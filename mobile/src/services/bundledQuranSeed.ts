import { InteractionManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseSurahsFromApiJson, saveQuranListCache } from "../storage/quranListCache";
import { saveSurahAyahsCache, type CachedAyah } from "../storage/quranSurahCache";
import { runWhenHeavyWorkAllowed } from "../utils/uiDefer";

const SEED_FLAG = "raqat_bundled_quran_seed_v6";

/** Әр сүреден кейін UI/натив көпіршікіне қайта кіру (114 AsyncStorage жазу қатыруы) */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

let quranSeedInFlight: Promise<boolean> | null = null;

/**
 * Алғашқы іске қосқанда бір рет: бандлдағы сүрелер тізімі мен барлық сүре мәтінін
 * AsyncStorage кешіне жазады — желісіз Құран оқуға дайын.
 * @returns true егер жаңа сидинг орындалған болса
 */
export async function seedBundledQuranCachesIfNeeded(): Promise<boolean> {
  const done = await AsyncStorage.getItem(SEED_FLAG);
  if (done === "1") return false;

  if (quranSeedInFlight) return quranSeedInFlight;

  quranSeedInFlight = (async (): Promise<boolean> => {
    await runWhenHeavyWorkAllowed();

  /* eslint-disable @typescript-eslint/no-require-imports — тек сидинг қажет кезде жүктеледі (~МБ JSON) */
  await yieldToUi();
  const surahListBundle = require("../../assets/bundled/surah-list-api.json") as unknown;
  await yieldToUi();
  const fullQuranBundle = require("../../assets/bundled/quran-uthmani-full.json") as {
    data?: {
      surahs?: Array<{
        number: number;
        ayahs: Array<{ numberInSurah: number; text: string }>;
      }>;
    };
  };
  await yieldToUi();
  const translitBundle = require("../../assets/bundled/quran-en-transliteration-full.json") as {
    data?: {
      surahs?: Array<{
        number: number;
        ayahs: Array<{ numberInSurah: number; text: string }>;
      }>;
    };
  };
  await yieldToUi();
  const kkFromDbBundle = require("../../assets/bundled/quran-kk-from-db.json") as {
    schema?: string;
    data?: {
      surahs?: Array<{
        number: number;
        ayahs: Array<{ numberInSurah: number; text_kk: string; translit?: string }>;
      }>;
    };
  };
  /* eslint-enable @typescript-eslint/no-require-imports */

  await yieldToUi();
  const list = parseSurahsFromApiJson(surahListBundle);
  if (list?.length) {
    await saveQuranListCache(list);
  }

  const surahs = fullQuranBundle?.data?.surahs;
  if (!Array.isArray(surahs)) {
    await AsyncStorage.setItem(SEED_FLAG, "1");
    return true;
  }

  const trSurahs = translitBundle?.data?.surahs;
  const trBySurah = new Map<number, Map<number, string>>();
  if (Array.isArray(trSurahs)) {
    let trI = 0;
    for (const ts of trSurahs) {
      const m = new Map<number, string>();
      for (const a of ts.ayahs ?? []) {
        m.set(a.numberInSurah, a.text);
      }
      trBySurah.set(ts.number, m);
      trI += 1;
      if (trI % 10 === 0) await yieldToUi();
    }
  }

  const kkSurahs = kkFromDbBundle?.data?.surahs;
  const kkBySurah = new Map<number, Map<number, string>>();
  /** Дерекқордан қазақша транскрипция (en.transliteration орнына басым) */
  const kkTranslitBySurah = new Map<number, Map<number, string>>();
  if (Array.isArray(kkSurahs)) {
    let kkI = 0;
    for (const ks of kkSurahs) {
      const m = new Map<number, string>();
      const trm = new Map<number, string>();
      for (const a of ks.ayahs ?? []) {
        const t = (a.text_kk ?? "").trim();
        if (t) m.set(a.numberInSurah, t);
        const tr = (a.translit ?? "").trim();
        if (tr) trm.set(a.numberInSurah, tr);
      }
      if (m.size) kkBySurah.set(ks.number, m);
      if (trm.size) kkTranslitBySurah.set(ks.number, trm);
      kkI += 1;
      if (kkI % 10 === 0) await yieldToUi();
    }
  }

  await yieldToUi();
  for (const s of surahs) {
    const trMap = trBySurah.get(s.number);
    const kkMap = kkBySurah.get(s.number);
    const dbTrMap = kkTranslitBySurah.get(s.number);
    const ayahs: CachedAyah[] = (s.ayahs ?? []).map((a) => {
      const trDb = dbTrMap?.get(a.numberInSurah);
      const trFallback = trMap?.get(a.numberInSurah);
      const tr = (trDb && trDb.trim()) || (trFallback && trFallback.trim()) || "";
      const kkTxt = kkMap?.get(a.numberInSurah);
      return {
        numberInSurah: a.numberInSurah,
        text: a.text,
        ...(tr ? { translit: tr } : {}),
        ...(kkTxt ? { textKk: kkTxt } : {}),
      };
    });
    if (ayahs.length) {
      await saveSurahAyahsCache(s.number, ayahs);
      await yieldToUi();
    }
  }

  await AsyncStorage.setItem(SEED_FLAG, "1");
  return true;
  })();

  try {
    return await quranSeedInFlight;
  } finally {
    quranSeedInFlight = null;
  }
}

/** UI блоктаусыз: интеракциядан кейін сидинг */
export function scheduleBundledQuranSeed(): void {
  InteractionManager.runAfterInteractions(() => {
    void seedBundledQuranCachesIfNeeded();
  });
}
