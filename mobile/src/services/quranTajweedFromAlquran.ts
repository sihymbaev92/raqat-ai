import type { QuranTajweedAssetDoc, QuranTajweedAyah, QuranTajweedSurah } from "./quranTajweedAsset";
import { ALQURAN_TAJWEED_API_URL } from "../config/bundledJsonFallbacks";

type ApiAyah = {
  number?: number;
  numberInSurah?: number;
  text?: string;
  juz?: number;
  manzil?: number;
  page?: number;
  ruku?: number;
  hizbQuarter?: number;
  sajda?: boolean | { id?: number; recommended?: boolean; obligatory?: boolean };
};

type ApiSurah = {
  number?: number;
  name?: string;
  englishName?: string;
  englishNameTranslation?: string;
  revelationType?: string;
  numberOfAyahs?: number;
  ayahs?: ApiAyah[];
};

function cleanAyah(ayah: ApiAyah): QuranTajweedAyah {
  const out: QuranTajweedAyah = {
    number: Number(ayah.number ?? 0),
    numberInSurah: Number(ayah.numberInSurah ?? 0),
    text: (ayah.text ?? "").trim(),
  };
  for (const key of ["juz", "manzil", "page", "ruku", "hizbQuarter", "sajda"] as const) {
    if (ayah[key] != null) (out as Record<string, unknown>)[key] = ayah[key];
  }
  return out;
}

function cleanSurah(surah: ApiSurah): QuranTajweedSurah {
  const ayahs = (surah.ayahs ?? []).map(cleanAyah);
  return {
    number: Number(surah.number ?? 0),
    name: surah.name,
    englishName: surah.englishName,
    englishNameTranslation: surah.englishNameTranslation,
    revelationType: surah.revelationType,
    numberOfAyahs: surah.numberOfAyahs ?? ayahs.length,
    ayahs,
  };
}

/** Al Quran Cloud quran-tajweed → assets/quran_tajweed.json пішімі. */
export function quranTajweedDocFromAlquranApi(body: unknown): QuranTajweedAssetDoc {
  const root = body as {
    code?: number;
    data?: {
      edition?: Record<string, unknown>;
      surahs?: ApiSurah[];
    };
  };
  const data = root.data;
  const surahsRaw = data?.surahs;
  if (!Array.isArray(surahsRaw) || surahsRaw.length < 1) {
    throw new Error("alquran tajweed: surahs missing");
  }
  const surahs = surahsRaw.map(cleanSurah).sort((a, b) => a.number - b.number);
  const ayahCount = surahs.reduce((n, s) => n + (s.ayahs?.length ?? 0), 0);
  const taggedAyahCount = surahs.reduce(
    (n, s) => n + (s.ayahs ?? []).filter((a) => (a.text ?? "").includes("[")).length,
    0
  );
  return {
    version: 1,
    source: ALQURAN_TAJWEED_API_URL,
    generatedAt: new Date().toISOString(),
    surahCount: surahs.length,
    ayahCount,
    taggedAyahCount,
    surahs,
  };
}
