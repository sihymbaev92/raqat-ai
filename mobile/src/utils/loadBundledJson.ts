/**
 * Native: хатым Arabic JSON APK-та; қалған ауыр JSON CDN + FileSystem cache.
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
import { isApkBundledJson, isRemoteBundledJson } from "./bundledJsonTypes";

export type { BundledJsonName } from "./bundledJsonTypes";
export { isApkBundledJson, isRemoteBundledJson } from "./bundledJsonTypes";

const CACHE_DIR = `${documentDirectory ?? ""}bundled-json/`;
const META_KEY = "raqat_bundled_json_meta_v1";

type FileMeta = { savedAt: string; bytes: number };
type MetaStore = Partial<Record<BundledJsonName, FileMeta>>;

const memory = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

export class BundledJsonMissingError extends Error {
  readonly jsonName: BundledJsonName;

  constructor(name: BundledJsonName, cause?: string) {
    super(`content pack missing: ${name}${cause ? ` (${cause})` : ""}`);
    this.name = "BundledJsonMissingError";
    this.jsonName = name;
  }
}

type KkDbAyah = { numberInSurah: number; text_kk?: string; translit?: string };
type KkDbSurah = { number: number; ayahs?: KkDbAyah[] };
type KkDbBundle = { data?: { surahs?: KkDbSurah[] } };

function cachePath(name: BundledJsonName): string {
  return `${CACHE_DIR}${name}`;
}

/** Jest ғана: production Metro бұл dynamic require-ды көрмейді. */
function loadFromAssetRequire(name: BundledJsonName): unknown {
  const testRequire = eval("require") as (path: string) => unknown;
  const kkDb = (): KkDbBundle =>
    testRequire("../../assets/bundled/quran-kk-from-db.json") as KkDbBundle;
  const readerFixtureFromKk = (): {
    data: { surahs: Array<{ number: number; ayahs: Array<{ numberInSurah: number; text: string }> }> };
  } => ({
    data: {
      surahs: (kkDb().data?.surahs ?? []).map((surah) => ({
        number: surah.number,
        ayahs: (surah.ayahs ?? []).map((ayah) => ({
          numberInSurah: ayah.numberInSurah,
          text: `آية قرآنية ${surah.number}:${ayah.numberInSurah}`,
        })),
      })),
    },
  });
  const translitFixtureFromKk = (): {
    data: { surahs: Array<{ number: number; ayahs: Array<{ numberInSurah: number; text: string }> }> };
  } => ({
    data: {
      surahs: (kkDb().data?.surahs ?? []).map((surah) => ({
        number: surah.number,
        ayahs: (surah.ayahs ?? []).map((ayah) => ({
          numberInSurah: ayah.numberInSurah,
          text: (ayah.translit ?? "").trim(),
        })),
      })),
    },
  });

  switch (name) {
    case "offline-auto-translations-core.json":
      return {
        targets: {
          en: { "1fvitgj": "Quran", "1lstt8w": "Home" },
          ru: { "1fvitgj": "Коран" },
        },
      };
    case "quran-translations-offline.json":
      return testRequire("../../assets/bundled/quran-translations-offline.json");
    case "surah-list-api.json":
      return { data: [] };
    case "quran-uthmani-full.json":
      return readerFixtureFromKk();
    case "quran-en-transliteration-full.json":
      return translitFixtureFromKk();
    case "quran-kk-from-db.json":
      return kkDb();
    case "quran-tajweed-offline.json":
      return { version: 1, surahs: { "1": { "1": "test [h:1[x]" } } };
    case "great-words-catalog.json":
      return { version: 1, authors: [], entries: [] };
    case "abai-kara-soz-full.json":
      return [];
    default:
      throw new Error(`unknown bundled json: ${name}`);
  }
}

