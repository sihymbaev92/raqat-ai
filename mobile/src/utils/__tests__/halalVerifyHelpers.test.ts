import { buildHalalCheckSummary, fastSeedProductsForQuery } from "../halalVerifyHelpers";
import type { HalalDamuAdditiveItem, HalalDamuProductItem } from "../../api/halalDamuWp";

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

describe("buildHalalCheckSummary additive risk", () => {
  const okProduct: HalalDamuProductItem = {
    id: 1,
    title: "Test",
    barcode: "123",
    certificateStatus: "active",
  };

  it("marks bad when haram additive present", () => {
    const additives: HalalDamuAdditiveItem[] = [
      { id: 1, title: "E120", description: "", risk: "HARAM" },
      { id: 2, title: "E471", description: "", risk: "MUSHKIL" },
    ];
    const summary = buildHalalCheckSummary([okProduct], additives, []);
    expect(summary?.tone).toBe("bad");
    expect(summary?.title).toMatch(/харам/i);
  });

  it("marks warn when only mushkil additives", () => {
    const additives: HalalDamuAdditiveItem[] = [
      { id: 1, title: "E471", description: "", risk: "MUSHKIL" },
    ];
    const summary = buildHalalCheckSummary([], additives, []);
    expect(summary?.tone).toBe("warn");
    expect(summary?.title).toMatch(/күдікті/i);
  });

  it("keeps ok when product halal and no risky additives", () => {
    const additives: HalalDamuAdditiveItem[] = [
      { id: 1, title: "E300", description: "", risk: "REFERENCE" },
    ];
    const summary = buildHalalCheckSummary([okProduct], additives, []);
    expect(summary?.tone).toBe("ok");
  });
});
