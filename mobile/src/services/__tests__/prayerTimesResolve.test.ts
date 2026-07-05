import {
  fetchPrayerTimesForLocation,
  isPrayerTimesResultForLocalToday,
  type PrayerTimesResult,
} from "../../api/prayerTimes";
import { loadPrayerCache, loadPrayerCacheRelaxed, savePrayerCache } from "../../storage/prayerCache";
import { resolvePrayerTimesForDisplay } from "../prayerTimesResolve";

jest.mock("../../api/prayerTimes", () => ({
  ...jest.requireActual("../../api/prayerTimes"),
  fetchPrayerTimesForLocation: jest.fn(),
  isPrayerTimesResultForLocalToday: jest.fn(),
}));

jest.mock("../../storage/prayerCache", () => ({
  loadPrayerCache: jest.fn(),
  loadPrayerCacheRelaxed: jest.fn(),
  savePrayerCache: jest.fn(),
}));

const mockFetch = fetchPrayerTimesForLocation as jest.MockedFunction<typeof fetchPrayerTimesForLocation>;
const mockToday = isPrayerTimesResultForLocalToday as jest.MockedFunction<
  typeof isPrayerTimesResultForLocalToday
>;
const mockStrict = loadPrayerCache as jest.MockedFunction<typeof loadPrayerCache>;
const mockRelaxed = loadPrayerCacheRelaxed as jest.MockedFunction<typeof loadPrayerCacheRelaxed>;
const mockSave = savePrayerCache as jest.MockedFunction<typeof savePrayerCache>;

const cachedToday: PrayerTimesResult = {
  city: "Shymkent",
  country: "Kazakhstan",
  date: "2026-06-17",
  fajr: "04:10",
  sunrise: "05:40",
  dhuhr: "12:30",
  asr: "16:20",
  maghrib: "19:50",
  isha: "21:20",
};

describe("resolvePrayerTimesForDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStrict.mockResolvedValue(null);
    mockRelaxed.mockResolvedValue(null);
    mockToday.mockReturnValue(true);
    mockSave.mockResolvedValue(undefined);
  });

  it("returns fresh network data and saves cache on success", async () => {
    mockFetch.mockResolvedValue({ ...cachedToday, fajr: "04:11" });

    const out = await resolvePrayerTimesForDisplay("Shymkent", "Kazakhstan");

    expect(out.fromCache).toBe(false);
    expect(out.data.fajr).toBe("04:11");
    expect(mockSave).toHaveBeenCalledWith(out.data);
  });

  it("falls back to cached times when network throws", async () => {
    mockRelaxed.mockResolvedValue({ ...cachedToday, savedAt: new Date().toISOString() } as never);
    mockFetch.mockRejectedValue(new Error("offline"));

    const out = await resolvePrayerTimesForDisplay("Shymkent", "Kazakhstan");

    expect(out.fromCache).toBe(true);
    expect(out.networkError).toBe("offline");
    expect(out.data.fajr).toBe("04:10");
  });

  it("falls back to cache when network returns error payload", async () => {
    mockRelaxed.mockResolvedValue({ ...cachedToday, savedAt: new Date().toISOString() } as never);
    mockFetch.mockResolvedValue({
      ...cachedToday,
      fajr: "",
      error: "API down",
    });

    const out = await resolvePrayerTimesForDisplay("Shymkent", "Kazakhstan");

    expect(out.fromCache).toBe(true);
    expect(out.networkError).toBe("API down");
    expect(out.data.fajr).toBe("04:10");
  });
});
