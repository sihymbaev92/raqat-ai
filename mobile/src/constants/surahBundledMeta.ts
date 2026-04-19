import surahListJson from "../../assets/bundled/surah-list-api.json";

type SurahRow = { number: number; name: string };

function rows(): SurahRow[] {
  const raw = surahListJson as { data?: SurahRow[] };
  return Array.isArray(raw.data) ? raw.data : [];
}

/** Бандлдағы сүре атауы (араб) — URL арқылы QuranSurah ашылғанда қолданылады. */
export function surahArabicFromBundled(surahNumber: number): string {
  const hit = rows().find((r) => r.number === surahNumber);
  return hit?.name ?? "";
}
