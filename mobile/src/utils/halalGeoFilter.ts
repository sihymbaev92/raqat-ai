import type { HalalDamuCompanyCard } from "../api/halalDamuWp";
import { parseLatLngFromMapServiceUrl } from "../lib/halalDamuMapLinkGeo";

const EARTH_RADIUS_M = 6_371_000;

/** WGS84 — екі нүкте арасындағы қашықтық (метр). */
export function haversineDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** API lat/lon немесе map_link координатасы. */
export function halalCompanyEffectiveCoords(c: HalalDamuCompanyCard): { lat: number; lon: number } | null {
  if (c.lat != null && c.lon != null && Number.isFinite(c.lat) && Number.isFinite(c.lon)) {
    if (Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180 && !(c.lat === 0 && c.lon === 0)) {
      return { lat: c.lat, lon: c.lon };
    }
  }
  const parsed = parseLatLngFromMapServiceUrl(c.mapLink);
  if (parsed) return { lat: parsed.lat, lon: parsed.lng };
  return null;
}

export type HalalCompanyWithDistance = HalalDamuCompanyCard & { distanceM: number };

/**
 * Сервер radius сүзгісін қосымша қатаңдатады: координаты жоқ немесе радиустан тыс жазбалар алынып тасталады.
 */
export function filterHalalCompaniesWithinRadius(
  items: HalalDamuCompanyCard[],
  centerLat: number,
  centerLon: number,
  radiusM: number
): HalalCompanyWithDistance[] {
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLon) || radiusM <= 0) return [];
  const out: HalalCompanyWithDistance[] = [];
  for (const c of items) {
    const coords = halalCompanyEffectiveCoords(c);
    if (!coords) continue;
    const distanceM = haversineDistanceM(centerLat, centerLon, coords.lat, coords.lon);
    if (distanceM <= radiusM) out.push({ ...c, distanceM });
  }
  out.sort((a, b) => a.distanceM - b.distanceM);
  return out;
}

export function formatHalalDistanceKm(distanceM: number): string {
  if (distanceM < 1000) return `${Math.round(distanceM)} м`;
  const km = distanceM / 1000;
  return km < 10 ? `${km.toFixed(1)} км` : `${Math.round(km)} км`;
}
