import titles from "../../assets/bundled/surah-arabic-titles.json";

const TITLES = titles as readonly string[];

/** Мушаф тақырыбы: «سُورَةُ …» (114 сүре, бандл JSON). */
export function surahArabicBannerTitle(surahOneBased: number): string {
  const i = surahOneBased - 1;
  return i >= 0 && i < TITLES.length ? TITLES[i]! : "";
}

/** Тізімдегі қысқа араб атау (префикссіз). */
export function surahArabicListTitle(surahOneBased: number): string {
  const banner = surahArabicBannerTitle(surahOneBased);
  const short = banner.replace(/^سُورَةُ\s/u, "").trim();
  return short || banner;
}
