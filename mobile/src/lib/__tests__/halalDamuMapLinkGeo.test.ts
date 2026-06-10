import { parseLatLngFromMapServiceUrl } from "../halalDamuMapLinkGeo";

describe("parseLatLngFromMapServiceUrl", () => {
  it("parses 2gis m=lng,lat", () => {
    const u =
      "https://2gis.kz/almaty/firm/70000001033669069?m=76.897785%2C43.187039%2F16";
    expect(parseLatLngFromMapServiceUrl(u)).toEqual({ lat: 43.187039, lng: 76.897785 });
  });

  it("parses 2gis path /lng,lat before query", () => {
    const u =
      "https://2gis.kz/almaty/search/Qazaqsha/firm/70000001082498135/76.843717%2C43.218346?m=76.843749%2C43.218373%2F18";
    expect(parseLatLngFromMapServiceUrl(u)).toEqual({ lat: 43.218373, lng: 76.843749 });
  });

  it("parses Google @lat,lng", () => {
    const u = "https://www.google.com/maps/place/Foo/@43.218346,76.843717,17z/data=!3m1!4b1";
    expect(parseLatLngFromMapServiceUrl(u)).toEqual({ lat: 43.218346, lng: 76.843717 });
  });

  it("returns null for empty", () => {
    expect(parseLatLngFromMapServiceUrl("")).toBeNull();
    expect(parseLatLngFromMapServiceUrl(null)).toBeNull();
  });
});
