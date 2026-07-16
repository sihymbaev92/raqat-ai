import { Platform } from "react-native";
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
let loadPromise: Promise<Mosque2GisEntry[]> | null = null;

function applyMosqueBundle(raw: MosqueBundle | null): Mosque2GisEntry[] {
  cached = Array.isArray(raw?.mosques) ? raw.mosques : [];
  syncedAtCache = raw?.syncedAt ?? null;
  return cached;
}

function apkMosqueBundle(): MosqueBundle | null {
  if (Platform.OS === "web" || process.env.NODE_ENV === "test") return null;
  try {
    // Lazy require — модуль импортталғанда JSON бірден parse болмасын.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mosques2gisApk = require("../../assets/bundled/mosques-2gis-kz.json") as MosqueBundle;
    return Array.isArray(mosques2gisApk?.mosques) && mosques2gisApk.mosques.length
      ? mosques2gisApk
      : null;
  } catch {
    return null;
  }
}

async function loadMosqueBundle(): Promise<MosqueBundle | null> {
  const apk = apkMosqueBundle();
  if (apk) return apk;
  return tryLoadBundledJson<MosqueBundle>("mosques-2gis-kz.json");
}

export async function ensureMosques2gisCatalogLoaded(): Promise<Mosque2GisEntry[]> {
  if (cached?.length) return cached;
  if (!loadPromise) {
    loadPromise = loadMosqueBundle()
      .then((raw) => applyMosqueBundle(raw))
      .finally(() => {
        loadPromise = null;
      });
  }
  return (await loadPromise) ?? [];
}

/** ҚМДБ «Мешіттер» табы — каталогты алдын ала жүктеу. */
export function prefetchMosques2gisCatalog(): Promise<void> {
  return ensureMosques2gisCatalogLoaded().then(() => undefined).catch(() => undefined);
}

/** 2GIS rubric 13374 — Қазақстан мешіттері (APK + CDN/cache). */
export function loadMosques2gisCatalog(): Mosque2GisEntry[] {
  if (cached?.length) return cached;
  const apk = apkMosqueBundle();
  if (apk) return applyMosqueBundle(apk);
  return [];
}

export function mosqueCatalogSyncedAt(): string | null {
  return syncedAtCache;
}

export function mosqueCatalogCount(): number {
  return loadMosques2gisCatalog().length;
}

/** Nearby/KMDB жабылғанда RAM-нан мешіт каталогын түсіру. */
export function releaseMosques2gisCatalogMemory(): void {
  cached = null;
  syncedAtCache = null;
  loadPromise = null;
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

export async function searchNearbyMosquesAsync(
  centerLat: number,
  centerLon: number,
  radiusM: number,
  query: string,
  limit = 10
): Promise<Mosque2GisWithDistance[]> {
  await ensureMosques2gisCatalogLoaded();
  return searchNearbyMosques(centerLat, centerLon, radiusM, query, limit);
}
