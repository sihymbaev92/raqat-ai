import {
  mushafQcf4ColrFontUrl,
  mushafQcf4ColrOtSvgFontUrl,
} from "../../config/mushafPagesBase";
import { qcf4ColrFontFamilyName } from "../qcf4ColrFontLoader";
import { qcf4ColrBasePaletteIndex, qcf4ColrPaletteForReadingTheme } from "../qcf4ColrTheme";

describe("qcf4ColrTheme", () => {
  it("maps reading themes to COLR palettes", () => {
    expect(qcf4ColrPaletteForReadingTheme("original", false)).toBe("light");
    expect(qcf4ColrPaletteForReadingTheme("dark", false)).toBe("dark");
    expect(qcf4ColrPaletteForReadingTheme("sepia", false)).toBe("sepia");
    expect(qcf4ColrPaletteForReadingTheme("muftyat", true)).toBe("dark");
  });

  it("uses Quran Foundation palette indices", () => {
    expect(qcf4ColrBasePaletteIndex("light")).toBe(0);
    expect(qcf4ColrBasePaletteIndex("dark")).toBe(1);
    expect(qcf4ColrBasePaletteIndex("sepia")).toBe(2);
  });
});

describe("qcf4 COLR CDN URLs", () => {
  it("builds per-page COLRv1 and OT-SVG paths", () => {
    expect(mushafQcf4ColrFontUrl(1, "woff2")).toContain("/v4/colrv1/woff2/p1.woff2");
    expect(mushafQcf4ColrOtSvgFontUrl(604, "dark", "ttf")).toContain(
      "/v4/ot-svg/dark/ttf/p604.ttf"
    );
  });

  it("names one font family per mushaf page", () => {
    expect(qcf4ColrFontFamilyName(42)).toBe("QCF4V4_p42");
  });
});
