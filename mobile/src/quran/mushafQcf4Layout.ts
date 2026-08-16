import { Platform } from "react-native";
import type { Qcf4PageJson, Qcf4Word, Qcf4WordType } from "./qcf4Types";
import { HATIM_LOCKED_MUSHAF_TEXT_SCALE, HATIM_UNIFIED_ARABIC_FONT_SIZE } from "./mushafTextScale";
import {
  TURKISH_PRINT_HATIM_GLYPH_SCALE_QCOM,
  TURKISH_PRINT_HATIM_LINE_HEIGHT_FACTOR,
  TURKISH_PRINT_HATIM_PHONE_GLYPH_MAX,
  TURKISH_PRINT_HATIM_PHONE_GLYPH_SCALE_QCOM,
  TURKISH_PRINT_HATIM_CHROME_RESERVE,
  TURKISH_PRINT_HATIM_PAGE_CHROME_H,
  TURKISH_PRINT_HATIM_PHONE_VERTICAL_SAFE,
  TURKISH_PRINT_HATIM_GLYPH_EXTRA_QCOM,
  TURKISH_PRINT_HATIM_TABLET_GLYPH_MAX,
  TURKISH_PRINT_HATIM_FONT_SIZE_OFFSET,
  TURKISH_PRINT_HATIM_MEDINA_PARITY,
} from "./quranTurkishPrintTypography";

export const QCF4_GLYPH_SCALE_QCOM = 0.78;
export const QCF4_GLYPH_EXTRA_QCOM = 1;
export const QCF4_GLYPH_LINE_HEIGHT_SCALE_QCOM = 1.48;
export const QCF4_CHROME_JUZ_RESERVE = 28;
const QCF4_NATIVE_GLYPH_VISUAL_SCALE_Y = 1.06;
const QCF4_NATIVE_LINE_INNER_PADDING = 2;

export const QCF4_RENDER_LINE_COUNT = 15;
/** Жол арасы — харакат/нүкте кесілмей, бірақ бет тығыздығы сақталады. */
export const QCF4_QCOM_LINE_GAP = 8;
export const QCF4_EXTERNAL_SURAH_FRAME_RESERVE = 56;
/** Жүз/бет қатары мен сүре рамкасы арасын сәл жақындату (QCF4 + Unicode text-hafs). */
export const QCF4_EXTERNAL_SURAH_FRAME_TOP_TIGHTEN = 6;
export const QCF4_PHONE_WEB_SAFE_INSET = 10;
export const QCF4_PHONE_NATIVE_SAFE_INSET = 14;
export const QCF4_PHONE_LINE_PADDING = 16;
/** Телефонда қысу аз — сызықтар жіңішке көрінбейді. */
export const QCF4_PHONE_LINE_SCALE_X = 0.86;
export const QCF4_PHONE_GLYPH_SCALE_QCOM = 0.78;
export const QCF4_PHONE_GLYPH_MAX_QCOM = 46;
export const QCF4_PHONE_VERTICAL_STRETCH_FACTOR = 1.44;
/** Телефонда QCF4 glyph ascender/descender line box-тан шығып, бірінші/соңғы жол кесілмесін. */
export const QCF4_PHONE_VERTICAL_SAFE_PADDING = 14;
/** Альбом: ен толық, glyph үлкенірек — портреттегі «кішкентай жолақ» қалмасын. */
export const QCF4_LANDSCAPE_PHONE_LINE_PADDING = 10;
export const QCF4_LANDSCAPE_PHONE_LINE_SCALE_X = 1;
export const QCF4_LANDSCAPE_PHONE_GLYPH_SCALE_QCOM = 0.9;
export const QCF4_LANDSCAPE_PHONE_GLYPH_MAX_QCOM = 52;
export const QCF4_LANDSCAPE_PHONE_VERTICAL_SAFE_PADDING = 4;
export const QCF4_LANDSCAPE_QCOM_LINE_GAP = 2;
export const QCF4_SPARSE_PAGE_RENDER_LINE_THRESHOLD = 10;

const HATIM_QCF4_SLOT_PADDING = Platform.OS === "web" ? 2 : 4;

