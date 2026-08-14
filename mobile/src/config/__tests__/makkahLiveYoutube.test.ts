import {
  MAKKAH_LIVE_HLS_FHD_URL,
  MAKKAH_LIVE_HLS_HD_URL,
  MAKKAH_LIVE_HLS_PRIMARY_URL,
  MAKKAH_LIVE_HLS_SD_URL,
  MAKKAH_LIVE_HLS_SOURCES,
  MAKKAH_LIVE_HLS_URL,
} from "../makkahLiveYoutube";

describe("makkahLiveYoutube", () => {
  it("uses working 720p HTTPS primary and HTTP/480p fallbacks", () => {
    expect(MAKKAH_LIVE_HLS_URL).toBe(MAKKAH_LIVE_HLS_PRIMARY_URL);
    expect(MAKKAH_LIVE_HLS_FHD_URL).toBe(MAKKAH_LIVE_HLS_PRIMARY_URL);
    expect(MAKKAH_LIVE_HLS_SOURCES).toHaveLength(3);
    expect(MAKKAH_LIVE_HLS_SOURCES[0]).toBe(MAKKAH_LIVE_HLS_PRIMARY_URL);
    expect(MAKKAH_LIVE_HLS_SOURCES[1]).toBe(MAKKAH_LIVE_HLS_HD_URL);
    expect(MAKKAH_LIVE_HLS_SOURCES[2]).toBe(MAKKAH_LIVE_HLS_SD_URL);
    expect(MAKKAH_LIVE_HLS_PRIMARY_URL).toMatch(/^https:\/\/win\.holol\.com/);
    expect(MAKKAH_LIVE_HLS_HD_URL).toMatch(/^http:\/\/m\.live\.net\.sa/);
  });
});
