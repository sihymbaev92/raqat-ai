import {
  getHalalProductsSeedCount,
  lookupHalalProductsSeedByBarcode,
  searchHalalProductsSeed,
} from "../halalProductsSeedKz";

describe("halalProductsSeedKz", () => {
  it("loads bundled seed count", () => {
    expect(getHalalProductsSeedCount()).toBeGreaterThan(50);
  });

  it("finds product by exact GTIN", () => {
    const all = searchHalalProductsSeed("айран", 5);
    expect(all.length).toBeGreaterThan(0);
    const bc = all[0]?.barcode;
    expect(bc).toBeTruthy();
    const hit = lookupHalalProductsSeedByBarcode(bc!);
    expect(hit.length).toBe(1);
    expect(hit[0]?.fromRaqatSeed).toBe(true);
    expect(hit[0]?.verificationStatus).toBe("raqat_reference");
    expect(hit[0]?.certificateStatus).toBe("reference");
    expect(hit[0]?.title.toLowerCase()).toContain("айран");
  });

  it("search matches ingredients token", () => {
    const hit = searchHalalProductsSeed("желатин", 10);
    expect(hit.some((p) => (p.ingredients ?? "").toLowerCase().includes("желатин"))).toBe(true);
  });
});
