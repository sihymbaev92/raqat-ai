import { KB_ARTICLES_OFFLINE_SEED } from "../kbArticlesSeed";
import { loadKbArticlesFeed } from "../../services/kbArticlesFeed";

jest.mock("../../services/platformApiClient", () => ({
  fetchPlatformIslamicKbSearch: jest.fn(),
  fetchPlatformIslamicKbBrowse: jest.fn(),
}));

jest.mock("../../services/officialSitesBootstrap", () => ({
  loadOfficialHomeNewsItems: jest.fn().mockRejectedValue(new Error("offline")),
}));

jest.mock("../../storage/officialHomeFeedCache", () => ({
  readOfficialHomeFeedCacheSnapshot: jest.fn().mockResolvedValue(null),
}));

jest.mock("../../config/raqatApiBase", () => ({
  getRaqatApiBase: jest.fn(() => ""),
}));

describe("kbArticlesFeed", () => {
  it("falls back to offline seed when network and cache unavailable", async () => {
    const res = await loadKbArticlesFeed({ query: "", site: "" });
    expect(res.source).toBe("seed");
    expect(res.items.length).toBe(KB_ARTICLES_OFFLINE_SEED.length);
    expect(res.items[0].excerpt.length).toBeGreaterThan(20);
  });

  it("offline seed articles have official urls", () => {
    for (const item of KB_ARTICLES_OFFLINE_SEED) {
      expect(item.url).toMatch(/^https:\/\//);
      expect(item.title.trim().length).toBeGreaterThan(0);
    }
  });
});
