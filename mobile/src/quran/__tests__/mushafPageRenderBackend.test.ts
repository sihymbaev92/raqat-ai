import { Platform } from "react-native";
import {
  fallbackMushafAyahHotspots,
  getMushafAyahMapHotspots,
  type MushafAyahMapFile,
} from "../mushafAyahMap";
import {
  isMushafQcf4Backend,
  isMushafRasterBackend,
  isMushafSvgBackend,
  isMushafWebpBackend,
  mushafBookEffectiveRenderBackend,
  mushafBookPageRenderBackend,
  mushafBookPageImageUri,
  mushafPageImageUri,
  mushafPageRenderBackend,
  mushafPageSvgUri,
} from "../mushafPageRenderBackend";
import { mushafPageSvgUrl, mushafPageWebpUrl } from "../../config/mushafPagesBase";
import type { MushafBookPageSlice } from "../mushafBookTypes";

describe("mushafPageRenderBackend", () => {
  const env = process.env;

  afterEach(() => {
    process.env = env;
    delete process.env.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS;
  });

  it("defaults to text-hafs", () => {
    delete process.env.EXPO_PUBLIC_MUSHAF_PAGE_BACKEND;
    expect(mushafPageRenderBackend()).toBe("text-hafs");
    expect(mushafPageImageUri(1)).toBeNull();
    expect(isMushafWebpBackend()).toBe(false);
  });

  it("returns webp URI when backend is webp", () => {
    process.env.EXPO_PUBLIC_MUSHAF_PAGE_BACKEND = "webp";
    expect(mushafPageRenderBackend()).toBe("webp");
    expect(mushafPageImageUri(1)).toBe(mushafPageWebpUrl(1));
    expect(isMushafWebpBackend()).toBe(true);
    expect(isMushafRasterBackend()).toBe(true);
  });

  it("returns svg URI when backend is svg", () => {
    process.env.EXPO_PUBLIC_MUSHAF_PAGE_BACKEND = "svg";
    expect(mushafPageRenderBackend()).toBe("svg");
    expect(mushafPageSvgUri(1)).toBe(mushafPageSvgUrl(1));
    expect(isMushafSvgBackend()).toBe(true);
  });

  it("detects qcf4 backend", () => {
    process.env.EXPO_PUBLIC_MUSHAF_PAGE_BACKEND = "qcf4";
    expect(mushafPageRenderBackend()).toBe("qcf4");
    expect(isMushafQcf4Backend()).toBe(true);
    expect(isMushafRasterBackend()).toBe(false);
  });

  it("book reader backend for Quran.com original when env default", () => {
    delete process.env.EXPO_PUBLIC_MUSHAF_PAGE_BACKEND;
    delete process.env.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS;
    expect(mushafBookPageRenderBackend("original")).toBe("qcf4");
    expect(mushafBookPageRenderBackend("muftyat")).toBe("qcf4");
    process.env.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS = "1";
    expect(mushafBookPageRenderBackend("original")).toBe("text-hafs");
  });

  it("keeps QCF4 mushaf when tajweed colors are on (Sajda-style glyph page)", () => {
    delete process.env.EXPO_PUBLIC_MUSHAF_PAGE_BACKEND;
    delete process.env.EXPO_PUBLIC_MUSHAF_HATIM_TEXT_HAFS;
    const os = Platform.OS;
    try {
      Platform.OS = "web";
      expect(
        mushafBookEffectiveRenderBackend("original", {
          showTajweedColors: true,
          arabicScriptEdition: "madinah",
        })
      ).toBe("qcf4");
      expect(
        mushafBookEffectiveRenderBackend("original", {
          showTajweedColors: false,
          arabicScriptEdition: "madinah",
        })
      ).toBe("qcf4");
    } finally {
      Platform.OS = os;
    }
  });

  it("mushafBookPageImageUri is null for qcf4 book backend", () => {
    delete process.env.EXPO_PUBLIC_MUSHAF_PAGE_BACKEND;
    expect(mushafBookPageImageUri(2, "original")).toBeNull();
  });

  it("formats page urls with zero padding", () => {
    expect(mushafPageWebpUrl(3)).toContain("/003.webp");
    expect(mushafPageWebpUrl(42)).toContain("/042.webp");
  });
});

describe("mushafAyahMap", () => {
  const sampleMap: MushafAyahMapFile = {
    version: 1,
    edition: "hafs-604",
    pages: {
      "1": [{ surah: 1, ayah: 1, x: 0.1, y: 0.2, w: 0.8, h: 0.05 }],
    },
  };

  const page: MushafBookPageSlice = {
    key: "hafs-1",
    mushafPageNumber: 1,
    ayahs: [
      { numberInSurah: 1, text: "x", surahNumber: 1 },
      { numberInSurah: 2, text: "y", surahNumber: 1 },
    ],
  };

  it("reads hotspots from map", () => {
    const spots = getMushafAyahMapHotspots(sampleMap, 1);
    expect(spots).toHaveLength(1);
    expect(spots![0]!.surah).toBe(1);
  });

  it("fallback splits page into ayah bands", () => {
    const spots = fallbackMushafAyahHotspots(page);
    expect(spots).toHaveLength(2);
    expect(spots[0]!.y).toBeLessThan(spots[1]!.y);
  });
});
