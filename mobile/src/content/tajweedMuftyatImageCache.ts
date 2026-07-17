/**
 * Muftyat page JPG — CDN + FileSystem cache (slim APK CDN-only).
 */
import {
  documentDirectory,
  downloadAsync,
  getInfoAsync,
  makeDirectoryAsync,
} from "expo-file-system/legacy";
import type { ImageSourcePropType } from "react-native";
import { tajweedMuftyatPageImageUris } from "../config/tajweedAssetsBase";

const CACHE_DIR = `${documentDirectory ?? ""}tajweed-muftyat/`;
const memory = new Map<number, string>();
const inflight = new Map<number, Promise<string | null>>();

function cachePath(page: number): string {
  const p = Math.max(1, Math.min(104, Math.floor(page)));
  return `${CACHE_DIR}page-${String(p).padStart(3, "0")}.jpg`;
}

async function ensureCacheDir(): Promise<void> {
  if (!documentDirectory) return;
  const info = await getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

async function readCached(page: number): Promise<string | null> {
  if (!documentDirectory) return null;
  const path = cachePath(page);
  const info = await getInfoAsync(path);
  if (!info.exists || !info.size) return null;
  return path;
}

async function downloadPage(page: number): Promise<string | null> {
  if (process.env.NODE_ENV === "test") {
    return null;
  }
  await ensureCacheDir();
  const dest = cachePath(page);
  for (const url of tajweedMuftyatPageImageUris(page)) {
    try {
      const r = await downloadAsync(url, dest);
      if (r.status === 200) {
        memory.set(page, dest);
        return dest;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function resolveTajweedMuftyatPageUri(page: number): Promise<string | null> {
  const p = Math.max(1, Math.min(104, Math.floor(page)));
  const hit = memory.get(p);
  if (hit) return hit;

  const cached = await readCached(p);
  if (cached) {
    memory.set(p, cached);
    return cached;
  }

  const pending = inflight.get(p);
  if (pending) return pending;

  const task = downloadPage(p).finally(() => {
    inflight.delete(p);
  });
  inflight.set(p, task);
  return task;
}

export function tajweedMuftyatPageSource(page: number): ImageSourcePropType {
  const p = Math.max(1, Math.min(104, Math.floor(page)));
  const local = memory.get(p);
  if (local) return { uri: local };
  return { uri: tajweedMuftyatPageImageUris(p)[0] ?? "" };
}

/** Экран mount — cache/local URI жаңарту. */
export async function hydrateTajweedMuftyatPageSource(page: number): Promise<ImageSourcePropType> {
  const uri = await resolveTajweedMuftyatPageUri(page);
  if (uri) return { uri };
  return tajweedMuftyatPageSource(page);
}

export function releaseTajweedMuftyatImageMemory(): void {
  memory.clear();
  inflight.clear();
}
