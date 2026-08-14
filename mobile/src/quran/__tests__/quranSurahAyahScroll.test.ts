import type { ScrollView } from "react-native";
import { scrollQuranSurahToAyah } from "../quranSurahAyahScroll";

describe("scrollQuranSurahToAyah", () => {
  it("scrolls mushaf stack mode via measured ayah tops", () => {
    const scrollTo = jest.fn();
    const mushafScrollRef = { current: { scrollTo } as unknown as ScrollView };
    scrollQuranSurahToAyah({
      targetAyah: 255,
      ayahs: [{ numberInSurah: 255, text: "x" }],
      mushafPageMode: false,
      mushafScrollMode: true,
      mushafPages: [],
      mushafPageWidth: 400,
      horizontalListRef: { current: null },
      mushafScrollRef,
      mushafContinuousRef: { current: null },
      listRef: { current: null },
      ayahScrollTops: { 255: 4200 },
    });
    expect(scrollTo).toHaveBeenCalledWith({ y: 4112, animated: true });
  });

  it("falls back to continuous block when mushaf stack tops are missing", () => {
    const scrollToAyah = jest.fn();
    scrollQuranSurahToAyah({
      targetAyah: 10,
      ayahs: [{ numberInSurah: 10, text: "x" }],
      mushafPageMode: false,
      mushafScrollMode: true,
      mushafPages: [],
      mushafPageWidth: 400,
      horizontalListRef: { current: null },
      mushafScrollRef: { current: null },
      mushafContinuousRef: { current: { scrollToAyah } },
      listRef: { current: null },
      ayahScrollTops: {},
    });
    expect(scrollToAyah).toHaveBeenCalledWith(10, { animated: true, viewOffset: 88 });
  });
});
