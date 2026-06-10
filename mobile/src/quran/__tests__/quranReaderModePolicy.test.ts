import {
  resolveEffectiveQuranReaderNavMode,
  shouldRenderSingleMushafBookPageOnWeb,
} from "../quranReaderModePolicy";
import { AYAH_COUNTS_PER_SURAH } from "../../data/quranAyahCounts";

describe("quranReaderModePolicy", () => {
  it("forces scroll mode for mobile web mushaf pages", () => {
    expect(AYAH_COUNTS_PER_SURAH[0]).toBe(7);
    expect(
      resolveEffectiveQuranReaderNavMode({
        platformOS: "web",
        mushafLayout: true,
        windowWidth: 390,
        preferredMode: "page",
      })
    ).toBe("scroll");
  });

  it("keeps page mode on wider web and native screens", () => {
    expect(
      resolveEffectiveQuranReaderNavMode({
        platformOS: "web",
        mushafLayout: true,
        windowWidth: 900,
        preferredMode: "page",
      })
    ).toBe("page");
    expect(
      resolveEffectiveQuranReaderNavMode({
        platformOS: "android",
        mushafLayout: true,
        windowWidth: 390,
        preferredMode: "page",
      })
    ).toBe("page");
  });

  it("renders the Hatim book reader as one controlled page on web", () => {
    expect(shouldRenderSingleMushafBookPageOnWeb("web")).toBe(true);
    expect(shouldRenderSingleMushafBookPageOnWeb("android")).toBe(false);
  });
});
