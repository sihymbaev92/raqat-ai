import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DashboardNewsItem } from "../../content/dashboardNewsItems";
import { readOfficialHomeFeedCache, writeOfficialHomeFeedCache } from "../officialHomeFeedCache";

const sampleItem: DashboardNewsItem = {
  id: "fatua-1",
  title: "Тест мақала",
  subtitle: "Fatua.kz",
  sourceLabel: "Fatua.kz",
  image: { uri: "https://fatua.kz/media/x.jpg" },
  imageUrl: "https://fatua.kz/media/x.jpg",
  articleUrl: "https://fatua.kz/kk/qa/read/1",
};

describe("officialHomeFeedCache", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("returns null when cache is empty", async () => {
    expect(await readOfficialHomeFeedCache()).toBeNull();
  });

  it("round-trips fresh items", async () => {
    await writeOfficialHomeFeedCache([sampleItem]);
    const cached = await readOfficialHomeFeedCache();
    expect(cached).toHaveLength(1);
    expect(cached?.[0]?.title).toBe("Тест мақала");
  });

  it("ignores expired cache", async () => {
    const stale = {
      syncedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(),
      items: [sampleItem],
    };
    await AsyncStorage.setItem("raqat_official_home_feed_v1", JSON.stringify(stale));
    expect(await readOfficialHomeFeedCache()).toBeNull();
  });

  it("skips write for empty list", async () => {
    await writeOfficialHomeFeedCache([]);
    expect(await AsyncStorage.getItem("raqat_official_home_feed_v1")).toBeNull();
  });
});
