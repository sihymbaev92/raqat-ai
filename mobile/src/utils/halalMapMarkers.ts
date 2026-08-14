import type { HalalDamuCompanyCard, HalalDamuMapMarker } from "../api/halalDamuWp";
import { parseLatLngFromMapServiceUrl } from "../lib/halalDamuMapLinkGeo";
import { haversineDistanceM } from "./halalGeoFilter";
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

/** Карта маркерлерін GPS радиус бойынша сүзу (нақты lat/lng). */
export function filterHalalMapMarkersWithinRadius(
  markers: HalalDamuMapMarker[],
  centerLat: number,
  centerLon: number,
  radiusKm: number,
  cap = halalMapMarkerCap()
): HalalDamuMapMarker[] {
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLon) || radiusKm <= 0) return [];
  const radiusM = radiusKm * 1000;
  const ranked = markers
    .map((m) => ({
      m,
      d: haversineDistanceM(centerLat, centerLon, m.lat, m.lng),
    }))
    .filter((x) => x.d <= radiusM)
    .sort((a, b) => a.d - b.d);
  return ranked.slice(0, cap).map((x) => x.m);
}
