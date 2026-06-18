/**
 * Аят сайын дыбыс — негізінен islamic.network CDN (bitrate 192).
 * `edition`: мысалы ar.abdurrahmaansudais (толық тізім: `config/quranReciters.ts`).
 */
import {
  DEFAULT_QURAN_RECITER_EDITION,
  QURAN_ABDULRAHMAN_MOSSAD_EDITION,
  QURAN_HUSARY_EDITION,
} from "../config/quranReciters";
import { quranComReciterIdForEdition, quranComTimedAudioUrlForEdition } from "../config/quranComReciterMap";
import { globalAyahToRef } from "../data/quranAyahCounts";

/** CDN-де тек 192 kbps арнада тұрақты ойнайтын араб қарилары. */
const CDN_AYAH_192_EDITIONS = new Set([
  "ar.abdurrahmaansudais",
  "ar.abdulbasitmurattal",
]);

/** `kk.*` / `ru.*` және көптеген `ar.*` тек 128 kbps; жоғарыдағы тізім — 192. */
export function cdnAyahBitrateKbps(edition: string): 128 | 192 {
  const e = edition.trim().toLowerCase();
  if (e.startsWith("kk.") || e.startsWith("ru.")) return 128;
  if (CDN_AYAH_192_EDITIONS.has(e)) return 192;
  return 128;
}
export const QURAN_SUDAIS_EDITION = "ar.abdurrahmaansudais";

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
  const timedUrl = quranComTimedAyahMp3Url(n, ed);
  if (timedUrl) return timedUrl;
  const br = cdnAyahBitrateKbps(ed);
  return `https://cdn.islamic.network/quran/audio/${br}/${ed}/${n}.mp3`;
}

/** @deprecated қолданыңыз: quranAyahMp3Url(n, edition) */
export function sudaisAyahMp3Url(globalAyahOneBased: number): string {
  return quranAyahMp3Url(globalAyahOneBased, QURAN_SUDAIS_EDITION);
}

/** Толық сүре файлы (128 kbps) — сыртқы ойнатқыш; edition сол қариға сәйкес. */
export function quranSurahMp3Url(surahOneBased: number, edition: string = DEFAULT_QURAN_RECITER_EDITION): string {
  const s = Math.max(1, Math.min(114, Math.floor(surahOneBased)));
  const padded = String(s).padStart(3, "0");
  const ed = (edition || DEFAULT_QURAN_RECITER_EDITION).trim() || DEFAULT_QURAN_RECITER_EDITION;
  /** Толық сүре: CDN әдетте 128 kbps жолмен (аят сайын bitrate-тен өзгеше). */
  return `https://cdn.islamic.network/quran/audio-surah/128/${ed}/${padded}.mp3`;
}

/** @deprecated қолданыңыз: quranSurahMp3Url(s, edition) */
export function sudaisSurahMp3Url(surahOneBased: number): string {
  return quranSurahMp3Url(surahOneBased, QURAN_SUDAIS_EDITION);
}
