/**
 * Құран имла нұсқасы: madinah (Усмани) | turkish (Unicode, түрік кодтауы).
 * Дерек: Al Quran Cloud edition slug-тары (`alquranSurahDualArabicFetch.ts`).
 */
export type QuranArabicScriptEditionId = "madinah" | "turkish";

export const DEFAULT_QURAN_ARABIC_SCRIPT_EDITION: QuranArabicScriptEditionId = "madinah";

export function normalizeQuranArabicScriptEdition(raw: string | null | undefined): QuranArabicScriptEditionId {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "turkish" || s === "tr" || s === "turkish_print" || s === "unicode") return "turkish";
  return "madinah";
}
