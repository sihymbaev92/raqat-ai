import AsyncStorage from "@react-native-async-storage/async-storage";
import { qcf4FontPackTotalTasks } from "../services/qcf4FontPackManifest";
import { quranBookFontTotalTasks } from "../services/quranBookFontManifest";

const PREFS_KEY = "quran_font_download_prefs_v1";
const BOOK_STATE_KEY = "quran_font_download_book_state_v1";
const QCF4_STATE_KEY = "quran_font_download_qcf4_state_v1";

export type QuranFontDownloadStatus =
  | "idle"
  | "running"
  | "paused"
  | "blocked"
  | "complete"
  | "error";

export type QuranFontDownloadPrefs = {
  allowMobileData: boolean;
};

export type QuranFontPackState = {
  status: QuranFontDownloadStatus;
  cursorIndex: number;
  total: number;
  downloaded: number;
  cached: number;
  failed: number;
  bytes: number;
  currentLabel?: string;
  lastError?: string;
  completedAt?: string;
  updatedAt?: string;
};

export type QuranFontDownloadSnapshot = {
  prefs: QuranFontDownloadPrefs;
  book: QuranFontPackState;
  qcf4: QuranFontPackState;
};

const DEFAULT_PREFS: QuranFontDownloadPrefs = {
  allowMobileData: false,
};

function defaultPackState(total: number): QuranFontPackState {
  return {
    status: "idle",
    cursorIndex: 0,
    total,
    downloaded: 0,
    cached: 0,
    failed: 0,
    bytes: 0,
  };
}

function normalizePrefs(raw: Partial<QuranFontDownloadPrefs> | null | undefined): QuranFontDownloadPrefs {
  return {
    allowMobileData: raw?.allowMobileData ?? DEFAULT_PREFS.allowMobileData,
  };
}

function clampCursor(n: unknown, total: number): number {
  const x = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(total, Math.floor(x)));
}

function normalizePackState(
  raw: Partial<QuranFontPackState> | null | undefined,
  total: number
): QuranFontPackState {
  const base = defaultPackState(total);
  if (!raw) return base;
  return {
    status: raw.status ?? base.status,
    cursorIndex: clampCursor(raw.cursorIndex, total),
    total,
    downloaded: typeof raw.downloaded === "number" ? raw.downloaded : base.downloaded,
    cached: typeof raw.cached === "number" ? raw.cached : base.cached,
    failed: typeof raw.failed === "number" ? raw.failed : base.failed,
    bytes: typeof raw.bytes === "number" ? raw.bytes : base.bytes,
    currentLabel: raw.currentLabel,
    lastError: raw.lastError,
    completedAt: raw.completedAt,
    updatedAt: raw.updatedAt,
  };
}

export async function loadQuranFontDownloadPrefs(): Promise<QuranFontDownloadPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    return normalizePrefs(raw ? (JSON.parse(raw) as Partial<QuranFontDownloadPrefs>) : null);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function patchQuranFontDownloadPrefs(
  partial: Partial<QuranFontDownloadPrefs>
): Promise<QuranFontDownloadPrefs> {
  const next = { ...(await loadQuranFontDownloadPrefs()), ...partial };
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

export async function loadQuranBookFontDownloadState(): Promise<QuranFontPackState> {
  const total = quranBookFontTotalTasks();
  try {
    const raw = await AsyncStorage.getItem(BOOK_STATE_KEY);
    return normalizePackState(raw ? (JSON.parse(raw) as Partial<QuranFontPackState>) : null, total);
  } catch {
    return defaultPackState(total);
  }
}

export async function loadQcf4FontPackDownloadState(): Promise<QuranFontPackState> {
  const total = qcf4FontPackTotalTasks();
  try {
    const raw = await AsyncStorage.getItem(QCF4_STATE_KEY);
    return normalizePackState(raw ? (JSON.parse(raw) as Partial<QuranFontPackState>) : null, total);
  } catch {
    return defaultPackState(total);
  }
}

export async function saveQuranBookFontDownloadState(state: QuranFontPackState): Promise<void> {
  await AsyncStorage.setItem(
    BOOK_STATE_KEY,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() })
  );
}

export async function saveQcf4FontPackDownloadState(state: QuranFontPackState): Promise<void> {
  await AsyncStorage.setItem(
    QCF4_STATE_KEY,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() })
  );
}

export async function resetQuranBookFontDownloadState(): Promise<QuranFontPackState> {
  const state = defaultPackState(quranBookFontTotalTasks());
  await saveQuranBookFontDownloadState(state);
  return state;
}

export async function resetQcf4FontPackDownloadState(): Promise<QuranFontPackState> {
  const state = defaultPackState(qcf4FontPackTotalTasks());
  await saveQcf4FontPackDownloadState(state);
  return state;
}

export async function loadQuranFontDownloadSnapshot(): Promise<QuranFontDownloadSnapshot> {
  const [prefs, book, qcf4] = await Promise.all([
    loadQuranFontDownloadPrefs(),
    loadQuranBookFontDownloadState(),
    loadQcf4FontPackDownloadState(),
  ]);
  return { prefs, book, qcf4 };
}
