import { upgradeMuftyatImageUrl, upgradeRemoteFeedImageUrl } from "../remoteImageUrlQuality";

describe("remoteImageUrlQuality", () => {
  it("upgrades muftyat orxl CDN path to orxxl", () => {
    expect(
      upgradeMuftyatImageUrl(
        "https://imgs.muftyat.kz/orxl/WhatsApp_Image_2026-05-19_at_13.10.57.jpeg"
      )
    ).toBe("https://imgs.muftyat.kz/orxxl/WhatsApp_Image_2026-05-19_at_13.10.57.jpeg");
  });

  it("leaves fatua media URLs unchanged", () => {
    const url = "https://fatua.kz/media/cache/article_thumb/foo.jpg";
    expect(upgradeRemoteFeedImageUrl(url)).toBe(url);
  });

  it("leaves already-large muftyat URLs unchanged", () => {
    const url = "https://imgs.muftyat.kz/orxxl/slider.jpeg";
    expect(upgradeRemoteFeedImageUrl(url)).toBe(url);
  });
});
