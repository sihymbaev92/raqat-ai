import {
  fetchHalalDamuCompaniesCatalog,
  peekHalalDamuCatalogPage1,
  purgeHalalDamuOversizedDiskCaches,
  seedHalalCompaniesBulkFromBundled,
  type HalalDamuCompanyFetchOpts,
} from "../api/halalDamuWp";
import { hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";
import { getHalalCompaniesBundledCards, ensureHalalCompaniesSnapshotLoaded, hydrateHalalCompaniesSnapshotFromCdn } from "./halalCompaniesSnapshot";
import { prefetchHalalProductsSeedIndex } from "./halalProductsSeedKz";
import { warmHalalCompanyMapMarkers } from "../utils/halalMapBootstrap";

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
      prefetchHalalProductsSeedIndex();
      warmHalalCompanyMapMarkers();
      // Параллель: диск тазалау + API база + CDN — бірінші тізімді күттірмейді.
      await Promise.all([
        purgeHalalDamuOversizedDiskCaches().catch(() => undefined),
        hydrateRaqatApiBaseOverride().catch(() => undefined),
        hydrateHalalCompaniesSnapshotFromCdn().catch(() => undefined),
      ]);
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
