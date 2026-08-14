import fs from "fs";
import path from "path";

const LATIN = /[A-Za-z]/;

describe("dhikr-list.json transliteration quality", () => {
  const jsonPath = path.join(__dirname, "../../../assets/bundled/dhikr-list.json");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as {
    items: Array<{ id: number; slug: string; textAr: string; textKk: string; translitKk: string }>;
  };

  it("has 119 dhikr entries", () => {
    expect(data.items).toHaveLength(119);
  });

  it("translitKk has no Latin letters", () => {
    const bad = data.items.filter((i) => LATIN.test(i.translitKk));
    expect(bad.map((i) => `${i.id}:${i.translitKk}`)).toEqual([]);
  });

  it("translitKk has no truncated ellipsis", () => {
    const bad = data.items.filter((i) => i.translitKk.includes("…"));
    expect(bad.map((i) => i.id)).toEqual([]);
  });

  it("uses уә for Arabic وَ conjunction", () => {
    const bad = data.items.filter((i) => / уа /.test(i.translitKk));
    expect(bad.map((i) => i.id)).toEqual([]);
  });

  it("uses билләһ for بِاللَّهِ", () => {
    const bad = data.items.filter((i) => /илла биллаһ/.test(i.translitKk));
    expect(bad.map((i) => i.id)).toEqual([]);
  });

  it("uses Мұхаммад for Prophet name in translit", () => {
    const bad = data.items.filter((i) => i.translitKk.includes("Мухаммад"));
    expect(bad.map((i) => i.id)).toEqual([]);
  });

  it("textKk labels have no Latin letters", () => {
    const bad = data.items.filter((i) => LATIN.test(i.textKk));
    expect(bad.map((i) => `${i.id}:${i.textKk}`)).toEqual([]);
  });

  it("key long duas have full translit (not label-only)", () => {
    const bySlug = Object.fromEntries(data.items.map((i) => [i.slug, i]));
    expect(bySlug.rabbana_atina.translitKk).toContain("қина 'азабан-наар");
    expect(bySlug.la_ilaha_full_tawhid.translitKk).toContain("ләһул-мулку");
    expect(bySlug.allahumma_antarabbi.translitKk).toContain("'абдука");
  });
});
