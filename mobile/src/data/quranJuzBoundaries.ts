/**
 * 30 джуздың басталуы (Хафс, Мадани мұсаф бойынша кең тараған белгілеу).
 * Әр жазба: сол джуздың бірінші аяты (сүре және аят нөмірі).
 */
export type QuranJuzStart = {
  juz: number;
  startSurah: number;
  startAyah: number;
};

/**
 * Аяттың орналасқан джузы (Мадани мұсаф бойынша `QURAN_JUZ_STARTS` шегінен).
 * Мысалы, Әл-Фатиха: (1,1) → 1; Бақараның басындағы аяттар → 1, содан 2:142-тен бастап 2 джуз т.с.
 */
export function juzForSurahAyah(surahNum: number, ayahInSurah: number): number {
  let juz = 1;
  for (const row of QURAN_JUZ_STARTS) {
    if (row.startSurah < surahNum || (row.startSurah === surahNum && row.startAyah <= ayahInSurah)) {
      juz = row.juz;
    }
  }
  return juz;
}

export const QURAN_JUZ_STARTS: readonly QuranJuzStart[] = [
  { juz: 1, startSurah: 1, startAyah: 1 },
  { juz: 2, startSurah: 2, startAyah: 142 },
  { juz: 3, startSurah: 2, startAyah: 253 },
  { juz: 4, startSurah: 3, startAyah: 93 },
  { juz: 5, startSurah: 4, startAyah: 24 },
  { juz: 6, startSurah: 4, startAyah: 148 },
  { juz: 7, startSurah: 5, startAyah: 82 },
  { juz: 8, startSurah: 6, startAyah: 111 },
  { juz: 9, startSurah: 7, startAyah: 88 },
  { juz: 10, startSurah: 8, startAyah: 41 },
  { juz: 11, startSurah: 9, startAyah: 93 },
  { juz: 12, startSurah: 11, startAyah: 6 },
  { juz: 13, startSurah: 12, startAyah: 53 },
  { juz: 14, startSurah: 15, startAyah: 1 },
  { juz: 15, startSurah: 17, startAyah: 1 },
  { juz: 16, startSurah: 18, startAyah: 75 },
  { juz: 17, startSurah: 21, startAyah: 1 },
  { juz: 18, startSurah: 23, startAyah: 1 },
  { juz: 19, startSurah: 25, startAyah: 21 },
  { juz: 20, startSurah: 27, startAyah: 56 },
  { juz: 21, startSurah: 29, startAyah: 46 },
  { juz: 22, startSurah: 33, startAyah: 31 },
  { juz: 23, startSurah: 36, startAyah: 28 },
  { juz: 24, startSurah: 39, startAyah: 32 },
  { juz: 25, startSurah: 41, startAyah: 47 },
  { juz: 26, startSurah: 46, startAyah: 1 },
  { juz: 27, startSurah: 51, startAyah: 31 },
  { juz: 28, startSurah: 58, startAyah: 1 },
  { juz: 29, startSurah: 67, startAyah: 1 },
  { juz: 30, startSurah: 78, startAyah: 1 },
] as const;
