import {
  deleteAsync,
  documentDirectory,
  downloadAsync,
  getFreeDiskStorageAsync,
  getInfoAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
} from "expo-file-system/legacy";
import type { QuranBookFontEntry } from "./quranBookFontManifest";
import { QURAN_BOOK_FONT_ENTRIES } from "./quranBookFontManifest";
import { QCF4_FONT_PACK_IDS } from "./qcf4FontPackManifest";
import { qcf4FontFileName } from "../quran/qcf4FontLoader";

const QURAN_FONT_CACHE_ROOT = `${documentDirectory ?? ""}quran-fonts/`;
const BOOK_DIR = `${QURAN_FONT_CACHE_ROOT}book/`;
const QCF4_DIR = `${QURAN_FONT_CACHE_ROOT}qcf4/`;
const MIN_USABLE_FONT_BYTES = 8 * 1024;

export function quranBookFontCachePath(entry: QuranBookFontEntry): string | null {
  if (!documentDirectory) return null;
  return `${BOOK_DIR}${entry.fileName}`;
}

export function qcf4FontCachePath(fontId: string): string | null {
  if (!documentDirectory) return null;
  return `${QCF4_DIR}${qcf4FontFileName(fontId)}`;
}

export async function ensureQuranFontCacheDirs(): Promise<void> {
  if (!documentDirectory) return;
  for (const dir of [QURAN_FONT_CACHE_ROOT, BOOK_DIR, QCF4_DIR]) {
    const info = await getInfoAsync(dir);
    if (!info.exists) {
      await makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}

export async function hasUsableFontFile(uri: string): Promise<boolean> {
  const info = await getInfoAsync(uri);
  return Boolean(info.exists && (info.size ?? 0) > MIN_USABLE_FONT_BYTES);
}

export async function isQuranBookFontCached(entry: QuranBookFontEntry): Promise<boolean> {
  const path = quranBookFontCachePath(entry);
  return path ? hasUsableFontFile(path) : false;
}

export async function isQcf4FontCached(fontId: string): Promise<boolean> {
  const path = qcf4FontCachePath(fontId);
  return path ? hasUsableFontFile(path) : false;
}

export async function areQuranBookFontsCached(): Promise<boolean> {
  const checks = await Promise.all(QURAN_BOOK_FONT_ENTRIES.map((e) => isQuranBookFontCached(e)));
  return checks.every(Boolean);
}

export async function isQcf4FontPackCached(): Promise<boolean> {
  const checks = await Promise.all(QCF4_FONT_PACK_IDS.map((id) => isQcf4FontCached(id)));
  return checks.every(Boolean);
}

export type QuranFontDownloadResult = {
  uri: string;
  bytes: number;
  alreadyCached: boolean;
};

async function downloadFontToPath(remoteUrls: string[], cachePath: string): Promise<QuranFontDownloadResult> {
  if (!documentDirectory) {
    return { uri: remoteUrls[0] ?? "", bytes: 0, alreadyCached: false };
  }

  if (await hasUsableFontFile(cachePath)) {
    const hit = await getInfoAsync(cachePath);
    return { uri: cachePath, bytes: hit.size ?? 0, alreadyCached: true };
  }

  await ensureQuranFontCacheDirs();
  let lastError = "download failed";
  for (const url of remoteUrls) {
    try {
      const result = await downloadAsync(url, cachePath);
      const saved = await getInfoAsync(cachePath);
      if (result.status >= 200 && result.status < 300 && saved.exists && (saved.size ?? 0) > MIN_USABLE_FONT_BYTES) {
        return { uri: cachePath, bytes: saved.size ?? 0, alreadyCached: false };
      }
      await deleteAsync(cachePath, { idempotent: true });
      lastError = `HTTP ${result.status}`;
    } catch (err) {
      await deleteAsync(cachePath, { idempotent: true }).catch(() => {});
      lastError = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(lastError);
}

export async function downloadQuranBookFont(entry: QuranBookFontEntry): Promise<QuranFontDownloadResult> {
  const cachePath = quranBookFontCachePath(entry);
  if (!cachePath) throw new Error("document directory unavailable");
  return downloadFontToPath(entry.remoteUrls, cachePath);
}

export async function downloadQcf4Font(fontId: string, remoteUrls: string[]): Promise<QuranFontDownloadResult> {
  const cachePath = qcf4FontCachePath(fontId);
  if (!cachePath) throw new Error("document directory unavailable");
  return downloadFontToPath(remoteUrls, cachePath);
}

export type QuranFontCacheStats = {
  bookFiles: number;
  bookBytes: number;
  qcf4Files: number;
  qcf4Bytes: number;
};

async function dirStats(dir: string, suffix: string): Promise<{ files: number; bytes: number }> {
  if (!documentDirectory) return { files: 0, bytes: 0 };
  let names: string[] = [];
  try {
    names = await readDirectoryAsync(dir);
  } catch {
    return { files: 0, bytes: 0 };
  }
  let files = 0;
  let bytes = 0;
  for (const name of names) {
    if (!name.endsWith(suffix)) continue;
    try {
      const info = await getInfoAsync(`${dir}${name}`);
      if (info.exists && (info.size ?? 0) > MIN_USABLE_FONT_BYTES) {
        files += 1;
        bytes += info.size ?? 0;
      }
    } catch {
      /* ignore */
    }
  }
  return { files, bytes };
}

export async function getQuranFontCacheStats(): Promise<QuranFontCacheStats> {
  await ensureQuranFontCacheDirs();
  const [book, qcf4] = await Promise.all([dirStats(BOOK_DIR, ".ttf"), dirStats(QCF4_DIR, ".ttf")]);
  return {
    bookFiles: book.files,
    bookBytes: book.bytes,
    qcf4Files: qcf4.files,
    qcf4Bytes: qcf4.bytes,
  };
}

export async function getQuranFontFreeDiskBytes(): Promise<number | null> {
  try {
    return await getFreeDiskStorageAsync();
  } catch {
    return null;
  }
}

export async function deleteQuranBookFontCache(): Promise<void> {
  if (!documentDirectory) return;
  await deleteAsync(BOOK_DIR, { idempotent: true });
}

export async function deleteQcf4FontCache(): Promise<void> {
  if (!documentDirectory) return;
  await deleteAsync(QCF4_DIR, { idempotent: true });
}

export async function deleteAllQuranFontCache(): Promise<void> {
  if (!documentDirectory) return;
  await deleteAsync(QURAN_FONT_CACHE_ROOT, { idempotent: true });
}
