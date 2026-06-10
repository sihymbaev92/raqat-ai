/**
 * Аят сайын дыбыс — негізінен islamic.network CDN (bitrate 192).
 * `edition`: мысалы ar.abdurrahmaansudais (толық тізім: `config/quranReciters.ts`).
 */
import {
  DEFAULT_QURAN_RECITER_EDITION,
  QURAN_ABDULRAHMAN_MOSSAD_EDITION,
} from "../config/quranReciters";
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

const ABDULRAHMAN_MOSSAD_ARCHIVE_BASE = "https://ia904706.us.archive.org/13/items/010_20221110";

/** Бұл қариде жалпыға ашық source-та толық Құран емес, таңдаулы толық сүрелер ғана бар. */
export const ABDULRAHMAN_MOSSAD_AVAILABLE_SURAHS = new Set([
  10, 19, 23, 29, 32, 49, 73, 78, 87, 88, 100, 107,
]);

export function quranReciterUsesAyahAudio(edition: string): boolean {
  return edition.trim().toLowerCase() !== QURAN_ABDULRAHMAN_MOSSAD_EDITION;
}

export function quranReciterHasAudioForGlobalAyah(globalAyahOneBased: number, edition: string): boolean {
  const ed = (edition || DEFAULT_QURAN_RECITER_EDITION).trim() || DEFAULT_QURAN_RECITER_EDITION;
  if (ed !== QURAN_ABDULRAHMAN_MOSSAD_EDITION) return true;
  const { surah } = globalAyahToRef(globalAyahOneBased);
  return ABDULRAHMAN_MOSSAD_AVAILABLE_SURAHS.has(surah);
}

export function quranAyahMp3Url(globalAyahOneBased: number, edition: string = DEFAULT_QURAN_RECITER_EDITION): string {
  const n = Math.max(1, Math.min(6236, Math.floor(globalAyahOneBased)));
  const ed = (edition || DEFAULT_QURAN_RECITER_EDITION).trim() || DEFAULT_QURAN_RECITER_EDITION;
  if (ed === QURAN_ABDULRAHMAN_MOSSAD_EDITION) {
    const { surah } = globalAyahToRef(n);
    if (!ABDULRAHMAN_MOSSAD_AVAILABLE_SURAHS.has(surah)) {
      throw new Error(`Abdulrahman Mossad audio is not available for surah ${surah}`);
    }
    return `${ABDULRAHMAN_MOSSAD_ARCHIVE_BASE}/${String(surah).padStart(3, "0")}.mp3`;
  }
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
