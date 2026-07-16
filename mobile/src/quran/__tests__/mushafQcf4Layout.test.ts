import type { Qcf4PageJson, Qcf4Word, Qcf4WordType } from "../qcf4Types";
import {
  QCF4_EXTERNAL_SURAH_FRAME_RESERVE,
  QCF4_LANDSCAPE_PHONE_LINE_PADDING,
  QCF4_LANDSCAPE_PHONE_LINE_SCALE_X,
  QCF4_PHONE_GLYPH_MAX_QCOM,
  QCF4_PHONE_GLYPH_SCALE_QCOM,
  QCF4_PHONE_NATIVE_SAFE_INSET,
  QCF4_PHONE_VERTICAL_SAFE_PADDING,
  QCF4_PHONE_VERTICAL_STRETCH_FACTOR,
  QCF4_PHONE_WEB_SAFE_INSET,
  QCF4_RENDER_LINE_COUNT,
  buildQcf4RenderableLines,
  computeQcf4LineMetrics,
  hatimQcf4GlyphMetrics,
  qcf4EffectiveLineWidth,
  qcf4MetricLineCount,
  qcf4SafeGlyphSizeForLine,
  shouldRenderQcf4InlineSurahFrame,
} from "../mushafQcf4Layout";
import {
  computeMushafBookPageBox,
  mushafBookNativeContentWidth,
} from "../mushafBookPageLayout";
import { resolveHatimMushafLayout } from "../hatimMushafLayoutPolicy";
import { HATIM_UNIFIED_ARABIC_FONT_SIZE } from "../mushafTextScale";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const qcf4Page1 = require("../../../assets/quran/qcf4/pages/001.json") as Qcf4PageJson;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qcf4Page2 = require("../../../assets/quran/qcf4/pages/002.json") as Qcf4PageJson;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qcf4Page50 = require("../../../assets/quran/qcf4/pages/050.json") as Qcf4PageJson;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qcf4Page604 = require("../../../assets/quran/qcf4/pages/604.json") as Qcf4PageJson;

function qcf4Word(type: Qcf4WordType, overrides: Partial<Qcf4Word> = {}): Qcf4Word {
  return {
    code: 1,
    char: type === "surah_header" ? "header" : "word",
    font: "QCF_P001",
    text: type,
    type,
    ...overrides,
  };
}

function qcf4Page(lines: Qcf4PageJson["lines"]): Qcf4PageJson {
  return {
    page: 1,
    font: "QCF_P001",
    surahs: [],
    lines,
  };
}

