import { QURAN_RECITER_OPTIONS } from "../config/quranReciters";
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

export function quranAudioDownloadReciterBlocks(): ReciterBlock[] {
  const blocks: ReciterBlock[] = [];
  let start = 0;
  for (const reciter of QURAN_RECITER_OPTIONS) {
    const count = TOTAL_AYAHS;
    blocks.push({
      edition: reciter.edition,
      labelKk: reciter.labelKk,
      start,
      count,
      kind: "ayah",
    });
    start += count;
  }
  return blocks;
}

export function quranAudioDownloadTotalTasks(): number {
  const blocks = quranAudioDownloadReciterBlocks();
  const last = blocks[blocks.length - 1];
  return last ? last.start + last.count : 0;
}

export function quranAudioDownloadTaskAt(index: number): QuranAudioDownloadTask | null {
  const ix = Math.floor(index);
  if (ix < 0) return null;
  const block = quranAudioDownloadReciterBlocks().find((b) => ix >= b.start && ix < b.start + b.count);
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
