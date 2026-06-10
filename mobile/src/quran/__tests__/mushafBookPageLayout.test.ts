import {
  computeMushafBookPageBox,
  mushafBookContentWidth,
  mushafBookNativeContentWidth,
  MUSHAF_BOOK_PAGE_EDGE_INSET,
  MUSHAF_BOOK_PHONE_SIDE_INSET,
  MUSHAF_BOOK_NATIVE_HATIM_INNER_SIDE_INSET,
  MUSHAF_BOOK_MAX_PAGE_WIDTH,
} from "../mushafBookPageLayout";
import {
  QCF4_PHONE_NATIVE_SAFE_INSET,
  QCF4_PHONE_VERTICAL_STRETCH_FACTOR,
  qcf4EffectiveLineWidth,
} from "../mushafQcf4Layout";

describe("mushafBookContentWidth", () => {
  it("caps wide viewports like desktop web", () => {
    expect(mushafBookContentWidth(1200)).toBe(MUSHAF_BOOK_MAX_PAGE_WIDTH);
    expect(MUSHAF_BOOK_MAX_PAGE_WIDTH).toBe(520);
  });

  it("keeps narrow phone width", () => {
    expect(mushafBookContentWidth(390)).toBe(390);
  });

  it("uses a native phone side inset for clipped hatim pages", () => {
    expect(mushafBookNativeContentWidth(390)).toBe(390 - MUSHAF_BOOK_PHONE_SIDE_INSET * 2);
    expect(MUSHAF_BOOK_PHONE_SIDE_INSET).toBeLessThanOrEqual(10);
  });
});

describe("computeMushafBookPageBox", () => {
  it("fits page height inside viewport", () => {
    const { pageHeight } = computeMushafBookPageBox(390, 520, 24);
    expect(pageHeight).toBeLessThanOrEqual(520 - 24 - 10 - 4);
  });

  it("full page mode contain-fits mushaf aspect in viewport", () => {
    const viewport = 900;
    const pad = 24;
    const available = viewport - pad - MUSHAF_BOOK_PAGE_EDGE_INSET;
    const { pageHeight, pageWidth } = computeMushafBookPageBox(1200, viewport, pad, true);
    expect(pageHeight).toBeLessThanOrEqual(available);
    expect(pageWidth).toBeLessThanOrEqual(MUSHAF_BOOK_MAX_PAGE_WIDTH);
    expect(pageWidth / pageHeight).toBeCloseTo(382.68 / 547.09, 2);
  });

  it("keeps a safe full width without overflowing narrow hatim screens", () => {
    const viewport = 520;
    const pad = 24;
    const available = viewport - pad - MUSHAF_BOOK_PAGE_EDGE_INSET;
    const { pageHeight, pageWidth } = computeMushafBookPageBox(390, viewport, pad, true, {
      allowVerticalOverflow: true,
      horizontalSafeInset: MUSHAF_BOOK_NATIVE_HATIM_INNER_SIDE_INSET,
    });
    expect(pageWidth).toBe(390 - MUSHAF_BOOK_NATIVE_HATIM_INNER_SIDE_INSET * 2);
    expect(pageHeight).toBeLessThanOrEqual(available);
  });

  it("does not over-stretch hatim pages on tall screens", () => {
    const { pageHeight, pageWidth } = computeMushafBookPageBox(390, 900, 24, true, {
      allowVerticalOverflow: true,
      horizontalSafeInset: MUSHAF_BOOK_NATIVE_HATIM_INNER_SIDE_INSET,
      maxVerticalStretchFactor: 1.1,
    });
    const naturalHeight = pageWidth / (382.68 / 547.09);
    expect(pageHeight).toBeLessThanOrEqual(naturalHeight * 1.1 + 1);
  });

  it("keeps quran.com hatim pages inside one viewport with side inset", () => {
    const viewport = 520;
    const pad = 24;
    const available = viewport - pad - MUSHAF_BOOK_PAGE_EDGE_INSET;
    const { pageHeight, pageWidth } = computeMushafBookPageBox(390, viewport, pad, true, {
      horizontalSafeInset: MUSHAF_BOOK_NATIVE_HATIM_INNER_SIDE_INSET,
    });
    expect(pageHeight).toBeLessThanOrEqual(available);
    expect(pageWidth).toBeLessThanOrEqual(390 - MUSHAF_BOOK_NATIVE_HATIM_INNER_SIDE_INSET * 2);
    expect(pageWidth / pageHeight).toBeCloseTo(382.68 / 547.09, 2);
  });

  it("does not let the legacy minimum width defeat a large phone safe inset", () => {
    const { pageHeight, pageWidth } = computeMushafBookPageBox(320, 900, 0, true, {
      horizontalSafeInset: 30,
    });
    expect(pageWidth).toBe(260);
    expect(pageWidth / pageHeight).toBeCloseTo(382.68 / 547.09, 2);
  });

  it("keeps QCF4 phone geometry readable after the screen already applies native side insets", () => {
    const nativePagerWidth = 390 - MUSHAF_BOOK_PHONE_SIDE_INSET * 2;
    const { pageHeight, pageWidth } = computeMushafBookPageBox(
      nativePagerWidth,
      780,
      0,
      true,
      { horizontalSafeInset: QCF4_PHONE_NATIVE_SAFE_INSET }
    );
    expect(pageWidth).toBe(nativePagerWidth);
    expect(pageWidth / pageHeight).toBeCloseTo(382.68 / 547.09, 2);
  });

  it("lets phone QCF4 pages use tall viewport height instead of leaving a large bottom blank", () => {
    const nativePagerWidth = 390 - MUSHAF_BOOK_PHONE_SIDE_INSET * 2;
    const plain = computeMushafBookPageBox(nativePagerWidth, 780, 0, true, {
      horizontalSafeInset: QCF4_PHONE_NATIVE_SAFE_INSET,
    });
    const stretched = computeMushafBookPageBox(nativePagerWidth, 780, 0, true, {
      allowVerticalOverflow: true,
      horizontalSafeInset: QCF4_PHONE_NATIVE_SAFE_INSET,
      maxVerticalStretchFactor: QCF4_PHONE_VERTICAL_STRETCH_FACTOR,
    });

    expect(stretched.pageWidth).toBe(plain.pageWidth);
    expect(stretched.pageHeight).toBeGreaterThanOrEqual(700);
    expect(stretched.pageHeight).toBeLessThanOrEqual(780 - MUSHAF_BOOK_PAGE_EDGE_INSET);
  });

  it("keeps QCF4 phone line width readable while leaving edge clipping room", () => {
    const pageWidth = mushafBookNativeContentWidth(390);
    expect(qcf4EffectiveLineWidth(pageWidth)).toBeGreaterThan(pageWidth * 0.74);
    expect(qcf4EffectiveLineWidth(pageWidth)).toBeLessThan(pageWidth * 0.8);
  });
});
