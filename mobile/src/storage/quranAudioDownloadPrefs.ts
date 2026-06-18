import AsyncStorage from "@react-native-async-storage/async-storage";
import { quranAudioDownloadTotalTasks } from "../services/quranAudioDownloadManifest";

const PREFS_KEY = "quran_audio_download_prefs_v1";
const STATE_KEY = "quran_audio_download_state_v1";

export type QuranAudioDownloadStatus =
  | "idle"
  | "running"
  | "paused"
  | "blocked"
  | "complete"
  | "error";

export type QuranAudioDownloadPrefs = {
  enabled: boolean;
  allowMobileData: boolean;
  paused: boolean;
};

export type QuranAudioFailedItem = {
  index: number;
  uri: string;
  error: string;
};

export type QuranAudioDownloadState = {
  status: QuranAudioDownloadStatus;
  cursorIndex: number;
  total: number;
  downloaded: number;
  cached: number;
  failed: number;
  bytes: number;
  currentLabel?: string;
  lastError?: string;
  failedItems: QuranAudioFailedItem[];
  updatedAt?: string;
  completedAt?: string;
};

export type QuranAudioDownloadSnapshot = {
  prefs: QuranAudioDownloadPrefs;
  state: QuranAudioDownloadState;
};

const DEFAULT_PREFS: QuranAudioDownloadPrefs = {
  enabled: true,
  allowMobileData: false,
  paused: false,
};

export function defaultQuranAudioDownloadState(): QuranAudioDownloadState {
  return {
    status: "idle",
    cursorIndex: 0,
    total: quranAudioDownloadTotalTasks(),
    downloaded: 0,
    cached: 0,
    failed: 0,
    bytes: 0,
    failedItems: [],
  };
}

function normalizePrefs(raw: Partial<QuranAudioDownloadPrefs> | null | undefined): QuranAudioDownloadPrefs {
  return {
    enabled: raw?.enabled ?? DEFAULT_PREFS.enabled,
    allowMobileData: raw?.allowMobileData ?? DEFAULT_PREFS.allowMobileData,
    paused: raw?.paused ?? DEFAULT_PREFS.paused,
  };
}

function clampCursor(n: unknown, total: number): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(total, Math.floor(x)));
}

function normalizeState(raw: Partial<QuranAudioDownloadState> | null | undefined): QuranAudioDownloadState {
  const total = quranAudioDownloadTotalTasks();
  const status: QuranAudioDownloadStatus =
    raw?.status === "running" ||
    raw?.status === "paused" ||
    raw?.status === "blocked" ||
    raw?.status === "complete" ||
    raw?.status === "error"
      ? raw.status
      : "idle";
  const failedItems = Array.isArray(raw?.failedItems) ? raw.failedItems.slice(0, 200) : [];
  return {
    status,
    cursorIndex: clampCursor(raw?.cursorIndex, total),
    total,
    downloaded: Math.max(0, Math.floor(Number(raw?.downloaded ?? 0) || 0)),
    cached: Math.max(0, Math.floor(Number(raw?.cached ?? 0) || 0)),
    failed: Math.max(0, Math.floor(Number(raw?.failed ?? 0) || 0)),
    bytes: Math.max(0, Math.floor(Number(raw?.bytes ?? 0) || 0)),
    currentLabel: raw?.currentLabel,
    lastError: raw?.lastError,
    failedItems,
    updatedAt: raw?.updatedAt,
    completedAt: raw?.completedAt,
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

export async function loadQuranAudioDownloadPrefs(): Promise<QuranAudioDownloadPrefs> {
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
