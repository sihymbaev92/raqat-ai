import {
  isHajjMuftyatGarbageLine,
  isHajjMuftyatTextDisplayable,
  sanitizeHajjMuftyatPageText,
} from "../hajjMuftyatTextSanitize";

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
});
