import {
  findKzTrustedHadith,
  getKzTrustedHadithItems,
  searchKzTrustedHadiths,
} from "../kzTrustedHadithCatalog";

describe("kzTrustedHadithCatalog", () => {
  it("ships authentic sahih entries with in-app KK meaning and citation", () => {
    const items = getKzTrustedHadithItems();
    expect(items.length).toBeGreaterThanOrEqual(80);
    for (const h of items) {
      expect(["bukhari", "muslim"]).toContain(h.collection);
      expect(h.arabic.length).toBeGreaterThan(20);
      expect(h.textKk.length).toBeGreaterThan(30);
      expect(h.sourceCitationKk).toMatch(/№/);
      expect(h.sourceNoteKk.toLowerCase()).toContain("қмдб");
    }
  });

  it("finds and searches by theme", () => {
    const first = getKzTrustedHadithItems()[0];
    expect(findKzTrustedHadith(first.id)?.id).toBe(first.id);
    const found = searchKzTrustedHadiths("ниет", 10);
    expect(found.some((h) => h.id === "bukhari-1" || h.themeKk.toLowerCase().includes("ниет"))).toBe(true);
  });
});
