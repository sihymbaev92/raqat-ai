import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

const VOICE_DIAG_KEY = "raqat_voice_diag_v1";
const VOICE_DIAG_LIMIT = 40;

type VoiceDiagEntry = {
  at: number;
  transcript: string;
  action: string;
  lang: "kk-KZ" | "ru-RU";
};

async function appendVoiceDiag(entry: VoiceDiagEntry): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(VOICE_DIAG_KEY);
    const prev = raw ? (JSON.parse(raw) as VoiceDiagEntry[]) : [];
    const next = [...prev, entry].slice(-VOICE_DIAG_LIMIT);
    await AsyncStorage.setItem(VOICE_DIAG_KEY, JSON.stringify(next));
  } catch {
    // diagnostics must never break voice flow
  }
}

function applyNavigation(outcome: VoiceCommandOutcome): boolean {
  if (!rootNavigationRef.isReady() || outcome.kind !== "navigate") return false;
  const { screen, params } = outcome;
  try {
    type NavFn = (name: keyof RootStackParamList, p?: object) => void;
    const nav = rootNavigationRef.navigate as unknown as NavFn;
    if (params !== undefined) {
      nav(screen, params);
    } else {
      nav(screen);
    }
    return true;
  } catch {
    return false;
  }
}

function newVoiceActionToken(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function extractAiPromptFromTranscript(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const patterns = [
    /^(ракат\s+ай|рақат\s+ай|raqat\s+ai)\s*[:\- ]+\s*(.+)$/i,
    /^(ракат\s+ай|рақат\s+ай|raqat\s+ai)\s+(.+)$/i,
    /^(ai|аи|көмекші|komekshi)\s*[:\- ]+\s*(.+)$/i,
    /^(ai-?ға|аи-?ға|көмекшіге)\s*(сұрақ|сурак|жаз|жібер)\s*[:\- ]*\s*(.+)$/i,
    /^(сұрақ|сурак)\s*(ai|аи|көмекшіге)\s*[:\- ]*\s*(.+)$/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (!m) continue;
    const g = m[m.length - 1]?.trim();
    if (g) return g;
  }
  return null;
}

function extractHalalTextFromTranscript(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const patterns = [
    /^(халал|halal)\s*(тексер|тексеру|анализ|analyse|check)\s*[:\- ]*\s*(.+)$/i,
    /^(ингредиент|құрам|состав)\s*(тексер|халал)\s*[:\- ]*\s*(.+)$/i,
  ];
  for (const re of patterns) {
    const m = t.match(re);
    if (!m) continue;
    const g = m[m.length - 1]?.trim();
    if (g) return g;
  }
  return null;
}

type QuickVoiceAction = "open_telegram" | "refresh_qibla" | "open_prayer_times";

function extractQuickVoiceAction(raw: string): QuickVoiceAction | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (
    /\b(телеграм|telegram|тг)\b/.test(t) &&
    /\b(аш|открой|open|кір|зайди)\b/.test(t)
  ) {
    return "open_telegram";
  }
  if (
    /\b(құбыла|кыбла|qibla)\b/.test(t) &&
    /\b(жаңарт|обнови|refresh|кайта)\b/.test(t)
  ) {
    return "refresh_qibla";
  }
  if (
    /\b(намаз уақыты|время намаза|prayer time|prayer times)\b/.test(t) &&
    /\b(оқы|скажи|айт|show|аш|open)\b/.test(t)
  ) {
    return "open_prayer_times";
  }
  return null;
}

function phraseForOutcome(outcome: VoiceCommandOutcome): string | null {
  const key = confirmationPhraseFor(outcome);
  if (!key) return null;
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
  return phrase || null;
}

type Props = { children: React.ReactNode };

