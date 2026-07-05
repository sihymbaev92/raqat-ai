import { Platform } from "react-native";
import * as Network from "expo-network";
import { QURAN_BOOK_FONT_ENTRIES } from "./quranBookFontManifest";
import {
  QCF4_FONT_PACK_IDS,
  qcf4FontPackRemoteUrls,
  qcf4FontPackTaskLabel,
} from "./qcf4FontPackManifest";
import {
  areQuranBookFontsCached,
  deleteQcf4FontCache,
  deleteQuranBookFontCache,
  downloadQcf4Font,
  downloadQuranBookFont,
  getQuranFontCacheStats,
  getQuranFontFreeDiskBytes,
  isQcf4FontCached,
  isQcf4FontPackCached,
  isQuranBookFontCached,
} from "./quranFontCache";
import { clearQcf4FontLoaderCache } from "../quran/qcf4FontLoader";
import {
  loadQcf4FontPackDownloadState,
  loadQuranBookFontDownloadState,
  loadQuranFontDownloadPrefs,
  loadQuranFontDownloadSnapshot,
  patchQuranFontDownloadPrefs,
  resetQcf4FontPackDownloadState,
  resetQuranBookFontDownloadState,
  saveQcf4FontPackDownloadState,
  saveQuranBookFontDownloadState,
  type QuranFontDownloadSnapshot,
  type QuranFontPackState,
} from "../storage/quranFontDownloadPrefs";

const MIN_FREE_DISK_BYTES = 80 * 1024 * 1024;

type NetworkGate = { ok: true } | { ok: false; reason: string };

let bookDownloadRunning = false;
let qcf4DownloadRunning = false;

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

export async function canDownloadQuranFontsNow(allowMobileData: boolean): Promise<NetworkGate> {
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
  const free = await getQuranFontFreeDiskBytes();
  if (free != null && free < MIN_FREE_DISK_BYTES) {
    return { ok: false, reason: "device storage is low" };
  }
  return { ok: true };
}

function finishPackState(state: QuranFontPackState): QuranFontPackState {
  const hasFailures = state.failed > 0;
  return {
    ...state,
    cursorIndex: state.total,
    status: hasFailures ? "error" : "complete",
    currentLabel: undefined,
    completedAt: hasFailures ? undefined : state.completedAt ?? new Date().toISOString(),
    lastError: hasFailures ? state.lastError ?? "Some font files failed to download" : undefined,
  };
}

