import { fastSeedProductsForQuery } from "../halalVerifyHelpers";

describe("fastSeedProductsForQuery barcode", () => {
  it("finds seed product by barcode even with halal status filter", () => {
    const hits = fastSeedProductsForQuery("4607025392015", "halal");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.fromRaqatSeed).toBe(true);
  });

  it("finds seed product by barcode from 4+ digits", () => {
    const hits = fastSeedProductsForQuery("4607025392015");
    expect(hits.some((p) => p.barcode === "4607025392015")).toBe(true);
  });
});
