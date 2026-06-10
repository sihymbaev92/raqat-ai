import type { Qcf4PageJson, Qcf4Word, Qcf4WordType } from "../qcf4Types";
import {
  QCF4_EXTERNAL_SURAH_FRAME_RESERVE,
  QCF4_PHONE_NATIVE_SAFE_INSET,
  QCF4_PHONE_WEB_SAFE_INSET,
  QCF4_RENDER_LINE_COUNT,
  buildQcf4RenderableLines,
  computeQcf4LineMetrics,
  qcf4EffectiveLineWidth,
  qcf4MetricLineCount,
  qcf4SafeGlyphSizeForLine,
  shouldRenderQcf4InlineSurahFrame,
} from "../mushafQcf4Layout";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const qcf4Page1 = require("../../../assets/quran/qcf4/pages/001.json") as Qcf4PageJson;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const qcf4Page2 = require("../../../assets/quran/qcf4/pages/002.json") as Qcf4PageJson;
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

  it("keeps phone effective QCF4 line width readable after page safe insets", () => {
    expect(QCF4_PHONE_NATIVE_SAFE_INSET).toBe(0);
    expect(qcf4EffectiveLineWidth(354 - QCF4_PHONE_NATIVE_SAFE_INSET * 2)).toBeGreaterThanOrEqual(
      240
    );
    expect(qcf4EffectiveLineWidth(390 - QCF4_PHONE_WEB_SAFE_INSET * 2)).toBeGreaterThanOrEqual(245);
  });

  it("clamps phone glyph size so text line height never exceeds its row", () => {
    const lineHeight = 36;
    const glyphSize = qcf4SafeGlyphSizeForLine({
      rawGlyphSize: 32,
      lineHeight,
      maxGlyphSize: 32,
      lineHeightScale: 1.46,
    });

    expect(Math.ceil(glyphSize * 1.46)).toBeLessThanOrEqual(lineHeight);
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
});