/** Хатым QCF4: glyph lineHeight слоттан асырмайды — харакат кесілмеуі. */
export function hatimQcf4GlyphMetrics(
  lineSlotHeight: number,
  unifiedFontSize = HATIM_UNIFIED_ARABIC_FONT_SIZE
): { glyphSize: number; glyphLineHeight: number } {
  const safeSlot = Math.max(14, lineSlotHeight - HATIM_QCF4_SLOT_PADDING);
  const glyphSize = Math.min(
    unifiedFontSize,
    Math.max(1, Math.floor(safeSlot / 1.28))
  );
  const glyphLineHeight = Math.min(
    safeSlot,
    Math.max(glyphSize + 4, Math.ceil(glyphSize * 1.32))
  );
  return { glyphSize, glyphLineHeight };
}

export type Qcf4RenderableLine = {
  line: number;
  rawWords: Qcf4Word[];
  words: Qcf4Word[];
};

export function shouldSkipQcf4Glyph(
  type: Qcf4WordType,
  opts: {
    hideSurahHeaderGlyph: boolean;
    hideBismillahGlyph: boolean;
    omitQuarterGlyph: boolean;
  }
): boolean {
  if (opts.omitQuarterGlyph && type === "quarter") return true;
  if (type === "surah_header" && opts.hideSurahHeaderGlyph) return true;
  if (type === "bismillah" && opts.hideBismillahGlyph) return true;
  return false;
}

export function buildQcf4RenderableLines(
  qcfPage: Qcf4PageJson | null,
  opts: {
    hideSurahHeaderGlyph: boolean;
    hideBismillahGlyph: boolean;
    useExternalSurahFrame: boolean;
    externalSurahFrameLine?: number | null;
    omitQuarterGlyph: boolean;
  }
): Qcf4RenderableLine[] {
  if (!qcfPage) return [];
  const byNum = new Map(qcfPage.lines.map((line) => [line.line, line]));
  const sourceLineCount = Math.max(1, ...qcfPage.lines.map((line) => line.line));
  const lineSlots = Math.min(QCF4_RENDER_LINE_COUNT, sourceLineCount);
  const out: Qcf4RenderableLine[] = [];
  for (let i = 1; i <= lineSlots; i += 1) {
    const source = byNum.get(i);
    const rawWords = source?.words ?? [];
    const words = rawWords.filter((word) => !shouldSkipQcf4Glyph(word.type, opts));
    const isExternalHeaderLine =
      opts.useExternalSurahFrame &&
      opts.externalSurahFrameLine === (source?.line ?? i) &&
      rawWords.some((word) => word.type === "surah_header");
    const hiddenExternalHeaderLine =
      isExternalHeaderLine;
    if (hiddenExternalHeaderLine) continue;
    out.push({ line: source?.line ?? i, rawWords, words });
  }
  return out;
}

export function computeQcf4LineMetrics(args: {
  linesAreaH: number;
  renderLineCount: number;
  fitOneScreen: boolean;
  qcomPurePage: boolean;
  /** Альбом: gap кішірейтіп glyph биіктігін арттыру. */
  landscape?: boolean;
}): { lineGap: number; lineHeight: number } {
  const safeLineCount = Math.max(1, args.renderLineCount);
  const lineGap =
    args.fitOneScreen && args.qcomPurePage
      ? args.landscape
        ? QCF4_LANDSCAPE_QCOM_LINE_GAP
        : QCF4_QCOM_LINE_GAP
      : 0;
  const lineHeight = args.fitOneScreen
    ? Math.max(14, Math.floor((args.linesAreaH - lineGap * (safeLineCount - 1)) / safeLineCount))
    : args.linesAreaH / safeLineCount;
  return { lineGap, lineHeight };
}

export function qcf4MetricLineCount(renderLineCount: number): number {
  const count = Math.max(1, Math.floor(renderLineCount));
  return count < QCF4_SPARSE_PAGE_RENDER_LINE_THRESHOLD ? QCF4_RENDER_LINE_COUNT : count;
}

