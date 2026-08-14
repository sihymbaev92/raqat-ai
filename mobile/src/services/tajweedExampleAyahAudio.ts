import type { AVPlaybackSource } from "expo-av";

import { DEFAULT_QURAN_RECITER_EDITION } from "../config/quranReciters";
import { surahAyahToGlobalOneBased } from "../data/quranAyahCounts";
import { fetchQuranComAyahAudioSegments } from "./quranComAudioSegments";
import { quranAyahMp3Url } from "./quranSudaisAudio";
import { playTajweedMp3Segment } from "../utils/tajweedLetterAudioPlayer";
import type { TajweedGuideExampleAudio } from "../content/tajweedGuideDataset.types";

/**
 * EveryAyah / Quran.com — аят ішіндегі нақты сөзді өзгеріссіз ойнату.
 * Word timestamps: Quran.com API v4 segments.
 */
export async function playTajweedEveryAyahWordAudio(
  audio: Extract<TajweedGuideExampleAudio, { source: "everyayah-word" }>
): Promise<boolean> {
  const surah = Math.floor(audio.surah);
  const ayah = Math.floor(audio.ayah);
  const wordIndex = Math.max(0, Math.floor(audio.wordIndex));
  const edition = (audio.reciterEdition ?? DEFAULT_QURAN_RECITER_EDITION).trim() || DEFAULT_QURAN_RECITER_EDITION;

  if (surah < 1 || surah > 114 || ayah < 1) return false;

  const globalAyah = surahAyahToGlobalOneBased(surah, ayah);
  const url = quranAyahMp3Url(globalAyah, edition);
  const source: AVPlaybackSource = { uri: url };

  const meta = await fetchQuranComAyahAudioSegments(surah, ayah, edition);
  if (!meta?.segments.length) {
    return playTajweedMp3Segment(source, { startMs: 0, endMs: 0, playbackRate: 1 });
  }

  const seg = meta.segments.find(([w0, w1]) => wordIndex >= w0 && wordIndex < w1);
  if (!seg) {
    const fallback = meta.segments[Math.min(wordIndex, meta.segments.length - 1)]!;
    return playTajweedMp3Segment(source, {
      startMs: fallback[2],
      endMs: fallback[3],
      playbackRate: 1,
    });
  }

  return playTajweedMp3Segment(source, {
    startMs: seg[2],
    endMs: seg[3],
    playbackRate: 1,
  });
}
