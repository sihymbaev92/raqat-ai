import React, { type ReactNode } from "react";
import { Platform } from "react-native";
import { VoiceAssistantContext, type VoiceAssistantContextValue } from "./voiceAssistantCore";
import { VoiceAssistantGlobalChrome } from "./VoiceAssistantGlobalChrome";
import { VoiceAssistantGlobalFab } from "./VoiceAssistantGlobalFab";

const VOICE_STUB: VoiceAssistantContextValue = {
  phase: "idle",
  hint: null,
  toggleListen: async () => {},
};

/**
 * expo-speech / expo-speech-recognition жоқ: native модульдер bundle-да линксіз қалады (ашылуды
 * сынау үшін).
 */
export function VoiceAssistantStubProvider({ children }: { children: ReactNode }) {
  return (
    <VoiceAssistantContext.Provider value={VOICE_STUB}>
      {children}
      {Platform.OS !== "web" ? <VoiceAssistantGlobalChrome /> : null}
      {Platform.OS !== "web" ? <VoiceAssistantGlobalFab /> : null}
    </VoiceAssistantContext.Provider>
  );
}
