import { getTalbiyahHeroCopy } from "../talbiyahHeroContent";

describe("getTalbiyahHeroCopy", () => {
  it("returns Kazakh by default locale id", () => {
    const kk = getTalbiyahHeroCopy("kk");
    expect(kk.title).toBe("Тәлбия – дұғасы");
    expect(kk.oqyly).toContain("Ләббәйкә");
    expect(kk.arabic?.split("\n")).toHaveLength(2);
  });

  it("returns Russian copy", () => {
    const ru = getTalbiyahHeroCopy("ru");
    expect(ru.title).toMatch(/Тальбия/i);
    expect(ru.magynasyLabel).toBe("Смысл");
  });
});
