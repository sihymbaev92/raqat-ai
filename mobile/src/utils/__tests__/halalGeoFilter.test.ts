import {
  filterHalalCompaniesWithinRadius,
  haversineDistanceM,
  halalCompanyEffectiveCoords,
} from "../halalGeoFilter";
import type { HalalDamuCompanyCard } from "../../api/halalDamuWp";

function company(partial: Partial<HalalDamuCompanyCard> & { id: number; title: string }): HalalDamuCompanyCard {
  return {
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
    lat: partial.lat ?? null,
    lon: partial.lon ?? null,
    resolvedMapUrl: null,
    extraUrls: [],
    ...partial,
    id: partial.id,
    title: partial.title,
  };
}

describe("halalGeoFilter", () => {
  it("haversineDistanceM is ~0 for same point", () => {
    expect(haversineDistanceM(43.24, 76.95, 43.24, 76.95)).toBeLessThan(1);
  });

  it("excludes companies outside radius", () => {
    const centerLat = 43.24;
    const centerLon = 76.95;
    const near = company({ id: 1, title: "Near", lat: 43.241, lon: 76.951 });
    const far = company({ id: 2, title: "Far", lat: 42.0, lon: 70.0 });
    const filtered = filterHalalCompaniesWithinRadius([near, far], centerLat, centerLon, 5000);
    expect(filtered.map((c) => c.id)).toEqual([1]);
    expect(filtered[0].distanceM).toBeGreaterThan(0);
    expect(filtered[0].distanceM).toBeLessThan(5000);
  });

  it("parses coords from map_link when lat/lon missing", () => {
    const c = company({
      id: 3,
      title: "2GIS",
      lat: null,
      lon: null,
      mapLink: "https://2gis.kz/almaty/geo/70000001012345678?m=76.95,43.24",
    });
    expect(halalCompanyEffectiveCoords(c)?.lat).toBeCloseTo(43.24, 2);
  });
});
