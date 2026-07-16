import {
  deleteAsync,
  documentDirectory,
  downloadAsync,
  getFreeDiskStorageAsync,
  getInfoAsync,
  makeDirectoryAsync,
  readDirectoryAsync,
} from "expo-file-system/legacy";

const QURAN_AUDIO_CACHE_DIR = `${documentDirectory ?? ""}quran-audio/`;
const MIN_USABLE_AUDIO_BYTES = 1024;

function hashAudioUrl(url: string): string {
  let h = 2166136261;
  for (let i = 0; i < url.length; i += 1) {
    h ^= url.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function quranAudioCacheFileNameForUrl(url: string): string {
  return `${hashAudioUrl(url)}.mp3`;
}

export function quranAudioCachePathForUrl(url: string): string | null {
  if (!documentDirectory) return null;
  return `${QURAN_AUDIO_CACHE_DIR}${quranAudioCacheFileNameForUrl(url)}`;
}

export async function ensureQuranAudioCacheDir(): Promise<void> {
  if (!documentDirectory) return;
  const info = await getInfoAsync(QURAN_AUDIO_CACHE_DIR);
  if (!info.exists) {
    await makeDirectoryAsync(QURAN_AUDIO_CACHE_DIR, { intermediates: true });
  }
}

export async function hasUsableQuranAudioFile(uri: string): Promise<boolean> {
  const info = await getInfoAsync(uri);
  return Boolean(info.exists && (info.size ?? 0) > MIN_USABLE_AUDIO_BYTES);
}

export async function isQuranAudioCached(remoteUri: string): Promise<boolean> {
  const cachePath = quranAudioCachePathForUrl(remoteUri);
  return cachePath ? hasUsableQuranAudioFile(cachePath) : false;
}

export async function getQuranAudioFreeDiskBytes(): Promise<number | null> {
  try {
    return await getFreeDiskStorageAsync();
  } catch {
    return null;
  }
}

export type QuranAudioDownloadResult = {
  uri: string;
  bytes: number;
  alreadyCached: boolean;
};

export async function downloadQuranAudioToCache(remoteUri: string): Promise<QuranAudioDownloadResult> {
  const cachePath = quranAudioCachePathForUrl(remoteUri);
  if (!cachePath) return { uri: remoteUri, bytes: 0, alreadyCached: false };

  const hit = await getInfoAsync(cachePath);
  if (hit.exists && (hit.size ?? 0) > MIN_USABLE_AUDIO_BYTES) {
    return { uri: cachePath, bytes: hit.size ?? 0, alreadyCached: true };
  }

  await ensureQuranAudioCacheDir();
  try {
    const result = await downloadAsync(remoteUri, cachePath);
    const saved = await getInfoAsync(cachePath);
    if (result.status >= 200 && result.status < 300 && saved.exists && (saved.size ?? 0) > MIN_USABLE_AUDIO_BYTES) {
      return { uri: cachePath, bytes: saved.size ?? 0, alreadyCached: false };
    }
    await deleteAsync(cachePath, { idempotent: true });
    throw new Error(`Quran audio download failed: HTTP ${result.status}`);
  } catch (err) {
    await deleteAsync(cachePath, { idempotent: true }).catch(() => {});
    throw err;
  }
}

export type QuranAudioCacheStats = {
  files: number;
  bytes: number;
};

export async function getQuranAudioCacheStats(): Promise<QuranAudioCacheStats> {
  if (!documentDirectory) return { files: 0, bytes: 0 };
  await ensureQuranAudioCacheDir();
  let files: string[] = [];
  try {
    files = await readDirectoryAsync(QURAN_AUDIO_CACHE_DIR);
  } catch {
    return { files: 0, bytes: 0 };
  }
  let bytes = 0;
  let count = 0;
  for (const file of files) {
    if (!file.endsWith(".mp3")) continue;
    try {
      const info = await getInfoAsync(`${QURAN_AUDIO_CACHE_DIR}${file}`);
      if (info.exists && (info.size ?? 0) > MIN_USABLE_AUDIO_BYTES) {
        count += 1;
        bytes += info.size ?? 0;
      }
    } catch {
      /* ignore one broken file */
    }
  }
  return { files: count, bytes };
}

export async function deleteQuranAudioCache(): Promise<void> {
  if (!documentDirectory) return;
  await deleteAsync(QURAN_AUDIO_CACHE_DIR, { idempotent: true });
}

/** Бір қари MP3 кэшін тазалау (edition slug бойынша). */
export async function deleteQuranAudioCacheForEdition(
  edition: string,
  urlForGlobalAyah: (globalAyah: number, ed: string) => string
): Promise<void> {
  if (!documentDirectory) return;
  const ed = edition.trim();
  if (!ed) return;
  const { TOTAL_AYAHS } = await import("../data/quranAyahCounts");
  for (let g = 1; g <= TOTAL_AYAHS; g += 1) {
    const remote = urlForGlobalAyah(g, ed);
    const path = quranAudioCachePathForUrl(remote);
    if (!path) continue;
    try {
      await deleteAsync(path, { idempotent: true });
    } catch {
      /* ignore one file */
    }
  }
}

/**
 * Құран аудиосы үлкен болғандықтан app bundle-ға кірмейді.
 * Бір рет тыңдалған MP3 локал cache-ке түседі де, кейін интернетсіз ойналады.
 */
export async function resolveCachedOrDownloadQuranAudioUri(remoteUri: string): Promise<string> {
  const cachePath = quranAudioCachePathForUrl(remoteUri);
  if (!cachePath) return remoteUri;

  if (await hasUsableQuranAudioFile(cachePath)) {
    return cachePath;
  }

  return (await downloadQuranAudioToCache(remoteUri)).uri;
}

/**
 * Тыңдауды тоқтатпау үшін: cache hit болса local файл, әйтпесе remote URL бірден қайтады.
 * MP3 cache фонмен жүктеледі, келесі тыңдауда/offline режимде дайын болады.
 */
export async function resolveCachedOrRemoteQuranAudioUri(remoteUri: string): Promise<string> {
  const cachePath = quranAudioCachePathForUrl(remoteUri);
  if (!cachePath) return remoteUri;

  if (await hasUsableQuranAudioFile(cachePath)) {
    return cachePath;
  }

  void downloadQuranAudioToCache(remoteUri).catch(() => {});
  return remoteUri;
}
