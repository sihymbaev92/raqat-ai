import { runAfterInteractions, runWhenHeavyWorkAllowed } from "../utils/uiDefer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ensureBundledSurahListLoaded, getBundledSurahList } from "./bundledQuranSurahList";
import { prefetchBundledQuranReader } from "./bundledQuranReader";

/**
 * v15: бандл runtime оқиды; 114 сүре AsyncStorage-ға көшірілмейді.
 * Ескі v14 кешін бір рет тазалайды.
 */
const SEED_FLAG = "raqat_bundled_quran_seed_v15";
const LEGACY_SURAH_KEY_PREFIX = "raqat_surah_ayahs_";

let quranSeedInFlight: Promise<boolean> | null = null;

async function clearLegacySurahCaches(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const legacy = keys.filter((k) => k.startsWith(LEGACY_SURAH_KEY_PREFIX));
    if (legacy.length) await AsyncStorage.multiRemove(legacy);
  } catch {
    /* ignore */
  }
}

/**
 * Бір рет: бандл қолжетімді екенін белгілейді; legacy AsyncStorage тазалайды.
 * @returns true егер жаңа миграция орындалса
 */
export async function seedBundledQuranCachesIfNeeded(opts?: {
  skipInteractionDefer?: boolean;
}): Promise<boolean> {
  const done = await AsyncStorage.getItem(SEED_FLAG);
  if (done === "1") return false;

  if (quranSeedInFlight) return quranSeedInFlight;

  const skipDefer = opts?.skipInteractionDefer === true;

  quranSeedInFlight = (async (): Promise<boolean> => {
    if (!skipDefer) {
      await runWhenHeavyWorkAllowed();
    }

    await ensureBundledSurahListLoaded().catch(() => {
      /* офлайн — QuranList remote/cache қайта көреді */
    });
    void prefetchBundledQuranReader();

    /** Бос/сәтсіз жүктеуде flag қойма — келесі boot қайта көреді. */
    if (!getBundledSurahList()?.length) {
      return false;
    }

    await clearLegacySurahCaches();
    await AsyncStorage.setItem(SEED_FLAG, "1");
    return true;
  })();

  try {
    return await quranSeedInFlight;
  } finally {
    quranSeedInFlight = null;
  }
}

/** UI блоктаусыз: интеракциядан кейін (қайта іске қосу). */
export function scheduleBundledQuranSeed(): void {
  runAfterInteractions(() => {
    void prefetchBundledQuranReader();
    void seedBundledQuranCachesIfNeeded();
  });
}
