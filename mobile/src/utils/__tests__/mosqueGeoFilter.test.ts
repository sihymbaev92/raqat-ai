import { filterMosquesWithinRadius } from "../mosqueGeoFilter";

describe("mosqueGeoFilter", () => {
  const sample = [
    {
      id: "1",
      dgisItemId: "1_x",
      name: "Test Mosque",
      address: "Main st",
      lat: 43.24,
      lon: 76.95,
      regionId: "67",
      regionName: "Almaty",
      mapUrl: "https://2gis.kz/firm/1",
    },
    {
      id: "2",
      dgisItemId: "2_x",
      name: "Far Mosque",
      address: "Other",
      lat: 42.0,
      lon: 70.0,
      regionId: "67",
      regionName: "Almaty",
      mapUrl: "https://2gis.kz/firm/2",
    },
  ];

  it("filters within radius and sorts by distance", () => {
    const rows = filterMosquesWithinRadius(sample, 43.24, 76.95, 5000);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe("1");
    expect(rows[0]?.distanceM).toBeLessThan(100);
  });
});
