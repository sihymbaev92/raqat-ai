import { Platform } from "react-native";
import * as Network from "expo-network";
import {
  deleteQuranAudioCache,
  deleteQuranAudioCacheForEdition,
  downloadQuranAudioToCache,
  getQuranAudioCacheStats,
  getQuranAudioFreeDiskBytes,
  isQuranAudioCached,
} from "./quranAudioCache";
import {
  quranAudioDownloadEditionAyahTotal,
  quranAudioDownloadTaskForEditionAt,
  quranAudioDownloadTaskLabel,
} from "./quranAudioDownloadManifest";
import { quranAyahMp3Url } from "./quranSudaisAudio";
import {
  aggregateQuranAudioDownloadStatus,
  defaultReciterEditionDownloadState,
  hasPendingQuranAudioDownloads,
  loadQuranAudioDownloadPrefs,
  loadQuranAudioDownloadSnapshot,
  loadQuranAudioDownloadState,
  patchQuranAudioDownloadPrefs,
  patchQuranAudioDownloadState,
  resetQuranAudioDownloadState,
  saveQuranAudioDownloadState,
  type QuranAudioDownloadSnapshot,
  type QuranAudioDownloadState,
  type ReciterEditionDownloadState,
} from "../storage/quranAudioDownloadPrefs";

const DEFAULT_CHUNK_FILES = 18;
const BACKGROUND_CHUNK_FILES = 6;
const LOOP_DELAY_MS = 1400;
const MIN_FREE_DISK_BYTES = 250 * 1024 * 1024;
const MAX_FAILED_ITEMS = 200;

let loopRunning = false;
/** Кейінгі kick/loop тоқтату (тест teardown / pause). */
let loopToken = 0;

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
  try {
    if (Platform.OS === "web") return { ok: false, reason: "web unsupported" };
  } catch {
    return { ok: false, reason: "platform unavailable" };
  }
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
  state: ReciterEditionDownloadState,
  item: { index: number; uri: string; error: string }
): ReciterEditionDownloadState {
  return {
    ...state,
    failedItems: [item, ...state.failedItems].slice(0, MAX_FAILED_ITEMS),
  };
}

function finishEditionState(state: ReciterEditionDownloadState, total: number): ReciterEditionDownloadState {
  const hasFailures = state.failed > 0 || state.failedItems.length > 0;
  return {
    ...state,
    cursorIndex: total,
    status: hasFailures ? "error" : "complete",
    lastError: hasFailures ? state.lastError ?? "Some Quran audio files failed to download" : undefined,
    completedAt: hasFailures ? undefined : state.completedAt ?? new Date().toISOString(),
  };
}

function ensureEditionState(
  state: QuranAudioDownloadState,
  edition: string
): ReciterEditionDownloadState {
  return state.editions[edition] ?? defaultReciterEditionDownloadState();
}

function setEditionState(
  state: QuranAudioDownloadState,
  edition: string,
  editionState: ReciterEditionDownloadState
): QuranAudioDownloadState {
  return {
    ...state,
    editions: { ...state.editions, [edition]: editionState },
  };
}

