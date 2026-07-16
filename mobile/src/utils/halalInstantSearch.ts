import type { HalalDamuCompanyCard } from "../api/halalDamuWp";
import {
  filterHalalCompaniesWithinRadius,
  type HalalCompanyWithDistance,
} from "./halalGeoFilter";

export const INSTANT_HALAL_SEARCH_LIMIT = 10;
/** Жақын маңдағы мекемелер — толық тізімнің жоғарғы шегі. */
export const NEARBY_INSTITUTIONS_MAX = 150;
export const NEARBY_API_PER_PAGE = 100;

export type HalalInstantCompanyFilter = {
  categoryType?: string;
  certificateStatus?: string;
};

/** Бір мекеменің WP-де қайталанған id/жазба дубликаттарын ажырату. */
export function halalCompanyFingerprint(c: HalalDamuCompanyCard): string {
  const title = (c.title ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const addr = (c.address ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return `${title}|${addr}`;
}

/** id + атау/мекенжай бойынша қайталануларды алып тастайды. */
export function dedupeHalalCompanyCards<T extends HalalDamuCompanyCard>(items: T[]): T[] {
  const seenId = new Set<number>();
  const seenFp = new Set<string>();
  const out: T[] = [];
  for (const c of items) {
    if (c.id > 0 && seenId.has(c.id)) continue;
    const fp = halalCompanyFingerprint(c);
    if (fp !== "|" && seenFp.has(fp)) continue;
    if (c.id > 0) seenId.add(c.id);
    if (fp !== "|") seenFp.add(fp);
    out.push(c);
  }
  return out;
}

function companyHaystack(c: HalalDamuCompanyCard): string {
  return [c.title, c.legalName, c.address, c.categoryType].filter(Boolean).join(" ").toLowerCase();
}

function applyClientFilters(
  items: HalalDamuCompanyCard[],
  opts?: HalalInstantCompanyFilter
): HalalDamuCompanyCard[] {
  let out = items;
  const cat = opts?.categoryType?.trim();
  if (cat) {
    out = out.filter((c) => (c.categoryType ?? "").toLowerCase() === cat.toLowerCase());
  }
  const cert = opts?.certificateStatus?.trim();
  if (cert) {
    out = out.filter((c) => (c.certificateStatus ?? "").toLowerCase() === cert.toLowerCase());
  }
  return out;
}

/** Кэш/каталог ішінен лезде сүзу — API жауабын күтпей алғашқы 10 қатар. */
export function filterHalalCompaniesInstant(
  items: HalalDamuCompanyCard[],
  query: string,
  opts?: HalalInstantCompanyFilter & { limit?: number }
): HalalDamuCompanyCard[] {
  const t = query.trim().toLowerCase();
  if (t.length < 2) return [];
  const limit = opts?.limit ?? INSTANT_HALAL_SEARCH_LIMIT;
  const pool = applyClientFilters(items, opts);
  const out: HalalDamuCompanyCard[] = [];
  const seen = new Set<number>();
  for (const c of pool) {
    if (out.length >= limit) break;
    if (seen.has(c.id)) continue;
    if (companyHaystack(c).includes(t)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out;
}

function companyNearbyHaystack(c: HalalDamuCompanyCard): string {
  return [c.title, c.legalName, c.address].filter(Boolean).join(" ").toLowerCase();
}

/** Кэш/каталог + GPS: радиус ішіндегі алғашқы N (API күтпей). */
export function filterHalalCompaniesNearbyInstant(
  items: HalalDamuCompanyCard[],
  centerLat: number,
  centerLon: number,
  radiusM: number,
  query: string,
  opts?: HalalInstantCompanyFilter & { limit?: number }
): HalalCompanyWithDistance[] {
  if (!Number.isFinite(centerLat) || !Number.isFinite(centerLon) || radiusM <= 0) return [];
  const pool = applyClientFilters(items, opts);
  const within = filterHalalCompaniesWithinRadius(pool, centerLat, centerLon, radiusM, {
    allowCityApprox: true,
  });
  const q = query.trim().toLowerCase();
  const filtered =
    q.length > 0 ? within.filter((c) => companyNearbyHaystack(c).includes(q)) : within;
  const limit = opts?.limit ?? INSTANT_HALAL_SEARCH_LIMIT;
  return dedupeHalalCompanyCards(filtered).slice(0, limit);
}

export function mergeHalalCompanyLists(...lists: HalalDamuCompanyCard[][]): HalalDamuCompanyCard[] {
  return dedupeHalalCompanyCards(lists.flat());
}

/** Жақындық тізімдерін біріктіру — жақын қашықтығы сақталады, дубликат жоқ. */
export function mergeHalalNearbyCompanyLists(
  ...lists: HalalCompanyWithDistance[][]
): HalalCompanyWithDistance[] {
  const sorted = lists.flat().sort((a, b) => a.distanceM - b.distanceM);
  return dedupeHalalCompanyCards(sorted).slice(0, NEARBY_INSTITUTIONS_MAX);
}
