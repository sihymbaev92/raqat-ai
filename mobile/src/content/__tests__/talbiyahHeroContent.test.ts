import { getTalbiyahHeroCopy } from "../talbiyahHeroContent";

describe("getTalbiyahHeroCopy", () => {
  it("returns Kazakh by default locale id", () => {
    const kk = getTalbiyahHeroCopy("kk");
    expect(kk.title).toBe("Тәлбия");
    expect(kk.oqyly).toContain("Ләббәйкә");
    expect(kk.arabic?.split("\n")).toHaveLength(2);
  });

  it("returns Russian copy", () => {
    const ru = getTalbiyahHeroCopy("ru");
    expect(ru.title).toMatch(/Тальбия/i);
    expect(ru.oqylyLabel).toBe("Транскрипция");
    expect(ru.magynasyLabel).toBe("Перевод");
  });

  it("keeps Kyrgyz Talbiyah copy in Kyrgyz instead of Kazakh fallback", () => {
    const ky = getTalbiyahHeroCopy("ky");
    expect(ky.title).toBe("Талбия");
    expect(ky.magynasyLabel).toBe("Котормосу");
    expect(ky.oqyly).toContain("Лаббайка");
    expect(ky.magynasy).toContain("Сенин шеригиң жок");
    expect(ky.oqyly).not.toContain("Ләббәйкә");
    expect(ky.magynasy).not.toContain("Сенің");
  });

  it("uses a meaning label and explanatory Arabic meaning for Arabic locale", () => {
    const ar = getTalbiyahHeroCopy("ar");
    expect(ar.magynasyLabel).toBe("المعنى");
    expect(ar.magynasy).toContain("معناها");
    expect(ar.magynasy).not.toBe(ar.arabic);
  });
});
