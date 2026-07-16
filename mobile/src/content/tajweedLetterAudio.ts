import type { AVPlaybackSource } from "expo-av";
import { tajweedLetterAudioUri } from "../config/tajweedAssetsBase";

/** Тәжуид әліпбиі — еркек араб дауысы (CDN; release APK stash). */
const TAJWEED_LETTER_AUDIO_FILES: Record<string, string> = {
  ا: "alif.mp3",
  ب: "ba.mp3",
  ت: "ta.mp3",
  ث: "tha.mp3",
  ج: "jim.mp3",
  ح: "ha.mp3",
  خ: "kha.mp3",
  د: "dal.mp3",
  ذ: "dhal.mp3",
  ر: "ra.mp3",
  ز: "zay.mp3",
  س: "sin.mp3",
  ش: "shin.mp3",
  ص: "sad.mp3",
  ض: "dad.mp3",
  ط: "ta_emph.mp3",
  ظ: "za_emph.mp3",
  ع: "ayn.mp3",
  غ: "ghayn.mp3",
  ف: "fa.mp3",
  ق: "qaf.mp3",
  ك: "kaf.mp3",
  ل: "lam.mp3",
  م: "mim.mp3",
  ن: "nun.mp3",
  و: "waw.mp3",
  ه: "ha_end.mp3",
  ي: "ya.mp3",
};

export const TAJWEED_LETTER_AUDIO_BY_AR: Record<string, string> = TAJWEED_LETTER_AUDIO_FILES;

export function tajweedLetterAudioSource(ar: string): AVPlaybackSource | undefined {
  const file = TAJWEED_LETTER_AUDIO_FILES[(ar ?? "").trim()];
  if (!file) return undefined;
  return { uri: tajweedLetterAudioUri(file) };
}

/** @deprecated use tajweedLetterAudioSource */
export function tajweedLetterAudioModule(ar: string): AVPlaybackSource | undefined {
  return tajweedLetterAudioSource(ar);
}
