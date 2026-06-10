import type {
  HalalDamuCompanyCard,
  HalalDamuProductItem,
  HalalDamuProductQuery,
} from "../api/halalDamuWp";
import {
  fetchHalalDamuProductsBrowse,
  halalCompanyDisplayImageUrl,
  searchHalalDamuProducts,
  searchHalalDamuWpSiteCompanies,
} from "../api/halalDamuWp";
import {
  listHalalProductsSeedBrowse,
  searchHalalProductsSeed,
} from "../services/halalProductsSeedKz";
import {
  dedupeHalalCompanyCards,
  filterHalalCompaniesInstant,
  INSTANT_HALAL_SEARCH_LIMIT,
} from "./halalInstantSearch";

const BAD_CERT = new Set([
  "expired",
  "revoked",
  "cancelled",
  "inactive",
  "suspended",
  "rejected",
  "draft",
]);

/** Сертификаты нашар/жойылған ұйымдарды өнім fallback-тен шығару. */
export function isHalalCertifiedCompany(c: HalalDamuCompanyCard): boolean {
  const s = (c.certificateStatus ?? "").trim().toLowerCase();
  if (!s) return true;
  return !BAD_CERT.has(s);
}

export function companyToHalalProductItem(c: HalalDamuCompanyCard): HalalDamuProductItem {
  return {
    id: c.id,
    title: c.title,
    barcode: null,
    certificateStatus: "reference",
    verificationStatus: "certified_producer",
    producerCertificateStatus: c.certificateStatus ?? "active",
    imageUrl: halalCompanyDisplayImageUrl(c),
    companyId: c.id,
    fromCertifiedProducer: true,
  };
}

export type HalalProductResolveResult = {
  items: HalalDamuProductItem[];
  fromProducers: boolean;
  fromSeed?: boolean;
  error?: string;
};

/**
 * halal-bot `/products` бос болса — RAQAT seed, содан сертификатты өндірушілер.
 */
export async function resolveHalalProductBrowse(
  catalog: HalalDamuCompanyCard[],
  opts?: HalalDamuProductQuery & { limit?: number }
): Promise<HalalProductResolveResult> {
  const limit = opts?.limit ?? INSTANT_HALAL_SEARCH_LIMIT;
  const api = await fetchHalalDamuProductsBrowse({ ...opts, perPage: limit, page: opts?.page ?? 1 });
  if (api.items.length > 0) {
    return { items: api.items.slice(0, limit), fromProducers: false, fromSeed: false, error: api.error };
  }

  const seedItems = listHalalProductsSeedBrowse(limit);
  if (seedItems.length > 0) {
    return { items: seedItems, fromProducers: false, fromSeed: true, error: api.error };
  }

  const producers = catalog.filter(isHalalCertifiedCompany).slice(0, limit).map(companyToHalalProductItem);
  return { items: producers, fromProducers: producers.length > 0, fromSeed: false, error: api.error };
}

export async function resolveHalalProductSearch(
  query: string,
  catalog: HalalDamuCompanyCard[],
  opts?: HalalDamuProductQuery & { limit?: number }
): Promise<HalalProductResolveResult> {
  const q = query.trim();
  const limit = opts?.limit ?? INSTANT_HALAL_SEARCH_LIMIT;

  const api = await searchHalalDamuProducts(q, {
    ...opts,
    perPage: opts?.perPage ?? limit,
  });
  if (api.items.length > 0) {
    return { items: api.items.slice(0, limit), fromProducers: false, fromSeed: false, error: api.error };
  }

  const seedItems = searchHalalProductsSeed(q, limit);
  if (seedItems.length > 0) {
    return { items: seedItems, fromProducers: false, fromSeed: true, error: api.error };
  }

  const local = filterHalalCompaniesInstant(catalog, q, { limit: limit * 3 }).filter(
    isHalalCertifiedCompany
  );

  const wpMatches = await searchHalalDamuWpSiteCompanies(q, catalog, { limit: limit * 2 });
  const merged = dedupeHalalCompanyCards([
    ...local,
    ...wpMatches.filter(isHalalCertifiedCompany),
  ]);
  const items = merged.slice(0, limit).map(companyToHalalProductItem);

  return { items, fromProducers: items.length > 0, fromSeed: false, error: api.error };
}
