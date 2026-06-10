import { clampZoomScale, IMAGE_ZOOM_MAX_SCALE, IMAGE_ZOOM_MIN_SCALE } from "../zoomImageLimits";

describe("clampZoomScale", () => {
  it("clamps below min", () => {
    expect(clampZoomScale(0.2)).toBe(IMAGE_ZOOM_MIN_SCALE);
  });

  it("clamps above max", () => {
    expect(clampZoomScale(99)).toBe(IMAGE_ZOOM_MAX_SCALE);
  });

  it("passes through mid values", () => {
    expect(clampZoomScale(2.5)).toBe(2.5);
  });
});
