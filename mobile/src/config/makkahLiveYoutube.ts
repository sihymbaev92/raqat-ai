/** Қағба тікелей эфир — HLS көздері (YouTube жоқ). */

/**
 * Негізгі эфир — Aloula / Kwikmotion ABR master (1920×1080 + 480p + 360p).
 * Ойнатқыш ең жоғары variant-ты шешіп тікелей ашады (ABR 360p-ға түспесін).
 */
export const MAKKAH_LIVE_HLS_FHD_URL = "https://aloula-redirect.vercel.app/7/playlist.m3u8";

/**
 * Қосалқы — Saudi Quran TV 1280×720 бір variant (HTTP; cleartext exception).
 */
export const MAKKAH_LIVE_HLS_HD_URL = "http://m.live.net.sa:1935/live/quran/playlist.m3u8";

/**
 * Makkah TV — 854×480 HTTPS.
 */
export const MAKKAH_LIVE_HLS_MAKKAH_TV_URL =
  "https://media2.streambrothers.com:1936/8122/8122/playlist.m3u8";

/**
 * HTTPS Roku резерв — макс. ~480×384 (бұлыңғыр). Тек соңғы мүмкіндік.
 */
export const MAKKAH_LIVE_HLS_HTTPS_FALLBACK_URL =
  "https://cdn-globecast.akamaized.net/live/eds/saudi_quran/hls_roku/index.m3u8";

/** Негізгі эфир URL — FHD master (resolve кейін 1080p). */
export const MAKKAH_LIVE_HLS_URL = MAKKAH_LIVE_HLS_FHD_URL;

/**
 * HLS кезегі: FHD master (→1080p pin) → 720p → 480p → Roku.
 * Master URL-дерді ойнатқыш ең жоғары variant-қа шешеді.
 */
export const MAKKAH_LIVE_HLS_SOURCES: readonly string[] = [
  MAKKAH_LIVE_HLS_FHD_URL,
  MAKKAH_LIVE_HLS_HD_URL,
  MAKKAH_LIVE_HLS_MAKKAH_TV_URL,
  MAKKAH_LIVE_HLS_HTTPS_FALLBACK_URL,
];

/** Осы индекстердегі master-ды жоғары сапаға шешу керек. */
export function makkahLiveSourceNeedsQualityPin(sourceIndex: number): boolean {
  return sourceIndex === 0 || sourceIndex === 2 || sourceIndex === 3;
}
