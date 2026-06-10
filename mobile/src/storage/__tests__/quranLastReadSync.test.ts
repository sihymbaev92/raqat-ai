import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  loadQuranLastReadState,
  syncQuranLastReadWithServerBidirectional,
} from "../quranLastRead";

jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
}));

jest.mock("../../config/raqatApiBase", () => ({
  getRaqatApiBase: jest.fn(() => "https://api.test"),
}));

jest.mock("../../services/platformApiClient", () => ({
  fetchMeQuranLastRead: jest.fn(),
  putMeQuranLastRead: jest.fn(),
}));

jest.mock("../authTokens", () => ({
  getValidAccessToken: jest.fn(),
}));

import { getRaqatApiBase } from "../../config/raqatApiBase";
import { fetchMeQuranLastRead, putMeQuranLastRead } from "../../services/platformApiClient";
import { getValidAccessToken } from "../authTokens";

describe("quranLastRead server sync", () => {
  beforeEach(() => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockClear();
    (getRaqatApiBase as jest.Mock).mockReturnValue("https://api.test");
    (getValidAccessToken as jest.Mock).mockResolvedValue("tok");
    (fetchMeQuranLastRead as jest.Mock).mockReset();
    (putMeQuranLastRead as jest.Mock).mockReset();
  });

  it("syncQuranLastReadWithServerBidirectional no-ops without API base", async () => {
    (getRaqatApiBase as jest.Mock).mockReturnValue("");
    await syncQuranLastReadWithServerBidirectional();
    expect(fetchMeQuranLastRead).not.toHaveBeenCalled();
  });

  it("syncQuranLastReadWithServerBidirectional pushes local when remote empty", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "quran_last_read_state_v1") {
        return Promise.resolve(
          JSON.stringify({
            global: { surah: 1, ayah: 7, ts: "2026-05-25T00:00:00.000Z" },
            bySurah: { "1": 7 },
          })
        );
      }
      return Promise.resolve(null);
    });
    (fetchMeQuranLastRead as jest.Mock).mockResolvedValue({
      ok: true,
      global: null,
      by_surah: {},
    });
    (putMeQuranLastRead as jest.Mock).mockResolvedValue({ ok: true });

    await syncQuranLastReadWithServerBidirectional();

    expect(putMeQuranLastRead).toHaveBeenCalledWith(
      "https://api.test",
      "tok",
      expect.objectContaining({
        global: { surah: 1, ayah: 7, ts: "2026-05-25T00:00:00.000Z" },
        by_surah: { "1": 7 },
      })
    );
  });

  it("syncQuranLastReadWithServerBidirectional merges remote into local", async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => {
      if (key === "quran_last_read_state_v1") {
        return Promise.resolve(
          JSON.stringify({
            global: { surah: 1, ayah: 1, ts: "2026-05-24T00:00:00.000Z" },
            bySurah: { "1": 1 },
          })
        );
      }
      return Promise.resolve(null);
    });
    (fetchMeQuranLastRead as jest.Mock).mockResolvedValue({
      ok: true,
      global: { surah: 2, ayah: 255, ts: "2026-05-25T12:00:00.000Z" },
      by_surah: { "2": 255 },
    });
    (putMeQuranLastRead as jest.Mock).mockResolvedValue({ ok: true });

    await syncQuranLastReadWithServerBidirectional();

    const writes = (AsyncStorage.setItem as jest.Mock).mock.calls.filter(
      (c) => c[0] === "quran_last_read_state_v1"
    );
    expect(writes.length).toBeGreaterThanOrEqual(1);
    const saved = JSON.parse(writes[writes.length - 1]![1] as string);
    expect(saved.global.surah).toBe(2);
    expect(saved.global.ayah).toBe(255);
    expect(saved.bySurah["2"]).toBe(255);
    expect(putMeQuranLastRead).toHaveBeenCalled();
  });
});
