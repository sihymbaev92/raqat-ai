import {
  getFatuaBooksWithPdf,
  getOfficialBooksBySite,
  getOfficialBooksCatalogMeta,
} from "../officialBooksCatalog";

describe("officialBooksCatalog", () => {
  it("lists 12 Fatua books with PDF URLs", () => {
    const meta = getOfficialBooksCatalogMeta();
    expect(meta.fatuaCount).toBe(12);
    const withPdf = getFatuaBooksWithPdf();
    expect(withPdf).toHaveLength(12);
    for (const b of withPdf) {
      expect(b.pdfUrl).toMatch(/^https:\/\/fatua\.kz\/media\/upload\/books\/.+\.pdf$/i);
      expect(b.coverUrl).toMatch(/^https:\/\/fatua\.kz\/media\//);
    }
  });

  it("maps Fatua books to in-app reader action", () => {
    const books = getOfficialBooksBySite("fatua");
    expect(books).toHaveLength(12);
    for (const b of books) {
      expect(b.action).toEqual({
        kind: "screen",
        screen: "OfficialFatuaBook",
        params: expect.objectContaining({ bookId: expect.any(String) }),
      });
    }
  });
});