function loadFromNativeAssetFallback(name: BundledJsonName): unknown | null {
  if (!isApkBundledJson(name)) return null;
  switch (name) {
    case "surah-list-api.json":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/surah-list-api.json");
    case "quran-uthmani-full.json":
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("../../assets/bundled/quran-uthmani-full.json");
    default:
      return null;
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

export async function readCachedBundledJsonFile<T>(name: BundledJsonName): Promise<T | null> {
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

export async function saveCachedBundledJsonFile(name: BundledJsonName, data: unknown): Promise<void> {
  if (!documentDirectory) return;
  await ensureCacheDir();
  const raw = JSON.stringify(data);
  await writeAsStringAsync(cachePath(name), raw);
  const meta = await readMeta();
  meta[name] = { savedAt: new Date().toISOString(), bytes: raw.length };
  await writeMeta(meta);
}

export async function isBundledJsonCached(name: BundledJsonName): Promise<boolean> {
  if (isApkBundledJson(name) && loadFromNativeAssetFallback(name) != null) return true;
  const cached = await readCachedBundledJsonFile(name);
  return cached != null;
}

export async function downloadBundledJsonToCache<T>(
  name: BundledJsonName,
  timeoutMs = 180_000
): Promise<T> {
  const url = bundledJsonRemoteUrl(name);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = (await r.json()) as T;
    await saveCachedBundledJsonFile(name, data);
    memory.set(name, data);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveJson<T>(name: BundledJsonName, opts?: { optional?: boolean }): Promise<T | null> {
  const hit = memory.get(name);
  if (hit !== undefined) return hit as T;

  const pending = inflight.get(name);
  if (pending) return pending as Promise<T | null>;

  const task = (async (): Promise<T | null> => {
    if (process.env.NODE_ENV === "test") {
      const data = loadFromAssetRequire(name) as T;
      memory.set(name, data);
      return data;
    }

    if (isApkBundledJson(name)) {
      const native = loadFromNativeAssetFallback(name);
      if (native != null) {
        memory.set(name, native);
        return native as T;
      }
    }

    const cached = await readCachedBundledJsonFile<T>(name);
    if (cached != null) {
      memory.set(name, cached);
      return cached;
    }

    if (isRemoteBundledJson(name)) {
      if (opts?.optional) {
        if (__DEV__) {
          try {
            const dev = loadFromAssetRequire(name) as T;
            memory.set(name, dev);
            return dev;
          } catch {
            return null;
          }
        }
        return null;
      }
      try {
        const data = await downloadBundledJsonToCache<T>(name);
        return data;
      } catch (err) {
        if (__DEV__) {
          try {
            const dev = loadFromAssetRequire(name) as T;
            memory.set(name, dev);
            return dev;
          } catch {
            /* fall through */
          }
        }
        if (opts?.optional) return null;
        throw new BundledJsonMissingError(name, String(err));
      }
    }

    try {
      const data = await downloadBundledJsonToCache<T>(name);
      return data;
    } catch (err) {
      const fallback = loadFromNativeAssetFallback(name);
      if (fallback != null) {
        memory.set(name, fallback);
        return fallback as T;
      }
      if (opts?.optional) return null;
      throw new BundledJsonMissingError(name, String(err));
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
  const data = await resolveJson<T>(name);
  if (data == null) throw new BundledJsonMissingError(name);
  return data;
}

/** Remote pack жоқ болса null (хатым Arabic ғана режим). */
export async function tryLoadBundledJson<T>(name: BundledJsonName): Promise<T | null> {
  return resolveJson<T>(name, { optional: true });
}

/** Үлкен JSON-нан runtime map құрылған соң raw payload-ты RAM cache-тан босату. */
export function releaseBundledJsonMemory(name?: BundledJsonName): void {
  if (name) {
    memory.delete(name);
    return;
  }
  memory.clear();
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

export async function getBundledJsonCacheBytes(name: BundledJsonName): Promise<number> {
  const meta = await readMeta();
  return meta[name]?.bytes ?? 0;
}
