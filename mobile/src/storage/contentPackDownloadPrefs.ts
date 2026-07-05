import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CONTENT_PACKS,
  contentPackById,
  type ContentPackId,
} from "../config/contentPackManifest";
import type { BundledJsonName } from "../utils/bundledJsonTypes";
import {
  downloadBundledJsonToCache,
  getBundledJsonCacheBytes,
  invalidateBundledJsonCache,
  isBundledJsonCached,
} from "../utils/loadBundledJson";

const PREFS_KEY = "content_pack_download_prefs_v1";
const STATE_PREFIX = "content_pack_state_v1:";

export type ContentPackDownloadStatus =
  | "ready"
  | "idle"
  | "running"
  | "blocked"
  | "error";

export type ContentPackDownloadPrefs = {
  allowMobileData: boolean;
  autoDownloadOnWifi: boolean;
};

export type ContentPackState = {
  status: ContentPackDownloadStatus;
  downloadedFiles: number;
  totalFiles: number;
  bytes: number;
  lastError?: string;
  updatedAt?: string;
};

export type ContentPackSnapshot = {
  prefs: ContentPackDownloadPrefs;
  packs: Record<ContentPackId, ContentPackState>;
};

const DEFAULT_PREFS: ContentPackDownloadPrefs = {
  allowMobileData: false,
  autoDownloadOnWifi: true,
};

function defaultPackState(totalFiles: number, status: ContentPackDownloadStatus = "idle"): ContentPackState {
  return {
    status,
    downloadedFiles: 0,
    totalFiles,
    bytes: 0,
  };
}

function normalizePrefs(raw: Partial<ContentPackDownloadPrefs> | null | undefined): ContentPackDownloadPrefs {
  return {
    allowMobileData: raw?.allowMobileData ?? DEFAULT_PREFS.allowMobileData,
    autoDownloadOnWifi: raw?.autoDownloadOnWifi ?? DEFAULT_PREFS.autoDownloadOnWifi,
  };
}

export async function loadContentPackPrefs(): Promise<ContentPackDownloadPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return normalizePrefs(JSON.parse(raw) as Partial<ContentPackDownloadPrefs>);
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function patchContentPackPrefs(
  patch: Partial<ContentPackDownloadPrefs>
): Promise<ContentPackDownloadPrefs> {
  const prev = await loadContentPackPrefs();
  const next = normalizePrefs({ ...prev, ...patch });
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
  return next;
}

async function loadPackState(packId: ContentPackId): Promise<ContentPackState> {
  const def = contentPackById(packId);
  const total = def.jsonFiles.length;
  if (def.bundledInApk) {
    return { status: "ready", downloadedFiles: total, totalFiles: total, bytes: 0 };
  }
  try {
    const raw = await AsyncStorage.getItem(`${STATE_PREFIX}${packId}`);
    if (!raw) return defaultPackState(total);
    const parsed = JSON.parse(raw) as Partial<ContentPackState>;
    return {
      status: parsed.status ?? "idle",
      downloadedFiles: typeof parsed.downloadedFiles === "number" ? parsed.downloadedFiles : 0,
      totalFiles: total,
      bytes: typeof parsed.bytes === "number" ? parsed.bytes : 0,
      lastError: parsed.lastError,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return defaultPackState(total);
  }
}

async function savePackState(packId: ContentPackId, state: ContentPackState): Promise<void> {
  await AsyncStorage.setItem(
    `${STATE_PREFIX}${packId}`,
    JSON.stringify({ ...state, updatedAt: new Date().toISOString() })
  );
}

export async function isContentPackReady(packId: ContentPackId): Promise<boolean> {
  const def = contentPackById(packId);
  if (def.bundledInApk) return true;
  for (const file of def.jsonFiles) {
    if (!(await isBundledJsonCached(file))) return false;
  }
  return true;
}

async function refreshPackStateFromCache(packId: ContentPackId): Promise<ContentPackState> {
  const def = contentPackById(packId);
  if (def.bundledInApk) {
    return { status: "ready", downloadedFiles: def.jsonFiles.length, totalFiles: def.jsonFiles.length, bytes: 0 };
  }
  let downloaded = 0;
  let bytes = 0;
  for (const file of def.jsonFiles) {
    if (await isBundledJsonCached(file)) {
      downloaded += 1;
      bytes += await getBundledJsonCacheBytes(file);
    }
  }
  const total = def.jsonFiles.length;
  const status: ContentPackDownloadStatus =
    downloaded >= total ? "ready" : downloaded > 0 ? "idle" : "idle";
  return {
    status: downloaded >= total ? "ready" : "idle",
    downloadedFiles: downloaded,
    totalFiles: total,
    bytes,
  };
}

export async function loadContentPackSnapshot(): Promise<ContentPackSnapshot> {
  const prefs = await loadContentPackPrefs();
  const packs = {} as Record<ContentPackId, ContentPackState>;
  for (const pack of CONTENT_PACKS) {
    packs[pack.id] = await refreshPackStateFromCache(pack.id);
  }
  return { prefs, packs };
}

async function canDownloadNow(allowMobileData: boolean): Promise<{ ok: true } | { ok: false; reason: string }> {
  try {
    const Network = await import("expo-network");
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected || state.type === Network.NetworkStateType.NONE) {
      return { ok: false, reason: "network offline" };
    }
    if (!allowMobileData) {
      const ok =
        state.type === Network.NetworkStateType.WIFI ||
        state.type === Network.NetworkStateType.ETHERNET;
      if (!ok) return { ok: false, reason: "waiting for Wi-Fi" };
    }
    return { ok: true };
  } catch {
    return allowMobileData ? { ok: true } : { ok: false, reason: "network unavailable" };
  }
}