describe("mushafQcf4Layout", () => {
  it("drops the hidden external surah frame line from the rendered 15-line grid", () => {
    const page = qcf4Page([
      { line: 1, words: [qcf4Word("surah_header", { sura: 2 })] },
      ...Array.from({ length: QCF4_RENDER_LINE_COUNT - 1 }, (_, idx) => ({
        line: idx + 2,
        words: [qcf4Word("word", { verse_key: `2:${idx + 1}` })],
      })),
    ]);

    const renderLines = buildQcf4RenderableLines(page, {
      hideSurahHeaderGlyph: true,
      hideBismillahGlyph: false,
      useExternalSurahFrame: true,
      externalSurahFrameLine: 1,
      omitQuarterGlyph: false,
    });

    expect(renderLines).toHaveLength(QCF4_RENDER_LINE_COUNT - 1);
    expect(renderLines.some((line) => line.line === 1)).toBe(false);

    const baseline = computeQcf4LineMetrics({
      linesAreaH: 420,
      renderLineCount: QCF4_RENDER_LINE_COUNT,
      fitOneScreen: true,
      qcomPurePage: true,
    });
    const adjusted = computeQcf4LineMetrics({
      linesAreaH: 420,
      renderLineCount: renderLines.length,
      fitOneScreen: true,
      qcomPurePage: true,
    });
    expect(adjusted.lineHeight).toBeGreaterThan(baseline.lineHeight);
  });

  it("keeps inline surah frames in the render line when no external frame is used", () => {
    const page = qcf4Page([
      { line: 7, words: [qcf4Word("surah_header", { sura: 114 })] },
      { line: QCF4_RENDER_LINE_COUNT, words: [qcf4Word("word", { verse_key: "114:6" })] },
    ]);

    const renderLines = buildQcf4RenderableLines(page, {
      hideSurahHeaderGlyph: false,
      hideBismillahGlyph: false,
      useExternalSurahFrame: false,
      omitQuarterGlyph: false,
    });

    const inlineHeaderLine = renderLines.find((line) => line.line === 7);
    expect(renderLines).toHaveLength(QCF4_RENDER_LINE_COUNT);
    expect(inlineHeaderLine?.rawWords[0]?.type).toBe("surah_header");
    expect(inlineHeaderLine?.words[0]?.type).toBe("surah_header");
  });

  it("drops only the external title line while preserving the real bismillah glyph line", () => {
    const page = qcf4Page([
      {
        line: 1,
        words: [qcf4Word("surah_header", { sura: 2 })],
      },
      { line: 2, words: [qcf4Word("bismillah", { sura: 2 })] },
    ]);

    const renderLines = buildQcf4RenderableLines(page, {
      hideSurahHeaderGlyph: true,
      hideBismillahGlyph: false,
      useExternalSurahFrame: true,
      externalSurahFrameLine: 1,
      omitQuarterGlyph: false,
    });

    expect(renderLines.some((line) => line.line === 1)).toBe(false);
    expect(renderLines).toHaveLength(1);
    expect(renderLines[0]?.words[0]?.type).toBe("bismillah");
    expect(
      shouldRenderQcf4InlineSurahFrame({
        qcomPurePage: true,
        useExternalSurahFrame: true,
        lineHasSurahHeader: true,
        line: 1,
        externalSurahFrameLine: 1,
      })
    ).toBe(false);
  });

  it("keeps mid-page surah frames on page 604 while only the top frame is external", () => {
    const page604 = qcf4Page([
      { line: 1, words: [qcf4Word("surah_header", { sura: 112 })] },
      { line: 2, words: [qcf4Word("bismillah", { sura: 112 })] },
      { line: 5, words: [qcf4Word("surah_header", { sura: 113 })] },
      { line: 6, words: [qcf4Word("bismillah", { sura: 113 })] },
      { line: 10, words: [qcf4Word("surah_header", { sura: 114 })] },
      { line: 11, words: [qcf4Word("bismillah", { sura: 114 })] },
    ]);

    const renderLines = buildQcf4RenderableLines(page604, {
      hideSurahHeaderGlyph: true,
      hideBismillahGlyph: false,
      useExternalSurahFrame: true,
      externalSurahFrameLine: 1,
      omitQuarterGlyph: false,
    });

    expect(renderLines.some((line) => line.line === 1)).toBe(false);
    expect(renderLines.find((line) => line.line === 5)?.rawWords[0]?.sura).toBe(113);
    expect(renderLines.find((line) => line.line === 10)?.rawWords[0]?.sura).toBe(114);
    expect(
      shouldRenderQcf4InlineSurahFrame({
        qcomPurePage: true,
        useExternalSurahFrame: true,
        lineHasSurahHeader: true,
        line: 5,
        externalSurahFrameLine: 1,
      })
    ).toBe(true);
    expect(
      shouldRenderQcf4InlineSurahFrame({
        qcomPurePage: true,
        useExternalSurahFrame: true,
        lineHasSurahHeader: true,
        line: 10,
        externalSurahFrameLine: 1,
      })
    ).toBe(true);
  });

  it("keeps surah-start page line metrics close to normal pages", () => {
    const normal = computeQcf4LineMetrics({
      linesAreaH: 430,
      renderLineCount: QCF4_RENDER_LINE_COUNT,
      fitOneScreen: true,
      qcomPurePage: true,
    });
    const surahStart = computeQcf4LineMetrics({
      linesAreaH: 430 - QCF4_EXTERNAL_SURAH_FRAME_RESERVE,
      renderLineCount: QCF4_RENDER_LINE_COUNT - 1,
      fitOneScreen: true,
      qcomPurePage: true,
    });

    expect(Math.abs(surahStart.lineHeight - normal.lineHeight)).toBeLessThanOrEqual(2);
  });

  it("keeps phone effective QCF4 line width readable after ayah edge inset only", () => {
    const layout = resolveHatimMushafLayout(390, "android");
    const effective = qcf4EffectiveLineWidth(layout.bookPageWidth, layout.linePadding, layout.lineScaleX);
    expect(effective).toBeGreaterThanOrEqual(300);
    expect(effective).toBeLessThanOrEqual(390);
  });

  it("landscape phone fillViewport uses full pager width", () => {
    const { pageWidth, pageHeight } = computeMushafBookPageBox(800, 360, 0, true, {
      horizontalSafeInset: 0,
      fillViewport: true,
    });
    expect(pageWidth).toBe(800);
    expect(pageHeight).toBeGreaterThanOrEqual(300);
    const landscapeLine = qcf4EffectiveLineWidth(
      pageWidth,
      QCF4_LANDSCAPE_PHONE_LINE_PADDING,
      QCF4_LANDSCAPE_PHONE_LINE_SCALE_X
    );
    expect(landscapeLine).toBeGreaterThanOrEqual(760);
  });

  it("clamps phone glyph size so text line height never exceeds its row", () => {
    const lineHeight = 36;
    const glyphSize = qcf4SafeGlyphSizeForLine({
      rawGlyphSize: 32,
      lineHeight,
      maxGlyphSize: 30,
      lineHeightScale: 1.46,
      visualScaleY: 1.04,
      lineInnerPadding: 2,
    });

    expect(Math.ceil(glyphSize * 1.46 * 1.04)).toBeLessThanOrEqual(lineHeight - 2);
  });

  it("keeps special QCF4 pages 1 and 2 visually compact without empty line nodes", () => {
    for (const page of [qcf4Page1, qcf4Page2]) {
      const renderLines = buildQcf4RenderableLines(page, {
        hideSurahHeaderGlyph: true,
        hideBismillahGlyph: false,
        useExternalSurahFrame: true,
        externalSurahFrameLine: 1,
        omitQuarterGlyph: false,
      });

      expect(page.lines).toHaveLength(8);
      expect(renderLines).toHaveLength(7);
      expect(renderLines.at(-1)?.line).toBe(8);
      expect(renderLines.some((line) => line.words.length === 0)).toBe(false);
      expect(qcf4MetricLineCount(renderLines.length)).toBe(QCF4_RENDER_LINE_COUNT);
    }
  });

  it("keeps real QCF4 bismillah glyphs when the top surah title is external", () => {
    const cases = [
      { page: qcf4Page2, topSura: 2, bismillahCount: 1 },
      { page: qcf4Page604, topSura: 112, bismillahCount: 3 },
    ];

    for (const { page, topSura, bismillahCount } of cases) {
      const renderLines = buildQcf4RenderableLines(page, {
        hideSurahHeaderGlyph: true,
        hideBismillahGlyph: false,
        useExternalSurahFrame: true,
        externalSurahFrameLine: 1,
        omitQuarterGlyph: false,
      });

      expect(renderLines.some((line) => line.line === 1)).toBe(false);
      const bismillahLines = renderLines.filter((line) =>
        line.words.some((word) => word.type === "bismillah")
      );
      expect(bismillahLines).toHaveLength(bismillahCount);
      expect(bismillahLines.some((line) => line.words.some((word) => word.sura === topSura))).toBe(
        true
      );
    }
  });

  it("release-gates critical phone pages against vertical glyph clipping", () => {
    const pagerWidth = mushafBookNativeContentWidth(360);
    const { pageHeight } = computeMushafBookPageBox(pagerWidth, 740, 0, true, {
      allowVerticalOverflow: true,
      horizontalSafeInset: QCF4_PHONE_NATIVE_SAFE_INSET,
      maxVerticalStretchFactor: QCF4_PHONE_VERTICAL_STRETCH_FACTOR,
    });

    for (const page of [qcf4Page1, qcf4Page2, qcf4Page50, qcf4Page604]) {
      const externalSurahFrameLine =
        page.lines[0]?.words.some((word) => word.type === "surah_header") ? 1 : null;
      const renderLines = buildQcf4RenderableLines(page, {
        hideSurahHeaderGlyph: externalSurahFrameLine != null,
        hideBismillahGlyph: false,
        useExternalSurahFrame: externalSurahFrameLine != null,
        externalSurahFrameLine,
        omitQuarterGlyph: false,
      });
      const lineMetricsAreaH = Math.max(
        80,
        pageHeight -
          28 -
          (externalSurahFrameLine != null ? QCF4_EXTERNAL_SURAH_FRAME_RESERVE : 0) -
          QCF4_PHONE_VERTICAL_SAFE_PADDING * 2
      );
      const { lineHeight } = computeQcf4LineMetrics({
        linesAreaH: lineMetricsAreaH,
        renderLineCount: qcf4MetricLineCount(renderLines.length),
        fitOneScreen: true,
        qcomPurePage: true,
      });
      const rawGlyphSize = Math.max(1, Math.round(lineHeight * QCF4_PHONE_GLYPH_SCALE_QCOM) - 1);
      const glyphSize = qcf4SafeGlyphSizeForLine({
        rawGlyphSize,
        lineHeight,
        maxGlyphSize: QCF4_PHONE_GLYPH_MAX_QCOM,
        lineHeightScale: 1.46,
        visualScaleY: 1.04,
        lineInnerPadding: 2,
      });

      expect(renderLines.length).toBeGreaterThan(0);
      expect(Math.ceil(glyphSize * 1.46 * 1.04)).toBeLessThanOrEqual(lineHeight - 2);
    }
  });

  it("hatimQcf4GlyphMetrics keeps glyph line height inside the line slot", () => {
    for (const slot of [32, 35, 40, 44]) {
      const { glyphSize, glyphLineHeight } = hatimQcf4GlyphMetrics(slot);
      expect(glyphLineHeight).toBeLessThanOrEqual(slot);
      expect(glyphSize).toBeLessThanOrEqual(HATIM_UNIFIED_ARABIC_FONT_SIZE);
      expect(glyphSize).toBeGreaterThanOrEqual(1);
    }
    const wide = hatimQcf4GlyphMetrics(44);
    expect(wide.glyphSize).toBe(HATIM_UNIFIED_ARABIC_FONT_SIZE);
  });
});