/** Толық: expo-speech + native тану. App істемесе `VoiceAssistantStubProvider` қолданылады. */
export function VoiceAssistantProvider({ children }: Props) {
  const [phase, setPhase] = useState<VoiceAssistantPhase>("idle");
  const [hint, setHint] = useState<string | null>(null);
  const lastFinalRef = useRef("");
  const lastHeardRef = useRef("");
  const lastSpokenRef = useRef("");
  const recognitionLangRef = useRef<"kk-KZ" | "ru-RU">("kk-KZ");
  const emptyFallbackUsedRef = useRef(false);
  const aiFollowupModeRef = useRef(false);
  const aiFollowupExpiresAtRef = useRef(0);

  const bestTranscriptFromEvent = useCallback((ev: unknown): string => {
    const out: string[] = [];
    const visit = (node: unknown, depth = 0) => {
      if (depth > 4 || node == null) return;
      if (typeof node === "string") {
        const t = node.trim();
        if (t) out.push(t);
        return;
      }
      if (Array.isArray(node)) {
        for (const item of node) visit(item, depth + 1);
        return;
      }
      if (typeof node !== "object") return;
      const rec = node as Record<string, unknown>;
      const directKeys = ["transcript", "text", "value"];
      for (const k of directKeys) {
        const v = rec[k];
        if (typeof v === "string" && v.trim()) out.push(v.trim());
      }
      const nestedKeys = ["results", "result", "alternatives", "items"];
      for (const k of nestedKeys) {
        if (k in rec) visit(rec[k], depth + 1);
      }
    };
    visit(ev);
    return out.sort((a, b) => b.length - a.length)[0] ?? "";
  }, []);

  const speakNow = useCallback((text: string) => {
    const phrase = text.trim();
    if (!phrase) return;
    lastSpokenRef.current = phrase;
    void Speech.stop();
    Speech.speak(phrase, {
      language: "kk-KZ",
      rate: 0.95,
      pitch: 1.0,
    });
  }, []);

  const stopAllAudio = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      /* */
    }
    void Speech.stop();
  }, []);

  const startRecognition = useCallback((lang: "kk-KZ" | "ru-RU") => {
    recognitionLangRef.current = lang;
    ExpoSpeechRecognitionModule.start({
      lang,
      interimResults: true,
      continuous: false,
      maxAlternatives: 1,
      contextualStrings: VOICE_RECOGNITION_CONTEXT_HINTS.slice(0, 100),
    });
  }, []);

  const isWakeRaqatOnly = useCallback((raw: string): boolean => {
    const t = raw.trim().toLowerCase();
    if (!t) return false;
    const compact = t
      .replace(/[’'`".,!?;:()[\]{}]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return compact === "рақат" || compact === "ракат" || compact === "raqat";
  }, []);

  useSpeechRecognitionEvent("start", () => {
    setPhase("listening");
    lastFinalRef.current = "";
    lastHeardRef.current = "";
    setHint(null);
  });
  useSpeechRecognitionEvent("end", () => {
    setPhase("busy");
    const t = (lastFinalRef.current || lastHeardRef.current).trim();
    lastFinalRef.current = "";
    lastHeardRef.current = "";
    void (async () => {
      try {
        if (!t) {
          if (recognitionLangRef.current === "kk-KZ" && !emptyFallbackUsedRef.current) {
            emptyFallbackUsedRef.current = true;
            setHint(kk.voiceAssistant.fallbackRu);
            try {
              startRecognition("ru-RU");
              return;
            } catch {
              // continue to heardNothing
            }
          }
          emptyFallbackUsedRef.current = false;
          void appendVoiceDiag({
            at: Date.now(),
            transcript: "",
            action: "heard_nothing",
            lang: recognitionLangRef.current,
          });
          setHint(kk.voiceAssistant.heardNothing);
          speakNow(kk.voiceAssistant.heardNothing);
          return;
        }
        if (aiFollowupModeRef.current) {
          if (Date.now() > aiFollowupExpiresAtRef.current) {
            void appendVoiceDiag({
              at: Date.now(),
              transcript: t,
              action: "ai_followup_expired",
              lang: recognitionLangRef.current,
            });
            aiFollowupModeRef.current = false;
            aiFollowupExpiresAtRef.current = 0;
            setHint(kk.voiceAssistant.followupExpired);
            speakNow(kk.voiceAssistant.followupExpired);
            setPhase("idle");
            return;
          }
          const tnFollow = t.toLowerCase().trim();
          if (/\b(болдырма|отмена|cancel|тоқта|стоп|stop)\b/i.test(tnFollow)) {
            void appendVoiceDiag({
              at: Date.now(),
              transcript: t,
              action: "ai_followup_cancelled",
              lang: recognitionLangRef.current,
            });
            aiFollowupModeRef.current = false;
            aiFollowupExpiresAtRef.current = 0;
            setHint(kk.voiceAssistant.followupCancelled);
            speakNow(kk.voiceAssistant.followupCancelled);
            setPhase("idle");
            return;
          }
          aiFollowupModeRef.current = false;
          aiFollowupExpiresAtRef.current = 0;
          const followup = t.trim();
          if (followup && rootNavigationRef.isReady()) {
            void appendVoiceDiag({
              at: Date.now(),
              transcript: followup,
              action: "ai_followup_sent",
              lang: recognitionLangRef.current,
            });
            rootNavigationRef.navigate("MoreStack", {
              screen: "RaqatAI",
              params: {
                initialPrompt: followup,
                autoSend: true,
                voiceActionToken: newVoiceActionToken(),
              },
            });
            speakNow(kk.voiceAssistant.openedAi);
          }
          setPhase("idle");
          return;
        }
        if (isWakeRaqatOnly(t)) {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: "wake_raqat",
            lang: recognitionLangRef.current,
          });
          aiFollowupModeRef.current = true;
          aiFollowupExpiresAtRef.current = Date.now() + 15_000;
          const askLine = "Тыңдап тұрмын. AI сұрағыңды айт.";
          setHint(askLine);
          speakNow(askLine);
          setPhase("idle");
          return;
        }
        emptyFallbackUsedRef.current = false;
        const tn = t.toLowerCase().trim();
        if (/\b(тоқта|токта|стоп|stop|үндеме|тише)\b/i.test(tn)) {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: "stop_audio",
            lang: recognitionLangRef.current,
          });
          stopAllAudio();
          setHint(kk.voiceAssistant.stoppedByVoice);
          setPhase("idle");
          return;
        }
        if (/\b(қайта айт|кайта айт|повтори|repeat)\b/i.test(tn)) {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: "repeat_last",
            lang: recognitionLangRef.current,
          });
          if (lastSpokenRef.current.trim()) {
            speakNow(lastSpokenRef.current);
          } else {
            setHint(kk.voiceAssistant.repeatUnavailable);
            speakNow(kk.voiceAssistant.repeatUnavailable);
          }
          setPhase("idle");
          return;
        }
        if (/\b(көмек|комек|help|помощь)\b/i.test(tn)) {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: "help",
            lang: recognitionLangRef.current,
          });
          setHint(kk.voiceAssistant.help);
          speakNow(kk.voiceAssistant.help);
          setPhase("idle");
          return;
        }
        const aiPrompt = extractAiPromptFromTranscript(t);
        if (aiPrompt) {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: "ai_direct_prompt",
            lang: recognitionLangRef.current,
          });
          if (rootNavigationRef.isReady()) {
            rootNavigationRef.navigate("MoreStack", {
              screen: "RaqatAI",
              params: {
                initialPrompt: aiPrompt,
                autoSend: true,
                voiceActionToken: newVoiceActionToken(),
              },
            });
            speakNow(kk.voiceAssistant.openedAi);
          }
          setPhase("idle");
          return;
        }
        const halalText = extractHalalTextFromTranscript(t);
        if (halalText) {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: "halal_direct_check",
            lang: recognitionLangRef.current,
          });
          if (rootNavigationRef.isReady()) {
            rootNavigationRef.navigate("MoreStack", {
              screen: "Halal",
              params: {
                initialText: halalText,
                autoRunText: true,
                voiceActionToken: newVoiceActionToken(),
              },
            });
            speakNow(kk.voiceAssistant.openedHalal);
          }
          setPhase("idle");
          return;
        }
        const quickAction = extractQuickVoiceAction(t);
        if (quickAction) {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: `quick_${quickAction}`,
            lang: recognitionLangRef.current,
          });
          if (rootNavigationRef.isReady()) {
            if (quickAction === "open_telegram") {
              rootNavigationRef.navigate("MoreStack", {
                screen: "TelegramInfo",
              });
              speakNow(kk.voiceAssistant.openedTelegram);
            } else if (quickAction === "refresh_qibla") {
              rootNavigationRef.navigate("Qibla");
              speakNow(kk.voiceAssistant.openedQibla);
            } else {
              rootNavigationRef.navigate("PrayerTimes");
              speakNow(kk.voiceAssistant.openedPrayerTimes);
            }
          }
          if (!rootNavigationRef.isReady()) {
            setHint("Навигация дайын емес, қайта көріңіз.");
            speakNow("Навигация дайын емес, қайта көріңіз.");
          }
          setPhase("idle");
          return;
        }
        const outcome = matchVoiceCommand(t);
        if (outcome.kind === "back") {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: "navigate_back",
            lang: recognitionLangRef.current,
          });
          stopAllAudio();
          if (rootNavigationRef.isReady() && rootNavigationRef.canGoBack()) {
            rootNavigationRef.goBack();
            speakNow(kk.voiceAssistant.wentBack);
          } else {
            setHint(kk.voiceAssistant.cannotGoBack);
            speakNow(kk.voiceAssistant.cannotGoBack);
          }
        } else if (outcome.kind === "navigate") {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: "navigate_command",
            lang: recognitionLangRef.current,
          });
          const ok = applyNavigation(outcome);
          if (!ok) {
            setHint("Команда танылды, бірақ экран ашылмады. Қайта айтыңыз.");
            speakNow("Команда танылды, бірақ экран ашылмады. Қайта айтыңыз.");
          } else {
            const phrase = phraseForOutcome(outcome);
            if (phrase) speakNow(phrase);
          }
        } else {
          void appendVoiceDiag({
            at: Date.now(),
            transcript: t,
            action: "not_understood",
            lang: recognitionLangRef.current,
          });
          setHint(kk.voiceAssistant.notUnderstood);
          stopAllAudio();
          speakNow(kk.voiceAssistant.notUnderstood);
        }
      } finally {
        setPhase("idle");
      }
    })();
  });
  useSpeechRecognitionEvent("result", (ev) => {
    const best = bestTranscriptFromEvent(ev);
    if (best) {
      lastHeardRef.current = best;
      lastFinalRef.current = best;
      if (best.length > 2) {
        setHint(`Естілді: ${best}`);
      }
    }
  });
  useSpeechRecognitionEvent("error", (ev) => {
    setPhase("idle");
    if (ev.error === "not-allowed") {
      setHint(kk.voiceAssistant.needPermission);
    } else if (ev.error === "service-not-allowed" || ev.error === "language-not-supported") {
      if (ev.error === "language-not-supported" && recognitionLangRef.current === "kk-KZ") {
        setHint(kk.voiceAssistant.fallbackRu);
        try {
          startRecognition("ru-RU");
          return;
        } catch {
          /* ignore and show generic hint below */
        }
      }
      setHint(kk.voiceAssistant.devBuildHint);
    } else {
      setHint(ev.message ?? ev.error);
    }
  });

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  useEffect(() => {
    if (phase !== "busy") return;
    const id = setTimeout(() => setPhase("idle"), 20_000);
    return () => clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "listening" || Platform.OS === "web") return;
    const id = setTimeout(() => {
      stopAllAudio();
      setPhase("idle");
    }, 90_000);
    return () => clearTimeout(id);
  }, [phase, stopAllAudio]);

  const toggleListen = useCallback(async () => {
    if (Platform.OS === "web") return;
    setHint(null);
    if (phase === "listening") {
      stopAllAudio();
      setPhase("idle");
      return;
    }
    if (phase === "busy") return;

    stopAllAudio();
    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setHint(kk.voiceAssistant.needPermission);
        return;
      }
      lastFinalRef.current = "";
      lastHeardRef.current = "";
      emptyFallbackUsedRef.current = false;
      startRecognition("kk-KZ");
    } catch {
      setHint(kk.voiceAssistant.devBuildHint);
      setPhase("idle");
    }
  }, [phase, startRecognition, stopAllAudio]);

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
