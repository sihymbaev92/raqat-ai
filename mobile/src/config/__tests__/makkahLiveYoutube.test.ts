import {
  MAKKAH_LIVE_HLS_FHD_URL,
  MAKKAH_LIVE_HLS_HD_URL,
  MAKKAH_LIVE_HLS_HTTPS_FALLBACK_URL,
  MAKKAH_LIVE_HLS_MAKKAH_TV_URL,
  MAKKAH_LIVE_HLS_SOURCES,
  MAKKAH_LIVE_HLS_URL,
} from "../makkahLiveYoutube";

describe("makkahLiveYoutube", () => {
  it("prefers FHD HTTPS over HD HTTP and low-res Roku", () => {
    expect(MAKKAH_LIVE_HLS_URL).toBe(MAKKAH_LIVE_HLS_FHD_URL);
    expect(MAKKAH_LIVE_HLS_SOURCES[0]).toBe(MAKKAH_LIVE_HLS_FHD_URL);
    expect(MAKKAH_LIVE_HLS_SOURCES[1]).toBe(MAKKAH_LIVE_HLS_HD_URL);
    expect(MAKKAH_LIVE_HLS_SOURCES[2]).toBe(MAKKAH_LIVE_HLS_MAKKAH_TV_URL);
    expect(MAKKAH_LIVE_HLS_SOURCES[MAKKAH_LIVE_HLS_SOURCES.length - 1]).toBe(
      MAKKAH_LIVE_HLS_HTTPS_FALLBACK_URL
    );
    expect(MAKKAH_LIVE_HLS_FHD_URL).toMatch(/^https:\/\//);
    expect(MAKKAH_LIVE_HLS_HD_URL).toMatch(/^http:\/\/m\.live\.net\.sa/);
  });
});
