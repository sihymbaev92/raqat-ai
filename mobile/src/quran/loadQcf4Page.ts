import { Platform } from "react-native";
import {
  getQcf4UpstreamBaseUrl,
  mushafPagePadded,
  mushafQcf4FontMapUrl,
  mushafQcf4PageJsonUrl,
} from "../config/mushafPagesBase";
import type { Qcf4FontMap, Qcf4PageJson } from "./qcf4Types";
import {
  downloadQcf4PageJsonToCache,
  readQcf4PageJsonFromCache,
  writeQcf4PageJsonToCache,
} from "./qcf4AssetCache";
import { loadQcf4BundledPageJson } from "./qcf4BundledPageAssets.generated";
import { fetchWithTimeout } from "../utils/fetchWithTimeout";
import {
  readQcf4PageFromWebIndexedDb,
  writeQcf4PageToWebIndexedDb,
} from "./webHatimIndexedDb";

const pageCache = new Map<number, Qcf4PageJson>();
const inflight = new Map<number, Promise<Qcf4PageJson | null>>();
let fontMapCache: Qcf4FontMap | null = null;
let fontMapInflight: Promise<Qcf4FontMap | null> | null = null;
/** 604 бетті толық ұстамау — көрінетін терезе + көрші (±1–2 preload). */
const PAGE_CACHE_MAX = 4;

const BUNDLED_FONT_MAP = require("../../assets/quran/qcf4/font-map.json") as Qcf4FontMap;

function rememberQcf4Page(page: number, data: Qcf4PageJson): void {
  if (pageCache.has(page)) pageCache.delete(page);
  pageCache.set(page, data);
  while (pageCache.size > PAGE_CACHE_MAX) {
    const oldest = pageCache.keys().next().value;
    if (oldest == null) break;
    pageCache.delete(oldest);
  }
}

function isQcf4Page(data: unknown): data is Qcf4PageJson {
  if (!data || typeof data !== "object") return false;
  const o = data as Qcf4PageJson;
  return typeof o.page === "number" && Array.isArray(o.lines);
}

function qcf4RemotePageJsonUrls(page: number): string[] {
  const padded = mushafPagePadded(page);
  const upstream = `${getQcf4UpstreamBaseUrl()}/pages/${padded}.json`;
  const cdn = mushafQcf4PageJsonUrl(page);
  return [upstream, cdn];
}

async function loadQcf4PageFromWebStatic(page: number): Promise<Qcf4PageJson | null> {
  if (Platform.OS !== "web") return null;
  for (const url of qcf4RemotePageJsonUrls(page)) {
    try {
      const r = await fetchWithTimeout(url, { cache: "force-cache", timeoutMs: 10_000 });
      if (!r.ok) continue;
      const data: unknown = await r.json();
      if (!isQcf4Page(data)) continue;
      return data;
    } catch {
      /* try next */
    }
  }
  return null;
}

function loadQcf4PageFromBundledAssets(page: number): Qcf4PageJson | null {
  if (Platform.OS === "web") return null;
  try {
    const data = loadQcf4BundledPageJson(page);
    return isQcf4Page(data) ? data : null;
  } catch {
    return null;
  }
}

export async function loadQcf4Page(page: number): Promise<Qcf4PageJson | null> {
  const p = Math.max(1, Math.min(604, Math.floor(page)));
  const hit = pageCache.get(p);
  if (hit) return hit;

  const pending = inflight.get(p);
  if (pending) return pending;

  const task = (async () => {
    const bundled = loadQcf4PageFromBundledAssets(p);
    if (bundled) {
      rememberQcf4Page(p, bundled);
      return bundled;
    }

    if (Platform.OS === "web") {
      const idbHit = await readQcf4PageFromWebIndexedDb(p);
      if (idbHit) {
        rememberQcf4Page(p, idbHit);
        return idbHit;
      }

      const webStatic = await loadQcf4PageFromWebStatic(p);
      if (webStatic) {
        rememberQcf4Page(p, webStatic);
        void writeQcf4PageToWebIndexedDb(p, webStatic);
        return webStatic;
      }
    }

    if (Platform.OS !== "web") {
      const cachedRaw = await readQcf4PageJsonFromCache(p);
      if (cachedRaw) {
        try {
          const cached: unknown = JSON.parse(cachedRaw);
          if (isQcf4Page(cached)) {
            rememberQcf4Page(p, cached);
            return cached;
          }
        } catch {
          /* refetch */
        }
      }
    }

    for (const url of qcf4RemotePageJsonUrls(p)) {
      try {
        const r = await fetchWithTimeout(url, { cache: "force-cache", timeoutMs: 12_000 });
        if (!r.ok) continue;
        const data: unknown = await r.json();
        if (!isQcf4Page(data)) continue;
        rememberQcf4Page(p, data);
        if (Platform.OS === "web") {
          void writeQcf4PageToWebIndexedDb(p, data);
        } else {
          void writeQcf4PageJsonToCache(p, JSON.stringify(data));
        }
        return data;
      } catch {
        /* try next */
      }
    }

    if (Platform.OS !== "web" && (await downloadQcf4PageJsonToCache(p))) {
      const cachedRaw = await readQcf4PageJsonFromCache(p);
      if (cachedRaw) {
        try {
          const cached: unknown = JSON.parse(cachedRaw);
          if (isQcf4Page(cached)) {
            rememberQcf4Page(p, cached);
            return cached;
          }
        } catch {
          /* fall through */
        }
      }
    }
    return null;
  })();

  inflight.set(p, task);
  try {
    return await task;
  } finally {
    inflight.delete(p);
  }
}

export async function loadQcf4FontMap(): Promise<Qcf4FontMap | null> {
  if (fontMapCache) return fontMapCache;
  if (fontMapInflight) return fontMapInflight;

  fontMapInflight = (async () => {
    try {
      if (Platform.OS !== "web" && BUNDLED_FONT_MAP && typeof BUNDLED_FONT_MAP === "object") {
        fontMapCache = BUNDLED_FONT_MAP;
        return BUNDLED_FONT_MAP;
      }
      for (const url of [
        `${getQcf4UpstreamBaseUrl()}/font-map.json`,
        mushafQcf4FontMapUrl(),
      ]) {
        try {
          const r = await fetchWithTimeout(url, { cache: "force-cache", timeoutMs: 12_000 });
          if (!r.ok) continue;
          const data = (await r.json()) as Qcf4FontMap;
          if (!data || typeof data !== "object") continue;
          fontMapCache = data;
          return data;
        } catch {
          /* try next */
        }
      }
      return null;
    } finally {
      fontMapInflight = null;
    }
  })();

  return fontMapInflight;
}

export function clearQcf4PageCache(): void {
  pageCache.clear();
  inflight.clear();
  fontMapCache = null;
  fontMapInflight = null;
}

/** Көрінетін бет ±radius — swipe алдында QCF4 JSON дайындау. */
export function preloadAdjacentQcf4Pages(page: number, radius = 1): void {
  const center = Math.max(1, Math.min(604, Math.floor(page)));
  for (let d = -radius; d <= radius; d += 1) {
    const n = center + d;
    if (n < 1 || n > 604) continue;
    void loadQcf4Page(n).catch(() => null);
  }
}

