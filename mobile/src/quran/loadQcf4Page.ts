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

const pageCache = new Map<number, Qcf4PageJson>();
const inflight = new Map<number, Promise<Qcf4PageJson | null>>();
let fontMapCache: Qcf4FontMap | null = null;
let fontMapInflight: Promise<Qcf4FontMap | null> | null = null;

const BUNDLED_FONT_MAP = require("../../assets/quran/qcf4/font-map.json") as Qcf4FontMap;

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
      pageCache.set(p, bundled);
      return bundled;
    }

    if (Platform.OS !== "web") {
      const cachedRaw = await readQcf4PageJsonFromCache(p);
      if (cachedRaw) {
        try {
          const cached: unknown = JSON.parse(cachedRaw);
          if (isQcf4Page(cached)) {
            pageCache.set(p, cached);
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
        pageCache.set(p, data);
        if (Platform.OS !== "web") {
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
            pageCache.set(p, cached);
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
