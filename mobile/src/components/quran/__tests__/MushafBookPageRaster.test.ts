import { mushafRasterActiveImageUri } from "../../../quran/mushafRasterActiveImage";

describe("mushafRasterActiveImageUri", () => {
  it("does not load raster assets for inactive pager cells", () => {
    expect(mushafRasterActiveImageUri(false, "https://example.test/page.webp", false)).toBeNull();
  });

  it("loads active raster assets until an image error occurs", () => {
    expect(mushafRasterActiveImageUri(true, "https://example.test/page.webp", false)).toBe(
      "https://example.test/page.webp"
    );
    expect(mushafRasterActiveImageUri(true, "https://example.test/page.webp", true)).toBeNull();
  });
});
