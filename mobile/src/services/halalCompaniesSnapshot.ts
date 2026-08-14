/**
 * Halal Damu companies — CDN snapshot (instant hub; APK bundled sync require).
 */
import { Platform } from "react-native";
import type { HalalDamuCompanyCard } from "../api/halalDamuWp";
import { getHalalCompaniesSnapshotUrl } from "../config/halalCompaniesSnapshotBase";
import { tryLoadBundledJson } from "../utils/loadBundledJson";

export type HalalCompanySnapshotRow = {
  id: number;
  title: string;
  legalName?: string | null;
  slug?: string | null;
  certificateStatus?: string | null;
  categoryType?: string | null;
  address?: string | null;
  lat?: number | null;
  lon?: number | null;
};

type HalalCompaniesSnapshotBundle = {
  version: number;
  syncedAt: string;
  origin?: string;
  total?: number;
  items: HalalCompanySnapshotRow[];
};

let bundledCache: HalalCompaniesSnapshotBundle | null = null;
let bundledCardsCache: HalalDamuCompanyCard[] | null = null;
let bundledLoadPromise: Promise<HalalCompaniesSnapshotBundle | null> | null = null;
let cdnHydrateInFlight: Promise<HalalDamuCompanyCard[] | null> | null = null;

function emptyCardFields(): Omit<HalalDamuCompanyCard, "id" | "title"> {
  return {
    legalName: null,
    slug: null,
    categoryType: null,
    certificateStatus: null,
    address: null,
    phone: null,
    website: null,
    mapLink: null,
    thumbnailUrl: null,
    updatedAt: null,
    logoUrl: null,
    galleryUrls: [],
    phones: [],
    description: null,
    certNumber: null,
    certIssuedAt: null,
    certExpiresAt: null,
    lat: null,
    lon: null,
    resolvedMapUrl: null,
    extraUrls: [],
  };
}

export function snapshotRowToCompanyCard(row: HalalCompanySnapshotRow): HalalDamuCompanyCard {
  const lat = row.lat != null && Number.isFinite(row.lat) ? row.lat : null;
  const lon = row.lon != null && Number.isFinite(row.lon) ? row.lon : null;
  return {
    ...emptyCardFields(),
    id: row.id,
    title: row.title,
    legalName: row.legalName ?? null,
    slug: row.slug ?? null,
    categoryType: row.categoryType ?? null,
    certificateStatus: row.certificateStatus ?? null,
    address: row.address ?? null,
    lat,
    lon,
  };
}

export async function ensureHalalCompaniesSnapshotLoaded(): Promise<HalalCompaniesSnapshotBundle | null> {
  const sync = ensureBundledSnapshotSync();
  if (sync) {
    try {
      const { seedHalalCompaniesBulkFromBundled } = await import("../api/halalDamuWp");
      seedHalalCompaniesBulkFromBundled();
    } catch {
      /* optional */
    }
    return sync;
  }
  if (bundledCache) return bundledCache;
  if (!bundledLoadPromise) {
    bundledLoadPromise = tryLoadBundledJson<HalalCompaniesSnapshotBundle>("halal-companies-snapshot.json")
      .then(async (data) => {
        const applied = applyBundledSnapshot(data);
        if (applied) {
          try {
            const { seedHalalCompaniesBulkFromBundled } = await import("../api/halalDamuWp");
            seedHalalCompaniesBulkFromBundled();
          } catch {
            /* optional */
          }
        }
        return applied;
      })
      .finally(() => {
        bundledLoadPromise = null;
      });
  }
  return bundledLoadPromise;
}

function applyBundledSnapshot(data: HalalCompaniesSnapshotBundle | null): HalalCompaniesSnapshotBundle | null {
  if (!data?.items?.length) return bundledCache;
  bundledCache = data;
  bundledCardsCache = data.items.map(snapshotRowToCompanyCard);
  return bundledCache;
}

function apkHalalCompaniesSnapshot(): HalalCompaniesSnapshotBundle | null {
  if (Platform.OS === "web") return null;
  try {
    // Lazy require — Halal экраны ашылғанша JSON parse болмасын.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require("../../assets/bundled/halal-companies-snapshot.json") as HalalCompaniesSnapshotBundle;
    return Array.isArray(data?.items) && data.items.length ? data : null;
  } catch {
    return null;
  }
}

function ensureBundledSnapshotSync(): HalalCompaniesSnapshotBundle | null {
  if (bundledCache) return bundledCache;
  return applyBundledSnapshot(apkHalalCompaniesSnapshot());
}

function getBundledSnapshot(): HalalCompaniesSnapshotBundle | null {
  return bundledCache ?? ensureBundledSnapshotSync();
}

/** Sync — APK bundled немесе бұрын жүктелген кэш. */
export function getHalalCompaniesBundledCards(): HalalDamuCompanyCard[] {
  if (bundledCardsCache?.length) return bundledCardsCache;
  ensureBundledSnapshotSync();
  return bundledCardsCache ?? [];
}

export function getHalalCompaniesBundledSyncedAt(): string | null {
  return getBundledSnapshot()?.syncedAt ?? null;
}

export function getHalalCompaniesBundledCount(): number {
  return getHalalCompaniesBundledCards().length;
}

export function releaseHalalCompaniesSnapshotMemory(): void {
  bundledCache = null;
  bundledCardsCache = null;
  bundledLoadPromise = null;
  cdnHydrateInFlight = null;
}

/** CDN snapshot — bundled-тан жаңарақ болса жадқа жүктейді. */
export async function hydrateHalalCompaniesSnapshotFromCdn(): Promise<HalalDamuCompanyCard[] | null> {
  if (cdnHydrateInFlight) return cdnHydrateInFlight;
  cdnHydrateInFlight = (async () => {
    await ensureHalalCompaniesSnapshotLoaded();
    const bundledAt = getHalalCompaniesBundledSyncedAt();
    const url = getHalalCompaniesSnapshotUrl();
    try {
      const r = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!r.ok) return bundledCardsCache;
      const data = (await r.json()) as HalalCompaniesSnapshotBundle;
      if (!data?.items?.length) return bundledCardsCache;
      if (bundledAt && data.syncedAt && data.syncedAt <= bundledAt) return bundledCardsCache;
      const cards = data.items.map(snapshotRowToCompanyCard);
      bundledCardsCache = cards;
      bundledCache = data;
      return cards;
    } catch {
      return bundledCardsCache;
    } finally {
      cdnHydrateInFlight = null;
    }
  })();
  return cdnHydrateInFlight;
}
