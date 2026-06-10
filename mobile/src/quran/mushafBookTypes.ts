import type { CachedAyah } from "../storage/quranSurahCache";

/** Хафс 604-беттік кітап: аят сүре контекстімен. */
export type MushafBookAyah = CachedAyah & { surahNumber: number };

/** Бір Hafs беті (1..604) — аяттар мен бет нөмірі. */
export type MushafBookPageSlice = {
  key: string;
  mushafPageNumber: number;
  ayahs: MushafBookAyah[];
};

export type MushafAyahRef = { surah: number; ayah: number };
