import { HAJJ_MUFTYAT_PAGES, HAJJ_MUFTYAT_SOURCE } from "../hajjMuftyatPages";
import { HAJJ_MUFTYAT_SECTIONS } from "../hajjMuftyatCatalog";
import { getHajjMuftyatPageText } from "../hajjMuftyatPageText";
import { HAJJ_BOOK_SECTIONS } from "../hajjBookContent";

describe("hajjMuftyat catalog", () => {
  it("loads full muftyat.kz book", () => {
    expect(HAJJ_MUFTYAT_SOURCE.url).toContain("muftyat.kz/kk/book/28689");
    expect(HAJJ_MUFTYAT_PAGES).toHaveLength(HAJJ_MUFTYAT_SOURCE.totalPages);
  });

  it("sections sortable in book page order (intro before talbiyah)", () => {
    const sorted = [...HAJJ_MUFTYAT_SECTIONS].sort((a, b) => a.startPage - b.startPage);
    expect(sorted[0]).toMatchObject({ id: "qajylyq", startPage: 3 });
    expect(sorted.find((s) => s.id === "talbiyah")).toMatchObject({ startPage: 7 });
  });

  it("covers content pages without overlap gaps before back matter", () => {
    const covered = new Set<number>();
    for (const s of HAJJ_MUFTYAT_SECTIONS) {
      for (let p = s.startPage; p <= s.endPage; p += 1) covered.add(p);
    }
    expect(covered.has(7)).toBe(true);
    expect(covered.has(9)).toBe(true);
    expect(getHajjMuftyatPageText(9)?.readable).toBe(true);
  });

  it("has a systematic hajj/umrah roadmap from preparation to after-hajj", () => {
    const titles = HAJJ_BOOK_SECTIONS.map((s) => s.title);
    for (let n = 1; n <= 30; n += 1) {
      expect(titles.some((title) => title.startsWith(`${n}.`))).toBe(true);
    }
    expect(titles.some((title) => /Тәлбия/.test(title))).toBe(true);
    expect(titles[titles.length - 1]).toMatch(/схемалары/i);
    expect(HAJJ_BOOK_SECTIONS.every((s) => s.body.trim().length > 40)).toBe(true);
  });
});
