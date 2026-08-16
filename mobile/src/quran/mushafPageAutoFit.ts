import { useCallback, useEffect, useRef, useState } from "react";
import { HATIM_AYAH_AUTO_FIT_MIN_FONT_SCALE, QURAN_HATIM_COMPACT_MIN_FONT } from "./quranResponsiveLayout";
import { TURKISH_PRINT_HATIM_AUTO_FIT_MAX_SCALE } from "./quranTurkishPrintTypography";

export const MUSHAF_PAGE_AUTO_FIT_MAX_ITERATIONS = 14;

const UNICODE_TEXT_HAFS_MIN_FONT = 14;
const UNICODE_TEXT_HAFS_MIN_SCALE = 0.45;

/** Хатым: минималды оқуға болатын fitScale (18px floor). */
export function mushafPageMinFitScale(
  baseFontSize: number,
  opts?: { unicodeTextHafs?: boolean }
): number {
  const minFont = opts?.unicodeTextHafs ? UNICODE_TEXT_HAFS_MIN_FONT : QURAN_HATIM_COMPACT_MIN_FONT;
  const scaleFloor = opts?.unicodeTextHafs ? UNICODE_TEXT_HAFS_MIN_SCALE : HATIM_AYAH_AUTO_FIT_MIN_FONT_SCALE;
  return Math.max(scaleFloor, minFont / Math.max(14, baseFontSize));
}

/** Unicode text-hafs: QCF4 өлшемінен бастап, wrap-келемаса алдын ала scale-down/up. */
export function estimateUnicodeMushafFitScale(args: {
  glyphCount: number;
  contentWidth: number;
  fontSize: number;
  lineHeight: number;
  maxHeight: number;
  maxScale?: number;
}): number {
  if (args.maxHeight <= 0 || args.glyphCount <= 0 || args.fontSize <= 0 || args.lineHeight <= 0) {
    return 1;
  }
  const maxScale = args.maxScale ?? 1;
  const charWidth = args.fontSize * 0.52;
  const charsPerLine = Math.max(16, Math.floor(args.contentWidth / charWidth));
  const estimatedLines = Math.ceil(args.glyphCount / charsPerLine);
  const estimatedHeight = estimatedLines * args.lineHeight;
  const minScale = mushafPageMinFitScale(args.fontSize, { unicodeTextHafs: true });
  if (estimatedHeight <= args.maxHeight + 2) {
    if (estimatedHeight <= 0) return 1;
    const fillScale = (args.maxHeight / estimatedHeight) * 0.95;
    if (fillScale > 1.004) {
      return Math.max(minScale, Math.min(maxScale, fillScale));
    }
    return 1;
  }
  return Math.max(minScale, Math.min(maxScale, (args.maxHeight / estimatedHeight) * 0.93));
}

/**
 * Viewport fit: мазмұн биіктігін maxHeight-ке сыйыру (scale-down) немесе
 * сиrek беттерде экранды толтыру (scale-up).
 */
export function computeMushafPageViewportFitScale(
  contentHeight: number,
  maxHeight: number,
  currentScale: number,
  minScale: number,
  maxScale = 1
): number | null {
  if (maxHeight <= 0 || contentHeight <= 0) return null;
  if (contentHeight <= maxHeight + 1 && maxScale <= 1) return null;
  const target = (maxHeight / contentHeight) * 0.985;
  const next = Math.max(minScale, Math.min(maxScale, currentScale * target));
  if (Math.abs(next - currentScale) < 0.003) return null;
  return next;
}

/** @deprecated use computeMushafPageViewportFitScale (maxScale=1). */
export function computeMushafPageAutoFitScale(
  contentHeight: number,
  maxHeight: number,
  currentScale: number,
  minScale: number
): number | null {
  return computeMushafPageViewportFitScale(contentHeight, maxHeight, currentScale, minScale, 1);
}

export function useMushafPageAutoFitScale(
  pageKey: string,
  initialScale: number,
  maxHeight: number,
  baseFontSize: number,
  opts?: { unicodeTextHafs?: boolean; maxScale?: number }
) {
  const minScale = mushafPageMinFitScale(baseFontSize, opts);
  const maxScale =
    opts?.maxScale ??
    (opts?.unicodeTextHafs ? TURKISH_PRINT_HATIM_AUTO_FIT_MAX_SCALE : 1);
  const cappedInitial = Math.min(maxScale, Math.max(minScale, initialScale));
  const [scale, setScale] = useState(cappedInitial);
  const iterationsRef = useRef(0);

  useEffect(() => {
    setScale(cappedInitial);
    iterationsRef.current = 0;
  }, [pageKey, cappedInitial]);

  const onContentLayout = useCallback(
    (contentHeight: number) => {
      if (maxHeight <= 0 || contentHeight <= 0) return;
      setScale((current) => {
        const next = computeMushafPageViewportFitScale(
          contentHeight,
          maxHeight,
          current,
          minScale,
          maxScale
        );
        if (next == null) return current;
        if (iterationsRef.current >= MUSHAF_PAGE_AUTO_FIT_MAX_ITERATIONS) return current;
        iterationsRef.current += 1;
        return next;
      });
    },
    [maxHeight, minScale, maxScale]
  );

  const atMinScale = scale <= minScale + 0.004;

  return {
    scale: Math.min(maxScale, Math.max(minScale, scale)),
    minScale,
    maxScale,
    atMinScale,
    onContentLayout,
  };
}
