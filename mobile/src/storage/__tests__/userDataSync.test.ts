import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMeHatim, fetchMeQuranBookmarks, putMeHatim, putMeQuranBookmarks } from "../../services/platformApiClient";
import { getBookmarkedSurahs } from "../quranBookmarks";
import { loadHatimProgress } from "../hatimProgress";
import { syncUserDataWithServerBidirectional } from "../userDataSync";

jest.mock("../../config/raqatApiBase", () => ({
  getRaqatApiBase: jest.fn(() => "https://api.test"),
}));

jest.mock("../authTokens", () => ({
  getValidAccessToken: jest.fn(async () => "access-token"),
}));

jest.mock("../../services/platformApiClient", () => ({
  fetchMeHatim: jest.fn(),
  fetchMeQuranBookmarks: jest.fn(),
  putMeHatim: jest.fn(),
  putMeQuranBookmarks: jest.fn(),
}));

const HATIM_KEY = "raqat_hatim_progress_v2";
const BOOKMARKS_KEY = "raqat_quran_bookmarks_v1";

async function seedHatim(readSurahs: number[]) {
  await AsyncStorage.setItem(
    HATIM_KEY,
    JSON.stringify({ v: 2, readSurahs, resume: null, updatedAt: "2026-06-17T00:00:00.000Z" })
  );
}

async function seedBookmarks(surahs: number[]) {
  await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(surahs));
}

describe("userDataSync two-device union", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    (putMeHatim as jest.Mock).mockResolvedValue({ ok: true, read_surahs: [] });
    (putMeQuranBookmarks as jest.Mock).mockResolvedValue({ ok: true, surahs: [] });
  });

  it("simulates device A push then device B merge (hatim + bookmarks)", async () => {
    // Device A — local state, empty server
    await seedHatim([1, 2]);
    await seedBookmarks([36]);
    (fetchMeHatim as jest.Mock).mockResolvedValue({ ok: true, read_surahs: [] });
    (fetchMeQuranBookmarks as jest.Mock).mockResolvedValue({ ok: true, surahs: [] });
    await syncUserDataWithServerBidirectional();
    expect(putMeHatim).toHaveBeenCalledWith("https://api.test", "access-token", [1, 2]);
    expect(putMeQuranBookmarks).toHaveBeenCalledWith("https://api.test", "access-token", [36]);

    // Device B — local differs; server has device A payload
    jest.clearAllMocks();
    await seedHatim([114]);
    await seedBookmarks([1]);
    (fetchMeHatim as jest.Mock).mockResolvedValue({ ok: true, read_surahs: [1, 2] });
    (fetchMeQuranBookmarks as jest.Mock).mockResolvedValue({ ok: true, surahs: [36] });
    await syncUserDataWithServerBidirectional();

    expect(await loadHatimProgress()).toEqual(new Set([1, 2, 114]));
    expect(await getBookmarkedSurahs()).toEqual([1, 36]);
    expect(putMeHatim).toHaveBeenCalledWith("https://api.test", "access-token", [1, 2, 114]);
    expect(putMeQuranBookmarks).toHaveBeenCalledWith("https://api.test", "access-token", [1, 36]);

    // Device A — pull merged union without local edits
    jest.clearAllMocks();
    await seedHatim([1, 2]);
    await seedBookmarks([36]);
    (fetchMeHatim as jest.Mock).mockResolvedValue({ ok: true, read_surahs: [1, 2, 114] });
    (fetchMeQuranBookmarks as jest.Mock).mockResolvedValue({ ok: true, surahs: [1, 36] });
    await syncUserDataWithServerBidirectional();

    expect(await loadHatimProgress()).toEqual(new Set([1, 2, 114]));
    expect(await getBookmarkedSurahs()).toEqual([1, 36]);
    expect(putMeHatim).not.toHaveBeenCalled();
    expect(putMeQuranBookmarks).not.toHaveBeenCalled();
  });
});
