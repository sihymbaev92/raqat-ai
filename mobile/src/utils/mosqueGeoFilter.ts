import type { Mosque2GisEntry } from "../data/mosques2gisCatalog";
import { formatHalalDistanceKm, haversineDistanceM } from "./halalGeoFilter";

export type Mosque2GisWithDistance = Mosque2GisEntry & { distanceM: number };

export function filterMosquesWithinRadius(
  items: Mosque2GisEntry[],
  centerLat: number,
  centerLon: number,
  radiusM: number
): Mosque2GisWithDistance[] {
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLon) || radiusM <= 0) return [];
  const out: Mosque2GisWithDistance[] = [];
  for (const m of items) {
    if (!Number.isFinite(m.lat) || !Number.isFinite(m.lon)) continue;
    const distanceM = haversineDistanceM(centerLat, centerLon, m.lat, m.lon);
    if (distanceM <= radiusM) out.push({ ...m, distanceM });
  }
  out.sort((a, b) => a.distanceM - b.distanceM);
  return out;
}

export { formatHalalDistanceKm as formatMosqueDistanceKm };
