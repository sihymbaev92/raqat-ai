import abaiKaraSoz from "../../../assets/bundled/abai-kara-soz-full.json";
import { getEntriesByAuthorId } from "../greatWordsCatalog";

describe("abaiKaraSozFull", () => {
  it("contains all 45 Kara Soz with non-empty text", () => {
    expect(abaiKaraSoz.count).toBe(45);
    expect(abaiKaraSoz.items).toHaveLength(45);
    const nums = abaiKaraSoz.items.map((i) => i.number).sort((a, b) => a - b);
    expect(nums).toEqual(Array.from({ length: 45 }, (_, i) => i + 1));
    for (const item of abaiKaraSoz.items) {
      expect(item.text.trim().length).toBeGreaterThan(80);
      expect(item.excerpt.length).toBeGreaterThan(20);
    }
  });

  it("great-words catalog exposes 45 sorted Abai Kara Soz entries", () => {
    const abai = getEntriesByAuthorId("abai");
    const kara = abai.filter((e) => e.karaSozNumber != null);
    expect(kara).toHaveLength(45);
    expect(kara[0].karaSozNumber).toBe(1);
    expect(kara[44].karaSozNumber).toBe(45);
    expect(kara[0].id).toBe("abai-ks-01");
    expect(kara[0].body).toMatch(/Абай Құнанбаев.*«Қара сөз».*1-ші сөз/);
    expect(kara[0].body.length).toBeGreaterThan(500);
  });
});