export async function resumeQuranAudioDownloads(
  opts: QuranAudioDownloadResumeOptions = {}
): Promise<QuranAudioDownloadSnapshot> {
  const prefs = await loadQuranAudioDownloadPrefs();
  let state = await loadQuranAudioDownloadState();
  const totalPerEdition = quranAudioDownloadEditionAyahTotal();

  if (!state.queuedEditions.length) {
    state = { ...state, currentEdition: undefined, currentLabel: undefined };
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }
  if (prefs.paused) {
    state = {
      ...state,
      currentEdition: undefined,
      currentLabel: undefined,
    };
    for (const edition of state.queuedEditions) {
      const ed = ensureEditionState(state, edition);
      if (ed.cursorIndex < totalPerEdition && ed.status !== "complete" && ed.status !== "error") {
        state = setEditionState(state, edition, { ...ed, status: "paused" });
      }
    }
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }
  if (!hasPendingQuranAudioDownloads(state)) {
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }

  const network = await canDownloadQuranAudioNow(prefs.allowMobileData);
  if (!network.ok) {
    for (const edition of state.queuedEditions) {
      const ed = ensureEditionState(state, edition);
      if (ed.cursorIndex < totalPerEdition && ed.status !== "complete") {
        state = setEditionState(state, edition, { ...ed, status: "blocked", lastError: network.reason });
      }
    }
    state = { ...state, currentEdition: undefined, currentLabel: undefined };
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }
  const disk = await hasEnoughDisk();
  if (!disk.ok) {
    for (const edition of state.queuedEditions) {
      const ed = ensureEditionState(state, edition);
      if (ed.cursorIndex < totalPerEdition && ed.status !== "complete") {
        state = setEditionState(state, edition, { ...ed, status: "blocked", lastError: disk.reason });
      }
    }
    state = { ...state, currentEdition: undefined, currentLabel: undefined };
    await saveQuranAudioDownloadState(state);
    return { prefs, state };
  }

  let budgetFiles = Math.max(1, Math.floor(opts.budgetFiles ?? DEFAULT_CHUNK_FILES));

  for (const edition of state.queuedEditions) {
    if (budgetFiles <= 0) break;

    let editionState = ensureEditionState(state, edition);
    if (editionState.cursorIndex >= totalPerEdition) {
      if (editionState.status !== "complete" && editionState.status !== "error") {
        editionState = finishEditionState(editionState, totalPerEdition);
        state = setEditionState(state, edition, editionState);
      }
      continue;
    }

    while (budgetFiles > 0 && editionState.cursorIndex < totalPerEdition) {
      const freshPrefs = await loadQuranAudioDownloadPrefs();
      if (freshPrefs.paused) {
        editionState = { ...editionState, status: "paused" };
        state = setEditionState(state, edition, editionState);
        await saveQuranAudioDownloadState({ ...state, currentEdition: undefined, currentLabel: undefined });
        return { prefs: freshPrefs, state };
      }

      const task = quranAudioDownloadTaskForEditionAt(edition, editionState.cursorIndex);
      if (!task) {
        editionState = finishEditionState(editionState, totalPerEdition);
        state = setEditionState(state, edition, editionState);
        break;
      }

      const currentLabel = quranAudioDownloadTaskLabel(task);
      state = { ...state, currentEdition: edition, currentLabel };
      editionState = { ...editionState, status: "running", lastError: undefined };
      state = setEditionState(state, edition, editionState);
      await saveQuranAudioDownloadState(state);

      try {
        if (await isQuranAudioCached(task.uri)) {
          editionState = {
            ...editionState,
            cursorIndex: editionState.cursorIndex + 1,
            cached: editionState.cached + 1,
          };
        } else {
          const result = await downloadQuranAudioToCache(task.uri);
          editionState = {
            ...editionState,
            cursorIndex: editionState.cursorIndex + 1,
            downloaded: editionState.downloaded + (result.alreadyCached ? 0 : 1),
            cached: editionState.cached + (result.alreadyCached ? 1 : 0),
            bytes: editionState.bytes + (result.alreadyCached ? 0 : result.bytes),
          };
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        editionState = addFailedItem(
          {
            ...editionState,
            cursorIndex: editionState.cursorIndex + 1,
            failed: editionState.failed + 1,
            lastError: error,
          },
          { index: task.index, uri: task.uri, error }
        );
      }

      state = setEditionState(state, edition, editionState);
      await saveQuranAudioDownloadState(state);
      budgetFiles -= 1;

      if (editionState.cursorIndex >= totalPerEdition) {
        editionState = finishEditionState(editionState, totalPerEdition);
        state = setEditionState(state, edition, editionState);
        await saveQuranAudioDownloadState(state);
        break;
      }
    }
  }

  state = { ...state, currentEdition: undefined, currentLabel: undefined };
  await saveQuranAudioDownloadState(state);
  return { prefs: await loadQuranAudioDownloadPrefs(), state };
}

export async function kickQuranAudioAutoDownloadLoop(): Promise<void> {
  try {
    if (Platform.OS === "web" || loopRunning) return;
  } catch {
    return;
  }
  const { prefs, state } = await loadQuranAudioDownloadSnapshot();
  if (prefs.paused || !hasPendingQuranAudioDownloads(state)) return;

  const token = loopToken;
  loopRunning = true;
  try {
    while (token === loopToken) {
      const snap = await resumeQuranAudioDownloads({ budgetFiles: DEFAULT_CHUNK_FILES, source: "foreground" });
      if (token !== loopToken) return;
      const status = aggregateQuranAudioDownloadStatus(snap.prefs, snap.state);
      if (
        snap.prefs.paused ||
        !hasPendingQuranAudioDownloads(snap.state) ||
        status === "blocked" ||
        status === "error"
      ) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, LOOP_DELAY_MS));
    }
  } finally {
    if (token === loopToken) loopRunning = false;
    else loopRunning = false;
  }
}

/** Фондық auto-download циклін тоқтату (тест / pause). */
export function cancelQuranAudioAutoDownloadLoop(): void {
  loopToken += 1;
  loopRunning = false;
}

export async function resumeQuranAudioDownloadsInBackground(): Promise<QuranAudioDownloadSnapshot> {
  return resumeQuranAudioDownloads({ budgetFiles: BACKGROUND_CHUNK_FILES, source: "background" });
}

