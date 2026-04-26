import { createContext, useContext } from "react";

export type VoiceAssistantPhase = "idle" | "listening" | "busy";

export type VoiceAssistantContextValue = {
  phase: VoiceAssistantPhase;
  hint: string | null;
  toggleListen: () => Promise<void>;
};

/**
 * exo-speech-recognition-сыз сілтеме — `VoiceAssistantContext.tsx` жеке пакетте қалады, ол тек стаб/толық
 * провайдер таңдағанда ғана жүктеледі.
 */
export const VoiceAssistantContext = createContext<VoiceAssistantContextValue | null>(null);

export function useVoiceAssistant(): VoiceAssistantContextValue {
  const v = useContext(VoiceAssistantContext);
  if (!v) {
    throw new Error("useVoiceAssistant: VoiceAssistantProvider қажет");
  }
  return v;
}
