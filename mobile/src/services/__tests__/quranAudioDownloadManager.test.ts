import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import { canDownloadQuranAudioNow, resumeQuranAudioDownloads } from "../quranAudioDownloadManager";
import { downloadQuranAudioToCache, isQuranAudioCached } from "../quranAudioCache";
import { quranAudioDownloadTotalTasks } from "../quranAudioDownloadManifest";
import {
  patchQuranAudioDownloadPrefs,
  patchQuranAudioDownloadState,
} from "../../storage/quranAudioDownloadPrefs";

jest.mock("expo-network", () => ({
  NetworkStateType: {
    NONE: "NONE",
    CELLULAR: "CELLULAR",
    WIFI: "WIFI",
    ETHERNET: "ETHERNET",
  },
  getNetworkStateAsync: jest.fn(),
}));

jest.mock("../quranAudioCache", () => ({
  downloadQuranAudioToCache: jest.fn(),
  getQuranAudioCacheStats: jest.fn(),
  getQuranAudioFreeDiskBytes: jest.fn(() => Promise.resolve(1024 * 1024 * 1024)),
  isQuranAudioCached: jest.fn(),
}));

const getNetworkStateAsync = Network.getNetworkStateAsync as jest.MockedFunction<
  typeof Network.getNetworkStateAsync
>;
const isQuranAudioCachedMock = isQuranAudioCached as jest.MockedFunction<typeof isQuranAudioCached>;
const downloadQuranAudioToCacheMock = downloadQuranAudioToCache as jest.MockedFunction<
  typeof downloadQuranAudioToCache
>;

describe("canDownloadQuranAudioNow", () => {
  beforeEach(() => {
    getNetworkStateAsync.mockReset();
  });

  it("allows Wi-Fi when mobile data is disabled", async () => {
    getNetworkStateAsync.mockResolvedValue({
      type: Network.NetworkStateType.WIFI,
      isConnected: true,
      isInternetReachable: true,
    });

    await expect(canDownloadQuranAudioNow(false)).resolves.toEqual({ ok: true });
  });

  it("blocks cellular by default", async () => {
    getNetworkStateAsync.mockResolvedValue({
      type: Network.NetworkStateType.CELLULAR,
      isConnected: true,
      isInternetReachable: true,
    });

    const result = await canDownloadQuranAudioNow(false);
    expect(result.ok).toBe(false);
  });

  it("allows cellular when user enabled mobile data", async () => {
    getNetworkStateAsync.mockResolvedValue({
      type: Network.NetworkStateType.CELLULAR,
      isConnected: true,
      isInternetReachable: true,
    });

    await expect(canDownloadQuranAudioNow(true)).resolves.toEqual({ ok: true });
  });
});

describe("resumeQuranAudioDownloads", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    getNetworkStateAsync.mockReset();
    getNetworkStateAsync.mockResolvedValue({
      type: Network.NetworkStateType.WIFI,
      isConnected: true,
      isInternetReachable: true,
    });
    isQuranAudioCachedMock.mockReset();
    isQuranAudioCachedMock.mockResolvedValue(false);
    downloadQuranAudioToCacheMock.mockReset();
  });

  it("does not mark exhausted downloads complete when failures remain", async () => {
    const total = quranAudioDownloadTotalTasks();
    await patchQuranAudioDownloadPrefs({ enabled: true, paused: false });
    await patchQuranAudioDownloadState({
      cursorIndex: total,
      total,
      failed: 1,
      failedItems: [{ index: 0, uri: "https://cdn.example/1.mp3", error: "HTTP 503" }],
      lastError: "HTTP 503",
    });

    const snap = await resumeQuranAudioDownloads({ budgetFiles: 1, source: "settings" });

    expect(snap.state.status).toBe("error");
    expect(snap.state.completedAt).toBeUndefined();
    expect(snap.state.lastError).toBe("HTTP 503");
  });

  it("finishes with error when the last queued file fails", async () => {
    const total = quranAudioDownloadTotalTasks();
    await patchQuranAudioDownloadPrefs({ enabled: true, paused: false });
    await patchQuranAudioDownloadState({ cursorIndex: total - 1, total });
    downloadQuranAudioToCacheMock.mockRejectedValueOnce(new Error("CDN timeout"));

    const snap = await resumeQuranAudioDownloads({ budgetFiles: 1, source: "settings" });

    expect(snap.state.cursorIndex).toBe(total);
    expect(snap.state.failed).toBe(1);
    expect(snap.state.status).toBe("error");
    expect(snap.state.completedAt).toBeUndefined();
  });
});
