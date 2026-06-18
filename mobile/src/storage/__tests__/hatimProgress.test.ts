import AsyncStorage from "@react-native-async-storage/async-storage";
import { getRaqatApiBase } from "../../config/raqatApiBase";
import { fetchMeHatim, putMeHatim } from "../../services/platformApiClient";
import { getValidAccessToken } from "../authTokens";
import {
  clearHatimProgress,
  hatimProgressFraction,
  loadHatimProgress,
  loadHatimResume,
  pushHatimToServerIfLoggedIn,
  recordHatimAyahTapped,
  saveHatimResume,
  syncHatimWithServerBidirectional,
  toggleHatimSurah,
} from "../hatimProgress";

jest.mock("../../config/raqatApiBase", () => ({
  getRaqatApiBase: jest.fn(),
}));

jest.mock("../authTokens", () => ({
  getValidAccessToken: jest.fn(),
}));

jest.mock("../../services/platformApiClient", () => ({
  fetchMeHatim: jest.fn(),
  putMeHatim: jest.fn(),
}));

const KEY_V2 = "raqat_hatim_progress_v2";
const KEY_LEGACY_V1 = "raqat_hatim_progress_v1";

async function getStoredV2(): Promise<{
  readSurahs: number[];
  resume: { surah: number; ayah: number } | null;
} | null> {
  const raw = await AsyncStorage.getItem(KEY_V2);
  if (!raw) return null;
  return JSON.parse(raw) as {
    readSurahs: number[];
    resume: { surah: number; ayah: number } | null;
  };
}

