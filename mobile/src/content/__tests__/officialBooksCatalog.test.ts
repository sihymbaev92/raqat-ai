import {
  getOfficialBooksBySite,
  getOfficialBooksCatalogMeta,
} from "../officialBooksCatalog";

describe("officialBooksCatalog", () => {
  it("keeps catalog metadata without surfacing removed in-app book screens", () => {
    const meta = getOfficialBooksCatalogMeta();
    expect(meta.syncedAt).toBeTruthy();
    expect(getOfficialBooksBySite("fatua")).toEqual([]);
    expect(getOfficialBooksBySite("muftyat")).toEqual([]);
  });
});
