import {
  HATIM_AYAH_AUTO_FOCUS_PERSIST,
  HATIM_AYAH_EDGE_INSET,
  HATIM_QCF4_EDGE_BLEED,
  HATIM_QCF4_LINE_PADDING,
  HATIM_QCF4_NATIVE_SAFE_INSET,
  HATIM_QCF4_WEB_SAFE_INSET,
  hatimNativeBottomInset,
  hatimNativeTopInset,
  hatimQcf4LineJustifyContent,
  mushafBookHatimDisplayWidth,
  resolveHatimMushafLayout,
} from "../hatimMushafLayoutPolicy";
import { MUSHAF_BOOK_MAX_PAGE_WIDTH } from "../mushafBookPageLayout";
import { qcf4EffectiveLineWidth } from "../mushafQcf4Layout";

describe("resolveHatimMushafLayout (ayah edges only)", () => {
  it("uses Quran.com-like ayah edge inset on all devices", () => {
    for (const pagerWidth of [390, 520, 968]) {
      const layout = resolveHatimMushafLayout(pagerWidth, "android");
      expect(layout.linePadding).toBe(HATIM_AYAH_EDGE_INSET);
      expect(layout.linePadding).toBe(HATIM_QCF4_LINE_PADDING);
      expect(layout.lineScaleX).toBe(1);
      expect(layout.edgeBleed).toBe(HATIM_QCF4_EDGE_BLEED);
      expect(layout.lineJustifyContent).toBe("space-between");
      expect(hatimQcf4LineJustifyContent()).toBe("space-between");
      expect(layout.horizontalSafeInset).toBe(HATIM_QCF4_NATIVE_SAFE_INSET);
      expect(layout.frameWidth).toBe(mushafBookHatimDisplayWidth(pagerWidth));
    }
  });

  it("caps book at 520 and centers on wide pagers only", () => {
    const phone = resolveHatimMushafLayout(390, "android");
    expect(phone.bookPageWidth).toBe(390);
    expect(phone.centerBookColumn).toBe(false);

    const fold = resolveHatimMushafLayout(968, "android");
    expect(fold.bookPageWidth).toBe(MUSHAF_BOOK_MAX_PAGE_WIDTH);
    expect(fold.centerBookColumn).toBe(true);
    expect(fold.frameWidth).toBe(520);
  });

  it("leaves readable line width after ayah edge inset", () => {
    const layout = resolveHatimMushafLayout(390, "android");
    const pageWidth = layout.bookPageWidth - layout.horizontalSafeInset * 2;
    const effective = qcf4EffectiveLineWidth(pageWidth, layout.linePadding, layout.lineScaleX);
    expect(effective).toBeGreaterThanOrEqual(280);
    expect(effective).toBeLessThanOrEqual(360);
  });

  it("uses web safe inset on web platform", () => {
    const layout = resolveHatimMushafLayout(1200, "web");
    expect(layout.horizontalSafeInset).toBe(HATIM_QCF4_WEB_SAFE_INSET);
  });

  it("documents persistent auto-focus", () => {
    expect(HATIM_AYAH_AUTO_FOCUS_PERSIST).toBe(true);
    expect(HATIM_AYAH_EDGE_INSET).toBeGreaterThanOrEqual(18);
  });
});
