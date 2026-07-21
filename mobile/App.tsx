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
import { getOnboardingDone } from "./src/storage/prefs";
import { OnboardingLanguageScreen } from "./src/screens/OnboardingLanguageScreen";
import { runAfterInteractions } from "./src/utils/uiDefer";
import { trackNavigationPlausible } from "./src/navigation/navigationPlausible";
import { isPlausibleEnabled, trackPlausiblePageview } from "./src/services/plausible";
import * as Linking from "expo-linking";
import { trackUsageEvent } from "./src/services/usageAnalytics";
import { ScreenFitProvider, useScreenFitMetrics, webViewportClampStyle } from "./src/theme/screenFit";

const APP_STATE_SYNC_COOLDOWN_MS = 60_000;
const POST_BOOT_NATIVE_WARMUP_DELAY_MS = 1_800;
/** Рұқсаттар UI дайын болғаннан кейін бірден — баптауға кірмей. */
const FIRST_LAUNCH_PERMISSIONS_DELAY_MS = 280;

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
            width: "100%",
            height: "100%",
            backgroundColor: colors.bg,
            /** Үсті — сағаттан төмен; асты — жүйелік артқадан жоғары (жағаласпау). */
            paddingTop: deviceInsets.top,
            paddingBottom: bottomGuard,
          },
          webClamp,
        ]}
      >
        <SafeAreaProvider
          style={{ flex: 1, width: "100%" }}
          initialMetrics={innerMetrics}
        >
          {children}
        </SafeAreaProvider>
      </View>
    </DeviceSafeAreaInsetsProvider>
  );
}

function scheduleFirstLaunchPermissionsBurst(): void {
  if (Platform.OS === "web") return;
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

export default function App() {
  const [bootReady, setBootReady] = useState(false);
  const [needsLanguageOnboarding, setNeedsLanguageOnboarding] = useState(false);
  const locale = useAppLocale();
  const colorScheme = useColorScheme();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastAppStateSyncAtRef = useRef(0);

  useEffect(() => {
    void (async () => {
      /** API URL / тіл — UI алдында; қалған ауыр жұмыс интеракциядан кейін. */
      let onboardingDone = true;
      let azanLockScreenLaunch = false;
      try {
        /** Құлып экранындағы азан: boot spinner NavigationContainer-ды бөгемесін. */
        if (Platform.OS === "android") {
          try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl?.includes("azan")) {
              azanLockScreenLaunch = true;
              onboardingDone = true;
            }
          } catch {
            /* */
          }
        }

        if (!azanLockScreenLaunch) {
          await hydrateRaqatApiBaseOverride();
          try {
            await import("./src/security/appSecurityShield").then((m) =>
              m.evaluateAppSecurityPosture(true)
            );
          } catch {
            /* security shield — fail open for prayer UX */
          }
          onboardingDone = await getOnboardingDone();
          if (!onboardingDone && Platform.OS === "android") {
            try {
              const { ensurePrayerAzanShouldBypassOnboarding } = await import(
                "./src/services/prayerFullScreenAzan"
              );
              if (await ensurePrayerAzanShouldBypassOnboarding()) {
                onboardingDone = true;
                azanLockScreenLaunch = true;
              }
            } catch {
              /* */
            }
          }
        } else {
          void hydrateRaqatApiBaseOverride().catch(() => {});
        }

        setNeedsLanguageOnboarding(!onboardingDone);

        if (azanLockScreenLaunch) {
          // Навигацияны бірден ашу — тіл hydrate параллель (азан экраны құлып үстінде).
          setBootReady(true);
          void hydrateLocale().catch((e) => console.error("azan boot hydrateLocale", e));
        } else {
          await hydrateLocale();
          setBootReady(true);
        }
      } catch (e) {
        console.error("boot hydrate failed", e);
        setBootReady(true);
      } finally {
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

        void import("./src/services/prayerFullScreenAzan")
          .then((m) => m.initPrayerAzanLaunchRouting())
          .catch((e) => reportBackgroundJobError("prayerAzanLaunchRouting", e));

        /** Азан сессиясы кезінде рұқсат экрандарын ашпау — құлып үстіндегі бетті жаппау. */
        if (onboardingDone && !azanLockScreenLaunch) {
          scheduleFirstLaunchPermissionsBurst();
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
          void import("./src/services/prayerFullScreenAzan")
            .then((m) => m.ensurePrayerAzanRouteFromLaunch())
            .catch((e) => reportBackgroundJobError("prayerAzanRouteReplay", e));
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
        key={locale}
        ref={rootNavigationRef}
        linking={appDeepLinking}
        onReady={() => {
          const state = rootNavigationRef.getRootState() ?? undefined;
          setRootNavReady(true, state);
          trackNavigationPlausible(state);
          void import("./src/services/prayerFullScreenAzan")
            .then((m) => m.ensurePrayerAzanRouteFromLaunch())
            .catch((e) => reportBackgroundJobError("prayerAzanRouteReplay", e));
          void import("./src/services/notificationQuickActions")
            .then((m) => m.flushPendingNotificationQuickActions())
            .catch(() => {});
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

  const onLanguageOnboardingComplete = () => {
    setNeedsLanguageOnboarding(false);
    scheduleFirstLaunchPermissionsBurst();
  };

  return (
    <GestureHandlerRootView testID="raqat-app-root" style={{ flex: 1 }}>
      <AppErrorBoundary>
        <ScreenFitProvider>
          <SafeAreaProvider>
            <ThemeProvider>
              <AppSafeAreaFrame>
                {needsLanguageOnboarding ? (
                  <>
                    <OnboardingLanguageScreen onComplete={onLanguageOnboardingComplete} />
                    <ThemedStatusBar />
                  </>
                ) : (
                  appNavigation
                )}
              </AppSafeAreaFrame>
            </ThemeProvider>
          </SafeAreaProvider>
        </ScreenFitProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