describe("hatimProgress", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    (getRaqatApiBase as jest.Mock).mockReturnValue("https://api.raqat.kz");
    (getValidAccessToken as jest.Mock).mockResolvedValue("access-token");
    (fetchMeHatim as jest.Mock).mockResolvedValue({ ok: true, read_surahs: [] });
    (putMeHatim as jest.Mock).mockResolvedValue({ ok: true, read_surahs: [] });
  });

  it("starts empty when no storage", async () => {
    expect(await loadHatimProgress()).toEqual(new Set());
    expect(await loadHatimResume()).toBeNull();
  });

  it("migrates legacy v1 to v2 and removes legacy key", async () => {
    await AsyncStorage.setItem(KEY_LEGACY_V1, JSON.stringify({ readSurahs: [1, 2, 114] }));
    const read = await loadHatimProgress();
    expect(read).toEqual(new Set([1, 2, 114]));
    expect(await AsyncStorage.getItem(KEY_LEGACY_V1)).toBeNull();
    const v2 = await getStoredV2();
    expect(v2?.readSurahs).toEqual([1, 2, 114]);
  });

  it("recordHatimAyahTapped saves resume without completing mid-surah", async () => {
    const r = await recordHatimAyahTapped(2, 5, 286);
    expect(r.completedSurah).toBe(false);
    expect(await loadHatimResume()).toEqual({ surah: 2, ayah: 5 });
    expect(await loadHatimProgress()).toEqual(new Set());
  });

  it("saveHatimResume updates resume without changing read surahs", async () => {
    await toggleHatimSurah(36);
    await saveHatimResume(2, 255);

    expect(await loadHatimResume()).toEqual({ surah: 2, ayah: 255 });
    expect(await loadHatimProgress()).toEqual(new Set([36]));
  });

  it("recordHatimAyahTapped marks surah read on last ayah", async () => {
    const r = await recordHatimAyahTapped(1, 7, 7);
    expect(r.completedSurah).toBe(true);
    expect(await loadHatimProgress()).toEqual(new Set([1]));
    expect(await loadHatimResume()).toEqual({ surah: 1, ayah: 7 });
  });

  it("toggleHatimSurah adds and removes surah", async () => {
    let read = await toggleHatimSurah(36);
    expect(read).toEqual(new Set([36]));
    read = await toggleHatimSurah(36);
    expect(read).toEqual(new Set());
  });

  it("serializes overlapping toggles so neither local mutation is lost", async () => {
    await Promise.all([toggleHatimSurah(1), toggleHatimSurah(2)]);

    expect(await loadHatimProgress()).toEqual(new Set([1, 2]));
  });

  it("hatimProgressFraction computes pct", () => {
    expect(hatimProgressFraction(new Set([1, 2, 3]))).toEqual({
      read: 3,
      total: 114,
      pct: 3 / 114,
    });
  });

  it("syncHatimWithServerBidirectional no-ops without API base", async () => {
    (getRaqatApiBase as jest.Mock).mockReturnValue("");
    await AsyncStorage.setItem(
      KEY_V2,
      JSON.stringify({ v: 2, readSurahs: [1], resume: null, updatedAt: "" })
    );
    await syncHatimWithServerBidirectional();
    expect(fetchMeHatim).not.toHaveBeenCalled();
  });

  it("syncHatimWithServerBidirectional no-ops without access token", async () => {
    (getValidAccessToken as jest.Mock).mockResolvedValue(null);
    await syncHatimWithServerBidirectional();
    expect(fetchMeHatim).not.toHaveBeenCalled();
  });

  it("syncHatimWithServerBidirectional returns early on 401", async () => {
    await AsyncStorage.setItem(
      KEY_V2,
      JSON.stringify({ v: 2, readSurahs: [5], resume: null, updatedAt: "" })
    );
    (fetchMeHatim as jest.Mock).mockResolvedValue({ ok: false, status: 401 });
    await syncHatimWithServerBidirectional();
    expect(putMeHatim).not.toHaveBeenCalled();
    expect(await loadHatimProgress()).toEqual(new Set([5]));
  });

  it("syncHatimWithServerBidirectional pushes local when remote is empty", async () => {
    await AsyncStorage.setItem(
      KEY_V2,
      JSON.stringify({
        v: 2,
        readSurahs: [1, 2, 3],
        resume: { surah: 2, ayah: 10 },
        updatedAt: "",
      })
    );
    (fetchMeHatim as jest.Mock).mockResolvedValue({ ok: true, read_surahs: [] });
    await syncHatimWithServerBidirectional();
    expect(putMeHatim).toHaveBeenCalledWith(
      "https://api.raqat.kz",
      "access-token",
      [1, 2, 3]
    );
    expect(await loadHatimProgress()).toEqual(new Set([1, 2, 3]));
    expect(await loadHatimResume()).toEqual({ surah: 2, ayah: 10 });
  });

  it("syncHatimWithServerBidirectional merges local and remote readSurahs and keeps local resume", async () => {
    await AsyncStorage.setItem(
      KEY_V2,
      JSON.stringify({
        v: 2,
        readSurahs: [1],
        resume: { surah: 4, ayah: 12 },
        updatedAt: "",
      })
    );
    (fetchMeHatim as jest.Mock).mockResolvedValue({
      ok: true,
      read_surahs: [10, 11, 12, 200],
    });
    await syncHatimWithServerBidirectional();
    expect(putMeHatim).toHaveBeenCalledWith(
      "https://api.raqat.kz",
      "access-token",
      [1, 10, 11, 12]
    );
    expect(await loadHatimProgress()).toEqual(new Set([1, 10, 11, 12]));
    expect(await loadHatimResume()).toEqual({ surah: 4, ayah: 12 });
  });

  it("merges remote sync with the latest local state when the user toggles during fetch", async () => {
    await AsyncStorage.setItem(
      KEY_V2,
      JSON.stringify({
        v: 2,
        readSurahs: [1],
        resume: { surah: 4, ayah: 12 },
        updatedAt: "",
      })
    );
    let resolveFetch: (value: { ok: boolean; read_surahs: number[] }) => void = () => undefined;
    (fetchMeHatim as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const syncPromise = syncHatimWithServerBidirectional();
    await Promise.resolve();
    await toggleHatimSurah(36);
    resolveFetch({ ok: true, read_surahs: [2] });
    await syncPromise;

    expect(await loadHatimProgress()).toEqual(new Set([1, 2, 36]));
    expect(putMeHatim).toHaveBeenLastCalledWith(
      "https://api.raqat.kz",
      "access-token",
      [1, 2, 36]
    );
  });

  it("syncHatimWithServerBidirectional does not push when remote already includes local", async () => {
    await AsyncStorage.setItem(
      KEY_V2,
      JSON.stringify({
        v: 2,
        readSurahs: [1, 2],
        resume: { surah: 4, ayah: 12 },
        updatedAt: "",
      })
    );
    (fetchMeHatim as jest.Mock).mockResolvedValue({
      ok: true,
      read_surahs: [1, 2, 3],
    });
    await syncHatimWithServerBidirectional();
    expect(putMeHatim).not.toHaveBeenCalled();
    expect(await loadHatimProgress()).toEqual(new Set([1, 2, 3]));
  });

  it("pushHatimToServerIfLoggedIn sends sorted unique surahs", async () => {
    await pushHatimToServerIfLoggedIn(new Set([114, 2, 2, 1, 0, 999]));
    expect(putMeHatim).toHaveBeenCalledWith(
      "https://api.raqat.kz",
      "access-token",
      [1, 2, 114]
    );
  });

  it("clearHatimProgress wipes local and pushes empty set", async () => {
    await AsyncStorage.setItem(
      KEY_V2,
      JSON.stringify({
        v: 2,
        readSurahs: [1, 2],
        resume: { surah: 1, ayah: 3 },
        updatedAt: "",
      })
    );
    await clearHatimProgress();
    expect(await loadHatimProgress()).toEqual(new Set());
    expect(await loadHatimResume()).toBeNull();
    expect(putMeHatim).toHaveBeenCalledWith(
      "https://api.raqat.kz",
      "access-token",
      []
    );
  });

  it("recordHatimAyahTapped pushes to server when logged in", async () => {
    await recordHatimAyahTapped(1, 7, 7);
    expect(putMeHatim).toHaveBeenCalledWith(
      "https://api.raqat.kz",
      "access-token",
      [1]
    );
  });
});
