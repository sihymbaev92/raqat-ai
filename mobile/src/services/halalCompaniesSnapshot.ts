/**
 * Halal Damu companies — CDN snapshot (instant hub after cache; APK-да bundled жоқ).
 */
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
    id: row.id,
    title: row.title,
    legalName: row.legalName ?? null,
    slug: row.slug ?? null,
    categoryType: row.categoryType ?? null,
    certificateStatus: row.certificateStatus ?? null,
    address: row.address ?? null,
    ...emptyCardFields(),
    lat,
    lon,
  };
}

export async function ensureHalalCompaniesSnapshotLoaded(): Promise<HalalCompaniesSnapshotBundle | null> {
  if (bundledCache) return bundledCache;
  if (!bundledLoadPromise) {
    bundledLoadPromise = tryLoadBundledJson<HalalCompaniesSnapshotBundle>("halal-companies-snapshot.json")
      .then((data) => {
        if (data?.items?.length) {
          bundledCache = data;
          bundledCardsCache = data.items.map(snapshotRowToCompanyCard);
        }
        return bundledCache;
      })
      .finally(() => {
        bundledLoadPromise = null;
      });
  }
  return bundledLoadPromise;
}

function getBundledSnapshot(): HalalCompaniesSnapshotBundle | null {
  return bundledCache;
}

/** Sync — cache/фон жүктелгеннен кейін ғана толық тізім. */
export function getHalalCompaniesBundledCards(): HalalDamuCompanyCard[] {
  if (bundledCardsCache) return bundledCardsCache;
  return [];
}

export function getHalalCompaniesBundledSyncedAt(): string | null {
  return getBundledSnapshot()?.syncedAt ?? null;
}

export function getHalalCompaniesBundledCount(): number {
  return getHalalCompaniesBundledCards().length;
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
