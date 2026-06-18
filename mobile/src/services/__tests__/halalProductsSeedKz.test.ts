import {
  getHalalProductsSeedCount,
  lookupHalalProductsSeedByBarcode,
  searchHalalProductsSeed,
} from "../halalProductsSeedKz";
import seedBundle from "../../../assets/bundled/halal-products-seed-kz.json";

type SeedItem = {
  title: string;
  ingredients?: string | null;
  certificateStatus?: string | null;
  companyId?: number | null;
};

const seedItems = (seedBundle as { items: SeedItem[] }).items;
const hasLatinAndCyrillic = (word: string) => /[A-Za-z]/.test(word) && /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(word);

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

  it("does not keep mixed Latin/Cyrillic OCR typos inside one seed title word", () => {
    const bad = seedItems.flatMap((item) =>
      item.title
        .split(/\s+/)
        .filter(hasLatinAndCyrillic)
        .map((word) => `${item.title}: ${word}`)
    );

    expect(bad).toEqual([]);
  });

  it("does not mark pork-containing manual seed rows as active certified products", () => {
    const risky = seedItems.filter((item) => /шошқа/i.test(item.ingredients ?? ""));

    expect(risky.length).toBeGreaterThan(0);
    expect(risky).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          certificateStatus: "review_required",
          companyId: null,
        }),
      ])
    );
    expect(risky.every((item) => item.certificateStatus !== "active")).toBe(true);
  });
});
