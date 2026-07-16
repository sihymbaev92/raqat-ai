import { filterHalalCompaniesLocal, isHalalCatalogEstablishment } from "../halalCompanyLocalFilter";
import type { HalalDamuCompanyCard } from "../../api/halalDamuWp";

function card(partial: Partial<HalalDamuCompanyCard> & { id: number; title: string }): HalalDamuCompanyCard {
  return {
    legalName: null,
    slug: null,
    address: "Алматы, Абай 1",
    phone: null,
    phones: [],
    website: null,
    categoryType: null,
    certificateStatus: null,
    certNumber: null,
    certIssuedAt: null,
    certExpiresAt: null,
    updatedAt: null,
    logoUrl: null,
    thumbnailUrl: null,
    galleryUrls: [],
    mapLink: null,
    resolvedMapUrl: null,
    description: null,
    extraUrls: [],
    lat: null,
    lon: null,
    ...partial,
  };
}

describe("filterHalalCompaniesLocal progressive fallback", () => {
  it("shows catalog immediately without GPS instead of empty list", () => {
    const items = [
      card({ id: 1, title: "Халал кафе" }),
      card({ id: 2, title: "Халал дүкен", address: "Астана" }),
    ];
    expect(items.every(isHalalCatalogEstablishment)).toBe(true);
    const out = filterHalalCompaniesLocal(items, {
      centerLat: null,
      centerLon: null,
      radiusKm: 5,
    });
    expect(out.length).toBe(2);
    expect(out.map((c) => c.id)).toEqual([1, 2]);
  });

  it("prefers radius results once GPS is available", () => {
    const items = [
      card({ id: 1, title: "Жақын", lat: 43.24, lon: 76.91 }),
      card({ id: 2, title: "Алыс", lat: 51.16, lon: 71.45 }),
    ];
    const out = filterHalalCompaniesLocal(items, {
      centerLat: 43.24,
      centerLon: 76.91,
      radiusKm: 5,
    });
    expect(out.some((c) => c.id === 1)).toBe(true);
    expect(out.every((c) => c.id !== 2 || (c.distanceM ?? 0) < 50_000)).toBe(true);
  });
});
