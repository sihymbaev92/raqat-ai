import { loadOfficialHomeNewsItems } from "../officialSitesBootstrap";
import * as officialSiteHomeFeed from "../officialSiteHomeFeed";
import * as officialHomeFeedCache from "../../storage/officialHomeFeedCache";

jest.mock("../officialSiteHomeFeed");
jest.mock("../../storage/officialHomeFeedCache");

describe("loadOfficialHomeNewsItems", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(officialHomeFeedCache, "writeOfficialHomeFeedCache").mockResolvedValue(undefined);
  });

  it("maps proxy/direct feeds without platform AI/KB API", async () => {
    jest.spyOn(officialSiteHomeFeed, "fetchOfficialSiteHomeFeeds").mockResolvedValue([
      {
        site: "fatua",
        sourceLabel: "Fatua",
        title: "Test",
        subtitle: "Sub",
        url: "https://fatua.kz/kk/a",
        imageUrl: "https://fatua.kz/media/a.jpg",
      },
    ]);

    const items = await loadOfficialHomeNewsItems();
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Test");
    expect(officialHomeFeedCache.writeOfficialHomeFeedCache).toHaveBeenCalled();
  });

  it("returns empty when feed fetch fails", async () => {
    jest.spyOn(officialSiteHomeFeed, "fetchOfficialSiteHomeFeeds").mockRejectedValue(new Error("net"));
    await expect(loadOfficialHomeNewsItems()).resolves.toEqual([]);
  });
});
