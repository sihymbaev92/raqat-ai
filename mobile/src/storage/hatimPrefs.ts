import AsyncStorage from "@react-native-async-storage/async-storage";

const AUDIO_PLAY_UNTIL_KEY = "raqat_hatim_audio_play_until_v1";

export type HatimAudioPlayUntil = "juz" | "surah" | "ayah";

export async function getHatimAudioPlayUntil(): Promise<HatimAudioPlayUntil> {
  try {
    const v = (await AsyncStorage.getItem(AUDIO_PLAY_UNTIL_KEY))?.trim();
    if (v === "surah" || v === "ayah" || v === "juz") return v;
  } catch {
    /* */
  }
  return "juz";
}

export async function setHatimAudioPlayUntil(scope: HatimAudioPlayUntil): Promise<void> {
  await AsyncStorage.setItem(AUDIO_PLAY_UNTIL_KEY, scope);
}
