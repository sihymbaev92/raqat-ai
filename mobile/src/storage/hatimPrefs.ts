import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  normalizeQuranArabicScriptEdition,
  type QuranArabicScriptEditionId,
} from "../config/quranArabicScriptEdition";

const AUDIO_PLAY_UNTIL_KEY = "raqat_hatim_audio_play_until_v1";
const ARABIC_SCRIPT_EDITION_KEY = "raqat_hatim_arabic_script_edition_v1";

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

/** Хатым 604 мұсаф: madinah (Усмани QCF4) | turkish (Unicode). Құran prefs-тен бөлек. */
export async function getHatimArabicScriptEdition(): Promise<QuranArabicScriptEditionId> {
  try {
    const raw = await AsyncStorage.getItem(ARABIC_SCRIPT_EDITION_KEY);
    return normalizeQuranArabicScriptEdition(raw);
  } catch {
    return "madinah";
  }
}

export async function setHatimArabicScriptEdition(
  edition: QuranArabicScriptEditionId
): Promise<void> {
  await AsyncStorage.setItem(ARABIC_SCRIPT_EDITION_KEY, edition);
}
