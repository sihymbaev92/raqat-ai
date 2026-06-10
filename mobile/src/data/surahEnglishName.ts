import surahListApi from "../../assets/bundled/surah-list-api.json";

const BY_NUM = new Map(
  (surahListApi as { data: { number: number; englishName: string }[] }).data.map((s) => [
    s.number,
    s.englishName,
  ])
);

/** Quran.com стиліндегі латын атау (мыс. Al-Baqara). */
export function surahEnglishName(surahNumber: number): string {
  return BY_NUM.get(surahNumber) ?? "";
}
