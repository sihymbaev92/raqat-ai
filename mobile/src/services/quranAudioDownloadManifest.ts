import { QURAN_RECITER_OPTIONS, normalizeReciterEdition } from "../config/quranReciters";
import { quranAyahMp3Url } from "./quranSudaisAudio";
import { globalAyahToRef, TOTAL_AYAHS } from "../data/quranAyahCounts";

export type QuranAudioDownloadTask = {
  index: number;
  edition: string;
  reciterLabel: string;
  kind: "ayah";
  surah: number;
  ayah: number;
  globalAyah: number;
  uri: string;
};

type ReciterBlock = {
  edition: string;
  labelKk: string;
  start: number;
  count: number;
  kind: "ayah";
};

/** Таңдалған қаридың 6236 аяты — барлық қариларды бірден жүктемейміз. */
export function quranAudioDownloadReciterBlocks(edition?: string): ReciterBlock[] {
  const ed = normalizeReciterEdition(edition);
  const reciter = QURAN_RECITER_OPTIONS.find((o) => o.edition === ed) ?? QURAN_RECITER_OPTIONS[0]!;
  return [
    {
      edition: reciter.edition,
      labelKk: reciter.labelKk,
      start: 0,
      count: TOTAL_AYAHS,
      kind: "ayah",
    },
  ];
}

export function quranAudioDownloadTotalTasks(edition?: string): number {
  const blocks = quranAudioDownloadReciterBlocks(edition);
  const last = blocks[blocks.length - 1];
  return last ? last.start + last.count : 0;
}

export function quranAudioDownloadTaskAt(index: number, edition?: string): QuranAudioDownloadTask | null {
  const ix = Math.floor(index);
  if (ix < 0) return null;
  const block = quranAudioDownloadReciterBlocks(edition).find((b) => ix >= b.start && ix < b.start + b.count);
  if (!block) return null;
  const local = ix - block.start;
  const globalAyah = local + 1;
  const ref = globalAyahToRef(globalAyah);
  return {
    index: ix,
    edition: block.edition,
    reciterLabel: block.labelKk,
    kind: "ayah",
    surah: ref.surah,
    ayah: ref.ayah,
    globalAyah,
    uri: quranAyahMp3Url(globalAyah, block.edition),
  };
}

export function quranAudioDownloadTaskLabel(task: QuranAudioDownloadTask): string {
  return `${task.reciterLabel} · ${task.surah}:${task.ayah}`;
}

export function quranAudioDownloadEditionAyahTotal(): number {
  return TOTAL_AYAHS;
}

export function quranAudioDownloadTaskForEditionAt(
  edition: string,
  index: number
): QuranAudioDownloadTask | null {
  return quranAudioDownloadTaskAt(index, edition);
}
