import "react-native-gesture-handler";
import "react-native-reanimated";
import "./src/theme/applyGlobalFontDefaults";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, type AppStateStatus, Platform, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  appBottomSafeInset,
  DeviceSafeAreaInsetsProvider,
  deviceSafeAreaInsets,
  useZeroedSafeAreaMetrics,
} from "./src/theme/deviceSafeArea";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { appDeepLinking } from "./src/navigation/linking";
import { AndroidBackNavigationBridge } from "./src/navigation/AndroidBackNavigationBridge";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { rootNavigationRef } from "./src/navigation/rootNavigationRef";
import { darkColors, lightColors } from "./src/theme/colors";
import { ThemeProvider, useAppTheme } from "./src/theme/ThemeContext";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { setRootNavReady, setRootNavState } from "./src/voice/rootNavStateStore";
import { hydrateRaqatApiBaseOverride } from "./src/config/raqatApiBase";
import { hydrateLocale, useAppLocale } from "./src/i18n/runtime";
import { runAfterInteractions } from "./src/utils/uiDefer";
import { trackNavigationPlausible } from "./src/navigation/navigationPlausible";
import { isPlausibleEnabled, trackPlausiblePageview } from "./src/services/plausible";
import { trackUsageEvent } from "./src/services/usageAnalytics";
import { ScreenFitProvider, useScreenFitMetrics, webViewportClampStyle } from "./src/theme/screenFit";

const APP_STATE_SYNC_COOLDOWN_MS = 60_000;
const POST_BOOT_NATIVE_WARMUP_DELAY_MS = 1_800;
/** Рұқсаттар UI дайын болғаннан кейін бірден — баптауға кірмей. */
const FIRST_LAUNCH_PERMISSIONS_DELAY_MS = 600;

function reportBackgroundJobError(label: string, error: unknown): void {
  if (__DEV__) {
    console.warn(`[background:${label}]`, error);
  }
}

