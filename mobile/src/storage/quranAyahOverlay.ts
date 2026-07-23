/**
 * Желіден жаңартылған аяттар — ғана overlay (бандл негізі үстіне).
 * Толық 114 сүре AsyncStorage-ға жазылмайды; ең көбі OVERLAY_MAX_SURAHSA ұсталады.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CachedAyah, SurahAyahsCachePayload } from "./quranSurahCache";

const OVERLAY_PREFIX = "raqat_surah_overlay_";
const OVERLAY_INDEX_KEY = "raqat_surah_overlay_index_v1";
/** AsyncStorage + parse шыңын шектеу. */
const OVERLAY_MAX_SURAHS = 16;

function overlayKey(surahNumber: number): string {
  return `${OVERLAY_PREFIX}${surahNumber}_v1`;
}

async function readOverlayIndex(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(OVERLAY_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 114);
  } catch {
    return [];
  }
}

async function writeOverlayIndex(order: number[]): Promise<void> {
  await AsyncStorage.setItem(OVERLAY_INDEX_KEY, JSON.stringify(order));
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

  let order = await readOverlayIndex();
  order = order.filter((n) => n !== surahNumber);
  order.push(surahNumber);
  while (order.length > OVERLAY_MAX_SURAHS) {
    const drop = order.shift();
    if (drop == null) break;
    try {
      await AsyncStorage.removeItem(overlayKey(drop));
    } catch {
      /* */
    }
  }
  await writeOverlayIndex(order);
}
