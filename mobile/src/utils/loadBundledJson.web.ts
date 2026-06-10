/** Web: JSON — runtime fetch only. Keeps large JSON files out of the JS bundle. */
import { getBundledJsonBaseUrl } from "../config/bundledJsonBase";
import type { BundledJsonName } from "./bundledJsonTypes";

export type { BundledJsonName } from "./bundledJsonTypes";

const cache = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();

const FETCH_JSON_MS = 12_000;

async function fetchJson<T>(url: string): Promise<T | null> {
  const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = ctrl
    ? setTimeout(() => {
        ctrl.abort();
      }, FETCH_JSON_MS)
    : null;
  try {
    const r = await fetch(url, { cache: "force-cache", signal: ctrl?.signal });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function loadBundledJson<T>(name: BundledJsonName): Promise<T> {
  const hit = cache.get(name);
  if (hit !== undefined) return hit as T;

  const pending = inflight.get(name);
  if (pending) return pending as Promise<T>;

  const base = getBundledJsonBaseUrl().replace(/\/+$/, "");
  const task = (async (): Promise<T> => {
    const data = await fetchJson<T>(`${base}/${name}`);
    if (data != null) {
      cache.set(name, data);
      return data;
    }
    throw new Error(`bundled json unavailable: ${name}`);
  })();

  inflight.set(name, task);
  try {
    return await task;
  } finally {
    inflight.delete(name);
  }
}

/** Web fetch cache — тест/қайта синк үшін. */
export async function invalidateBundledJsonCache(name?: BundledJsonName): Promise<void> {
  if (name) cache.delete(name);
  else cache.clear();
}
