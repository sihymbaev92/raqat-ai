import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Network from "expo-network";
import {
  canDownloadQuranAudioNow,
  cancelQuranAudioAutoDownloadLoop,
  queueReciterEditionDownload,
  resumeQuranAudioDownloads,
} from "../quranAudioDownloadManager";
import { downloadQuranAudioToCache, isQuranAudioCached } from "../quranAudioCache";
import { quranAudioDownloadEditionAyahTotal } from "../quranAudioDownloadManifest";
import { QURAN_HUSARY_EDITION } from "../../config/quranReciters";
import {
  loadQuranAudioDownloadState,
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

afterEach(async () => {
  cancelQuranAudioAutoDownloadLoop();
  await patchQuranAudioDownloadPrefs({ paused: true });
});

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
    cancelQuranAudioAutoDownloadLoop();
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
    const total = quranAudioDownloadEditionAyahTotal();
    await patchQuranAudioDownloadPrefs({ paused: false });
    await patchQuranAudioDownloadState({
      queuedEditions: [QURAN_HUSARY_EDITION],
      editions: {
        [QURAN_HUSARY_EDITION]: {
          status: "error",
          cursorIndex: total,
          downloaded: total - 1,
          cached: 0,
          failed: 1,
          bytes: 0,
          failedItems: [{ index: 0, uri: "https://cdn.example/1.mp3", error: "HTTP 503" }],
          lastError: "HTTP 503",
        },
      },
    });

    const snap = await resumeQuranAudioDownloads({ budgetFiles: 1, source: "settings" });
    const edition = snap.state.editions[QURAN_HUSARY_EDITION];

    expect(edition?.status).toBe("error");
    expect(edition?.completedAt).toBeUndefined();
    expect(edition?.lastError).toBe("HTTP 503");
  });

  it("finishes with error when the last queued file fails", async () => {
    const total = quranAudioDownloadEditionAyahTotal();
    await patchQuranAudioDownloadPrefs({ paused: false });
    await patchQuranAudioDownloadState({
      queuedEditions: [QURAN_HUSARY_EDITION],
      editions: {
        [QURAN_HUSARY_EDITION]: {
          status: "running",
          cursorIndex: total - 1,
          downloaded: 0,
          cached: 0,
          failed: 0,
          bytes: 0,
          failedItems: [],
        },
      },
    });
    downloadQuranAudioToCacheMock.mockRejectedValueOnce(new Error("CDN timeout"));

    const snap = await resumeQuranAudioDownloads({ budgetFiles: 1, source: "settings" });
    const edition = snap.state.editions[QURAN_HUSARY_EDITION];

    expect(edition?.cursorIndex).toBe(total);
    expect(edition?.failed).toBe(1);
    expect(edition?.status).toBe("error");
    expect(edition?.completedAt).toBeUndefined();
  });

  it("queues a single reciter edition without downloading others", async () => {
    await queueReciterEditionDownload(QURAN_HUSARY_EDITION);
    cancelQuranAudioAutoDownloadLoop();
    downloadQuranAudioToCacheMock.mockResolvedValue({ uri: "/cache/1.mp3", bytes: 1000, alreadyCached: false });

    await resumeQuranAudioDownloads({ budgetFiles: 2, source: "settings" });
    const state = await loadQuranAudioDownloadState();

    expect(state.queuedEditions).toEqual([QURAN_HUSARY_EDITION]);
    expect(state.editions[QURAN_HUSARY_EDITION]?.cursorIndex).toBe(2);
    expect(Object.keys(state.editions)).toHaveLength(1);
  });
});
