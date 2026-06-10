import {
  guideLightboxFitSize,
  guideThumbDisplaySize,
  guideThumbFitContain,
  resolveGuideImageThumbFrame,
} from "../guideLightboxFit";

describe("resolveGuideImageThumbFrame", () => {
  it("uses explicit height from thumb style when no aspect ratio", () => {
    const frame = resolveGuideImageThumbFrame({ width: "100%", height: 300 });
    expect(frame.height).toBe(300);
    expect(frame.minHeight).toBe(300);
  });

  it("uses aspect ratio when provided", () => {
    const frame = resolveGuideImageThumbFrame({ width: "100%" }, 1024 / 558);
    expect(frame.aspectRatio).toBeCloseTo(1024 / 558, 4);
    expect(frame.height).toBeUndefined();
    expect(frame.minHeight).toBeUndefined();
  });

  it("does not upscale thumb beyond source pixels", () => {
    const thumb = guideThumbDisplaySize(390, 1024 / 559, { width: 1024, height: 559 }, 3);
    expect(thumb.width).toBeLessThanOrEqual(1024 / 3 + 0.01);
    expect(thumb.height).toBeLessThanOrEqual(559 / 3 + 0.01);
  });

  it("fits thumb inside max width and height (portrait page)", () => {
    const aspect = 766 / 1134;
    const fit = guideThumbFitContain(390, 520, aspect);
    expect(fit.height).toBeLessThanOrEqual(520);
    expect(fit.width).toBeLessThanOrEqual(390);
    expect(fit.width / fit.height).toBeCloseTo(aspect, 2);
  });

  it("allowUpscale fills phone width for muftyat scan pages", () => {
    const aspect = 766 / 1134;
    const capped = guideThumbFitContain(390, 720, aspect, { width: 766, height: 1134 }, 3);
    const full = guideThumbFitContain(390, 720, aspect, { width: 766, height: 1134 }, 3, {
      allowUpscale: true,
      preferWidth: true,
    });
    expect(capped.width).toBeLessThan(390);
    expect(full.width).toBe(390);
    expect(full.height).toBeGreaterThan(capped.height);
  });

  it("fits lightbox to window with contain", () => {
    const fit = guideLightboxFitSize(400, 800, 44, 1024 / 578);
    expect(fit.width).toBeCloseTo(360, 0);
    expect(fit.height).toBeCloseTo(360 / (1024 / 578), 0);
  });

  it("defaults to 220 when height missing", () => {
    const frame = resolveGuideImageThumbFrame({ width: "100%" });
    expect(frame.height).toBe(220);
  });
});
