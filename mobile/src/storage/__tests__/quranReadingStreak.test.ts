import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadQuranReadingStreak,
  recordQuranReadingDay,
} from "../quranReadingStreak";

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

describe("quranReadingStreak", () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  it("starts streak at 1 on first reading day", async () => {
    const s = await recordQuranReadingDay();
    expect(s.current).toBe(1);
    expect(s.longest).toBe(1);
    expect(s.lastDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("does not increment twice on same calendar day", async () => {
    let stored: string | null = null;
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      key === "quran_reading_streak_v1" ? Promise.resolve(stored) : Promise.resolve(null)
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, val: string) => {
      if (key === "quran_reading_streak_v1") stored = val;
      return Promise.resolve();
    });
    const first = await recordQuranReadingDay();
    const second = await recordQuranReadingDay();
    expect(second.current).toBe(first.current);
    expect(second.lastDate).toBe(first.lastDate);
  });

  it("load returns empty when storage missing", async () => {
    const s = await loadQuranReadingStreak();
    expect(s).toEqual({ current: 0, longest: 0, lastDate: "" });
  });
});
