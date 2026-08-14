/** Қағба тікелей эфир — HLS көздері (YouTube жоқ). */

/**
 * Негізгі — Saudi Quran TV 1280×720 (HTTPS).
 * Алдыңғы aloula-redirect.vercel.app өшірілген (402).
 */
export const MAKKAH_LIVE_HLS_PRIMARY_URL = "https://win.holol.com/live/quran/playlist.m3u8";

/**
 * Резерв — live.net.sa 720p (HTTP; Android cleartext рұқсатталған).
 */
export const MAKKAH_LIVE_HLS_HD_URL = "http://m.live.net.sa:1935/live/quran/playlist.m3u8";

/**
 * Makkah TV — 854×480 HTTPS.
 */
export const MAKKAH_LIVE_HLS_SD_URL = "https://media2.streambrothers.com:1936/8122/8122/playlist.m3u8";

/** @deprecated — ескі атау; primary URL */
export const MAKKAH_LIVE_HLS_FHD_URL = MAKKAH_LIVE_HLS_PRIMARY_URL;

/** @deprecated — ескі атау */
export const MAKKAH_LIVE_HLS_MAKKAH_TV_URL = MAKKAH_LIVE_HLS_SD_URL;

/** @deprecated — Akamai Roku 404; резерв ретінде primary қайта қолданылады */
export const MAKKAH_LIVE_HLS_HTTPS_FALLBACK_URL = MAKKAH_LIVE_HLS_PRIMARY_URL;

/** Негізгі эфир URL. */
export const MAKKAH_LIVE_HLS_URL = MAKKAH_LIVE_HLS_PRIMARY_URL;

/**
 * HLS кезегі: 720p HTTPS → 720p HTTP → 480p.
 * Master playlist-тер ойнатқышта ең жоғары variant-қа шешіледі.
 */
export const MAKKAH_LIVE_HLS_SOURCES: readonly string[] = [
  MAKKAH_LIVE_HLS_PRIMARY_URL,
  MAKKAH_LIVE_HLS_HD_URL,
  MAKKAH_LIVE_HLS_SD_URL,
];

/** Барлық master-ды жоғары сапаға pin жасау керек. */
export function makkahLiveSourceNeedsQualityPin(_sourceIndex: number): boolean {
  return true;
}
