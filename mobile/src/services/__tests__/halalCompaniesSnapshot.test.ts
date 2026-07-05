import {
  getHalalCompaniesBundledCards,
  getHalalCompaniesBundledCount,
  snapshotRowToCompanyCard,
} from "../halalCompaniesSnapshot";

describe("halalCompaniesSnapshot", () => {
  it("maps bundled rows to company cards", () => {
    const card = snapshotRowToCompanyCard({
      id: 1,
      title: "A",
      lat: 1,
      lon: 2,
    });
    expect(card.id).toBe(1);
    expect(card.title).toBe("A");
    expect(card.lat).toBe(1);
    expect(card.lon).toBe(2);
    expect(card.galleryUrls).toEqual([]);
  });

  it("loads bundled snapshot synchronously when asset is shipped", () => {
    const count = getHalalCompaniesBundledCount();
    if (count === 0) return;
    const cards = getHalalCompaniesBundledCards();
    expect(cards.length).toBe(count);
    expect(cards[0]?.id).toBeGreaterThan(0);
    expect(String(cards[0]?.title ?? "").length).toBeGreaterThan(0);
  });
});
