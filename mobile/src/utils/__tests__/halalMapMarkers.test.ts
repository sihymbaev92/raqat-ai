import { buildHalalMapMarkersFromCatalog } from "../halalMapMarkers";
import type { HalalDamuCompanyCard } from "../../api/halalDamuWp";

function card(partial: Partial<HalalDamuCompanyCard> & { id: number; title: string }): HalalDamuCompanyCard {
  return {
    legalName: null,
    slug: null,
    categoryType: null,
    certificateStatus: "active",
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
    ...partial,
  };
}

describe("halalMapMarkers", () => {
  it("builds markers from catalog lat/lon without network", () => {
    const markers = buildHalalMapMarkersFromCatalog([
      card({ id: 1, title: "A", lat: 43.24, lon: 76.91 }),
      card({ id: 2, title: "B", certificateStatus: "expired", lat: 43.25, lon: 76.92 }),
      card({ id: 3, title: "C" }),
    ]);
    expect(markers).toHaveLength(1);
    expect(markers[0]?.id).toBe(1);
  });
});
