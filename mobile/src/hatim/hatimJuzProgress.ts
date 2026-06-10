import { juzForSurahAyah } from "../data/quranJuzBoundaries";
import { AYAH_COUNTS_PER_SURAH } from "../data/quranAyahCounts";

/** Әр джузға тиесілі сүре нөмірлері (аят шекаралары бойынша; сүре бірнеше джузға кіруі мүмкін). */
const SURAHS_PER_JUZ: ReadonlyArray<ReadonlySet<number>> = (() => {
  const sets: Set<number>[] = Array.from({ length: 30 }, () => new Set<number>());
  for (let s = 1; s <= 114; s += 1) {
    const lastAyah = AYAH_COUNTS_PER_SURAH[s - 1] ?? 1;
    const jLo = juzForSurahAyah(s, 1);
    const jHi = juzForSurahAyah(s, lastAyah);
    const lo = Math.min(jLo, jHi);
    const hi = Math.max(jLo, jHi);
    for (let j = lo; j <= hi; j += 1) {
      if (j >= 1 && j <= 30) sets[j - 1]!.add(s);
    }
  }
  return sets;
})();

export type HatimJuzStat = {
  juz: number;
  /** 0..1 — осы джуздағы «тиісті» сүрелердің қаншасы толық оқылды деп белгіленген */
  fraction: number;
  readInJuz: number;
  totalInJuz: number;
};

/** Хатым тізіміндегі сүре белгілеріне сүйеніп әр джуз үшін шамамен толтыру дәрежесі. */
export function computeHatimJuzStats(read: Set<number> | ReadonlySet<number>): HatimJuzStat[] {
  const r = read instanceof Set ? read : new Set(read);
  const out: HatimJuzStat[] = [];
  for (let j = 1; j <= 30; j += 1) {
    const surahs = SURAHS_PER_JUZ[j - 1]!;
    let done = 0;
    for (const s of surahs) {
      if (r.has(s)) done += 1;
    }
    const total = surahs.size;
    const fraction = total > 0 ? Math.min(1, done / total) : 0;
    out.push({ juz: j, fraction, readInJuz: done, totalInJuz: total });
  }
  return out;
}
