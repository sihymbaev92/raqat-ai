import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Speech from "expo-speech";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { kk } from "../../i18n/kk";
import { rootNavigationRef } from "../../navigation/rootNavigationRef";
import type { RootStackParamList } from "../../navigation/types";
import {
  confirmationPhraseFor,
  matchVoiceCommand,
  VOICE_RECOGNITION_CONTEXT_HINTS,
  type VoiceCommandOutcome,
} from "../../services/voiceCommands";
import { VoiceAssistantGlobalChrome } from "./VoiceAssistantGlobalChrome";
import { VoiceAssistantGlobalFab } from "./VoiceAssistantGlobalFab";
import { VoiceAssistantContext, type VoiceAssistantPhase } from "./voiceAssistantCore";

export { useVoiceAssistant, type VoiceAssistantContextValue, type VoiceAssistantPhase } from "./voiceAssistantCore";

function applyNavigation(outcome: VoiceCommandOutcome): void {
  if (!rootNavigationRef.isReady() || outcome.kind !== "navigate") return;
  const { screen, params } = outcome;
  try {
    type NavFn = (name: keyof RootStackParamList, p?: object) => void;
    const nav = rootNavigationRef.navigate as unknown as NavFn;
    if (params !== undefined) {
      nav(screen, params);
    } else {
      nav(screen);
    }
  } catch {
    /* */
  }
}

function speakForOutcome(outcome: VoiceCommandOutcome): void {
  const key = confirmationPhraseFor(outcome);
  if (!key) return;
  const map: Record<string, string> = {
    "voiceAssistant.openedHome": kk.voiceAssistant.openedHome,
    "voiceAssistant.openedQibla": kk.voiceAssistant.openedQibla,
    "voiceAssistant.openedPrayerTimes": kk.voiceAssistant.openedPrayerTimes,
    "voiceAssistant.openedDuas": kk.voiceAssistant.openedDuas,
    "voiceAssistant.openedTasbih": kk.voiceAssistant.openedTasbih,
    "voiceAssistant.openedAsma": kk.voiceAssistant.openedAsma,
    "voiceAssistant.openedAi": kk.voiceAssistant.openedAi,
    "voiceAssistant.openedHalal": kk.voiceAssistant.openedHalal,
    "voiceAssistant.openedQuran": kk.voiceAssistant.openedQuran,
    "voiceAssistant.openedHadith": kk.voiceAssistant.openedHadith,
    "voiceAssistant.openedTajweed": kk.voiceAssistant.openedTajweed,
    "voiceAssistant.openedNamazGuide": kk.voiceAssistant.openedNamazGuide,
    "voiceAssistant.openedSettings": kk.voiceAssistant.openedSettings,
    "voiceAssistant.openedContentHub": kk.voiceAssistant.openedContentHub,
    "voiceAssistant.openedSeerah": kk.voiceAssistant.openedSeerah,
    "voiceAssistant.openedHatim": kk.voiceAssistant.openedHatim,
    "voiceAssistant.openedHajj": kk.voiceAssistant.openedHajj,
    "voiceAssistant.openedCommunityDua": kk.voiceAssistant.openedCommunityDua,
    "voiceAssistant.openedEcosystem": kk.voiceAssistant.openedEcosystem,
    "voiceAssistant.openedTelegram": kk.voiceAssistant.openedTelegram,
  };
  const phrase = map[key];
  if (!phrase) return;
  void Speech.stop();
  Speech.speak(phrase, { language: "ru-RU", rate: 0.95, pitch: 1.0 });
}

type Props = { children: React.ReactNode };

/** Толық: expo-speech + native тану. App істемесе `VoiceAssistantStubProvider` қолданылады. */
export function VoiceAssistantProvider({ children }: Props) {
  const [phase, setPhase] = useState<VoiceAssistantPhase>("idle");
  const [hint, setHint] = useState<string | null>(null);
  const lastFinalRef = useRef("");

  useSpeechRecognitionEvent("start", () => {
    setPhase("listening");
    lastFinalRef.current = "";
    setHint(null);
  });
  useSpeechRecognitionEvent("end", () => {
    setPhase("busy");
    const t = lastFinalRef.current.trim();
    lastFinalRef.current = "";
    void (async () => {
      try {
        if (t) {
          const outcome = matchVoiceCommand(t);
          if (outcome.kind === "back") {
            void Speech.stop();
            if (rootNavigationRef.isReady() && rootNavigationRef.canGoBack()) {
              rootNavigationRef.goBack();
              Speech.speak(kk.voiceAssistant.wentBack, { language: "ru-RU", rate: 0.95, pitch: 1.0 });
            } else {
              setHint(kk.voiceAssistant.cannotGoBack);
              Speech.speak(kk.voiceAssistant.cannotGoBack, { language: "ru-RU", rate: 0.95, pitch: 1.0 });
            }
          } else if (outcome.kind === "navigate") {
            applyNavigation(outcome);
            speakForOutcome(outcome);
          } else {
            setHint(kk.voiceAssistant.notUnderstood);
            void Speech.stop();
            Speech.speak(kk.voiceAssistant.notUnderstood, { language: "ru-RU", rate: 0.96 });
          }
        }
      } finally {
        setPhase("idle");
      }
    })();
  });
  useSpeechRecognitionEvent("result", (ev) => {
    const best =
      ev.results
        .map((r) => r?.transcript?.trim() ?? "")
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)[0] ?? "";
    if (best) lastFinalRef.current = best;
  });
  useSpeechRecognitionEvent("error", (ev) => {
    setPhase("idle");
    if (ev.error === "not-allowed") {
      setHint(kk.voiceAssistant.needPermission);
    } else if (ev.error === "service-not-allowed" || ev.error === "language-not-supported") {
      setHint(kk.voiceAssistant.devBuildHint);
    } else {
      setHint(ev.message ?? ev.error);
    }
  });

  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        /* */
      }
      void Speech.stop();
    };
  }, []);

  useEffect(() => {
    if (phase !== "busy") return;
    const id = setTimeout(() => setPhase("idle"), 20_000);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "listening" || Platform.OS === "web") return;
    const id = setTimeout(() => {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        /* */
      }
      setPhase("idle");
    }, 90_000);
    return () => clearTimeout(id);
  }, [phase]);

  const toggleListen = useCallback(async () => {
    if (Platform.OS === "web") return;
    setHint(null);
    if (phase === "listening") {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch {
        /* */
      }
      setPhase("idle");
      return;
    }
    if (phase === "busy") return;

    void Speech.stop();
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setHint(kk.voiceAssistant.needPermission);
        return;
      }
      lastFinalRef.current = "";
      ExpoSpeechRecognitionModule.start({
        lang: "ru-RU",
        interimResults: true,
        continuous: false,
        maxAlternatives: 1,
        contextualStrings: VOICE_RECOGNITION_CONTEXT_HINTS.slice(0, 100),
      });
    } catch {
      setHint(kk.voiceAssistant.devBuildHint);
      setPhase("idle");
    }
  }, [phase]);

  const value = useMemo(
    () => ({ phase, hint, toggleListen }),
    [phase, hint, toggleListen]
  );

  return (
    <VoiceAssistantContext.Provider value={value}>
      {children}
      {Platform.OS !== "web" ? <VoiceAssistantGlobalChrome /> : null}
      {Platform.OS !== "web" ? <VoiceAssistantGlobalFab /> : null}
    </VoiceAssistantContext.Provider>
  );
}
