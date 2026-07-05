import { filterMosquesWithinRadius, type Mosque2GisWithDistance } from "../utils/mosqueGeoFilter";
import { tryLoadBundledJson } from "../utils/loadBundledJson";

export type Mosque2GisEntry = {
  id: string;
  dgisItemId: string;
  name: string;
  address: string;
  fullAddress?: string;
  lat: number;
  lon: number;
  regionId: string;
  regionName: string;
  mapUrl: string;
  phone?: string;
  contactPhones?: string[];
  websites?: string[];
  socialUrls?: string[];
  scheduleText?: string;
  photoUrl?: string;
};

type MosqueBundle = {
  source: string;
  count: number;
  syncedAt: string;
  mosques: Mosque2GisEntry[];
};

let cached: Mosque2GisEntry[] | null = null;
let syncedAtCache: string | null = null;
let loadPromise: Promise<Mosque2GisEntry[] | null> | null = null;

async function loadMosqueBundle(): Promise<MosqueBundle | null> {
  return tryLoadBundledJson<MosqueBundle>("mosques-2gis-kz.json");
}

export async function ensureMosques2gisCatalogLoaded(): Promise<Mosque2GisEntry[]> {
  if (cached) return cached;
  if (!loadPromise) {
    loadPromise = loadMosqueBundle()
      .then((raw) => {
        cached = Array.isArray(raw?.mosques) ? raw.mosques : [];
        syncedAtCache = raw?.syncedAt ?? null;
        return cached;
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return (await loadPromise) ?? [];
}

/** 2GIS rubric 13374 — Қазақстан мешіттері (CDN/cache). */
export function loadMosques2gisCatalog(): Mosque2GisEntry[] {
  return cached ?? [];
}

export function mosqueCatalogSyncedAt(): string | null {
  return syncedAtCache;
}

export function mosqueCatalogCount(): number {
  return loadMosques2gisCatalog().length;
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

/** Атау, мекенжай, қала бойынша локалді сүзгі. */
export function filterMosquesByQuery<T extends Mosque2GisEntry>(rows: T[], query: string): T[] {
  const q = normalizeQuery(query);
  if (!q) return rows;
  return rows.filter((m) => {
    const name = m.name.toLowerCase();
    const addr = (m.address ?? "").toLowerCase();
    const region = (m.regionName ?? "").toLowerCase();
    return name.includes(q) || addr.includes(q) || region.includes(q);
  });
}

export function searchNearbyMosques(
  centerLat: number,
  centerLon: number,
  radiusM: number,
  query: string,
  limit = 10
): Mosque2GisWithDistance[] {
  const within = filterMosquesWithinRadius(loadMosques2gisCatalog(), centerLat, centerLon, radiusM);
  const filtered = filterMosquesByQuery(within, query);
  return filtered.slice(0, limit);
}
