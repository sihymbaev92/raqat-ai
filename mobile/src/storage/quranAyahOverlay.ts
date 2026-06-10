/**
 * Желіден жаңартылған аяттар — ғана overlay (бандл негізі үстіне).
 * Толық 114 сүре AsyncStorage-ға жазылмайды.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CachedAyah, SurahAyahsCachePayload } from "./quranSurahCache";

const OVERLAY_PREFIX = "raqat_surah_overlay_";

function overlayKey(surahNumber: number): string {
  return `${OVERLAY_PREFIX}${surahNumber}_v1`;
}

export async function loadSurahAyahsOverlay(
  surahNumber: number
): Promise<SurahAyahsCachePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(overlayKey(surahNumber));
    if (!raw) return null;
    const j = JSON.parse(raw) as SurahAyahsCachePayload;
    if (!Array.isArray(j?.ayahs) || !j?.savedAt) return null;
    return j;
  } catch {
    return null;
  }
}

export async function saveSurahAyahsOverlay(
  surahNumber: number,
  ayahs: CachedAyah[]
): Promise<void> {
  const payload: SurahAyahsCachePayload = {
    ayahs,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(overlayKey(surahNumber), JSON.stringify(payload));
}
