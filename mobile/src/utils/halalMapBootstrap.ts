import type { HalalDamuMapMarker } from "../api/halalDamuWp";
import {
  peekHalalDamuCompanyMapMarkersCache,
  prefetchHalalDamuCompanyMapMarkers,
} from "../api/halalDamuWp";
import { getHalalHubInstantCatalog } from "../services/halalHubBootstrap";
import { buildHalalMapMarkersFromCatalog } from "./halalMapMarkers";
import { halalMapMarkerCap } from "./halalPerformanceProfile";

/** Офлайн каталог + API кэш — карта модалін дереу ашу. */
export function resolveInstantHalalCompanyMapMarkers(): HalalDamuMapMarker[] {
  const cached = peekHalalDamuCompanyMapMarkersCache();
  if (cached?.length) return cached.slice(0, halalMapMarkerCap());
  return buildHalalMapMarkersFromCatalog(getHalalHubInstantCatalog());
}

export function warmHalalCompanyMapMarkers(): void {
  prefetchHalalDamuCompanyMapMarkers();
}
