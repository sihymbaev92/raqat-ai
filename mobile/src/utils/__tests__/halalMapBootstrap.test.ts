import { resolveInstantHalalCompanyMapMarkers } from "../halalMapBootstrap";

describe("halalMapBootstrap", () => {
  it("returns instant markers from bundled catalog without network", () => {
    const markers = resolveInstantHalalCompanyMapMarkers();
    expect(markers.length).toBeGreaterThan(0);
    expect(markers[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        lat: expect.any(Number),
        lng: expect.any(Number),
        title: expect.any(String),
      })
    );
  });
});
