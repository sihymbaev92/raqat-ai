import {
  computeMushafPageAutoFitScale,
  computeMushafPageViewportFitScale,
  estimateUnicodeMushafFitScale,
  mushafPageMinFitScale,
} from "../mushafPageAutoFit";

describe("mushafPageAutoFit", () => {
  it("uses one min fit scale policy for hatim pages", () => {
    expect(mushafPageMinFitScale(22)).toBeCloseTo(18 / 22, 2);
    expect(mushafPageMinFitScale(30)).toBeGreaterThanOrEqual(0.5);
  });

  it("allows lower min fit scale for Unicode text-hafs", () => {
    expect(mushafPageMinFitScale(30, { unicodeTextHafs: true })).toBeCloseTo(14 / 30, 2);
    expect(mushafPageMinFitScale(30, { unicodeTextHafs: true })).toBeLessThan(
      mushafPageMinFitScale(30)
    );
  });

  it("estimates Unicode mushaf fit scale from glyph wrap budget", () => {
    const dense = estimateUnicodeMushafFitScale({
      glyphCount: 1400,
      contentWidth: 360,
      fontSize: 30,
      lineHeight: 44,
      maxHeight: 520,
    });
    const sparse = estimateUnicodeMushafFitScale({
      glyphCount: 180,
      contentWidth: 360,
      fontSize: 30,
      lineHeight: 44,
      maxHeight: 520,
    });
    expect(dense).toBeLessThan(1);
    expect(sparse).toBe(1);
  });

  it("upscales sparse Unicode pages toward viewport fill", () => {
    const upscale = estimateUnicodeMushafFitScale({
      glyphCount: 120,
      contentWidth: 360,
      fontSize: 28,
      lineHeight: 31,
      maxHeight: 680,
      maxScale: 1.22,
    });
    expect(upscale).toBeGreaterThan(1);
    expect(upscale).toBeLessThanOrEqual(1.22);
  });

  it("viewport fit scales up sparse measured content", () => {
    const next = computeMushafPageViewportFitScale(280, 520, 1, 0.45, 1.22);
    expect(next).not.toBeNull();
    expect(next!).toBeGreaterThan(1);
    expect(next!).toBeLessThanOrEqual(1.22);
  });

  it("shrinks scale when content exceeds viewport", () => {
    const next = computeMushafPageAutoFitScale(520, 400, 0.94, 0.72);
    expect(next).not.toBeNull();
    expect(next!).toBeLessThan(0.94);
    expect(next!).toBeGreaterThanOrEqual(0.72);
  });

  it("returns null when content already fits", () => {
    expect(computeMushafPageAutoFitScale(380, 400, 0.9, 0.72)).toBeNull();
  });
});
