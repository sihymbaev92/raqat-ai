import { MUSHAF_PAGE_VIEWBOX } from "../../config/mushafPagesBase";
import {
  computeWordFrameScale,
  scaledImageSize,
  scaleRect,
  screenToImage,
} from "../wordFrameScale";
import { computeQcomHatimPageBox } from "../mushafBookPageLayout";

describe("wordFrameScale", () => {
  it("fits wide image by height when image is narrower than view", () => {
    const frame = computeWordFrameScale(
      { width: 200, height: 400 },
      { width: 300, height: 500 }
    );
    expect(frame.scale).toBeCloseTo(500 / 400, 4);
    expect(frame.xOffset).toBeGreaterThan(0);
    expect(frame.yOffset).toBe(0);
  });

  it("fits tall image by width when image is wider than view", () => {
    const frame = computeWordFrameScale(
      { width: 400, height: 200 },
      { width: 500, height: 300 }
    );
    expect(frame.scale).toBeCloseTo(500 / 400, 4);
    expect(frame.yOffset).toBeGreaterThan(0);
  });

  it("scales rects and inverts screen points", () => {
    const image = { width: 382.68, height: 547.09 };
    const view = { width: 390, height: 520 };
    const frame = computeWordFrameScale(image, view);
    const rect = scaleRect({ x: 10, y: 20, width: 30, height: 40 }, frame);
    expect(rect.width).toBeCloseTo(30 * frame.scale, 2);
    const back = screenToImage(rect.x, rect.y, frame);
    expect(back.x).toBeCloseTo(10, 1);
    expect(back.y).toBeCloseTo(20, 1);
  });

  it("scaledImageSize preserves aspect ratio", () => {
    const fitted = scaledImageSize(
      { width: MUSHAF_PAGE_VIEWBOX.w, height: MUSHAF_PAGE_VIEWBOX.h },
      { width: 390, height: 700 }
    );
    expect(fitted.width / fitted.height).toBeCloseTo(
      MUSHAF_PAGE_VIEWBOX.w / MUSHAF_PAGE_VIEWBOX.h,
      3
    );
  });
});

describe("computeQcomHatimPageBox", () => {
  it("portrait aspect-fits mushaf page inside viewport", () => {
    const box = computeQcomHatimPageBox(390, 520, 24, {
      horizontalSafeInset: 5,
      chromeTopReserve: 28,
    });
    const available = 520 - 24 - 10 - 28;
    expect(box.pageHeight).toBeLessThanOrEqual(available + 28 + 1);
    expect(box.pageWidth / (box.pageHeight - 28)).toBeCloseTo(
      MUSHAF_PAGE_VIEWBOX.w / MUSHAF_PAGE_VIEWBOX.h,
      2
    );
    expect(box.allowVerticalScroll).toBe(false);
    expect(box.xOffset).toBeGreaterThanOrEqual(0);
  });

  it("landscape uses full width and natural page height with scroll", () => {
    const box = computeQcomHatimPageBox(800, 360, 0);
    expect(box.pageWidth).toBe(800);
    expect(box.pageHeight).toBeGreaterThan(360);
    expect(box.allowVerticalScroll).toBe(true);
    expect(box.xOffset).toBe(0);
  });
});
