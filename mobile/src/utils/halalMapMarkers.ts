import type { HalalDamuCompanyCard, HalalDamuMapMarker } from "../api/halalDamuWp";
import { parseLatLngFromMapServiceUrl } from "../lib/halalDamuMapLinkGeo";
import { halalMapMarkerCap } from "./halalPerformanceProfile";

const BAD_CERT = new Set(["expired", "revoked", "cancelled", "inactive", "suspended", "rejected", "draft"]);

export function halalCompanyToMapMarker(card: HalalDamuCompanyCard): HalalDamuMapMarker | null {
  const status = (card.certificateStatus ?? "").trim().toLowerCase();
  if (status && BAD_CERT.has(status)) return null;
  if (!card.id) return null;

  let lat: number | null = card.lat != null && Number.isFinite(card.lat) ? card.lat : null;
  let lng: number | null = card.lon != null && Number.isFinite(card.lon) ? card.lon : null;
  if (lat == null || lng == null) {
    const parsed = parseLatLngFromMapServiceUrl(card.mapLink ?? card.resolvedMapUrl ?? null);
    if (parsed) {
      lat = parsed.lat;
      lng = parsed.lng;
    }
  }
  if (lat == null || lng == null) return null;

  return {
    id: card.id,
    title: (card.title ?? "").trim() || "—",
    lat,
    lng,
    address: card.address?.trim() ? card.address.trim() : null,
  };
}

/** Bundled/offline каталогдан лезде маркерлер — API күтпей. */
export function buildHalalMapMarkersFromCatalog(
  catalog: HalalDamuCompanyCard[],
  cap = halalMapMarkerCap()
): HalalDamuMapMarker[] {
  const out: HalalDamuMapMarker[] = [];
  for (const card of catalog) {
    const marker = halalCompanyToMapMarker(card);
    if (!marker) continue;
    out.push(marker);
    if (out.length >= cap) break;
  }
  return out;
}
