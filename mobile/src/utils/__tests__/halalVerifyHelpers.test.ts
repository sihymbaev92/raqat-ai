import {
  buildHalalCheckSummary,
  fastSeedProductsForQuery,
  productMatchesGoodsStatusFilter,
} from "../halalVerifyHelpers";
import type { HalalDamuAdditiveItem, HalalDamuProductItem } from "../../api/halalDamuWp";

describe("fastSeedProductsForQuery barcode", () => {
  it("does not treat all seed rows as halal when chip is set", () => {
    const hits = fastSeedProductsForQuery("4607025392015", "halal");
    expect(hits).toEqual([]);
  });

  it("keeps active seed products under the halal chip", () => {
    const hits = fastSeedProductsForQuery("4607025392228", "halal");
    expect(hits.some((p) => p.barcode === "4607025392228")).toBe(true);
    expect(hits[0]?.certificateStatus).toBe("active");
  });

  it("routes pork seed rows to the haram chip", () => {
    const hits = fastSeedProductsForQuery("4607025392529", "haram");
    expect(hits.some((p) => p.barcode === "4607025392529")).toBe(true);
  });

  it("finds seed product by barcode from 4+ digits", () => {
    const hits = fastSeedProductsForQuery("4607025392015");
    expect(hits.some((p) => p.barcode === "4607025392015")).toBe(true);
  });
});

describe("productMatchesGoodsStatusFilter", () => {
  const active: HalalDamuProductItem = {
    id: 1,
    title: "Milk",
    barcode: "1",
    certificateStatus: "active",
  };
  const review: HalalDamuProductItem = {
    id: 2,
    title: "Sausage",
    barcode: "2",
    certificateStatus: "review_required",
    ingredients: "шошқа еті",
  };

  it("maps active to halal and pork review to haram only", () => {
    expect(productMatchesGoodsStatusFilter(active, "halal")).toBe(true);
    expect(productMatchesGoodsStatusFilter(active, "haram")).toBe(false);
    expect(productMatchesGoodsStatusFilter(review, "halal")).toBe(false);
    expect(productMatchesGoodsStatusFilter(review, "haram")).toBe(true);
    expect(productMatchesGoodsStatusFilter(review, "doubtful")).toBe(false);
  });

  it("does not treat educational titles with the word haram as haram products", () => {
    const educational: HalalDamuProductItem = {
      id: 3,
      title: "halal oder haram",
      barcode: "3",
      certificateStatus: "active",
      ingredients: "су, тұз",
    };
    expect(productMatchesGoodsStatusFilter(educational, "halal")).toBe(true);
    expect(productMatchesGoodsStatusFilter(educational, "haram")).toBe(false);
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

  it("marks bad when seed product ingredients include pork", () => {
    const pork: HalalDamuProductItem = {
      id: 9,
      title: "Сосиски",
      barcode: "9",
      certificateStatus: "review_required",
      ingredients: "шошқа/сиыр еті",
      fromRaqatSeed: true,
    };
    const summary = buildHalalCheckSummary([pork], [], []);
    expect(summary?.tone).toBe("bad");
  });

  it("marks bad when product certificate expired", () => {
    const expired: HalalDamuProductItem = {
      id: 2,
      title: "Old",
      barcode: "456",
      certificateStatus: "expired",
    };
    const summary = buildHalalCheckSummary([expired], [], []);
    expect(summary?.tone).toBe("bad");
  });
});
