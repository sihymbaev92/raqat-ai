import "react-native-gesture-handler";
import "react-native-reanimated";
import "./src/theme/applyGlobalFontDefaults";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, type AppStateStatus, Platform, useColorScheme, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
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
  const insets = useSafeAreaInsets();
  const screenFit = useScreenFitMetrics();
  const webClamp = webViewportClampStyle(screenFit);
  /**
   * Android 15+/edge-to-edge and 3-button navigation can place app content
   * behind the system Back/Home/Recents area. Keep the whole app frame above it.
   */
  const bottomGuard = Platform.OS === "android" ? Math.max(insets.bottom, 12) : insets.bottom;
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.bg,
          paddingTop: insets.top,
          paddingBottom: bottomGuard,
        },
        webClamp,
      ]}
    >
      {/*
        The outer frame consumes device system insets once. The nested provider
        lets screens keep using useSafeAreaInsets() without adding those insets twice.
      */}
      <SafeAreaProvider style={{ flex: 1 }}>{children}</SafeAreaProvider>
    </View>
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
        await import("./src/fonts/brandFont").then((m) => m.loadBrandFont()).catch(() => {});
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
        void import("./src/services/notificationQuickActions")
          .then((m) => m.initNotificationQuickActions())
          .catch((e) => reportBackgroundJobError("notificationQuickActions", e));

        // Non-critical network warmups should not compete with first paint/navigation.
        setTimeout(() => {
          void import("./src/services/halalHubBootstrap")
            .then((m) => m.prefetchHalalDamuHub())
            .catch((e) => reportBackgroundJobError("halalHubBootstrap", e));
        }, 2500);
        setTimeout(() => {
          void import("./src/services/officialSitesBootstrap")
            .then((m) => m.prefetchOfficialHomeNewsFeed())
            .catch((e) => reportBackgroundJobError("officialSitesBootstrap", e));
        }, 4000);
        setTimeout(() => {
          void import("./src/components/officialSiteWebViewReload")
            .then((m) => m.prefetchOfficialSiteWebPages())
            .catch((e) => reportBackgroundJobError("officialSiteWebPrefetch", e));
        }, 3200);

        setTimeout(() => {
          void (async () => {
            if (Platform.OS === "web") return;

            const { seedBundledQuranCachesIfNeeded } = await import("./src/services/bundledQuranSeed");
            await seedBundledQuranCachesIfNeeded().catch(() => {
              /* QuranList қайта сидинг жасай алады */
            });

            const [
              { getFirstLaunchPermissionsBurstDone, setFirstLaunchPermissionsBurstDone },
              { requestAllCorePermissionsOnFirstLaunch },
              { reschedulePrayerNotificationsFromCache },
              { ensurePrayerNotificationBackgroundTask },
              { ensureQuranAudioBackgroundTask },
              { kickQuranAudioAutoDownloadLoop },
              { syncAndroidPrayerWidgetFromStorage },
            ] = await Promise.all([
              import("./src/storage/prefs"),
              import("./src/services/firstLaunchPermissions"),
              import("./src/services/prayerNotifications"),
              import("./src/services/prayerNotificationBackgroundTask"),
              import("./src/services/quranAudioBackgroundTask"),
              import("./src/services/quranAudioDownloadManager"),
              import("./src/storage/prayerCache"),
            ]);
            const burstDone = await getFirstLaunchPermissionsBurstDone();
            if (!burstDone) {
              try {
                await requestAllCorePermissionsOnFirstLaunch();
              } catch {
                /* рұқсат терезесі немесе модуль қатесі */
              }
              await setFirstLaunchPermissionsBurstDone();
            }

            await Promise.allSettled([
              reschedulePrayerNotificationsFromCache(),
              ensurePrayerNotificationBackgroundTask(),
              ensureQuranAudioBackgroundTask(),
              syncAndroidPrayerWidgetFromStorage(),
            ]);
            void kickQuranAudioAutoDownloadLoop();
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
          { syncAndroidPrayerWidgetFromStorage },
          { kickQuranAudioAutoDownloadLoop, resumeQuranAudioDownloadsInBackground },
        ] = await Promise.all([
          import("./src/services/prayerDaySelfHeal"),
          import("./src/services/prayerNotifications"),
          import("./src/storage/prayerCache"),
          import("./src/services/quranAudioDownloadManager"),
        ]);
        if (leavingForeground) {
          await refreshPrayerCacheIfCalendarStale();
          await resumeQuranAudioDownloadsInBackground();
        }
        if (next === "active") {
          void kickQuranAudioAutoDownloadLoop();
          void import("./src/services/prayerAzanPermissions")
            .then((m) => m.ensurePrayerAzanPermissionsOnAppActive())
            .catch((e) => reportBackgroundJobError("prayerAzanPermissions", e));
        }
        await Promise.allSettled([
          reschedulePrayerNotificationsFromCache(),
          syncAndroidPrayerWidgetFromStorage(),
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
