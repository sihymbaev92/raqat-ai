import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  computeQuranReaderViewportMetrics,
  mushafTextScaleToReaderFontMode,
  QURAN_READER_FONT_CONFIG,
  toArabicNumerals,
  type QuranReaderFontSizeMode,
  type QuranReaderViewportMetrics,
} from "../../quran/quranReaderViewportMetrics";

export {
  QURAN_READER_FONT_CONFIG,
  toArabicNumerals,
  computeQuranReaderViewportMetrics,
  mushafTextScaleToReaderFontMode,
};
export type { QuranReaderFontSizeMode, QuranReaderViewportMetrics };

/**
 * Quran scroll reader typography hook — RAQAT `QuranSurahScreen` + `QuranReaderAyahArabic`.
 * Medina QCF4 хатым бөлек; мұнда тек Unicode scroll reader viewport engine.
 */
export function useQuranReaderTypography(opts?: {
  fontSizeMode?: QuranReaderFontSizeMode;
  /** Баптаулардағы mushafTextScale (0.88–1.15). */
  mushafTextScale?: number;
  turkishPrint?: boolean;
}): QuranReaderViewportMetrics {
  const { width, height } = useWindowDimensions();
  const fontSizeMode =
    opts?.fontSizeMode ??
    mushafTextScaleToReaderFontMode(opts?.mushafTextScale ?? 1);
  const extraScale = opts?.mushafTextScale ?? 1;

  return useMemo(
    () =>
      computeQuranReaderViewportMetrics(width, fontSizeMode, extraScale, {
        turkishPrint: opts?.turkishPrint,
        screenHeight: height,
      }),
    [width, height, fontSizeMode, extraScale, opts?.turkishPrint]
  );
}