export function shouldRenderQcf4InlineSurahFrame(args: {
  qcomPurePage: boolean;
  useExternalSurahFrame: boolean;
  lineHasSurahHeader: boolean;
  line: number;
  externalSurahFrameLine?: number | null;
}): boolean {
  if (!args.qcomPurePage) return false;
  return !(
    args.useExternalSurahFrame &&
    args.lineHasSurahHeader &&
    args.externalSurahFrameLine === args.line
  );
}

export function qcf4EffectiveLineWidth(
  pageWidth: number,
  linePadding = QCF4_PHONE_LINE_PADDING,
  lineScaleX = QCF4_PHONE_LINE_SCALE_X
): number {
  return Math.max(0, pageWidth - linePadding * 2) * lineScaleX;
}

export function qcf4SafeGlyphSizeForLine(args: {
  rawGlyphSize: number;
  lineHeight: number;
  maxGlyphSize: number;
  lineHeightScale: number;
  visualScaleY?: number;
  lineInnerPadding?: number;
}): number {
  const visualScaleY = Math.max(1, args.visualScaleY ?? 1);
  const lineInnerPadding = Math.max(0, args.lineInnerPadding ?? 0);
  const safeLineHeight = Math.max(1, args.lineHeight - lineInnerPadding);
  const safeByLineHeight = Math.max(1, Math.floor(safeLineHeight / (args.lineHeightScale * visualScaleY)));
  return Math.max(1, Math.min(args.rawGlyphSize, args.maxGlyphSize, safeByLineHeight));
}

/** Ayah/Quran.com: QCF4 қatarы justify арқылы созылмайды. */
export function qcf4HatimLineJustifyContent(): "flex-start" {
  return "flex-start";
}

/** Хатым QCF4: бет биіктігінен араб жолы аймағы (MushafBookPageQcf4 формуласы). */
export function computeHatimQcf4LinesAreaH(args: {
  pageHeight: number;
  qcomPurePage?: boolean;
  useExternalSurahFrame?: boolean;
  isPhoneQcf4Page?: boolean;
  /** Түрік Unicode: мәтін жоғары, аз vert reserve. */
  turkishUnicodePrint?: boolean;
  /** Түрік Unicode хатым (Medina parity): тар chrome + vert safe. */
  unicodeTurkishHatim?: boolean;
}): number {
  const qcomPurePage = args.qcomPurePage ?? true;
  const turkishOverrides = args.turkishUnicodePrint === true && !TURKISH_PRINT_HATIM_MEDINA_PARITY;
  const turkishHatim = args.unicodeTurkishHatim === true || turkishOverrides;
  const chromeReserve = qcomPurePage
    ? turkishHatim
      ? TURKISH_PRINT_HATIM_PAGE_CHROME_H
      : QCF4_CHROME_JUZ_RESERVE
    : 0;
  const surahFrameReserve = args.useExternalSurahFrame ? QCF4_EXTERNAL_SURAH_FRAME_RESERVE : 0;
  const linesAreaH = Math.max(80, args.pageHeight - chromeReserve - surahFrameReserve);
  const phoneVerticalSafePadding =
    qcomPurePage && args.isPhoneQcf4Page
      ? turkishHatim
        ? TURKISH_PRINT_HATIM_PHONE_VERTICAL_SAFE
        : QCF4_PHONE_VERTICAL_SAFE_PADDING
      : 0;
  return Math.max(80, linesAreaH - phoneVerticalSafePadding * 2);
}

