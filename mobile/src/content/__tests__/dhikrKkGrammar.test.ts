import dhikrList from "../../../assets/bundled/dhikr-list.json";

const FORBIDDEN = [
  /\bтәспі\b/,
  /Оңайлық пен күш/,
  /мадақтай отырып/,
  /мадақтай пәк/,
  /қанағаттандым/,
  /Пайғамбарға салауат\./,
  /бастапқысы\)/,
  /салаamat/,
  /сенімді қорғаушы/,
  /тымайтын жоқ/,
  /кеудемді жайғасын/,
  /\bжайғастыр\b/,
  /\bбастапқы\b/,
  /\bқорғаушы\b/,
  / уа /,
];

describe("dhikr-list Kazakh grammar", () => {
  it("has 119 dhikr items", () => {
    expect(dhikrList.items).toHaveLength(119);
  });

  it("textKk labels avoid ellipsis and common typos", () => {
    const bad = dhikrList.items.filter(
      (i) =>
        i.textKk.includes("…") ||
        / уа /.test(i.textKk) ||
        /Мухаммад/.test(i.textKk) ||
        /бастапқы/.test(i.textKk) ||
        /Раббишрах|Раббанағфир|Раббиғфир/.test(i.textKk)
    );
    expect(bad.map((i) => i.id)).toEqual([]);
  });

  it("avoids common Kazakh grammar mistakes in textKk and meaningKk", () => {
    const violations: string[] = [];
    for (const item of dhikrList.items) {
      for (const field of ["textKk", "meaningKk"] as const) {
        const text = item[field];
        if (!text) continue;
        for (const re of FORBIDDEN) {
          if (re.test(text)) {
            violations.push(`id ${item.id} ${field}: ${re}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