export async function queueReciterEditionDownload(edition: string): Promise<QuranAudioDownloadSnapshot> {
  const trimmed = edition.trim();
  if (!trimmed) return loadQuranAudioDownloadSnapshot();

  let state = await loadQuranAudioDownloadState();
  const existing = ensureEditionState(state, trimmed);
  const totalPerEdition = quranAudioDownloadEditionAyahTotal();

  if (existing.cursorIndex >= totalPerEdition && existing.status === "complete") {
    return { prefs: await loadQuranAudioDownloadPrefs(), state };
  }

  const queuedEditions = state.queuedEditions.includes(trimmed)
    ? state.queuedEditions
    : [...state.queuedEditions, trimmed];

  const nextEditionState: ReciterEditionDownloadState =
    existing.status === "error"
      ? { ...defaultReciterEditionDownloadState(), status: "idle" }
      : { ...existing, status: "idle", lastError: undefined };

  state = {
    ...state,
    queuedEditions,
    editions: { ...state.editions, [trimmed]: nextEditionState },
  };
  await saveQuranAudioDownloadState(state);

  const prefs = await patchQuranAudioDownloadPrefs({ paused: false });
  void kickQuranAudioAutoDownloadLoop();
  return { prefs, state };
}

export async function removeReciterEditionOfflinePack(edition: string): Promise<QuranAudioDownloadSnapshot> {
  const trimmed = edition.trim();
  if (!trimmed) return loadQuranAudioDownloadSnapshot();

  await deleteQuranAudioCacheForEdition(trimmed, quranAyahMp3Url);

  let state = await loadQuranAudioDownloadState();
  const { [trimmed]: _removed, ...restEditions } = state.editions;
  void _removed;
  state = {
    ...state,
    queuedEditions: state.queuedEditions.filter((e) => e !== trimmed),
    editions: { ...restEditions, [trimmed]: defaultReciterEditionDownloadState() },
    currentEdition: state.currentEdition === trimmed ? undefined : state.currentEdition,
    currentLabel: state.currentEdition === trimmed ? undefined : state.currentLabel,
  };
  await saveQuranAudioDownloadState(state);
  return { prefs: await loadQuranAudioDownloadPrefs(), state };
}

export async function setQuranAudioAllowMobileData(allowMobileData: boolean): Promise<QuranAudioDownloadSnapshot> {
  const prefs = await patchQuranAudioDownloadPrefs({ allowMobileData });
  const state = await loadQuranAudioDownloadState();
  if (!prefs.paused && hasPendingQuranAudioDownloads(state)) void kickQuranAudioAutoDownloadLoop();
  return { prefs, state };
}

export async function pauseQuranAudioDownloads(): Promise<QuranAudioDownloadSnapshot> {
  cancelQuranAudioAutoDownloadLoop();
  const prefs = await patchQuranAudioDownloadPrefs({ paused: true });
  const state = await loadQuranAudioDownloadState();
  return { prefs, state };
}

export async function resumeQuranAudioDownloadsFromSettings(): Promise<QuranAudioDownloadSnapshot> {
  await patchQuranAudioDownloadPrefs({ paused: false });
  const snap = await resumeQuranAudioDownloads({ budgetFiles: DEFAULT_CHUNK_FILES, source: "settings" });
  void kickQuranAudioAutoDownloadLoop();
  return snap;
}

export async function resetQuranAudioDownloadsAndCache(): Promise<QuranAudioDownloadSnapshot> {
  await deleteQuranAudioCache();
  await patchQuranAudioDownloadPrefs({ paused: false });
  const state = await resetQuranAudioDownloadState();
  const prefs = await loadQuranAudioDownloadPrefs();
  return { prefs, state };
}

export async function loadQuranAudioDownloadDashboard(): Promise<
  QuranAudioDownloadSnapshot & {
    cacheFiles: number;
    cacheBytes: number;
    aggregateStatus: ReturnType<typeof aggregateQuranAudioDownloadStatus>;
  }
> {
  const [snap, stats] = await Promise.all([loadQuranAudioDownloadSnapshot(), getQuranAudioCacheStats()]);
  return {
    ...snap,
    cacheFiles: stats.files,
    cacheBytes: stats.bytes,
    aggregateStatus: aggregateQuranAudioDownloadStatus(snap.prefs, snap.state),
  };
}

/** @deprecated per-reciter queue replaces global auto-download toggle */
export async function setQuranAudioAutoDownloadEnabled(enabled: boolean): Promise<QuranAudioDownloadSnapshot> {
  if (!enabled) return pauseQuranAudioDownloads();
  return resumeQuranAudioDownloadsFromSettings();
}
