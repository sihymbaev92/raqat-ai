import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOTAL_AYAHS } from "../data/quranAyahCounts";

const PREFS_KEY = "quran_audio_download_prefs_v2";
const STATE_KEY = "quran_audio_download_state_v2";
const LEGACY_PREFS_KEY = "quran_audio_download_prefs_v1";
const LEGACY_STATE_KEY = "quran_audio_download_state_v1";

export type QuranAudioDownloadStatus =
  | "idle"
  | "running"
  | "paused"
  | "blocked"
  | "complete"
  | "error";

export type QuranAudioDownloadPrefs = {
  allowMobileData: boolean;
  paused: boolean;
};

export type QuranAudioFailedItem = {
  index: number;
  uri: string;
  error: string;
};

export type ReciterEditionDownloadState = {
  status: QuranAudioDownloadStatus;
  cursorIndex: number;
  downloaded: number;
  cached: number;
  failed: number;
  bytes: number;
  lastError?: string;
  failedItems: QuranAudioFailedItem[];
  completedAt?: string;
};

export type QuranAudioDownloadState = {
  queuedEditions: string[];
  editions: Record<string, ReciterEditionDownloadState>;
  currentEdition?: string;
  currentLabel?: string;
  updatedAt?: string;
};

export type QuranAudioDownloadSnapshot = {
  prefs: QuranAudioDownloadPrefs;
  state: QuranAudioDownloadState;
};

const DEFAULT_PREFS: QuranAudioDownloadPrefs = {
  allowMobileData: false,
  paused: false,
};

export function defaultReciterEditionDownloadState(): ReciterEditionDownloadState {
  return {
    status: "idle",
    cursorIndex: 0,
    downloaded: 0,
    cached: 0,
    failed: 0,
    bytes: 0,
    failedItems: [],
  };
}

export function defaultQuranAudioDownloadState(): QuranAudioDownloadState {
  return {
    queuedEditions: [],
    editions: {},
  };
}

export function isReciterEditionFullyDownloaded(state: ReciterEditionDownloadState | undefined): boolean {
  if (!state) return false;
  return state.cursorIndex >= TOTAL_AYAHS && state.status === "complete";
}

export function reciterEditionDownloadPercent(state: ReciterEditionDownloadState | undefined): number {
  if (!state) return 0;
  return Math.min(100, Math.round((state.cursorIndex / TOTAL_AYAHS) * 100));
}

function normalizePrefs(raw: Partial<QuranAudioDownloadPrefs> | null | undefined): QuranAudioDownloadPrefs {
  return {
    allowMobileData: raw?.allowMobileData ?? DEFAULT_PREFS.allowMobileData,
    paused: raw?.paused ?? DEFAULT_PREFS.paused,
  };
}

function normalizeEditionState(
  raw: Partial<ReciterEditionDownloadState> | null | undefined
): ReciterEditionDownloadState {
  const status: QuranAudioDownloadStatus =
    raw?.status === "running" ||
    raw?.status === "paused" ||
    raw?.status === "blocked" ||
    raw?.status === "complete" ||
    raw?.status === "error"
      ? raw.status
      : "idle";
  const failedItems = Array.isArray(raw?.failedItems) ? raw.failedItems.slice(0, 200) : [];
  const cursorIndex = Math.max(0, Math.min(TOTAL_AYAHS, Math.floor(Number(raw?.cursorIndex ?? 0) || 0)));
  return {
    status,
    cursorIndex,
    downloaded: Math.max(0, Math.floor(Number(raw?.downloaded ?? 0) || 0)),
    cached: Math.max(0, Math.floor(Number(raw?.cached ?? 0) || 0)),
    failed: Math.max(0, Math.floor(Number(raw?.failed ?? 0) || 0)),
    bytes: Math.max(0, Math.floor(Number(raw?.bytes ?? 0) || 0)),
    lastError: raw?.lastError,
    failedItems,
    completedAt: raw?.completedAt,
  };
}

