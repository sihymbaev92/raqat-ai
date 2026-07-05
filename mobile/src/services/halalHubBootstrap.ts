import {
  fetchHalalDamuCompaniesCatalog,
  peekHalalDamuCatalogPage1,
  purgeHalalDamuOversizedDiskCaches,
  seedHalalCompaniesBulkFromBundled,
  type HalalDamuCompanyFetchOpts,
} from "../api/halalDamuWp";
import { hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";
import { getHalalCompaniesBundledCards, ensureHalalCompaniesSnapshotLoaded, hydrateHalalCompaniesSnapshotFromCdn } from "./halalCompaniesSnapshot";

/** Тізім/карта: WP логотип enrich жоқ — ашылу жылдам. */
export const HALAL_HUB_LIST_OPTS = { skipMediaEnrich: true as const };

let prefetchInFlight: Promise<void> | null = null;

/** Sync — Halal таб: алдымен CDN/cache snapshot жүктеледі. */
export function getHalalHubInstantCatalog(): ReturnType<typeof getHalalCompaniesBundledCards> {
  void ensureHalalCompaniesSnapshotLoaded();
  seedHalalCompaniesBulkFromBundled();
  return getHalalCompaniesBundledCards();
}

/** Қолданба іске қосылғанда — bundled seed + фonda CDN/API жаңарту (UI блокталмайды). */
export function prefetchHalalDamuHub(): Promise<void> {
  if (prefetchInFlight) return prefetchInFlight;
  prefetchInFlight = (async () => {
    try {
      await ensureHalalCompaniesSnapshotLoaded();
      seedHalalCompaniesBulkFromBundled();
      await purgeHalalDamuOversizedDiskCaches();
      await hydrateRaqatApiBaseOverride();
      await hydrateHalalCompaniesSnapshotFromCdn();
      seedHalalCompaniesBulkFromBundled();
      await fetchHalalDamuCompaniesCatalog({ page: 1, ...HALAL_HUB_LIST_OPTS });
    } catch {
      /* офлайн / API — CDN snapshot қолданылады */
    } finally {
      prefetchInFlight = null;
    }
  })();
  return prefetchInFlight;
}

export async function readHalalHubCatalogSnapshot(
  opts?: HalalDamuCompanyFetchOpts
): Promise<Awaited<ReturnType<typeof peekHalalDamuCatalogPage1>>> {
  return peekHalalDamuCatalogPage1({ page: 1, ...HALAL_HUB_LIST_OPTS, ...opts });
}
