import { MUSHAF_PAGE_VIEWBOX, mushafPageAspectRatio } from "../config/mushafPagesBase";
import { computeWordFrameScale, scaledImageSize } from "./wordFrameScale";

/** QCF4 жоғарғы джуз/бет жолы (MushafBookPageQcf4). */
export const QCOM_HATIM_CHROME_TOP_RESERVE = 28;
/** Сыртқы сүре рамкасы (MushafBookPageQcf4). */
export const QCOM_HATIM_SURAH_FRAME_RESERVE = 56;

/** Мұсаф кітап/хатым: бет экранға жақынырақ толсын, бірақ desktop-та тым жайылып кетпесін. */
export const MUSHAF_BOOK_MAX_PAGE_WIDTH = 520;
/** Native телефонда glyph/marker/frame экран шетіне тимеу үшін қауіпсіз бүйір орын. */
export const MUSHAF_BOOK_PHONE_SIDE_INSET = 10;
/** Хатым ішкі беті рамкаға/gesture edge-ке тимес үшін қосымша page-safe орын. */
export const MUSHAF_BOOK_NATIVE_HATIM_INNER_SIDE_INSET = 6;
/** Quran.com хатымда жоғарғы/төменгі хром экран бұрышына жабыспасын. */
export const MUSHAF_BOOK_PAGE_EDGE_INSET = 10;

export function mushafBookContentWidth(pagerWidth: number): number {
  return Math.max(280, Math.min(pagerWidth, MUSHAF_BOOK_MAX_PAGE_WIDTH));
}

export function mushafBookNativeContentWidth(windowWidth: number): number {
  return Math.max(280, windowWidth - MUSHAF_BOOK_PHONE_SIDE_INSET * 2);
}

/** Hafs бет қорабы — 1 парақ 1 экранға contain (QCF4 / webp ортақ). */
export function computeMushafBookPageBox(
  pagerWidth: number,
  viewportHeight: number | undefined,
  paddingBottom: number,
  /** Хатым: барлық биіктік — бір бет толық көрінеді. */
  fullPage?: boolean,
  opts?: {
    /** Тар телефонда жанын қыспай, бетті төменге жайып scroll жасау. */
    allowVerticalOverflow?: boolean;
    /** Экран шетіне араб әріптері тимеуі үшін ішкі қауіпсіз орын. */
    horizontalSafeInset?: number;
    /** Quran.com хатым: бет қағазы экранның төрт бұрышына толық жайылады. */
    fillViewport?: boolean;
    /** Бос жоғары/төмен кеңістікті көбейтпей, табиғи бет биіктігін қаншаға дейін созуға болады. */
    maxVerticalStretchFactor?: number;
  }
): { pageWidth: number; pageHeight: number } {
  const safeInset = Math.max(0, opts?.horizontalSafeInset ?? 0);
  const safeAvailableWidth = Math.max(1, pagerWidth - safeInset * 2);
  const minContentWidth = fullPage && safeInset > 0 ? Math.min(280, safeAvailableWidth) : 280;
  const safePagerWidth = Math.max(minContentWidth, safeAvailableWidth);
  /**
   * Desktop web: 520px cap (тым кең жол оқылмайды).
   * fillViewport / альбом телефон: толық ен — ортада кішкентай «портрет жолақ» қалмасын.
   */
  const shortSide =
    viewportHeight != null && viewportHeight > 0
      ? Math.min(safePagerWidth, viewportHeight)
      : safePagerWidth;
  const isLandscape =
    viewportHeight != null && viewportHeight > 0 && safePagerWidth > viewportHeight;
  const landscapeAspect =
    isLandscape && viewportHeight ? safePagerWidth / viewportHeight : 0;
  /** Телефон/планшет альбом (~16:9+) толық ен; desktop кең терезе 520 cap. */
  const landscapePhoneOrTablet =
    isLandscape && (shortSide <= 720 || landscapeAspect >= 1.5);
  const useFullPagerWidth = Boolean(opts?.fillViewport) || landscapePhoneOrTablet;
  const contentWidth = Math.max(
    minContentWidth,
    useFullPagerWidth ? safePagerWidth : Math.min(safePagerWidth, MUSHAF_BOOK_MAX_PAGE_WIDTH)
  );
  const aspect = mushafPageAspectRatio();
  const widthFitHeight = contentWidth / aspect;
  const listPadTop = fullPage ? MUSHAF_BOOK_PAGE_EDGE_INSET : 10;
  const reserve = fullPage ? 0 : 4;
  const availableHeight =
    viewportHeight && viewportHeight > 0
      ? viewportHeight - paddingBottom - listPadTop - reserve
      : widthFitHeight;
  const availableWidth = contentWidth;
  if (fullPage) {
    /** Альбом / fillViewport: енді толық ұстап, биіктікті экранға толтыру (aspect қыспасын). */
    if (opts?.fillViewport || useFullPagerWidth) {
      return {
        pageWidth: availableWidth,
        pageHeight: Math.max(120, availableHeight),
      };
    }
    const heightFromWidth = availableWidth / aspect;
    if (opts?.allowVerticalOverflow) {
      const stretch = Math.max(1, opts.maxVerticalStretchFactor ?? 1.1);
      const targetHeight = Math.min(availableHeight, heightFromWidth * stretch);
      return {
        pageWidth: availableWidth,
        pageHeight: Math.max(120, targetHeight),
      };
    }
    if (heightFromWidth <= availableHeight) {
      return {
        pageWidth: availableWidth,
        pageHeight: Math.max(120, heightFromWidth),
      };
    }
    return {
      pageWidth: Math.max(200, availableHeight * aspect),
      pageHeight: Math.max(120, availableHeight),
    };
  }

  const pageHeight = Math.max(120, Math.min(widthFitHeight, availableHeight));
  const pageWidth = Math.min(contentWidth, pageHeight * aspect);
  return { pageWidth, pageHeight };
}

