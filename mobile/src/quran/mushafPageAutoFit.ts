import { useCallback, useEffect, useRef, useState } from "react";
import { QURAN_HATIM_COMPACT_MIN_FONT } from "./quranResponsiveLayout";

export const MUSHAF_PAGE_AUTO_FIT_MAX_ITERATIONS = 14;

/** Хатым: минималды оқуға болатын fitScale (18px floor). */
export function mushafPageMinFitScale(baseFontSize: number): number {
  return Math.max(0.62, QURAN_HATIM_COMPACT_MIN_FONT / Math.max(14, baseFontSize));
}

/** Келесі fitScale — мазмұн биіктігі maxHeight-тен асса. */
export function computeMushafPageAutoFitScale(
  contentHeight: number,
  maxHeight: number,
  currentScale: number,
  minScale: number
): number | null {
  if (maxHeight <= 0 || contentHeight <= maxHeight + 1) return null;
  const next = Math.max(minScale, currentScale * (maxHeight / contentHeight) * 0.985);
  if (next >= currentScale - 0.002) return null;
  return next;
}

export function useMushafPageAutoFitScale(
  pageKey: string,
  initialScale: number,
  maxHeight: number,
  baseFontSize: number
) {
  const minScale = mushafPageMinFitScale(baseFontSize);
  const cappedInitial = Math.min(1, Math.max(minScale, initialScale));
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
        const next = computeMushafPageAutoFitScale(contentHeight, maxHeight, current, minScale);
        if (next == null) return current;
        if (iterationsRef.current >= MUSHAF_PAGE_AUTO_FIT_MAX_ITERATIONS) return current;
        iterationsRef.current += 1;
        return next;
      });
    },
    [maxHeight, minScale]
  );

  const atMinScale = scale <= minScale + 0.004;

  return {
    scale: Math.min(cappedInitial, scale),
    minScale,
    atMinScale,
    onContentLayout,
  };
}
