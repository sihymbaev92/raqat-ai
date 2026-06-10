/** QCF4 Madinah Mushaf page JSON (MohamadHajjRabee/quran-qcf4). */

export type Qcf4WordType = "word" | "end" | "surah_header" | "bismillah" | "quarter";

export type Qcf4Word = {
  code: number;
  char: string;
  font: string;
  text: string;
  type: Qcf4WordType;
  verse_key?: string;
  position?: number;
  sura?: number;
};

export type Qcf4Line = {
  line: number;
  words: Qcf4Word[];
};

export type Qcf4SurahOnPage = {
  id: number;
  name: string;
  name_arabic: string;
  verse_start: number;
  verse_end: number;
};

export type Qcf4PageJson = {
  page: number;
  font: string;
  surahs: Qcf4SurahOnPage[];
  lines: Qcf4Line[];
};

export type Qcf4FontMap = Record<string, string>;

export function parseVerseKey(verseKey: string): { surah: number; ayah: number } | null {
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(verseKey.trim());
  if (!m) return null;
  const surah = parseInt(m[1]!, 10);
  const ayah = parseInt(m[2]!, 10);
  if (!Number.isFinite(surah) || !Number.isFinite(ayah)) return null;
  return { surah, ayah };
}
