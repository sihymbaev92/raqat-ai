import type {
  HalalDamuAdditiveItem,
  HalalDamuCompanyCard,
  HalalDamuProductItem,
} from "../api/halalDamuWp";

export type HalalLookupSnapshot = {
  products: HalalDamuProductItem[];
  additives: HalalDamuAdditiveItem[];
  companies: HalalDamuCompanyCard[];
};

const TTL_MS = 2 * 60 * 1000;
const MAX_ENTRIES = 48;

const cache = new Map<string, { at: number; data: HalalLookupSnapshot }>();

export function buildHalalLookupCacheKey(query: string, status?: string): string {
  return `${query.trim().toLowerCase()}|${(status ?? "").trim().toLowerCase()}`;
}

export function readHalalLookupCache(key: string): HalalLookupSnapshot | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

export function writeHalalLookupCache(key: string, data: HalalLookupSnapshot): void {
  cache.set(key, { at: Date.now(), data });
  if (cache.size <= MAX_ENTRIES) return;
  const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0]?.[0];
  if (oldest) cache.delete(oldest);
}
