import { getQcf4UpstreamBaseUrl, mushafPagePadded, mushafQcf4FontMapUrl, mushafQcf4PageJsonUrl } from "../config/mushafPagesBase";
import type { Qcf4FontMap, Qcf4PageJson } from "./qcf4Types";

const pageCache = new Map<number, Qcf4PageJson>();
const inflight = new Map<number, Promise<Qcf4PageJson | null>>();
let fontMapCache: Qcf4FontMap | null = null;
let fontMapInflight: Promise<Qcf4FontMap | null> | null = null;

function isQcf4Page(data: unknown): data is Qcf4PageJson {
  if (!data || typeof data !== "object") return false;
  const o = data as Qcf4PageJson;
  return typeof o.page === "number" && Array.isArray(o.lines);
}

export async function loadQcf4Page(page: number): Promise<Qcf4PageJson | null> {
  const p = Math.max(1, Math.min(604, Math.floor(page)));
  const hit = pageCache.get(p);
  if (hit) return hit;

  const pending = inflight.get(p);
  if (pending) return pending;

  const task = (async () => {
    const padded = mushafPagePadded(p);
    const urls = [
      mushafQcf4PageJsonUrl(p),
      `${getQcf4UpstreamBaseUrl()}/pages/${padded}.json`,
    ];
    for (const url of urls) {
      try {
        const r = await fetch(url, { cache: "force-cache" });
        if (!r.ok) continue;
        const data: unknown = await r.json();
        if (!isQcf4Page(data)) continue;
        pageCache.set(p, data);
        return data;
      } catch {
        /* try next */
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
      const r = await fetch(mushafQcf4FontMapUrl(), { cache: "force-cache" });
      if (!r.ok) return null;
      const data = (await r.json()) as Qcf4FontMap;
      if (!data || typeof data !== "object") return null;
      fontMapCache = data;
      return data;
    } catch {
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
