import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  scheduleQuranLastReadSave,
  saveQuranLastReadNow,
  setQuranLastReadEnabled,
} from "../quranLastRead";

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

describe("quranLastRead", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("saveQuranLastReadNow cancels debounced save and persists explicit ayah", async () => {
    await setQuranLastReadEnabled(true);
    scheduleQuranLastReadSave(2, 5);
    await saveQuranLastReadNow(2, 99);
    jest.advanceTimersByTime(2000);
    const stateWrites = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
      (c) => c[0] === "quran_last_read_state_v1"
    );
    expect(stateWrites.length).toBeGreaterThanOrEqual(1);
    const last = JSON.parse(stateWrites[stateWrites.length - 1]![1] as string);
    expect(last.global.surah).toBe(2);
    expect(last.global.ayah).toBe(99);
  });
});