/** Unicode text-hafs: Medina QCF4 glyphSize/lineHeight-пен бірдей визуалдық өлшем. */
export function computeHatimQcf4EquivalentTextMetrics(args: {
  linesAreaH: number;
  mushafTextScale?: number;
  isPhoneQcf4Page?: boolean;
  qcomPurePage?: boolean;
  /** Түрік Unicode: ірі glyph + тар қatar арасы. */
  turkishUnicodePrint?: boolean;
  /** Түрік Unicode + Medina parity: fontSize Medina, line-height тарірек. */
  unicodeTurkishPrint?: boolean;
}): { fontSize: number; lineHeight: number } {
  const mushafTextScale = args.mushafTextScale ?? HATIM_LOCKED_MUSHAF_TEXT_SCALE;
  const qcomPurePage = args.qcomPurePage ?? true;
  const isPhoneQcf4Page = args.isPhoneQcf4Page ?? false;
  const turkishOverrides = args.turkishUnicodePrint === true && !TURKISH_PRINT_HATIM_MEDINA_PARITY;
  const unicodeTurkish = args.unicodeTurkishPrint === true;
  const { lineHeight } = computeQcf4LineMetrics({
    linesAreaH: args.linesAreaH,
    renderLineCount: QCF4_RENDER_LINE_COUNT,
    fitOneScreen: true,
    qcomPurePage,
  });
  const qcomGlyphScale = turkishOverrides
    ? qcomPurePage && isPhoneQcf4Page
      ? TURKISH_PRINT_HATIM_PHONE_GLYPH_SCALE_QCOM
      : TURKISH_PRINT_HATIM_GLYPH_SCALE_QCOM
    : qcomPurePage && isPhoneQcf4Page
      ? QCF4_PHONE_GLYPH_SCALE_QCOM
      : QCF4_GLYPH_SCALE_QCOM;
  const displayLineHeightScale =
    turkishOverrides || unicodeTurkish
      ? TURKISH_PRINT_HATIM_LINE_HEIGHT_FACTOR
      : QCF4_GLYPH_LINE_HEIGHT_SCALE_QCOM;
  const safeCapLineHeightScale = turkishOverrides
    ? TURKISH_PRINT_HATIM_LINE_HEIGHT_FACTOR
    : QCF4_GLYPH_LINE_HEIGHT_SCALE_QCOM;
  const rawGlyphSize = Math.max(
    1,
    Math.round(
      lineHeight * (qcomPurePage ? qcomGlyphScale : 0.82) * mushafTextScale
    ) +
      (qcomPurePage
        ? turkishOverrides
          ? TURKISH_PRINT_HATIM_GLYPH_EXTRA_QCOM
          : QCF4_GLYPH_EXTRA_QCOM
        : 0) -
      1
  );
  const turkishGlyphCap = isPhoneQcf4Page
    ? TURKISH_PRINT_HATIM_PHONE_GLYPH_MAX
    : TURKISH_PRINT_HATIM_TABLET_GLYPH_MAX;
  const glyphSize = turkishOverrides
    ? Math.max(1, Math.min(rawGlyphSize, turkishGlyphCap))
    : qcomPurePage && (isPhoneQcf4Page || Platform.OS !== "web")
      ? qcf4SafeGlyphSizeForLine({
          rawGlyphSize,
          lineHeight,
          maxGlyphSize: isPhoneQcf4Page ? QCF4_PHONE_GLYPH_MAX_QCOM : rawGlyphSize,
          lineHeightScale: safeCapLineHeightScale,
          visualScaleY: Platform.OS === "web" ? 1 : QCF4_NATIVE_GLYPH_VISUAL_SCALE_Y,
          lineInnerPadding: Platform.OS === "web" ? 0 : QCF4_NATIVE_LINE_INNER_PADDING,
        })
      : rawGlyphSize;
  const glyphLineHeight = qcomPurePage
    ? turkishOverrides || isPhoneQcf4Page
      ? Math.ceil(glyphSize * displayLineHeightScale)
      : Math.max(lineHeight, Math.ceil(glyphSize * displayLineHeightScale))
    : lineHeight;
  const fontSize =
    unicodeTurkish && TURKISH_PRINT_HATIM_FONT_SIZE_OFFSET !== 0
      ? Math.max(1, glyphSize + TURKISH_PRINT_HATIM_FONT_SIZE_OFFSET)
      : glyphSize;
  const resolvedLineHeight =
    unicodeTurkish && TURKISH_PRINT_HATIM_FONT_SIZE_OFFSET !== 0
      ? Math.ceil(fontSize * TURKISH_PRINT_HATIM_LINE_HEIGHT_FACTOR)
      : glyphLineHeight;
  return { fontSize, lineHeight: resolvedLineHeight };
}
