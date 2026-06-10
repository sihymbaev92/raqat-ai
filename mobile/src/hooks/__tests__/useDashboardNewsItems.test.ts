import { kbBrowseArticles } from "../../hooks/useDashboardNewsItems";

describe("kbBrowseArticles", () => {
  it("returns empty when ok=false", () => {
    expect(kbBrowseArticles({ ok: false, results: [{ title: "x" } as never] })).toEqual([]);
  });

  it("returns results when ok is undefined", () => {
    expect(kbBrowseArticles({ results: [{ title: "x" } as never] })).toHaveLength(1);
  });
});
