/**
 * Slim APK: QCF4 page JSON + fonts CDN-нен жүктеліп FileSystem-ге сақталады (офлайн mushaf).
 */
import { Platform } from "react-native";
import {
  documentDirectory,
  downloadAsync,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from "expo-file-system/legacy";
import {
  getQcf4UpstreamBaseUrl,
  mushafPagePadded,
  mushafQcf4FontFileUrl,
  mushafQcf4PageJsonUrl,
} from "../config/mushafPagesBase";

const CACHE_ROOT = `${documentDirectory ?? ""}qcf4-cache/`;

export function qcf4FontFileName(fontId: string, ext: "ttf" | "woff2"): string {
  if (fontId === "QCF4_QBSML") {
    return ext === "woff2" ? "QCF4_QBSML.woff2" : "QCF4_QBSML.ttf";
  }
  return ext === "woff2" ? `${fontId}_W.woff2` : `${fontId}_W.ttf`;
}

export function qcf4PageCachePath(page: number): string {
  return `${CACHE_ROOT}pages/${mushafPagePadded(page)}.json`;
}

export function qcf4FontCachePath(fontId: string, ext: "ttf" | "woff2"): string {
  return `${CACHE_ROOT}fonts/${qcf4FontFileName(fontId, ext)}`;
}

export function qcf4RemoteFontUrls(fontId: string, ext: "ttf" | "woff2"): string[] {
  const file = qcf4FontFileName(fontId, ext);
  const dir = ext === "woff2" ? "fonts-woff2" : "fonts";
  const upstream = `${getQcf4UpstreamBaseUrl()}/${dir}/${file}`;
  const cdn = mushafQcf4FontFileUrl(fontId, ext);
  return [upstream, cdn];
}

export function qcf4RemotePageJsonUrls(page: number): string[] {
  const padded = mushafPagePadded(page);
  const upstream = `${getQcf4UpstreamBaseUrl()}/pages/${padded}.json`;
  const cdn = mushafQcf4PageJsonUrl(page);
  return [upstream, cdn];
}

async function ensureDir(path: string): Promise<void> {
  if (!documentDirectory) return;
  const info = await getInfoAsync(path);
  if (!info.exists) {
    await makeDirectoryAsync(path, { intermediates: true });
  }
}

export async function ensureQcf4CacheRoot(): Promise<void> {
  if (Platform.OS === "web" || !documentDirectory) return;
  await ensureDir(`${CACHE_ROOT}pages`);
  await ensureDir(`${CACHE_ROOT}fonts`);
}

export async function readQcf4PageJsonFromCache(page: number): Promise<string | null> {
  if (Platform.OS === "web" || !documentDirectory) return null;
  const path = qcf4PageCachePath(page);
  try {
    const info = await getInfoAsync(path);
    if (!info.exists || !info.size) return null;
    return await readAsStringAsync(path);
  } catch {
    return null;
  }
}

export async function writeQcf4PageJsonToCache(page: number, raw: string): Promise<void> {
  if (Platform.OS === "web" || !documentDirectory || !raw.trim()) return;
  await ensureQcf4CacheRoot();
  await writeAsStringAsync(qcf4PageCachePath(page), raw);
}

export async function ensureQcf4FontCached(
  fontId: string,
  ext: "ttf" | "woff2" = "ttf"
): Promise<string | null> {
  if (Platform.OS === "web" || !documentDirectory) return null;
  const path = qcf4FontCachePath(fontId, ext);
  try {
    const info = await getInfoAsync(path);
    if (info.exists && info.size && info.size > 1024) return path;
  } catch {
    /* download */
  }
  await ensureQcf4CacheRoot();
  for (const url of qcf4RemoteFontUrls(fontId, ext)) {
    try {
      const result = await downloadAsync(url, path);
      if (result.status === 200) return path;
    } catch {
      /* try next */
    }
  }
  return null;
}

export async function downloadQcf4PageJsonToCache(page: number): Promise<boolean> {
  if (Platform.OS === "web" || !documentDirectory) return false;
  for (const url of qcf4RemotePageJsonUrls(page)) {
    try {
      const path = qcf4PageCachePath(page);
      const result = await downloadAsync(url, path);
      if (result.status === 200) return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

export async function getQcf4CacheCounts(): Promise<{ pages: number; fonts: number }> {
  if (Platform.OS === "web" || !documentDirectory) return { pages: 0, fonts: 0 };
  let pages = 0;
  let fonts = 0;
  try {
    const pagesDir = `${CACHE_ROOT}pages`;
    const fontsDir = `${CACHE_ROOT}fonts`;
    const pi = await getInfoAsync(pagesDir);
    if (pi.exists) {
      const { readDirectoryAsync } = await import("expo-file-system/legacy");
      const files = await readDirectoryAsync(pagesDir);
      pages = files.filter((f) => f.endsWith(".json")).length;
    }
    const fi = await getInfoAsync(fontsDir);
    if (fi.exists) {
      const { readDirectoryAsync } = await import("expo-file-system/legacy");
      const files = await readDirectoryAsync(fontsDir);
      fonts = files.filter((f) => f.endsWith(".ttf")).length;
    }
  } catch {
    /* ignore */
  }
  return { pages, fonts };
}

export async function isQcf4CacheComplete(): Promise<boolean> {
  const { pages, fonts } = await getQcf4CacheCounts();
  return pages >= 604 && fonts >= 48;
}
