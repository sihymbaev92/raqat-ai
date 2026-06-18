import {
  isHajjMuftyatGarbageLine,
  isHajjMuftyatTextDisplayable,
  sanitizeHajjMuftyatPageText,
} from "../hajjMuftyatTextSanitize";
import hajjMuftyatPageText from "../hajjMuftyatPageText.json";

const SAMPLE = `مناسك الحج
Пайғамбар мешітіне кіргенде:
ËǶ ÍǈËƥ ǶȈËƳōǂǳơ ËǹƢÊǘÍȈ
Оқылуы:
Ағуузи биллаһил-азим
Мағынасы:
Алладан, оның мейірімді жүзінен`;

describe("hajjMuftyatTextSanitize", () => {
  it("strips PDF garbage lines but keeps KK transliteration blocks", () => {
    const out = sanitizeHajjMuftyatPageText(SAMPLE);
    expect(out).toContain("Оқылуы:");
    expect(out).toContain("Ағуузи биллаһил-азим");
    expect(out).not.toMatch(/ËǶ/);
  });

  it("detects garbage lines", () => {
    expect(isHajjMuftyatGarbageLine("ËǶ ÍǈËƥ ǶȈËƳōǂǳơ")).toBe(true);
    expect(isHajjMuftyatGarbageLine("Оқылуы:")).toBe(false);
    expect(isHajjMuftyatGarbageLine("مناسك الحج")).toBe(false);
  });

  it("reflows PDF hyphen line breaks", () => {
    const out = sanitizeHajjMuftyatPageText("Мек-\nке шаһарында\n\nОқылуы:\nЛәббәйк");
    expect(out).toContain("Мекке шаһарында");
    expect(out).toContain("Оқылуы:");
  });

  it("allows display when cleaned KK content is sufficient", () => {
    expect(isHajjMuftyatTextDisplayable(SAMPLE, true)).toBe(true);
    expect(isHajjMuftyatTextDisplayable("ËǶ Êȏ only", true)).toBe(false);
  });

  it("does not keep common mixed Latin/Cyrillic OCR words in visible page text", () => {
    const allText = hajjMuftyatPageText.map((row) => row.text).join("\n");

    expect(allText).not.toMatch(
      /\b(?:бip|бipi|eкі|eкi|Бeciн|Paмадан|eтеккірі|Tік|cүpeciн|түcipe|гөp|Eкінші|pәкәты|Haмaздыгepдiң|Иeci|Teңдесі|түpi)\b/
    );
  });
});