function normalizeState(raw: Partial<QuranAudioDownloadState> | null | undefined): QuranAudioDownloadState {
  const queuedEditions = Array.isArray(raw?.queuedEditions)
    ? raw.queuedEditions.filter((e) => typeof e === "string" && e.trim())
    : [];
  const editions: Record<string, ReciterEditionDownloadState> = {};
  if (raw?.editions && typeof raw.editions === "object") {
    for (const [edition, value] of Object.entries(raw.editions)) {
      if (!edition.trim()) continue;
      editions[edition] = normalizeEditionState(value);
    }
  }
  return {
    queuedEditions,
    editions,
    currentEdition: raw?.currentEdition,
    currentLabel: raw?.currentLabel,
    updatedAt: raw?.updatedAt,
  };
}

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function migrateLegacyStorageIfNeeded(): Promise<void> {
  const existing = await readJson<unknown>(PREFS_KEY);
  if (existing) return;
  await AsyncStorage.multiRemove([LEGACY_PREFS_KEY, LEGACY_STATE_KEY]);
}

export async function loadQuranAudioDownloadPrefs(): Promise<QuranAudioDownloadPrefs> {
  await migrateLegacyStorageIfNeeded();
  return normalizePrefs(await readJson<Partial<QuranAudioDownloadPrefs>>(PREFS_KEY));
}

export async function saveQuranAudioDownloadPrefs(prefs: QuranAudioDownloadPrefs): Promise<void> {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(normalizePrefs(prefs)));
}

export async function patchQuranAudioDownloadPrefs(
  patch: Partial<QuranAudioDownloadPrefs>
): Promise<QuranAudioDownloadPrefs> {
  const next = normalizePrefs({ ...(await loadQuranAudioDownloadPrefs()), ...patch });
  await saveQuranAudioDownloadPrefs(next);
  return next;
}

export async function loadQuranAudioDownloadState(): Promise<QuranAudioDownloadState> {
  await migrateLegacyStorageIfNeeded();
  return normalizeState(await readJson<Partial<QuranAudioDownloadState>>(STATE_KEY));
}

export async function saveQuranAudioDownloadState(state: QuranAudioDownloadState): Promise<void> {
  const next = normalizeState({ ...state, updatedAt: new Date().toISOString() });
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(next));
}

export async function patchQuranAudioDownloadState(
  patch: Partial<QuranAudioDownloadState>
): Promise<QuranAudioDownloadState> {
  const next = normalizeState({ ...(await loadQuranAudioDownloadState()), ...patch });
  await saveQuranAudioDownloadState(next);
  return next;
}

export async function resetQuranAudioDownloadState(): Promise<QuranAudioDownloadState> {
  const next = defaultQuranAudioDownloadState();
  await saveQuranAudioDownloadState(next);
  return next;
}

export async function loadQuranAudioDownloadSnapshot(): Promise<QuranAudioDownloadSnapshot> {
  const [prefs, state] = await Promise.all([
    loadQuranAudioDownloadPrefs(),
    loadQuranAudioDownloadState(),
  ]);
  return { prefs, state };
}

export function hasPendingQuranAudioDownloads(state: QuranAudioDownloadState): boolean {
  return state.queuedEditions.some((edition) => {
    const ed = state.editions[edition] ?? defaultReciterEditionDownloadState();
    return ed.cursorIndex < TOTAL_AYAHS && ed.status !== "error";
  });
}

export function aggregateQuranAudioDownloadStatus(
  prefs: QuranAudioDownloadPrefs,
  state: QuranAudioDownloadState
): QuranAudioDownloadStatus {
  if (!state.queuedEditions.length) return "idle";
  if (prefs.paused) return "paused";
  const statuses = state.queuedEditions.map((edition) => state.editions[edition]?.status ?? "idle");
  if (statuses.some((s) => s === "running")) return "running";
  if (statuses.some((s) => s === "blocked")) return "blocked";
  if (statuses.every((s) => s === "complete")) return "complete";
  if (statuses.some((s) => s === "error")) return "error";
  return "idle";
}
