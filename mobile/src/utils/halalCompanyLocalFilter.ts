import type { HalalDamuCompanyCard } from "../api/halalDamuWp";
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
    const within = filterHalalCompaniesWithinRadius(pool, centerLat, centerLon, radiusKm * 1000, {
      allowCityApprox: true,
    });
    if (within.length > 0) return within;

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
