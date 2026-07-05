import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchMeQuranBookmarks, putMeQuranBookmarks } from "../../services/platformApiClient";
import {
  getBookmarkedSurahs,
  syncQuranBookmarksWithServerBidirectional,
} from "../quranBookmarks";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock("../../config/raqatApiBase", () => ({
  getRaqatApiBase: jest.fn(() => "https://api.test"),
}));

jest.mock("../authTokens", () => ({
  getValidAccessToken: jest.fn(async () => "access-token"),
}));

jest.mock("../../services/platformApiClient", () => ({
  fetchMeQuranBookmarks: jest.fn(),
  putMeQuranBookmarks: jest.fn(),
}));

describe("quranBookmarks sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (putMeQuranBookmarks as jest.Mock).mockResolvedValue({ ok: true, surahs: [] });
  });

  it("syncQuranBookmarksWithServerBidirectional no-ops without remote when local empty", async () => {
    (fetchMeQuranBookmarks as jest.Mock).mockResolvedValue({ ok: true, surahs: [] });
    await syncQuranBookmarksWithServerBidirectional();
    expect(putMeQuranBookmarks).not.toHaveBeenCalled();
  });

  it("syncQuranBookmarksWithServerBidirectional pushes local when remote empty", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([1, 36]));
    (fetchMeQuranBookmarks as jest.Mock).mockResolvedValue({ ok: true, surahs: [] });
    await syncQuranBookmarksWithServerBidirectional();
    expect(putMeQuranBookmarks).toHaveBeenCalledWith("https://api.test", "access-token", [1, 36]);
  });

  it("syncQuranBookmarksWithServerBidirectional merges remote into local", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([1]));
    (fetchMeQuranBookmarks as jest.Mock).mockResolvedValue({ ok: true, surahs: [2, 36] });
    await syncQuranBookmarksWithServerBidirectional();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "raqat_quran_bookmarks_v1",
      JSON.stringify([1, 2, 36])
    );
    expect(putMeQuranBookmarks).toHaveBeenCalledWith("https://api.test", "access-token", [1, 2, 36]);
  });
});

describe("getBookmarkedSurahs", () => {
  it("normalizes invalid entries", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify([0, 1, 200, 2]));
    await expect(getBookmarkedSurahs()).resolves.toEqual([1, 2]);
  });
});
