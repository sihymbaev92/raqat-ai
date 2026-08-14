import { normalizeMuftyatKkPageText, normalizeMuftyatKkText } from "../muftyatKkTextNormalize";

describe("normalizeMuftyatKkText", () => {
  it("fixes common OCR Kazakh typos", () => {
    expect(normalizeMuftyatKkText("Тиләует сәждесі")).toBe("Тіләуат сәждесі");
    expect(normalizeMuftyatKkText("кажет")).toBe("қажет");
    expect(normalizeMuftyatKkText("әр. қайсысына")).toBe("әрқайсысына");
  });

  it("merges hyphen-dot TTS splits", () => {
    expect(normalizeMuftyatKkText("дыбыс-. сыз")).toBe("дыбыссыз");
  });

  it("collapses letter-spaced words", () => {
    expect(normalizeMuftyatKkText("Қ ұ р а н")).toBe("Құран");
  });
});

describe("normalizeMuftyatKkPageText", () => {
  it("merges PDF hyphen line breaks", () => {
    expect(normalizeMuftyatKkPageText("Мек-\nке шаһарында")).toContain("Мекке шаһарында");
  });

  it("normalizes spaced hyphens in compounds", () => {
    expect(normalizeMuftyatKkPageText("Сондай - ақ")).toContain("Сондай-ақ");
  });
});
