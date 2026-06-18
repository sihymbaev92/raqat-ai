import type { Qcf4PageJson, Qcf4Word, Qcf4WordType } from "./qcf4Types";

export const QCF4_RENDER_LINE_COUNT = 15;
export const QCF4_QCOM_LINE_GAP = 5;
export const QCF4_EXTERNAL_SURAH_FRAME_RESERVE = 56;
export const QCF4_PHONE_WEB_SAFE_INSET = 10;
export const QCF4_PHONE_NATIVE_SAFE_INSET = 14;
export const QCF4_PHONE_LINE_PADDING = 18;
export const QCF4_PHONE_LINE_SCALE_X = 0.78;
export const QCF4_PHONE_GLYPH_SCALE_QCOM = 0.6;
export const QCF4_PHONE_GLYPH_MAX_QCOM = 30;
export const QCF4_PHONE_VERTICAL_STRETCH_FACTOR = 1.44;
/** Телефонда QCF4 glyph ascender/descender line box-тан шығып, бірінші/соңғы жол кесілмесін. */
export const QCF4_PHONE_VERTICAL_SAFE_PADDING = 14;
export const QCF4_SPARSE_PAGE_RENDER_LINE_THRESHOLD = 10;

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
}): { lineGap: number; lineHeight: number } {
  const safeLineCount = Math.max(1, args.renderLineCount);
  const lineGap = args.fitOneScreen && args.qcomPurePage ? QCF4_QCOM_LINE_GAP : 0;
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
