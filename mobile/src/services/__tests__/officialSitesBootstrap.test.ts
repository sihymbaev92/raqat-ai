import { pickRicherOfficialNewsFeed } from "../officialSitesBootstrap";
import type { DashboardNewsItem } from "../../content/dashboardNewsItems";

const sample = (id: string, imageUrl?: string): DashboardNewsItem => ({
  id,
  title: id,
  subtitle: "t",
  image: { uri: imageUrl ?? "https://example.com/icon.png" },
  imageUrl,
});

describe("pickRicherOfficialNewsFeed", () => {
  it("prefers direct feed when API ok=false", () => {
    const api = [sample("a1")];
    const direct = [sample("d1", "https://x/a.jpg"), sample("d2", "https://x/b.jpg")];
    const picked = pickRicherOfficialNewsFeed({ ok: false, results: [] }, api, direct);
    expect(picked).toBe(direct);
  });

  it("prefers feed with more images", () => {
    const api = [sample("a1", "https://x/a.jpg"), sample("a2", "https://x/b.jpg")];
    const direct = [sample("d1")];
    const picked = pickRicherOfficialNewsFeed({ ok: true, results: [] }, api, direct);
    expect(picked).toBe(api);
  });

  it("falls back to API when direct is empty", () => {
    const api = [sample("a1")];
    const picked = pickRicherOfficialNewsFeed({ ok: true, results: [] }, api, []);
    expect(picked).toEqual(api);
  });
});
