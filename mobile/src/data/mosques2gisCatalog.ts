import { filterMosquesWithinRadius, type Mosque2GisWithDistance } from "../utils/mosqueGeoFilter";

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

/** 2GIS rubric 13374 — Қазақстан мешіттері (bundled). */
export function loadMosques2gisCatalog(): Mosque2GisEntry[] {
  if (cached) return cached;
  const raw = require("../../assets/bundled/mosques-2gis-kz.json") as MosqueBundle;
  cached = Array.isArray(raw.mosques) ? raw.mosques : [];
  return cached;
}

export function mosqueCatalogSyncedAt(): string | null {
  const raw = require("../../assets/bundled/mosques-2gis-kz.json") as MosqueBundle;
  return raw.syncedAt ?? null;
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
