import { QURAN_JUZ_STARTS, juzForSurahAyah } from "../data/quranJuzBoundaries";

/** Осы сүре ішінде джуз соңына дейін ойнату кезекі (жүктелген аяттар). */
export function ayahNumbersUntilJuzEndInSurah(
  surahNum: number,
  startAyahInSurah: number,
  lastAyahInSurah: number
): number[] {
  const start = Math.max(1, Math.floor(startAyahInSurah));
  const last = Math.max(start, Math.floor(lastAyahInSurah));
  const juz = juzForSurahAyah(surahNum, start);
  const nextJuz = QURAN_JUZ_STARTS.find((r) => r.juz === juz + 1);

  let endAyah = last;
  if (nextJuz) {
    if (nextJuz.startSurah === surahNum) {
      endAyah = Math.min(last, nextJuz.startAyah - 1);
    } else if (nextJuz.startSurah > surahNum) {
      endAyah = last;
    }
  }

  const out: number[] = [];
  for (let a = start; a <= endAyah; a += 1) out.push(a);
  return out;
}

/** Хатым/Құран: аяттан кейін ойнату кезегін аудио scope бойынша құрастырады. */
export function ayahNumbersForAudioPlayUntil(
  scope: "juz" | "surah" | "ayah",
  surahNum: number,
  startAyahInSurah: number,
  lastAyahInSurah: number
): number[] {
  const start = Math.max(1, Math.floor(startAyahInSurah));
  const last = Math.max(start, Math.floor(lastAyahInSurah));
  if (scope === "ayah") return [start];
  if (scope === "surah") {
    const out: number[] = [];
    for (let a = start; a <= last; a += 1) out.push(a);
    return out;
  }
  return ayahNumbersUntilJuzEndInSurah(surahNum, start, last);
}
