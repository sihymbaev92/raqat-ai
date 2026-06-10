/**
 * Native: ауыр JSON Metro бандлда емес — CDN-нен жүктеліп FileSystem-ге кэштеледі.
 * Jest: assets/bundled require (офлайн тест).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import { bundledJsonRemoteUrl } from "../config/bundledJsonBase";
import type { BundledJsonName } from "./bundledJsonTypes";

export type { BundledJsonName } from "./bundledJsonTypes";

const CACHE_DIR = `${documentDirectory ?? ""}bundled-json/`;
const META_KEY = "raqat_bundled_json_meta_v1";

type FileMeta = { savedAt: string; bytes: number };
type MetaStore = Partial<Record<BundledJsonName, FileMeta>>;

const memory = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

function cachePath(name: BundledJsonName): string {
  return `${CACHE_DIR}${name}`;
}

/** Jest ғана: Metro dynamic require-ды қолдамайды — статик switch. */
function loadFromAssetRequire(name: BundledJsonName): unknown {
  switch (name) {
    case "surah-list-api.json":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/surah-list-api.json");
    case "quran-uthmani-full.json":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/quran-uthmani-full.json");
    case "quran-en-transliteration-full.json":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/quran-en-transliteration-full.json");
    case "quran-kk-from-db.json":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/quran-kk-from-db.json");
    case "great-words-catalog.json":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/great-words-catalog.json");
    case "abai-kara-soz-full.json":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/abai-kara-soz-full.json");
    default:
      throw new Error(`unknown bundled json: ${name}`);
  }
}

async function ensureCacheDir(): Promise<void> {
  if (!documentDirectory) return;
  const info = await getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

async function readMeta(): Promise<MetaStore> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as MetaStore;
  } catch {
    return {};
  }
}

async function writeMeta(meta: MetaStore): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

async function readCachedFile<T>(name: BundledJsonName): Promise<T | null> {
  if (!documentDirectory) return null;
  const path = cachePath(name);
  const info = await getInfoAsync(path);
  if (!info.exists || !info.size) return null;
  try {
    const raw = await readAsStringAsync(path);
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function saveCachedFile(name: BundledJsonName, data: unknown): Promise<void> {
  if (!documentDirectory) return;
  await ensureCacheDir();
  const raw = JSON.stringify(data);
  await writeAsStringAsync(cachePath(name), raw);
  const meta = await readMeta();
  meta[name] = { savedAt: new Date().toISOString(), bytes: raw.length };
  await writeMeta(meta);
}

async function downloadJson<T>(name: BundledJsonName, timeoutMs = 120_000): Promise<T> {
  const url = bundledJsonRemoteUrl(name);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = (await r.json()) as T;
    await saveCachedFile(name, data);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveJson<T>(name: BundledJsonName): Promise<T> {
  const hit = memory.get(name);
  if (hit !== undefined) return hit as T;

  const pending = inflight.get(name);
  if (pending) return pending as Promise<T>;

  const task = (async (): Promise<T> => {
    if (process.env.NODE_ENV === "test") {
      const data = loadFromAssetRequire(name) as T;
      memory.set(name, data);
      return data;
    }

    const cached = await readCachedFile<T>(name);
    if (cached != null) {
      memory.set(name, cached);
      return cached;
    }

    try {
      const data = await downloadJson<T>(name);
      memory.set(name, data);
      return data;
    } catch (err) {
      throw new Error(`bundled json unavailable: ${name} (${String(err)})`);
    }
  })();

  inflight.set(name, task);
  try {
    return await task;
  } finally {
    inflight.delete(name);
  }
}

export async function loadBundledJson<T>(name: BundledJsonName): Promise<T> {
  return resolveJson<T>(name);
}

/** Кэш файлын жою (қайта жүктеу). */
export async function invalidateBundledJsonCache(name?: BundledJsonName): Promise<void> {
  if (name) {
    memory.delete(name);
    if (documentDirectory) {
      try {
        const path = cachePath(name);
        const info = await getInfoAsync(path);
        if (info.exists) await writeAsStringAsync(path, "");
      } catch {
        /* ignore */
      }
    }
    const meta = await readMeta();
    delete meta[name];
    await writeMeta(meta);
    return;
  }
  memory.clear();
  if (documentDirectory) {
    try {
      const info = await getInfoAsync(CACHE_DIR);
      if (info.exists) {
        await makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }
    } catch {
      /* ignore */
    }
  }
  await AsyncStorage.removeItem(META_KEY);
}
