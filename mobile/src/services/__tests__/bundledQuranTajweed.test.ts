import { getBundledTajweedAyahText, loadBundledTajweedSurahMap } from "../bundledQuranTajweed";

jest.mock("../../utils/loadBundledJson", () => ({
  tryLoadBundledJson: jest.fn(async () => ({
    version: 1,
    surahs: {
      "1": {
        "1": "بِسْمِ [h:1[ٱ]للَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ",
        "2": "الْ[h[م]دُ لِلَّهِ",
      },
      "2": {
        "255": "اللَّهُ [l[ل]ا إِلَ[n[ـٰ]هَ",
      },
    },
  })),
  releaseBundledJsonMemory: jest.fn(),
}));

describe("bundledQuranTajweed", () => {
  it("loads tagged ayah text offline", async () => {
    const map = await loadBundledTajweedSurahMap(1);
    expect(map?.[1]).toContain("[h:1[");
    expect(getBundledTajweedAyahText(1, 1)).toContain("ٱ");
  });

  it("returns null when ayah has no tags", async () => {
    expect(getBundledTajweedAyahText(1, 999)).toBeNull();
  });
});
