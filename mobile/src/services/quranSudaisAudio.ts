/**
 * Аят сайын дыбыс — негізінен islamic.network CDN.
 * ky/uz аударма дауысы — RAQAT CDN (`quranTranslationAudioBase.ts`).
 */
import {
  DEFAULT_QURAN_RECITER_EDITION,
  QURAN_ABDULRAHMAN_MOSSAD_EDITION,
  QURAN_HUSARY_EDITION,
} from "../config/quranReciters";
import {
  isRaqatHostedTranslationAudioEdition,
  raqatHostedTranslationAyahMp3Url,
  raqatHostedTranslationSurahMp3Url,
} from "../config/quranTranslationAudioBase";
import { quranComReciterIdForEdition, quranComTimedAudioUrlForEdition } from "../config/quranComReciterMap";
import { globalAyahToRef } from "../data/quranAyahCounts";

/** CDN-де 192 kbps арнада тұрақты ойнайтын редакциялар. */
const CDN_AYAH_192_EDITIONS = new Set([
  "ar.abdurrahmaansudais",
  "ar.abdulbasitmurattal",
  "en.walk",
]);

/** `kk.*` / `ru.*` / `tr.*` / `ky.*` / `uz.*` және көптеген `ar.*` — 128; `en.*` және жоғарыдағы тізім — 192. */
export function cdnAyahBitrateKbps(edition: string): 128 | 192 {
  const e = edition.trim().toLowerCase();
  if (e.startsWith("en.") || CDN_AYAH_192_EDITIONS.has(e)) return 192;
  if (
    e.startsWith("kk.") ||
    e.startsWith("ru.") ||
    e.startsWith("tr.") ||
    e.startsWith("ky.") ||
    e.startsWith("uz.")
  ) {
    return 128;
  }
  return 128;
}
export function quranReciterUsesAyahAudio(edition: string): boolean {
  void edition;
  return true;
}

export function quranReciterHasAudioForGlobalAyah(globalAyahOneBased: number, edition: string): boolean {
  void globalAyahOneBased;
  void edition;
  return true;
}

export function quranReciterSupportsArabicKaraoke(edition: string): boolean {
  return quranComReciterIdForEdition(edition || DEFAULT_QURAN_RECITER_EDITION) != null;
}

function paddedAyahAudioKey(globalAyahOneBased: number): string {
  const { surah, ayah } = globalAyahToRef(Math.max(1, Math.min(6236, Math.floor(globalAyahOneBased))));
  return `${String(surah).padStart(3, "0")}${String(ayah).padStart(3, "0")}`;
}

function quranComTimedAyahMp3Url(globalAyahOneBased: number, edition: string): string | null {
  const key = paddedAyahAudioKey(globalAyahOneBased);
  return quranComTimedAudioUrlForEdition(edition, key);
}

export function quranAyahMp3Url(globalAyahOneBased: number, edition: string = DEFAULT_QURAN_RECITER_EDITION): string {
  const n = Math.max(1, Math.min(6236, Math.floor(globalAyahOneBased)));
  const rawEd = (edition || DEFAULT_QURAN_RECITER_EDITION).trim() || DEFAULT_QURAN_RECITER_EDITION;
  const ed = rawEd === QURAN_ABDULRAHMAN_MOSSAD_EDITION ? QURAN_HUSARY_EDITION : rawEd;
  if (isRaqatHostedTranslationAudioEdition(ed)) {
    return raqatHostedTranslationAyahMp3Url(n, ed, cdnAyahBitrateKbps(ed));
  }
  const timedUrl = quranComTimedAyahMp3Url(n, ed);
  if (timedUrl) return timedUrl;
  const br = cdnAyahBitrateKbps(ed);
  return `https://cdn.islamic.network/quran/audio/${br}/${ed}/${n}.mp3`;
}

/** Толық сүре файлы (128 kbps) — сыртқы ойнатқыш; edition сол қариға сәйкес. */
export function quranSurahMp3Url(surahOneBased: number, edition: string = DEFAULT_QURAN_RECITER_EDITION): string {
  const s = Math.max(1, Math.min(114, Math.floor(surahOneBased)));
  const padded = String(s).padStart(3, "0");
  const ed = (edition || DEFAULT_QURAN_RECITER_EDITION).trim() || DEFAULT_QURAN_RECITER_EDITION;
  if (isRaqatHostedTranslationAudioEdition(ed)) {
    return raqatHostedTranslationSurahMp3Url(s, ed, 128);
  }
  /** Толық сүре: CDN әдетте 128 kbps жолмен (аят сайын bitrate-тен өзгеше). */
  return `https://cdn.islamic.network/quran/audio-surah/128/${ed}/${padded}.mp3`;
}
