import { DUA_CATEGORIES } from "../duasCatalog";

import { DUA_EXTRA_DAILY, DUA_EXTRA_HEALTH, DUA_EXTRA_STUDY, DUA_EXTRA_TRAVEL, DUA_EXTRA_ZIKR } from "../duasMergedExtras";
import { DUA_SHORT_ZIKR_CATEGORY } from "../duasShortZikrCatalog";

const EXTRA_BLOCKS = [
  ...DUA_EXTRA_DAILY,
  ...DUA_EXTRA_HEALTH,
  ...DUA_EXTRA_TRAVEL,
  ...DUA_EXTRA_ZIKR,
  ...DUA_EXTRA_STUDY,
  ...DUA_SHORT_ZIKR_CATEGORY.blocks,
];

describe("DUA_CATEGORIES integrity", () => {
  it("has stable category titles for navigation keys", () => {
    const titles = DUA_CATEGORIES.map((c) => c.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("has eight numbered sections", () => {
    expect(DUA_CATEGORIES.length).toBe(8);
  });

  it("each category uses unique block titles (React list keys + UX)", () => {
    const dupes: string[] = [];
    for (const cat of DUA_CATEGORIES) {
      const seen = new Set<string>();
      for (const b of cat.blocks) {
        if (seen.has(b.title)) dupes.push(`${cat.title} :: ${b.title}`);
        seen.add(b.title);
      }
    }
    expect(dupes).toEqual([]);
  });

  it("translit uses Аллаһумма not Kazakh translation in translit field", () => {
    const bad: string[] = [];
    const all = [
      ...DUA_CATEGORIES.flatMap((c) => c.blocks),
      ...EXTRA_BLOCKS,
    ];
    for (const b of all) {
      if (b.translitKk?.includes("Аллаһ тағалам")) {
        bad.push(b.title);
      }
    }
    expect(bad).toEqual([]);
  });

  it("translit has space after comma", () => {
    const bad: string[] = [];
    for (const cat of DUA_CATEGORIES) {
      for (const b of cat.blocks) {
        if (b.translitKk && /,[а-яәіңғүұқөһ]/i.test(b.translitKk)) {
          bad.push(`${b.title}: ${b.translitKk}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("meaningKk has no embedded Arabic script", () => {
    const bad: string[] = [];
    for (const cat of DUA_CATEGORIES) {
      for (const b of cat.blocks) {
        if (/[\u0600-\u06FF]/.test(b.meaningKk)) {
          bad.push(`${cat.title} :: ${b.title}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("has no known Kazakh/translit typos", () => {
    const bad: string[] = [];
    const all = [
      ...DUA_CATEGORIES.flatMap((c) => c.blocks),
      ...EXTRA_BLOCKS,
    ];
    for (const b of all) {
      const text = `${b.title} ${b.translitKk ?? ""} ${b.meaningKk}`;
      if (/Мухаммед|қүдіретті|шуруристім/.test(text)) {
        bad.push(b.title);
      }
    }
    expect(bad).toEqual([]);
  });
});
