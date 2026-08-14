/** Сүре оқу экраны: тәжуид түстері көрінбейді (AsyncStorage prefs-тен тәуелсіз). */
export const QURAN_READER_TAJWEED_COLORS_ENABLED = false as const;

export function resolveQuranReaderTajweedColors(
  _stored?: boolean | null
): typeof QURAN_READER_TAJWEED_COLORS_ENABLED {
  void _stored;
  return QURAN_READER_TAJWEED_COLORS_ENABLED;
}
