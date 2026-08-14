import {
  clearHalalMapSessionCache,
  halalMapMarkerKey,
  peekHalalMapSession,
  storeHalalMapSession,
} from "../halalMapSessionCache";

describe("halalMapSessionCache", () => {
  afterEach(() => {
    clearHalalMapSessionCache();
  });

  it("stores and retrieves html snapshot by marker key", () => {
    const markers = [
      { id: 1, title: "A", lat: 43.2, lng: 76.9, address: null },
      { id: 2, title: "B", lat: 43.3, lng: 76.8, address: "Addr" },
    ];
    const key = halalMapMarkerKey(markers, null);
    storeHalalMapSession({ html: "<html/>", markers, markerKey: key });
    expect(peekHalalMapSession(key)?.html).toBe("<html/>");
    expect(peekHalalMapSession("other")).toBeNull();
  });

  it("stores multiple snapshots by marker key", () => {
    const markersA = [{ id: 1, title: "A", lat: 43.2, lng: 76.9, address: null }];
    const markersB = [{ id: 2, title: "B", lat: 43.3, lng: 76.8, address: null }];
    const keyA = halalMapMarkerKey(markersA, null);
    const keyB = halalMapMarkerKey(markersB, null);
    storeHalalMapSession({ html: "<a/>", markers: markersA, markerKey: keyA });
    storeHalalMapSession({ html: "<b/>", markers: markersB, markerKey: keyB });
    expect(peekHalalMapSession(keyA)?.html).toBe("<a/>");
    expect(peekHalalMapSession(keyB)?.html).toBe("<b/>");
  });
});
