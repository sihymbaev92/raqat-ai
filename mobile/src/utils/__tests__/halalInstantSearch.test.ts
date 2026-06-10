import type { HalalDamuCompanyCard } from "../../api/halalDamuWp";
import {
  dedupeHalalCompanyCards,
  filterHalalCompaniesInstant,
  filterHalalCompaniesNearbyInstant,
  mergeHalalCompanyLists,
  INSTANT_HALAL_SEARCH_LIMIT,
} from "../halalInstantSearch";

function card(partial: Partial<HalalDamuCompanyCard> & { id: number; title: string }): HalalDamuCompanyCard {
  return {
    id: partial.id,
    title: partial.title,
    legalName: null,
    slug: null,
    categoryType: partial.categoryType ?? null,
    certificateStatus: partial.certificateStatus ?? null,
    address: partial.address ?? null,
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
    lat: partial.lat ?? null,
    lon: partial.lon ?? null,
    resolvedMapUrl: null,
    extraUrls: [],
  };
}

describe("filterHalalCompaniesInstant", () => {
  const items = [
    card({ id: 1, title: "Астана Халал Et", categoryType: "food" }),
    card({ id: 2, title: "Базар", address: "Алматы" }),
    card({ id: 3, title: "Халал Damu Lab", certificateStatus: "active" }),
  ];

  it("returns up to 10 title/address matches", () => {
    const out = filterHalalCompaniesInstant(items, "халал");
    expect(out.map((c) => c.id)).toEqual([1, 3]);
    expect(out.length).toBeLessThanOrEqual(INSTANT_HALAL_SEARCH_LIMIT);
  });

  it("respects certificate filter", () => {
    const out = filterHalalCompaniesInstant(items, "халал", { certificateStatus: "active" });
    expect(out.map((c) => c.id)).toEqual([3]);
  });

  it("needs at least 2 chars", () => {
    expect(filterHalalCompaniesInstant(items, "а")).toEqual([]);
  });
});

describe("dedupeHalalCompanyCards", () => {
  it("removes duplicate ids and matching title+address", () => {
    const items = [
      card({ id: 1, title: "Morocco", address: "Shymkent" }),
      card({ id: 1, title: "Morocco", address: "Shymkent" }),
      card({ id: 99, title: "Morocco", address: "Shymkent" }),
      card({ id: 2, title: "Other", address: "Almaty" }),
    ];
    expect(dedupeHalalCompanyCards(items).map((c) => c.id)).toEqual([1, 2]);
  });
});

describe("mergeHalalCompanyLists", () => {
  it("merges without duplicates preferring first list", () => {
    const a = [card({ id: 1, title: "A" }), card({ id: 2, title: "B" })];
    const b = [card({ id: 2, title: "B dup" }), card({ id: 3, title: "C" })];
    expect(mergeHalalCompanyLists(a, b).map((c) => c.id)).toEqual([1, 2, 3]);
  });
});

describe("filterHalalCompaniesNearbyInstant", () => {
  const centerLat = 43.24;
  const centerLon = 76.95;
  const nearby = [
    card({ id: 1, title: "Жақын", lat: 43.241, lon: 76.951 }),
    card({ id: 2, title: "Алыс", lat: 44.0, lon: 77.0 }),
    card({ id: 3, title: "Жақын Халал", lat: 43.242, lon: 76.952 }),
  ];

  it("returns nearest within radius sorted by distance, max 10", () => {
    const out = filterHalalCompaniesNearbyInstant(nearby, centerLat, centerLon, 5000, "");
    expect(out.map((c) => c.id)).toEqual([1, 3]);
    expect(out[0].distanceM).toBeLessThan(out[1].distanceM);
    expect(out.length).toBeLessThanOrEqual(INSTANT_HALAL_SEARCH_LIMIT);
  });

  it("filters by query within radius", () => {
    const out = filterHalalCompaniesNearbyInstant(nearby, centerLat, centerLon, 5000, "халал");
    expect(out.map((c) => c.id)).toEqual([3]);
  });
});
