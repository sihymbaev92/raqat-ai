import surahListJson from "../../assets/bundled/surah-list-api.json";

type SurahRow = {
  number: number;
  name: string;
  numberOfAyahs?: number;
  revelationType?: string;
};

function rows(): SurahRow[] {
  const raw = surahListJson as { data?: SurahRow[] };
  return Array.isArray(raw.data) ? raw.data : [];
}

/** Бандлдағы сүре атауы (араб) — URL арқылы QuranSurah ашылғанда қолданылады. */
export function surahArabicFromBundled(surahNumber: number): string {
  const hit = rows().find((r) => r.number === surahNumber);
  return hit?.name ?? "";
}

export function surahRevelationTypeFromBundled(
  surahNumber: number
): "Meccan" | "Medinan" | null {
  const hit = rows().find((r) => r.number === surahNumber);
  const t = hit?.revelationType;
  if (t === "Meccan" || t === "Medinan") return t;
  return null;
}

export function surahAyahCountFromBundled(surahNumber: number): number | null {
  const hit = rows().find((r) => r.number === surahNumber);
  return typeof hit?.numberOfAyahs === "number" ? hit.numberOfAyahs : null;
}
