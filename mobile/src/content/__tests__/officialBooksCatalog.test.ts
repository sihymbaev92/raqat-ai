import {
  getOfficialBooksBySite,
  getOfficialBooksCatalogMeta,
} from "../officialBooksCatalog";

describe("officialBooksCatalog", () => {
  it("exposes synced catalog metadata and Fatua PDF books", () => {
    const meta = getOfficialBooksCatalogMeta();
    expect(meta.syncedAt).toBeTruthy();
    const fatua = getOfficialBooksBySite("fatua");
    expect(fatua.length).toBeGreaterThan(0);
    expect(fatua[0].action.kind).toBe("screen");
    expect(fatua[0].badge).toBe("PDF");
  });
});
