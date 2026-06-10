/**
 * halaldamu companies API quirks (2026): lang=kk → empty; category food → empty on server;
 * full list returned in one response — client paginates in halalDamuWp.ts.
 */
import { decodeHalalDamuHtmlEntities, halalPaginateCompanies } from "../halalDamuWp";
import type { HalalDamuCompanyCard } from "../halalDamuWp";

jest.mock("../../config/halalDamuUrl", () => ({
  getHalalDamuUrl: () => "https://halaldamu.kz",
}));

function stubCompany(id: number): HalalDamuCompanyCard {
  return {
    id,
    title: `Co ${id}`,
    legalName: null,
    slug: null,
    categoryType: null,
    certificateStatus: null,
    address: null,
    phone: null,
    website: null,
    mapLink: null,
    thumbnailUrl: null,
    updatedAt: null,
    logoUrl: null,
    galleryUrls: [],
    phones: [],
    description: null,
    certNumber: null,
    certIssuedAt: null,
    certExpiresAt: null,
    lat: null,
    lon: null,
    resolvedMapUrl: null,
    extraUrls: [],
  };
}

describe("halalPaginateCompanies", () => {
  const all = Array.from({ length: 35 }, (_, i) => stubCompany(i + 1));

  it("returns first 10 on page 1 when perPage is 10", () => {
    const { items, meta } = halalPaginateCompanies(all, { perPage: 10, page: 1 });
    expect(items.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(meta.totalItems).toBe(35);
    expect(meta.totalPages).toBe(4);
    expect(meta.page).toBe(1);
  });
});

describe("halalDamu catalog integration notes", () => {
  it("decode keeps company titles readable", () => {
    expect(decodeHalalDamuHtmlEntities("&#171;Test&#187;")).toBe("«Test»");
  });
});
