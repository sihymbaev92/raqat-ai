import { Platform } from "react-native";
import * as Network from "expo-network";
import {
  downloadQuranAudioToCache,
  getQuranAudioCacheStats,
  getQuranAudioFreeDiskBytes,
  isQuranAudioCached,
} from "./quranAudioCache";
import {
  quranAudioDownloadTaskAt,
  quranAudioDownloadTaskLabel,
  quranAudioDownloadTotalTasks,
} from "./quranAudioDownloadManifest";
import {
  loadQuranAudioDownloadPrefs,
  loadQuranAudioDownloadSnapshot,
  loadQuranAudioDownloadState,
  patchQuranAudioDownloadPrefs,
  resetQuranAudioDownloadState,
  saveQuranAudioDownloadState,
  type QuranAudioDownloadSnapshot,
  type QuranAudioDownloadState,
} from "../storage/quranAudioDownloadPrefs";

const DEFAULT_CHUNK_FILES = 18;
const BACKGROUND_CHUNK_FILES = 6;
const LOOP_DELAY_MS = 1400;
const MIN_FREE_DISK_BYTES = 250 * 1024 * 1024;
const MAX_FAILED_ITEMS = 200;

let loopRunning = false;

export type QuranAudioDownloadResumeOptions = {
  budgetFiles?: number;
  source?: "boot" | "foreground" | "background" | "settings" | "playback";
};

type NetworkGate = { ok: true } | { ok: false; reason: string };

function networkTypeLabel(type: Network.NetworkStateType | undefined): string {
  switch (type) {
    case Network.NetworkStateType.CELLULAR:
      return "mobile";
    case Network.NetworkStateType.WIFI:
      return "wifi";
    case Network.NetworkStateType.ETHERNET:
      return "ethernet";
    case Network.NetworkStateType.NONE:
      return "offline";
    default:
      return "network";
  }
}

export async function canDownloadQuranAudioNow(allowMobileData: boolean): Promise<NetworkGate> {
  if (Platform.OS === "web") return { ok: false, reason: "web unsupported" };
  try {
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected || state.type === Network.NetworkStateType.NONE) {
      return { ok: false, reason: "network offline" };
    }
    if (!allowMobileData) {
      const ok =
        state.type === Network.NetworkStateType.WIFI ||
        state.type === Network.NetworkStateType.ETHERNET;
      if (!ok) {
        return { ok: false, reason: `waiting for Wi-Fi (${networkTypeLabel(state.type)})` };
      }
    }
    return { ok: true };
  } catch {
    return allowMobileData ? { ok: true } : { ok: false, reason: "network state unavailable" };
  }
}

async function hasEnoughDisk(): Promise<NetworkGate> {
  const free = await getQuranAudioFreeDiskBytes();
  if (free != null && free < MIN_FREE_DISK_BYTES) {
    return { ok: false, reason: "device storage is low" };
  }
  return { ok: true };
}

function addFailedItem(
  state: QuranAudioDownloadState,
  item: { index: number; uri: string; error: string }
): QuranAudioDownloadState {
  return {
    ...state,
    failedItems: [item, ...state.failedItems].slice(0, MAX_FAILED_ITEMS),
  };
}

function finishQuranAudioDownloadState(state: QuranAudioDownloadState, total: number): QuranAudioDownloadState {
  const hasFailures = state.failed > 0 || state.failedItems.length > 0;
  return {
    ...state,
    total,
    cursorIndex: total,
    status: hasFailures ? "error" : "complete",
    currentLabel: undefined,
    completedAt: hasFailures ? undefined : state.completedAt ?? new Date().toISOString(),
    lastError: hasFailures ? state.lastError ?? "Some Quran audio files failed to download" : undefined,
  };
}