/** Ақ фонда жүйелік сағат/батарея «жоғалып» қалмасын — auto орнына нақты контраст. */
function ThemedStatusBar() {
  const { isDark } = useAppTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

function AppSafeAreaFrame({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const rawInsets = useSafeAreaInsets();
  const deviceInsets = React.useMemo(() => deviceSafeAreaInsets(rawInsets), [rawInsets]);
  const innerMetrics = useZeroedSafeAreaMetrics();
  const screenFit = useScreenFitMetrics();
  const webClamp = webViewportClampStyle(screenFit);
  const bottomGuard = appBottomSafeInset(deviceInsets);
  return (
    <DeviceSafeAreaInsetsProvider value={deviceInsets}>
      <View
        style={[
          {
            flex: 1,
            backgroundColor: colors.bg,
            paddingTop: deviceInsets.top,
            paddingBottom: bottomGuard,
          },
          webClamp,
        ]}
      >
        {/*
          The outer frame consumes device system insets once. The nested provider
          reports zero top/bottom so screens do not pad twice under the status bar.
        */}
        <SafeAreaProvider style={{ flex: 1 }} initialMetrics={innerMetrics}>
          {children}
        </SafeAreaProvider>
      </View>
    </DeviceSafeAreaInsetsProvider>
  );
}

export default function App() {
  const [bootReady, setBootReady] = useState(false);
  useAppLocale();
  const colorScheme = useColorScheme();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastAppStateSyncAtRef = useRef(0);

  useEffect(() => {
    void (async () => {
      /** API URL / тіл — UI алдында; қалған ауыр жұмыс интеракциядан кейін. */
      try {
        await hydrateRaqatApiBaseOverride();
        await hydrateLocale();
      } catch (e) {
        console.error("boot hydrate failed", e);
      } finally {
        setBootReady(true);
        void trackUsageEvent({
          eventName: "app_launch",
          screen: "App",
          detail: Platform.OS,
        });
      }

      runAfterInteractions(() => {
        void import("./src/fonts/brandFont")
          .then((m) => m.loadBrandFont())
          .catch(() => {});
        void import("./src/services/bundledQuranSeed")
          .then((m) => m.seedBundledQuranCachesIfNeeded())
          .catch(() => {});

        void import("./src/services/notificationQuickActions")
          .then((m) => m.initNotificationQuickActions())
          .catch((e) => reportBackgroundJobError("notificationQuickActions", e));

        void import("./src/services/prayerNotificationTap")
          .then((m) => m.initPrayerNotificationTapRouting())
          .catch((e) => reportBackgroundJobError("prayerNotificationTap", e));

        if (Platform.OS !== "web") {
          // Орнатқаннан кейін бірден: орын + хабарлама + батарея + азан рұқсаттары.
          setTimeout(() => {
            void import("./src/storage/prefs")
              .then(async (prefs) => {
                if (await prefs.getFirstLaunchPermissionsBurstDone()) return;
                const { requestAllCorePermissionsOnFirstLaunch } = await import(
                  "./src/services/firstLaunchPermissions"
                );
                await requestAllCorePermissionsOnFirstLaunch();
                await prefs.setFirstLaunchPermissionsBurstDone();
              })
              .catch((e) => reportBackgroundJobError("firstLaunchPermissions", e));
          }, FIRST_LAUNCH_PERMISSIONS_DELAY_MS);
        }

        if (Platform.OS === "web") {
          void import("./src/services/registerWebHatimOffline")
            .then((m) => m.registerWebHatimOfflineServiceWorker())
            .catch((e) => reportBackgroundJobError("webHatimOfflineSw", e));
        }

        setTimeout(() => {
          void import("./src/services/slimAssetPrefetch")
            .then((m) => m.prefetchSlimBundledAssetsOnWifi())
            .catch(() => {});
          void (async () => {
            if (Platform.OS === "web") return;

            const [
              { reschedulePrayerNotificationsFromCache },
              { ensurePrayerNotificationBackgroundTask },
              { ensureQuranAudioBackgroundTask },
              { syncNativePrayerWidgetFromStorage },
            ] = await Promise.all([
              import("./src/services/prayerNotifications"),
              import("./src/services/prayerNotificationBackgroundTask"),
              import("./src/services/quranAudioBackgroundTask"),
              import("./src/storage/prayerCache"),
            ]);

            await Promise.allSettled([
              reschedulePrayerNotificationsFromCache(),
              ensurePrayerNotificationBackgroundTask(),
              ensureQuranAudioBackgroundTask(),
              syncNativePrayerWidgetFromStorage(),
            ]);
          })().catch((e) => reportBackgroundJobError("postBootNativeWarmup", e));
        }, POST_BOOT_NATIVE_WARMUP_DELAY_MS);
      });
    })();
  }, []);

  useEffect(() => {
    if (!bootReady) return;
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (Platform.OS === "web") return;
      const prev = appStateRef.current;
      appStateRef.current = next;
      /** iOS: үй түймесі — алдымен inactive, содан background; кэшті тек background күтпей жаңартамыз. */
      const leavingForeground = next === "background" || (next === "inactive" && prev === "active");
      const shouldReschedule =
        next === "active" || next === "background" || (next === "inactive" && prev === "active");
      if (!shouldReschedule) return;
      const now = Date.now();
      if (now - lastAppStateSyncAtRef.current < APP_STATE_SYNC_COOLDOWN_MS) {
        return;
      }
      lastAppStateSyncAtRef.current = now;
      void (async () => {
        const [
          { refreshPrayerCacheIfCalendarStale },
          { reschedulePrayerNotificationsFromCache },
          { syncNativePrayerWidgetFromStorage },
          { resumeQuranAudioDownloadsInBackground },
        ] = await Promise.all([
          import("./src/services/prayerDaySelfHeal"),
          import("./src/services/prayerNotifications"),
          import("./src/storage/prayerCache"),
          import("./src/services/quranAudioDownloadManager"),
        ]);
        if (leavingForeground) {
          await refreshPrayerCacheIfCalendarStale();
          await resumeQuranAudioDownloadsInBackground();
          void import("./src/services/appMemoryRelease")
            .then((m) => m.releaseAppHeavyMemory())
            .catch((e) => reportBackgroundJobError("appMemoryRelease", e));
        }
        if (next === "active") {
          void import("./src/services/prayerAzanPermissions")
            .then((m) => m.ensurePrayerAzanPermissionsOnAppActive())
            .catch((e) => reportBackgroundJobError("prayerAzanPermissions", e));
          void import("./src/services/accountSync")
            .then((m) => m.syncAccountDataWithServerBidirectional())
            .catch((e) => reportBackgroundJobError("accountSync", e));
        }
        await Promise.allSettled([
          reschedulePrayerNotificationsFromCache(),
          syncNativePrayerWidgetFromStorage(),
        ]);
      })().catch((e) => reportBackgroundJobError("appStateSync", e));
    });
    return () => sub.remove();
  }, [bootReady]);

  /** Құраннан тыс экрандар портретте қалсын; ландшафт тек оқу баптамасында қосылғанда. */
  useEffect(() => {
    if (!bootReady || Platform.OS === "web") return;
    void import("expo-screen-orientation")
      .then((ScreenOrientation) =>
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
      )
      .catch((e) => reportBackgroundJobError("screenOrientation", e));
  }, [bootReady]);

  useEffect(() => {
    if (!bootReady || !isPlausibleEnabled() || typeof window === "undefined") return;
    const path = window.location.pathname || "/";
    trackPlausiblePageview(path);
  }, [bootReady]);

  if (!bootReady) {
    const bg = colorScheme === "dark" ? darkColors.bg : lightColors.bg;
    return (
      <View
        testID="raqat-app-boot"
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg }}
      >
        <ActivityIndicator size="large" color={colorScheme === "dark" ? "#38B2AC" : "#C9A227"} />
      </View>
    );
  }

  /** Qibla — Nav ішінде: onReady/state алдында үстімен тұрмайды. */
  const appNavigation = (
    <>
      <NavigationContainer
        ref={rootNavigationRef}
        linking={appDeepLinking}
        onReady={() => {
          const state = rootNavigationRef.getRootState() ?? undefined;
          setRootNavReady(true, state);
          trackNavigationPlausible(state);
        }}
        onStateChange={(state) => {
          setRootNavState(state);
          trackNavigationPlausible(state);
        }}
      >
        <AndroidBackNavigationBridge />
        <RootNavigator />
      </NavigationContainer>
      <ThemedStatusBar />
    </>
  );

  return (
    <GestureHandlerRootView testID="raqat-app-root" style={{ flex: 1 }}>
      <AppErrorBoundary>
        <ScreenFitProvider>
          <SafeAreaProvider>
            <ThemeProvider>
              <AppSafeAreaFrame>{appNavigation}</AppSafeAreaFrame>
            </ThemeProvider>
          </SafeAreaProvider>
        </ScreenFitProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
