import type {
  HalalDamuCompanyCard,
  HalalDamuProductItem,
  HalalDamuProductQuery,
} from "../api/halalDamuWp";
import {
  fetchHalalDamuProductsBrowse,
  halalCompanyDisplayImageUrl,
  searchHalalDamuProducts,
} from "../api/halalDamuWp";
import {
  listHalalProductsSeedBrowse,
  searchHalalProductsSeed,
} from "../services/halalProductsSeedKz";
import { filterHalalCompaniesInstant, INSTANT_HALAL_SEARCH_LIMIT } from "./halalInstantSearch";
import { productMatchesGoodsStatusFilter } from "./halalVerifyHelpers";

const BAD_CERT = new Set([
  "expired",
  "revoked",
  "cancelled",
  "inactive",
  "suspended",
  "rejected",
  "draft",
]);

function filterProductsByStatusQuery(
  items: HalalDamuProductItem[],
  status?: string,
): HalalDamuProductItem[] {
  if (!status?.trim()) return items;
  return items.filter((p) => productMatchesGoodsStatusFilter(p, status));
}

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
  const status = opts?.status;
  const api = await fetchHalalDamuProductsBrowse({ ...opts, perPage: limit, page: opts?.page ?? 1 });
  if (api.items.length > 0) {
    return {
      items: filterProductsByStatusQuery(api.items, status).slice(0, limit),
      fromProducers: false,
      fromSeed: false,
      error: api.error,
    };
  }

  const seedItems = filterProductsByStatusQuery(listHalalProductsSeedBrowse(limit * 3), status).slice(
    0,
    limit,
  );
  if (seedItems.length > 0) {
    return { items: seedItems, fromProducers: false, fromSeed: true };
  }

  return { items: [], fromProducers: false, fromSeed: false, error: api.error };
}

export async function resolveHalalProductSearch(
  query: string,
  catalog: HalalDamuCompanyCard[],
  opts?: HalalDamuProductQuery & { limit?: number }
): Promise<HalalProductResolveResult> {
  const q = query.trim();
  const limit = opts?.limit ?? INSTANT_HALAL_SEARCH_LIMIT;
  const status = opts?.status;

  const api = await searchHalalDamuProducts(q, {
    ...opts,
    perPage: opts?.perPage ?? limit,
  });
  if (api.items.length > 0) {
    return {
      items: filterProductsByStatusQuery(api.items, status).slice(0, limit),
      fromProducers: false,
      fromSeed: false,
      error: api.error,
    };
  }

  const seedItems = filterProductsByStatusQuery(searchHalalProductsSeed(q, limit), status);
  if (seedItems.length > 0) {
    return { items: seedItems.slice(0, limit), fromProducers: false, fromSeed: true };
  }

  const producers = filterProductsByStatusQuery(
    filterHalalCompaniesInstant(catalog, q, { limit })
      .filter(isHalalCertifiedCompany)
      .map(companyToHalalProductItem),
    status,
  ).slice(0, limit);
  if (producers.length > 0) {
    return { items: producers, fromProducers: true, fromSeed: false, error: api.error };
  }

  return { items: [], fromProducers: false, fromSeed: false, error: api.error };
}
