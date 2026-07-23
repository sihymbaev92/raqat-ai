import { ensureGreatWordsCatalogLoaded, getDisplayEntriesByAuthorId, getAuthorById } from "../greatWordsCatalog";
import { SANA_ENTRIES } from "../sanaMindOpeningWords";

describe("sana mind-opening words", () => {
  beforeAll(async () => {
    await ensureGreatWordsCatalogLoaded();
  });

  it("always exposes full sana collection even if remote catalog is thin", () => {
    const author = getAuthorById("sana");
    const rows = getDisplayEntriesByAuthorId("sana");
    expect(author?.name).toContain("Сананы");
    expect(rows.length).toBe(SANA_ENTRIES.length);
    expect(rows.every((e) => e.authorId === "sana" && e.body.length > 80)).toBe(true);
    expect(new Set(rows.map((e) => e.title)).size).toBe(SANA_ENTRIES.length);
  });
});