let downloadInflight: Promise<ContentPackSnapshot> | null = null;

export async function downloadContentPack(packId: ContentPackId): Promise<ContentPackSnapshot> {
  const def = contentPackById(packId);
  if (def.bundledInApk) return loadContentPackSnapshot();

  if (downloadInflight) return downloadInflight;

  downloadInflight = (async () => {
    const prefs = await loadContentPackPrefs();
    const gate = await canDownloadNow(prefs.allowMobileData);
    let state = await loadPackState(packId);
    if (!gate.ok) {
      state = { ...state, status: "blocked", lastError: gate.reason };
      await savePackState(packId, state);
      return loadContentPackSnapshot();
    }

    state = { ...state, status: "running", lastError: undefined };
    await savePackState(packId, state);

    try {
      for (const file of def.jsonFiles) {
        if (await isBundledJsonCached(file)) {
          state = {
            ...state,
            downloadedFiles: Math.min(state.totalFiles, state.downloadedFiles + 1),
          };
          continue;
        }
        await downloadBundledJsonToCache(file as BundledJsonName);
        state = {
          ...state,
          downloadedFiles: Math.min(state.totalFiles, state.downloadedFiles + 1),
          bytes: state.bytes + (await getBundledJsonCacheBytes(file as BundledJsonName)),
        };
        await savePackState(packId, state);
      }
      state = { ...state, status: "ready" };
      await savePackState(packId, state);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      state = { ...state, status: "error", lastError: msg };
      await savePackState(packId, state);
    }

    return loadContentPackSnapshot();
  })();

  try {
    return await downloadInflight;
  } finally {
    downloadInflight = null;
  }
}

export async function downloadAllRemoteContentPacks(): Promise<ContentPackSnapshot> {
  let snap = await loadContentPackSnapshot();
  for (const pack of CONTENT_PACKS) {
    if (pack.bundledInApk) continue;
    if (snap.packs[pack.id]?.status === "ready") continue;
    snap = await downloadContentPack(pack.id);
  }
  return snap;
}

export async function clearContentPackCache(packId: ContentPackId): Promise<ContentPackSnapshot> {
  const def = contentPackById(packId);
  if (def.bundledInApk) return loadContentPackSnapshot();
  for (const file of def.jsonFiles) {
    await invalidateBundledJsonCache(file as BundledJsonName);
  }
  await savePackState(packId, defaultPackState(def.jsonFiles.length));
  return loadContentPackSnapshot();
}

export async function maybeAutoDownloadContentPacksOnBoot(): Promise<void> {
  const prefs = await loadContentPackPrefs();
  if (!prefs.autoDownloadOnWifi) return;
  const gate = await canDownloadNow(false);
  if (!gate.ok) return;
  void downloadAllRemoteContentPacks().catch(() => {});
}
