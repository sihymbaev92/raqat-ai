import {
  peekMakkahLiveResolved,
  storeMakkahLiveResolved,
} from "../makkahLiveStreamCache";
import { MAKKAH_LIVE_HLS_PRIMARY_URL } from "../../config/makkahLiveYoutube";

describe("makkahLiveStreamCache", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("stores and returns resolved URLs within TTL", () => {
    const resolved = "https://win.holol.com/live/quran/chunklist.m3u8";
    storeMakkahLiveResolved(MAKKAH_LIVE_HLS_PRIMARY_URL, resolved);
    expect(peekMakkahLiveResolved(MAKKAH_LIVE_HLS_PRIMARY_URL)).toBe(resolved);

    jest.advanceTimersByTime(3 * 60_000);
    expect(peekMakkahLiveResolved(MAKKAH_LIVE_HLS_PRIMARY_URL)).toBe(resolved);
  });

  it("expires cached URLs after TTL", () => {
    storeMakkahLiveResolved(MAKKAH_LIVE_HLS_PRIMARY_URL, "https://example/chunk.m3u8");
    jest.advanceTimersByTime(4 * 60_000 + 1);
    expect(peekMakkahLiveResolved(MAKKAH_LIVE_HLS_PRIMARY_URL)).toBeNull();
  });
});
