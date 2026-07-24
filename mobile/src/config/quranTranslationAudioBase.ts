import { getExpoExtra } from "./expoExtra";
import {
  QURAN_KY_HAKIMOV_AUDIO_EDITION,
  QURAN_UZ_RWWAD_AUDIO_EDITION,
} from "./quranReciters";

function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

/**
 * RAQAT өз CDN — қырғыз/өзбек аударма аудиосы (файлдар дайын болғанда).
 * Файл жолы: `{base}/128/{edition}/{1..6236}.mp3`
 * Мысалы: https://rahatomir.com/assets/quran/audio/128/ky.hakimov-audio/1.mp3
 * Қазір каталогта `audioAvailable: false` — picker-де «жақында».
 */
export function getRaqatQuranTranslationAudioBaseUrl(): string {
  const env =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_QURAN_TRANSLATION_AUDIO_BASE
      ? String(process.env.EXPO_PUBLIC_QURAN_TRANSLATION_AUDIO_BASE)
      : "";
  if (env.trim()) return normalizeBase(env);

  const web = getExpoExtra()?.raqatWebUrl;
  if (web != null && String(web).trim()) {
    return `${normalizeBase(String(web))}/assets/quran/audio`;
  }

  return "https://rahatomir.com/assets/quran/audio";
}

/** islamic.network-те жоқ — өз CDN-дегі аударма дауыстары. */
export const RAQAT_HOSTED_TRANSLATION_AUDIO_EDITIONS = new Set<string>([
  QURAN_KY_HAKIMOV_AUDIO_EDITION,
  QURAN_UZ_RWWAD_AUDIO_EDITION,
]);

export function isRaqatHostedTranslationAudioEdition(edition: string): boolean {
  return RAQAT_HOSTED_TRANSLATION_AUDIO_EDITIONS.has((edition ?? "").trim());
}

export function raqatHostedTranslationAyahMp3Url(
  globalAyahOneBased: number,
  edition: string,
  bitrate: 128 | 192 = 128
): string {
  const n = Math.max(1, Math.min(6236, Math.floor(globalAyahOneBased)));
  const ed = (edition ?? "").trim();
  return `${getRaqatQuranTranslationAudioBaseUrl()}/${bitrate}/${ed}/${n}.mp3`;
}

export function raqatHostedTranslationSurahMp3Url(
  surahOneBased: number,
  edition: string,
  bitrate: 128 | 192 = 128
): string {
  const s = Math.max(1, Math.min(114, Math.floor(surahOneBased)));
  const ed = (edition ?? "").trim();
  return `${getRaqatQuranTranslationAudioBaseUrl()}-surah/${bitrate}/${ed}/${String(s).padStart(3, "0")}.mp3`;
}
