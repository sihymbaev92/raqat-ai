import type { HalalDamuMapMarker } from "../api/halalDamuWp";
import {
  fetchHalalDamuCompanyMapMarkers,
  peekHalalDamuCompanyMapMarkersCache,
  prefetchHalalDamuCompanyMapMarkers,
} from "../api/halalDamuWp";
import { ensureHalalCompaniesSnapshotLoaded } from "../services/halalCompaniesSnapshot";
import { getHalalHubInstantCatalog } from "../services/halalHubBootstrap";
import { buildHalalMapMarkersFromCatalog, filterHalalMapMarkersWithinRadius } from "./halalMapMarkers";
import { buildHalalLeafletMapHtml } from "./halalMapLeafletHtml";
import {
  halalMapMarkerKey,
  peekHalalMapSession,
  storeHalalMapSession,
} from "./halalMapSessionCache";
import { halalMapMarkerCap } from "./halalPerformanceProfile";
function pickHalalMapMarkersForUser(
  markers: HalalDamuMapMarker[],
  user?: { lat: number; lon: number } | null,
  radiusKm = 5
): HalalDamuMapMarker[] {
  if (!user || !markers.length) return markers;
  const nearby = filterHalalMapMarkersWithinRadius(markers, user.lat, user.lon, radiusKm);
  return nearby.length > 0 ? nearby : markers;
}

/** Офлайн каталог + API кэш — карта модалін дереу ашу. */
export function resolveInstantHalalCompanyMapMarkers(): HalalDamuMapMarker[] {
  const cached = peekHalalDamuCompanyMapMarkersCache();
  if (cached?.length) return cached.slice(0, halalMapMarkerCap());
  return buildHalalMapMarkersFromCatalog(getHalalHubInstantCatalog());
}

/** Маркерлер + HTML — модал ашылғанда дереу көрсету. */
export async function prewarmHalalMapSession(
  openDetailLabel = "Толығырақ",
  markerPool?: HalalDamuMapMarker[],
  user?: { lat: number; lon: number } | null,
  radiusKm = 5
): Promise<void> {
  let markers = markerPool?.length ? markerPool : resolveInstantHalalCompanyMapMarkers();
  if (!markers.length) {
    await ensureHalalCompaniesSnapshotLoaded().catch(() => null);
    markers = resolveInstantHalalCompanyMapMarkers();
  }
  if (!markers.length) return;
  const view = pickHalalMapMarkersForUser(markers, user ?? null, radiusKm);
  const markerKey = halalMapMarkerKey(view, user ?? null);
  if (peekHalalMapSession(markerKey)) return;
  const html = buildHalalLeafletMapHtml(view, openDetailLabel, user ?? null);
  storeHalalMapSession({ html, markers: view, markerKey });
}

export function warmHalalCompanyMapMarkers(): void {
  prefetchHalalDamuCompanyMapMarkers();
  void prewarmHalalMapSession();
  void fetchHalalDamuCompanyMapMarkers().then(({ markers }) => {
    if (markers.length > 0) void prewarmHalalMapSession(undefined, markers);
  });
}

/** Snapshot + API — карта табындағы сана және модал үшін жаңарту. */
export async function refreshHalalMapMarkerCount(): Promise<number> {
  await ensureHalalCompaniesSnapshotLoaded();
  const instant = resolveInstantHalalCompanyMapMarkers();
  if (instant.length > 0) return instant.length;
  try {
    const { markers } = await fetchHalalDamuCompanyMapMarkers();
    return markers.length;
  } catch {
    return resolveInstantHalalCompanyMapMarkers().length;
  }
}
