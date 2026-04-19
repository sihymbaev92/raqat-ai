import React, { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus, InteractionManager } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { raqatLinking } from "./src/navigation/linking";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useAppTheme } from "./src/theme/ThemeContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { OnboardingModal } from "./src/components/OnboardingModal";
import { getOnboardingDone } from "./src/storage/prefs";
import { QiblaSensorProvider } from "./src/context/QiblaSensorContext";
import { getRaqatApiBase } from "./src/config/raqatApiBase";
import { getRaqatContentSecret } from "./src/config/raqatContentSecret";
import { runContentSyncWithIncrementalPatches } from "./src/services/contentSync";
import { scheduleBundledHadithSeed } from "./src/services/bundledHadithSeed";
import { loadHadithCorpus } from "./src/storage/hadithCorpus";
import { reschedulePrayerNotificationsFromCache } from "./src/services/prayerNotifications";

function AppInner() {
  const { isDark } = useAppTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);
  /** AsyncStorage оқылғанша false — ауыр сидингті осыған байланыстыру керек */
  const [onboardingKnown, setOnboardingKnown] = useState(false);

  useEffect(() => {
    getOnboardingDone()
      .then((done) => {
        setShowOnboarding(!done);
        setOnboardingKnown(true);
      })
      .catch(() => {
        setShowOnboarding(true);
        setOnboardingKnown(true);
      });
  }, []);

  /**
   * Хадис корпусын фонда ерте сидингтеу — алғаш «Хадис» экранына кіргенде AsyncStorage+JSON
   * ауыр жүктемесі UI-ды қатты кідіртпесін.
   */
  const canRunLightBootstrap = onboardingKnown && !showOnboarding;

  /** Хадис JSON + жад кэшін ерте алдын ала жүктеу — «Хадис» экранына кіргенде қатып қалуды азайтады */
  useEffect(() => {
    if (!canRunLightBootstrap) return;
    const t = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        void loadHadithCorpus();
      });
    }, 900);
    return () => clearTimeout(t);
  }, [canRunLightBootstrap]);

  useEffect(() => {
    if (!canRunLightBootstrap) return;
    const t = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        scheduleBundledHadithSeed();
      });
    }, 2800);
    return () => clearTimeout(t);
  }, [canRunLightBootstrap]);

  useEffect(() => {
    if (!canRunLightBootstrap) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      const base = getRaqatApiBase();
      if (!base?.trim()) return;
      InteractionManager.runAfterInteractions(() => {
        if (cancelled) return;
        void runContentSyncWithIncrementalPatches(base, {
          contentSecret: getRaqatContentSecret() || undefined,
          timeoutMs: 60_000,
        }).catch(() => {
          /* желіде жоқ немесе API қатесі */
        });
      });
    }, 4500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [canRunLightBootstrap]);

  /** Алдыңғы планға оралғанда (интернет бар) контент синк қайталанады */
  const lastForegroundSyncRef = useRef(0);
  const lastPrayerRescheduleRef = useRef(0);
  const appStartedAtRef = useRef(Date.now());
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next !== "active") return;
      if (Date.now() - appStartedAtRef.current < 8000) return;
      const now = Date.now();
      if (now - lastPrayerRescheduleRef.current > 90_000) {
        lastPrayerRescheduleRef.current = now;
        InteractionManager.runAfterInteractions(() => {
          void reschedulePrayerNotificationsFromCache().catch(() => {});
        });
      }
      const base = getRaqatApiBase();
      if (!base?.trim()) return;
      if (now - lastForegroundSyncRef.current < 60_000) return;
      lastForegroundSyncRef.current = now;
      InteractionManager.runAfterInteractions(() => {
        void runContentSyncWithIncrementalPatches(base, {
          contentSecret: getRaqatContentSecret() || undefined,
          timeoutMs: 60_000,
        }).catch(() => {
          /* желіде жоқ немесе API қатесі */
        });
      });
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <NavigationContainer linking={raqatLinking}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <QiblaSensorProvider>
          <RootNavigator />
        </QiblaSensorProvider>
      </NavigationContainer>
      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppInner />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