export type QcomHatimPageBox = {
  pageWidth: number;
  pageHeight: number;
  /** Альбом: табиғи бет биіктігі viewport-тен асса — вертикаль скролл. */
  allowVerticalScroll: boolean;
  /** Letterbox орталау (quran-ios WordFrameScale). */
  xOffset: number;
  yOffset: number;
};

/**
 * Quran.com / quran-ios хатым: портрет — бір экранға aspect-fit (contain);
 * альбом — толық ен, табиғи бет биіктігі (скролл рұқсат).
 */
export function computeQcomHatimPageBox(
  pagerWidth: number,
  viewportHeight: number | undefined,
  paddingBottom: number,
  opts?: {
    horizontalSafeInset?: number;
    chromeTopReserve?: number;
    surahFrameReserve?: number;
  }
): QcomHatimPageBox {
  const safeInset = Math.max(0, opts?.horizontalSafeInset ?? 0);
  const availableWidth = Math.max(1, pagerWidth - safeInset * 2);
  const chromeReserve = Math.max(0, (opts?.chromeTopReserve ?? 0) + (opts?.surahFrameReserve ?? 0));
  const listPadTop = MUSHAF_BOOK_PAGE_EDGE_INSET;
  const viewportHeightBudget =
    viewportHeight && viewportHeight > 0
      ? Math.max(120, viewportHeight - paddingBottom - listPadTop)
      : availableWidth / mushafPageAspectRatio();
  const contentAvailableHeight = Math.max(120, viewportHeightBudget - chromeReserve);

  const isLandscape =
    viewportHeight != null && viewportHeight > 0 && pagerWidth > viewportHeight;

  if (isLandscape) {
    const pageWidth = availableWidth;
    const pageHeight = Math.max(120, pageWidth / mushafPageAspectRatio());
    const fullAvailable = viewportHeightBudget;
    return {
      pageWidth,
      pageHeight,
      allowVerticalScroll: pageHeight > fullAvailable + 1,
      xOffset: 0,
      yOffset: 0,
    };
  }

  const frame = computeWordFrameScale(
    { width: MUSHAF_PAGE_VIEWBOX.w, height: MUSHAF_PAGE_VIEWBOX.h },
    { width: availableWidth, height: contentAvailableHeight }
  );
  const fitted = scaledImageSize(
    { width: MUSHAF_PAGE_VIEWBOX.w, height: MUSHAF_PAGE_VIEWBOX.h },
    { width: availableWidth, height: contentAvailableHeight }
  );
  return {
    pageWidth: Math.max(120, fitted.width),
    pageHeight: Math.max(120, fitted.height + chromeReserve),
    allowVerticalScroll: false,
    xOffset: frame.xOffset,
    yOffset: frame.yOffset,
  };
}
