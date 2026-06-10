import {
  TRADITION_BOOKS,
  getCatalogBookSections,
  getCatalogBooksForBooksScreen,
  getGreatWordsCatalogBook,
  getKazakhWonderfulBooksForDisplay,
  getTraditionBooksByGroup,
  getWisdomAuthorBooks,
  traditionBookSearchBlob,
} from "../traditionBooksCatalog";

describe("traditionBooksCatalog", () => {
  it("has books in all groups", () => {
    expect(TRADITION_BOOKS.length).toBeGreaterThanOrEqual(30);
    expect(getTraditionBooksByGroup("wisdom").length).toBeGreaterThanOrEqual(19);
    expect(getTraditionBooksByGroup("faith").length).toBeGreaterThanOrEqual(14);
    expect(getTraditionBooksByGroup("tradition").length).toBeGreaterThanOrEqual(5);
    expect(getTraditionBooksByGroup("ait").length).toBeGreaterThanOrEqual(2);
  });

  it("search blob includes title", () => {
    const book = TRADITION_BOOKS[0];
    expect(traditionBookSearchBlob(book)).toContain(book.title.toLowerCase());
  });

  it("wisdom group has great-words hub and per-author books", () => {
    expect(getGreatWordsCatalogBook()?.id).toBe("great-words");
    const authors = getWisdomAuthorBooks();
    expect(authors.length).toBeGreaterThanOrEqual(18);
    expect(authors.every((b) => b.id.startsWith("wisdom-"))).toBe(true);
    expect(authors.some((b) => b.title.includes("Абай"))).toBe(true);
    const abai = authors.find((b) => b.id === "wisdom-abai");
    expect(abai?.action).toEqual({
      kind: "screen",
      screen: "KazakhGreatWordsAuthor",
      params: { authorId: "abai" },
    });
  });

  it("catalog books screen skips main-page feature cards and lists libraries/guides", () => {
    const books = getCatalogBooksForBooksScreen();
    expect(books.some((b) => b.id === "prayer-times")).toBe(false);
    expect(books.some((b) => b.id === "quran")).toBe(false);
    expect(books.some((b) => b.id === "tajweed")).toBe(false);
    expect(books.some((b) => b.id === "seerah")).toBe(false);
    expect(books.some((b) => b.id === "hajj")).toBe(false);
    expect(books.some((b) => b.id === "asma")).toBe(false);
    expect(books.some((b) => b.id === "halal")).toBe(false);
    expect(books.some((b) => b.id === "tradition-family")).toBe(true);
    expect(books.some((b) => b.id.startsWith("fatua-"))).toBe(true);
    expect(books.some((b) => b.id.startsWith("muftyat-"))).toBe(true);
    expect(books.length).toBeGreaterThanOrEqual(60);
  });

  it("groups catalog without duplicated main-page feature sections", () => {
    const sections = getCatalogBookSections();
    expect(sections.length).toBeGreaterThanOrEqual(3);
    expect(sections.some((s) => s.id === "faith-ibada")).toBe(false);
    expect(sections.some((s) => s.id === "faith-quran")).toBe(false);
    expect(sections.some((s) => s.id === "faith-ilm")).toBe(false);
    expect(sections.some((s) => s.id === "faith-tools")).toBe(false);
    const ids = sections.flatMap((s) => s.books.map((b) => b.id));
    expect(ids).not.toContain("prayer-times");
    expect(ids).not.toContain("quran");
    expect(ids).not.toContain("seerah");
    expect(ids).not.toContain("halal");
    expect(ids).not.toContain("islamic-kb");
    expect(ids).not.toContain("imam-ai");
    expect(ids.some((id) => id.startsWith("fatua-"))).toBe(true);
    expect(ids.some((id) => id.startsWith("muftyat-"))).toBe(true);
  });

  it("each book has pockets and action", () => {
    for (const b of TRADITION_BOOKS) {
      expect(b.summary.length).toBeGreaterThan(20);
      expect(b.contents.length).toBeGreaterThanOrEqual(2);
      expect(b.howToRead.length).toBeGreaterThanOrEqual(2);
      expect(b.action.kind).toBeTruthy();
    }
  });
});
