import { Platform, type TextStyle } from "react-native";
import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";

/** Түрік Unicode: Medina QCF4 viewport slot формуласы (15 жол, 0.78×, 1.48 lh). */
export const TURKISH_PRINT_HATIM_MEDINA_PARITY = true;

/**
 * Quran Foundation baseline — тек MEDINA_PARITY=false болғанда.
 * @see https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/
 */
export const TURKISH_PRINT_QF_BASE_FONT_SIZE = 28;
export const TURKISH_PRINT_QF_LINE_HEIGHT_FACTOR = 2.0;
export const TURKISH_PRINT_QF_REFERENCE_WIDTH = 390;

/** @deprecated MEDINA_PARITY=true — Medina QCF4 glyph scale */
export const TURKISH_PRINT_HATIM_GLYPH_SCALE_QCOM = 0.72;
export const TURKISH_PRINT_HATIM_PHONE_GLYPH_SCALE_QCOM = 0.68;
export const TURKISH_PRINT_HATIM_PHONE_GLYPH_MAX = 28;
export const TURKISH_PRINT_HATIM_TABLET_GLYPH_MAX = 34;
export const TURKISH_PRINT_HATIM_GLYPH_EXTRA_QCOM = 0;
/** Түрік Unicode: Scheherazade Regular — descender/harakat кесілмеуі (1.28 → Regular-ға кеңірек). */
export const TURKISH_PRINT_HATIM_LINE_HEIGHT_FACTOR = 1.42;

/** QF baseline — тек MEDINA_PARITY=false. */
export function computeTurkishPrintQfBaselineTextMetrics(args: {
  contentWidth: number;
  mushafTextScale?: number;
}): { fontSize: number; lineHeight: number } {
  const w = Math.max(1, args.contentWidth);
  const mushafScale = args.mushafTextScale ?? 1;
  const fontSize = Math.round(
    TURKISH_PRINT_QF_BASE_FONT_SIZE * (w / TURKISH_PRINT_QF_REFERENCE_WIDTH) * mushafScale
  );
  const lineHeight = Math.round(fontSize * TURKISH_PRINT_QF_LINE_HEIGHT_FACTOR);
  return { fontSize, lineHeight };
}

/** Түрік Unicode хатым: MushafBookPageChrome нақты биіктігі (padding+мәтін+margin). */
export const TURKISH_PRINT_HATIM_PAGE_CHROME_H = 30;
/** @deprecated — TURKISH_PRINT_HATIM_PAGE_CHROME_H қолданылады */
export const TURKISH_PRINT_HATIM_CHROME_RESERVE = TURKISH_PRINT_HATIM_PAGE_CHROME_H;
export const TURKISH_PRINT_HATIM_PHONE_VERTICAL_SAFE = 2;
export const TURKISH_PRINT_HATIM_PAGE_TOP_INSET = 0;
/** @deprecated MEDINA_PARITY=true — Medina QCF4 line padding */
export const TURKISH_PRINT_HATIM_PHONE_LINE_PADDING = 2;
export const TURKISH_PRINT_HATIM_PHONE_HORIZONTAL_SAFE = 0;
export const TURKISH_PRINT_HATIM_COMPACT_PADDING_H = 2;
export const TURKISH_PRINT_HATIM_MIN_HORIZONTAL_PADDING = 2;

/** Түрік Unicode хатым: Medina parity fontSize-тен түзету (px). */
export const TURKISH_PRINT_HATIM_FONT_SIZE_OFFSET = -1;

/** Medina parity: viewport slot формуласы + auto-fit. */
export const TURKISH_PRINT_QF_FIXED_SIZE = false;

export const TURKISH_PRINT_HATIM_UNIFORM_GLYPH_SIZE = false;
/** Uniform fit: типтік тығыз бет (~Әл-Бақара orta) — бір рет estimate, барлық бет сол scale. */
export const TURKISH_PRINT_HATIM_CALIBRATION_GLYPH_COUNT = 1400;
/** Соңғы жол harakat/descender кесілмеуі — slot/formula reserve. */
export const TURKISH_PRINT_HATIM_BOTTOM_CLIP_SAFE = 18;
/** Viewport slot өлшемі — layout measure арқылы scale жоқ (дірілдеу болмайды). */
export const TURKISH_PRINT_HATIM_AUTO_VIEWPORT_FIT = false;
export const TURKISH_PRINT_HATIM_AUTO_FIT_MAX_SCALE = 1;
/** @deprecated AUTO_VIEWPORT_FIT=false — қолданылмайды */
export const TURKISH_PRINT_HATIM_SPARSE_FILL_MAX_SCALE = 1;

/** Түрік Unicode: Scheherazade Regular (Bold емес). */
export function turkishPrintArabicAyahTextStyle(
  base: TextStyle,
  opts?: { fontsReady?: boolean }
): TextStyle {
  const fixedScale = {
    allowFontScaling: false as const,
    maxFontSizeMultiplier: 1 as const,
  };
  if (Platform.OS === "web") {
    return {
      ...base,
      ...fixedScale,
      fontWeight: "400",
      fontFamily: `"Scheherazade New", "Amiri", "Lateef", serif`,
    };
  }
  if (opts?.fontsReady === false) {
    return {
      ...base,
      ...fixedScale,
      fontFamily: QURAN_BOOK_FONT_FACE.lateef,
      fontWeight: "400",
    };
  }
  return {
    ...base,
    ...fixedScale,
    fontFamily: QURAN_BOOK_FONT_FACE.scheherazade,
    fontWeight: "400",
  };
}

export function quranArabicAyahStyleForEdition(
  base: TextStyle,
  edition: QuranArabicScriptEditionId,
  opts?: { fontsReady?: boolean }
): TextStyle {
  return edition === "turkish" ? turkishPrintArabicAyahTextStyle(base, opts) : base;
}

/** Reader engine: Lateef/mushaf fontSize қабаттаспау — edition стилі ғана fontFamily/fontWeight береді. */
export function resolveEditionArabicTextStyle(
  base: TextStyle,
  edition: QuranArabicScriptEditionId,
  opts?: { fontsReady?: boolean }
): TextStyle {
  const { fontFamily: _ff, fontWeight: _fw, fontSize: _fs, lineHeight: _lh, ...neutral } = base;
  return quranArabicAyahStyleForEdition(neutral, edition, opts);
}