export async function resumeQuranAudioDownloads(
  opts: QuranAudioDownloadResumeOptions = {}
): Promise<QuranAudioDownloadSnapshot> {
  const prefs = await loadQuranAudioDownloadPrefs();
  let state = await loadQuranAudioDownloadState();
  const total = quranAudioDownloadTotalTasks();

  if (!prefs.enabled) {
    state = { ...state, total, status: "idle", currentLabel: undefined };
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }
  if (prefs.paused) {
    state = { ...state, total, status: "paused" };
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }
  if (state.cursorIndex >= total) {
    state = finishQuranAudioDownloadState(state, total);
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }

  const network = await canDownloadQuranAudioNow(prefs.allowMobileData);
  if (!network.ok) {
    state = { ...state, total, status: "blocked", lastError: network.reason };
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }
  const disk = await hasEnoughDisk();
  if (!disk.ok) {
    state = { ...state, total, status: "blocked", lastError: disk.reason };
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }

  const budgetFiles = Math.max(1, Math.floor(opts.budgetFiles ?? DEFAULT_CHUNK_FILES));
  state = { ...state, total, status: "running", lastError: undefined };
  await saveQuranAudioDownloadState(state);

  for (let i = 0; i < budgetFiles && state.cursorIndex < total; i += 1) {
    const freshPrefs = await loadQuranAudioDownloadPrefs();
    if (!freshPrefs.enabled || freshPrefs.paused) {
      state = { ...state, status: freshPrefs.paused ? "paused" : "idle" };
      await saveQuranAudioDownloadState(state);
      return { prefs: freshPrefs, state };
    }

    const task = quranAudioDownloadTaskAt(state.cursorIndex);
    if (!task) {
      state = finishQuranAudioDownloadState(state, total);
      await saveQuranAudioDownloadState(state);
      return { prefs: freshPrefs, state };
    }

    const currentLabel = quranAudioDownloadTaskLabel(task);
    try {
      state = { ...state, currentLabel, status: "running" };
      await saveQuranAudioDownloadState(state);
      if (await isQuranAudioCached(task.uri)) {
        state = {
          ...state,
          cursorIndex: state.cursorIndex + 1,
          cached: state.cached + 1,
        };
      } else {
        const result = await downloadQuranAudioToCache(task.uri);
        state = {
          ...state,
          cursorIndex: state.cursorIndex + 1,
          downloaded: state.downloaded + (result.alreadyCached ? 0 : 1),
          cached: state.cached + (result.alreadyCached ? 1 : 0),
          bytes: state.bytes + (result.alreadyCached ? 0 : result.bytes),
        };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      state = addFailedItem(
        {
          ...state,
          cursorIndex: state.cursorIndex + 1,
          failed: state.failed + 1,
          lastError: error,
        },
        { index: task.index, uri: task.uri, error }
      );
    }
    await saveQuranAudioDownloadState(state);
  }

  if (state.cursorIndex >= total) {
    state = finishQuranAudioDownloadState(state, total);
    await saveQuranAudioDownloadState(state);
  }
  return { prefs: await loadQuranAudioDownloadPrefs(), state };
}

export async function kickQuranAudioAutoDownloadLoop(): Promise<void> {
  if (Platform.OS === "web" || loopRunning) return;
  loopRunning = true;
  try {
    while (true) {
      const { prefs, state } = await resumeQuranAudioDownloads({ budgetFiles: DEFAULT_CHUNK_FILES, source: "foreground" });
      if (!prefs.enabled || prefs.paused || state.status === "complete" || state.status === "blocked" || state.status === "error") {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, LOOP_DELAY_MS));
    }
  } finally {
    loopRunning = false;
  }
}

export async function resumeQuranAudioDownloadsInBackground(): Promise<QuranAudioDownloadSnapshot> {
  return resumeQuranAudioDownloads({ budgetFiles: BACKGROUND_CHUNK_FILES, source: "background" });
}

export async function setQuranAudioAutoDownloadEnabled(enabled: boolean): Promise<QuranAudioDownloadSnapshot> {
  const prefs = await patchQuranAudioDownloadPrefs({ enabled, paused: enabled ? false : true });
  let state = await loadQuranAudioDownloadState();
  state = { ...state, status: enabled ? "idle" : "paused" };
  await saveQuranAudioDownloadState(state);
  if (enabled) void kickQuranAudioAutoDownloadLoop();
  return { prefs, state };
}

export async function setQuranAudioAllowMobileData(allowMobileData: boolean): Promise<QuranAudioDownloadSnapshot> {
  const prefs = await patchQuranAudioDownloadPrefs({ allowMobileData });
  const state = await loadQuranAudioDownloadState();
  if (!prefs.paused && prefs.enabled) void kickQuranAudioAutoDownloadLoop();
  return { prefs, state };
}

export async function pauseQuranAudioDownloads(): Promise<QuranAudioDownloadSnapshot> {
  const prefs = await patchQuranAudioDownloadPrefs({ paused: true });
  const state = await loadQuranAudioDownloadState();
  const next = { ...state, status: "paused" as const };
  await saveQuranAudioDownloadState(next);
  return { prefs, state: next };
}

export async function resumeQuranAudioDownloadsFromSettings(): Promise<QuranAudioDownloadSnapshot> {
  await patchQuranAudioDownloadPrefs({ enabled: true, paused: false });
  const snap = await resumeQuranAudioDownloads({ budgetFiles: DEFAULT_CHUNK_FILES, source: "settings" });
  void kickQuranAudioAutoDownloadLoop();
  return snap;
}

export async function resetQuranAudioDownloadsAndCache(): Promise<QuranAudioDownloadSnapshot> {
  const { deleteQuranAudioCache } = await import("./quranAudioCache");
  await deleteQuranAudioCache();
  await patchQuranAudioDownloadPrefs({ enabled: true, paused: false });
  const state = await resetQuranAudioDownloadState();
  const prefs = await loadQuranAudioDownloadPrefs();
  return { prefs, state };
}

export async function loadQuranAudioDownloadDashboard(): Promise<
  QuranAudioDownloadSnapshot & { cacheFiles: number; cacheBytes: number }
> {
  const [snap, stats] = await Promise.all([loadQuranAudioDownloadSnapshot(), getQuranAudioCacheStats()]);
  return { ...snap, cacheFiles: stats.files, cacheBytes: stats.bytes };
}
