import { QURAN_JUZ_STARTS, juzForSurahAyah } from "../data/quranJuzBoundaries";

/** Аяттан бастап ағымдағы сүре ішінде джуз соңына дейінгі аят нөмірлері. */
export function ayahNumbersUntilJuzEndInSurah(
  surah: number,
  startAyah: number,
  maxAyahInSurah: number
): number[] {
  const start = Math.max(1, Math.min(startAyah, maxAyahInSurah));
  const juz = juzForSurahAyah(surah, start);
  const nextJuz = QURAN_JUZ_STARTS.find((row) => row.juz === juz + 1);
  let endAyah = maxAyahInSurah;
  if (nextJuz?.startSurah === surah) {
    endAyah = Math.min(maxAyahInSurah, nextJuz.startAyah - 1);
  }
  if (endAyah < start) endAyah = start;
  const out: number[] = [];
  for (let a = start; a <= endAyah; a += 1) out.push(a);
  return out;
}
