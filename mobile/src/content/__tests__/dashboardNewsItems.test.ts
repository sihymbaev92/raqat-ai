import {
  buildDashboardKurbanAitNewsItems,
  interleaveDashboardKbArticles,
  kbArticleToDashboardNewsItem,
  kbArticlesWithImages,
} from "../dashboardNewsItems";
import { getKurbanAitDashboardTopics } from "../kurbanAitDashboardTopics";
import type { PlatformIslamicKbArticle } from "../../services/platformApiClient";

describe("dashboardNewsItems", () => {
  const sampleFatua: PlatformIslamicKbArticle = {
    document_id: 1,
    site: "fatua",
    source_label: "Fatua.kz",
    title: "Fatua title",
    excerpt: "Fatua excerpt",
    url: "https://fatua.kz/kk/qa/read/2025-01-01/test",
    image_url: "https://fatua.kz/media/upload/articles/test.png",
  };

  const sampleMuftyat: PlatformIslamicKbArticle = {
    document_id: 2,
    site: "muftyat",
    source_label: "Muftyat.kz",
    title: "Muftyat title",
    excerpt: "Muftyat excerpt",
    url: "https://muftyat.kz/kk/articles/test/2025-01-01/1",
    image_url: "https://muftyat.kz/media/test.jpg",
  };

  it("maps kb article to dashboard news with remote image", () => {
    const item = kbArticleToDashboardNewsItem(sampleFatua);
    expect(item.id).toBe("kb-1");
    expect(item.imageUrl).toBe(sampleFatua.image_url);
    expect(item.image).toEqual({ uri: sampleFatua.image_url });
    expect(item.articleUrl).toBe(sampleFatua.url);
    expect(item.sourceLabel).toBe("Fatua.kz");
  });

  it("filters kb articles without images", () => {
    const withImg = kbArticlesWithImages([sampleFatua, { ...sampleMuftyat, image_url: "" }]);
    expect(withImg).toHaveLength(1);
    expect(withImg[0]?.site).toBe("fatua");
  });

  it("interleaves fatua and muftyat articles", () => {
    const merged = interleaveDashboardKbArticles([sampleFatua], [sampleMuftyat]);
    expect(merged.map((a) => a.site)).toEqual(["fatua", "muftyat"]);
  });

  it("builds kurban ait fallback items for offline dashboard", () => {
    const items = buildDashboardKurbanAitNewsItems();
    const topics = getKurbanAitDashboardTopics();
    expect(items).toHaveLength(topics.length);
    expect(items[0]?.target?.screen).toBe("KurbanAit");
    expect(items[0]?.articleUrl).toBeUndefined();
  });
});
