import {
  fetchHalalDamuCompaniesCatalog,
  peekHalalDamuCatalogPage1,
  purgeHalalDamuOversizedDiskCaches,
  type HalalDamuCompanyFetchOpts,
} from "../api/halalDamuWp";
import { hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";

/** Тізім/карта: WP логотип enrich жоқ — ашылу жылдам. */
export const HALAL_HUB_LIST_OPTS = { skipMediaEnrich: true as const };

let prefetchInFlight: Promise<void> | null = null;

/** Қолданба іске қосылғанда немесе Halal экраны ашылмай тұрып — каталог кэшін алдын ала толтыру. */
export function prefetchHalalDamuHub(): Promise<void> {
  if (prefetchInFlight) return prefetchInFlight;
  prefetchInFlight = (async () => {
    try {
      await purgeHalalDamuOversizedDiskCaches();
      await hydrateRaqatApiBaseOverride();
      await fetchHalalDamuCompaniesCatalog({ page: 1, ...HALAL_HUB_LIST_OPTS });
    } catch {
      /* офлайн / API — Halal экраны stale кэшпен ашылады */
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
