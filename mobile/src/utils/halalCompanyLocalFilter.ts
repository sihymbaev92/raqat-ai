import type { HalalDamuCompanyCard } from "../api/halalDamuWp";
import { findNearestKzCityPreset } from "../constants/kzCities";
import { matchKzCityFromHalalAddress } from "./halalAddressCity";
import {
  filterHalalCompaniesWithinRadius,
  halalCompanyEffectiveCoords,
  type HalalCompanyWithDistance,
} from "./halalGeoFilter";
import { dedupeHalalCompanyCards } from "./halalInstantSearch";

/** Каталогтағы толық мекеме — мекенжайы немесе координаты бар жазба. */
export function isHalalCatalogEstablishment(c: HalalDamuCompanyCard): boolean {
  if (!c.id || !c.title?.trim()) return false;
  return !!(c.address?.trim() || halalCompanyEffectiveCoords(c));
}

export function extractLocalCityTokens(
  places: { city?: string | null; region?: string | null; subregion?: string | null; district?: string | null }[]
): string[] {
  const tokens = new Set<string>();
  for (const p of places) {
    for (const raw of [p.city, p.subregion, p.district, p.region]) {
      const t = (raw ?? "").trim();
      if (t.length >= 3) tokens.add(t.toLowerCase());
    }
  }
  return [...tokens];
}

function matchesCityTokens(address: string | null | undefined, cityTokens: string[]): boolean {
  const addr = (address ?? "").trim().toLowerCase();
  if (!addr || cityTokens.length === 0) return false;
  return cityTokens.some((t) => t.length >= 3 && addr.includes(t));
}

/** GPS бойынша ең жақын ҚР қала пресеті — сол қаладағы барлық мекемелер (мекенжай/approx). */
function filterByNearestCityPreset(
  pool: HalalDamuCompanyCard[],
  centerLat: number,
  centerLon: number
): HalalCompanyWithDistance[] {
  const nearest = findNearestKzCityPreset(centerLat, centerLon);
  if (!nearest || nearest.distanceM > 150_000) return [];
  const wantCity = nearest.city.toLowerCase();
  const tokens = [nearest.label.toLowerCase(), nearest.city.toLowerCase(), nearest.label, nearest.city];
  const out = pool.filter((c) => {
    const fromAddr = matchKzCityFromHalalAddress(c.address);
    if (fromAddr && fromAddr.city.toLowerCase() === wantCity) return true;
    return matchesCityTokens(c.address, tokens);
  });
  return out.map((c) => ({ ...c, distanceM: 0 }));
}

export type HalalLocalCompanyFilterOpts = {
  centerLat: number | null;
  centerLon: number | null;
  radiusKm: number;
  cityTokens?: string[];
  /** GPS жоқ кезде бірден көрсетілетін шек */
  fallbackLimit?: number;
};

const DEFAULT_FALLBACK_LIMIT = 80;

/** GPS радиус + бір қаладағы мекемелер (мекенжай бойынша). GPS жоқ — бірден fallback тізім. */
export function filterHalalCompaniesLocal(
  items: HalalDamuCompanyCard[],
  opts: HalalLocalCompanyFilterOpts
): HalalCompanyWithDistance[] {
  const pool = dedupeHalalCompanyCards(items.filter(isHalalCatalogEstablishment));
  const { centerLat, centerLon, radiusKm, cityTokens = [], fallbackLimit = DEFAULT_FALLBACK_LIMIT } = opts;

  if (centerLat != null && centerLon != null && Number.isFinite(centerLat) && Number.isFinite(centerLon)) {
    const radiusM = radiusKm * 1000;
    const within = filterHalalCompaniesWithinRadius(pool, centerLat, centerLon, radiusM, {
      allowCityApprox: true,
    });
    if (within.length > 0) return within;

    // Шыгород: city-center approx координатасы қашық болса — радиусты кеңейтеміз.
    for (const mult of [2, 3]) {
      const wider = filterHalalCompaniesWithinRadius(pool, centerLat, centerLon, radiusM * mult, {
        allowCityApprox: true,
      });
      if (wider.length > 0) return wider;
    }

    const byPresetCity = filterByNearestCityPreset(pool, centerLat, centerLon);
    if (byPresetCity.length > 0) return byPresetCity;

    // Қала орталығынан 5 км тыс болса да — сол қала мекенжайлыларын көрсету.
    if (cityTokens.length > 0) {
      const byCity = pool.filter((c) => matchesCityTokens(c.address, cityTokens));
      if (byCity.length > 0) {
        return byCity.map((c) => ({ ...c, distanceM: 0 }));
      }
    }
  }

  if (cityTokens.length > 0) {
    const byCity = pool.filter((c) => matchesCityTokens(c.address, cityTokens));
    if (byCity.length > 0) {
      return byCity.map((c) => ({ ...c, distanceM: 0 }));
    }
  }

  // GPS әлі жоқ — каталогты бірден көрсету (кейін радиус бойынша қайта сұрыпталады).
  return pool.slice(0, Math.max(1, fallbackLimit)).map((c) => ({ ...c, distanceM: 0 }));
}
