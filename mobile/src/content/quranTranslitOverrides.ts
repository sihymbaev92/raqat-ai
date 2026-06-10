/**
 * Көрсетілетін қазақ транскрипциясы — бандлдағы кітаптық кирил (resolveQuranTranslitForDisplay).
 * Мұнда тек нақты түзетулер; басмала бандлда «бисмилләһир рахманир рахиим».
 */
type AyahMap = Record<number, string>;
type SurahMap = Record<number, AyahMap>;

const QURAN_TRANSLIT_OVERRIDES: SurahMap = {};

export function getQuranTranslitOverride(surah: number, ayah: number): string | null {
  const bySurah = QURAN_TRANSLIT_OVERRIDES[surah];
  if (!bySurah) return null;
  const value = bySurah[ayah];
  return value?.trim() ? value : null;
}
