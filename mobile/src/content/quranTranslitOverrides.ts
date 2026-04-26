/**
 * Транскрипция негізінен `assets/bundled/quran-kk-from-db.json` (asyldin) арқылы толықтырылады.
 * Қосымша оверрайд қажет болмаса бос қалдыруға болады.
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