async function resumeBookFontDownloads(): Promise<QuranFontDownloadSnapshot> {
  const prefs = await loadQuranFontDownloadPrefs();
  let state = await loadQuranBookFontDownloadState();
  const total = QURAN_BOOK_FONT_ENTRIES.length;

  if (state.cursorIndex >= total) {
    state = finishPackState({ ...state, total });
    await saveQuranBookFontDownloadState(state);
    return { prefs, book: state, qcf4: await loadQcf4FontPackDownloadState() };
  }

  const network = await canDownloadQuranFontsNow(prefs.allowMobileData);
  if (!network.ok) {
    state = { ...state, total, status: "blocked", lastError: network.reason };
    await saveQuranBookFontDownloadState(state);
    return { prefs, book: state, qcf4: await loadQcf4FontPackDownloadState() };
  }
  const disk = await hasEnoughDisk();
  if (!disk.ok) {
    state = { ...state, total, status: "blocked", lastError: disk.reason };
    await saveQuranBookFontDownloadState(state);
    return { prefs, book: state, qcf4: await loadQcf4FontPackDownloadState() };
  }

  state = { ...state, total, status: "running", lastError: undefined };
  await saveQuranBookFontDownloadState(state);

  while (state.cursorIndex < total) {
    const entry = QURAN_BOOK_FONT_ENTRIES[state.cursorIndex];
    if (!entry) break;
    state = { ...state, currentLabel: entry.labelKk, status: "running" };
    await saveQuranBookFontDownloadState(state);
    try {
      if (await isQuranBookFontCached(entry)) {
        state = {
          ...state,
          cursorIndex: state.cursorIndex + 1,
          cached: state.cached + 1,
        };
      } else {
        const result = await downloadQuranBookFont(entry);
        state = {
          ...state,
          cursorIndex: state.cursorIndex + 1,
          downloaded: state.downloaded + (result.alreadyCached ? 0 : 1),
          cached: state.cached + 1,
          bytes: state.bytes + (result.alreadyCached ? 0 : result.bytes),
        };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      state = {
        ...state,
        cursorIndex: state.cursorIndex + 1,
        failed: state.failed + 1,
        lastError: error,
        status: "error",
      };
      await saveQuranBookFontDownloadState(state);
      return { prefs, book: state, qcf4: await loadQcf4FontPackDownloadState() };
    }
    await saveQuranBookFontDownloadState(state);
  }

  state = finishPackState(state);
  await saveQuranBookFontDownloadState(state);
  return { prefs, book: state, qcf4: await loadQcf4FontPackDownloadState() };
}

async function resumeQcf4FontPackDownloads(): Promise<QuranFontDownloadSnapshot> {
  const prefs = await loadQuranFontDownloadPrefs();
  let state = await loadQcf4FontPackDownloadState();
  const total = QCF4_FONT_PACK_IDS.length;

  if (state.cursorIndex >= total) {
    state = finishPackState({ ...state, total });
    await saveQcf4FontPackDownloadState(state);
    return { prefs, book: await loadQuranBookFontDownloadState(), qcf4: state };
  }

  const network = await canDownloadQuranFontsNow(prefs.allowMobileData);
  if (!network.ok) {
    state = { ...state, total, status: "blocked", lastError: network.reason };
    await saveQcf4FontPackDownloadState(state);
    return { prefs, book: await loadQuranBookFontDownloadState(), qcf4: state };
  }
  const disk = await hasEnoughDisk();
  if (!disk.ok) {
    state = { ...state, total, status: "blocked", lastError: disk.reason };
    await saveQcf4FontPackDownloadState(state);
    return { prefs, book: await loadQuranBookFontDownloadState(), qcf4: state };
  }

  state = { ...state, total, status: "running", lastError: undefined };
  await saveQcf4FontPackDownloadState(state);

  const chunk = 6;
  let steps = 0;
  while (state.cursorIndex < total && steps < chunk) {
    const fontId = QCF4_FONT_PACK_IDS[state.cursorIndex];
    if (!fontId) break;
    state = { ...state, currentLabel: qcf4FontPackTaskLabel(fontId), status: "running" };
    await saveQcf4FontPackDownloadState(state);
    try {
      if (await isQcf4FontCached(fontId)) {
        state = {
          ...state,
          cursorIndex: state.cursorIndex + 1,
          cached: state.cached + 1,
        };
      } else {
        const result = await downloadQcf4Font(fontId, qcf4FontPackRemoteUrls(fontId));
        state = {
          ...state,
          cursorIndex: state.cursorIndex + 1,
          downloaded: state.downloaded + (result.alreadyCached ? 0 : 1),
          cached: state.cached + 1,
          bytes: state.bytes + (result.alreadyCached ? 0 : result.bytes),
        };
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      state = {
        ...state,
        cursorIndex: state.cursorIndex + 1,
        failed: state.failed + 1,
        lastError: error,
        status: "error",
      };
      await saveQcf4FontPackDownloadState(state);
      return { prefs, book: await loadQuranBookFontDownloadState(), qcf4: state };
    }
    await saveQcf4FontPackDownloadState(state);
    steps += 1;
  }

  if (state.cursorIndex >= total) {
    state = finishPackState(state);
    await saveQcf4FontPackDownloadState(state);
  }
  return { prefs, book: await loadQuranBookFontDownloadState(), qcf4: state };
}

export async function startQuranBookFontDownload(): Promise<QuranFontDownloadSnapshot> {
  if (bookDownloadRunning) return loadQuranFontDownloadSnapshot();
  bookDownloadRunning = true;
  try {
    let snap = await loadQuranFontDownloadSnapshot();
    if (await areQuranBookFontsCached()) {
      const state = finishPackState({ ...snap.book, cursorIndex: snap.book.total });
      await saveQuranBookFontDownloadState(state);
      return { ...snap, book: state };
    }
    if (snap.book.status !== "running") {
      const state = { ...snap.book, status: "idle" as const, cursorIndex: 0, lastError: undefined };
      await saveQuranBookFontDownloadState(state);
    }
    snap = await resumeBookFontDownloads();
    return snap;
  } finally {
    bookDownloadRunning = false;
  }
}

export async function continueQcf4FontPackDownloadLoop(): Promise<QuranFontDownloadSnapshot> {
  if (qcf4DownloadRunning) return loadQuranFontDownloadSnapshot();
  qcf4DownloadRunning = true;
  try {
    let snap = await loadQuranFontDownloadSnapshot();
    while (snap.qcf4.status === "running" && snap.qcf4.cursorIndex < snap.qcf4.total) {
      snap = await resumeQcf4FontPackDownloads();
      if (snap.qcf4.status === "blocked" || snap.qcf4.status === "error") break;
      await new Promise((r) => setTimeout(r, 200));
    }
    return snap;
  } finally {
    qcf4DownloadRunning = false;
  }
}

export async function startQcf4FontPackDownload(): Promise<QuranFontDownloadSnapshot> {
  let snap = await loadQuranFontDownloadSnapshot();
  if (await isQcf4FontPackCached()) {
    const state = finishPackState({ ...snap.qcf4, cursorIndex: snap.qcf4.total });
    await saveQcf4FontPackDownloadState(state);
    return { ...snap, qcf4: state };
  }
  if (snap.qcf4.status !== "running") {
    const state = { ...snap.qcf4, status: "idle" as const, cursorIndex: 0, lastError: undefined };
    await saveQcf4FontPackDownloadState(state);
  }
  snap = await resumeQcf4FontPackDownloads();
  if (snap.qcf4.status === "running") {
    void continueQcf4FontPackDownloadLoop();
  }
  return snap;
}

export async function setQuranFontAllowMobileData(allowMobileData: boolean): Promise<QuranFontDownloadSnapshot> {
  const prefs = await patchQuranFontDownloadPrefs({ allowMobileData });
  const snap = await loadQuranFontDownloadSnapshot();
  return { ...snap, prefs };
}

export async function resetQuranBookFontsDownload(): Promise<QuranFontDownloadSnapshot> {
  await deleteQuranBookFontCache();
  const book = await resetQuranBookFontDownloadState();
  const snap = await loadQuranFontDownloadSnapshot();
  return { ...snap, book };
}

export async function resetQcf4FontPackDownload(): Promise<QuranFontDownloadSnapshot> {
  await deleteQcf4FontCache();
  clearQcf4FontLoaderCache();
  const qcf4 = await resetQcf4FontPackDownloadState();
  const snap = await loadQuranFontDownloadSnapshot();
  return { ...snap, qcf4 };
}

export async function loadQuranFontDownloadDashboard(): Promise<
  QuranFontDownloadSnapshot & {
    bookReady: boolean;
    qcf4Ready: boolean;
    cacheStats: Awaited<ReturnType<typeof getQuranFontCacheStats>>;
  }
> {
  const [snap, bookReady, qcf4Ready, cacheStats] = await Promise.all([
    loadQuranFontDownloadSnapshot(),
    areQuranBookFontsCached(),
    isQcf4FontPackCached(),
    getQuranFontCacheStats(),
  ]);
  return { ...snap, bookReady, qcf4Ready, cacheStats };
}

export { areQuranBookFontsCached, isQcf4FontPackCached };
