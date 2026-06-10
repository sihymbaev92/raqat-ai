import { mushafPageAspectRatio } from "../config/mushafPagesBase";

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
  const contentWidth = Math.max(
    minContentWidth,
    Math.min(safePagerWidth, MUSHAF_BOOK_MAX_PAGE_WIDTH)
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
    if (opts?.fillViewport) {
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
