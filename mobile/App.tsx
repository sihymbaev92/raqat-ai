import "./src/theme/applyGlobalFontDefaults";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, AppState, type AppStateStatus, Platform, useColorScheme, View } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QiblaSensorProvider } from "./src/context/QiblaSensorContext";
import { appDeepLinking } from "./src/navigation/linking";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { rootNavigationRef } from "./src/navigation/rootNavigationRef";
import { darkColors, lightColors } from "./src/theme/colors";
import { ThemeProvider, useAppTheme } from "./src/theme/ThemeContext";
import { VoiceAssistantProvider } from "./src/components/voice/VoiceAssistantContext";
import { AppErrorBoundary } from "./src/components/AppErrorBoundary";
import { setRootNavReady, setRootNavState } from "./src/voice/rootNavStateStore";
import { hydrateRaqatApiBaseOverride } from "./src/config/raqatApiBase";
import { initNotificationQuickActions } from "./src/services/notificationQuickActions";
import { reschedulePrayerNotificationsFromCache } from "./src/services/prayerNotifications";
import { syncAndroidPrayerWidgetFromStorage } from "./src/storage/prayerCache";
import { hydrateLocale } from "./src/i18n/runtime";
import { requestAllCorePermissionsOnFirstLaunch } from "./src/services/firstLaunchPermissions";
import {
  getFirstLaunchPermissionsBurstDone,
  setFirstLaunchPermissionsBurstDone,
} from "./src/storage/prefs";

/** Ақ фонда жүйелік сағат/батарея «жоғалып» қалмасын — auto орнына нақты контраст. */
function ThemedStatusBar() {
  const { isDark } = useAppTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

export default function App() {
  const [bootReady, setBootReady] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    void (async () => {
      /** AsyncStorage API URL / тіл — алдымен жүктелмей тұрып getRaqatApiBase() .env қайтарады, сонда «желі жоқ». */
      await hydrateRaqatApiBaseOverride();
      await hydrateLocale();
      /** Алғашқы іске қосу: орын (құбыла/мекен), намаз хабарламалары, дауысты көмекші рұқсаттары — бір рет. */
      if (Platform.OS !== "web") {
        const burstDone = await getFirstLaunchPermissionsBurstDone();
        if (!burstDone) {
          try {
            await requestAllCorePermissionsOnFirstLaunch();
          } catch {
            /* рұқсат терезесі немесе модуль қатесі — іске қосу тоқтамайды */
          }
          await setFirstLaunchPermissionsBurstDone();
        }
      }
      setBootReady(true);
      void initNotificationQuickActions();
      void reschedulePrayerNotificationsFromCache();
      void syncAndroidPrayerWidgetFromStorage();
    })();
  }, []);

  useEffect(() => {
    if (!bootReady) return;
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        void reschedulePrayerNotificationsFromCache();
        void syncAndroidPrayerWidgetFromStorage();
      }
    });
    return () => sub.remove();
  }, [bootReady]);

  /** Құраннан тыс экрандар портретте қалсын; ландшафт тек оқу баптамасында қосылғанда. */
  useEffect(() => {
    if (!bootReady || Platform.OS === "web") return;
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, [bootReady]);

  if (!bootReady) {
    const bg = colorScheme === "dark" ? darkColors.bg : lightColors.bg;
    return (
      <View
        testID="raqat-app-boot"
        style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: bg }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View testID="raqat-app-root" style={{ flex: 1 }}>
    <AppErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <VoiceAssistantProvider>
            {/**
             * Qibla — Nav ішінде: onReady/ state алдында үстімен тұрмайды, іске қосу/«қатты қатып»
             * кідірісі азаяды.
             */}
            <NavigationContainer
              ref={rootNavigationRef}
              linking={appDeepLinking}
              onReady={() => {
                setRootNavReady(true, rootNavigationRef.getRootState() ?? undefined);
              }}
              onStateChange={(state) => {
                setRootNavState(state);
              }}
            >
              <QiblaSensorProvider>
                <RootNavigator />
              </QiblaSensorProvider>
            </NavigationContainer>
            <ThemedStatusBar />
          </VoiceAssistantProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
    </View>
  );
}
