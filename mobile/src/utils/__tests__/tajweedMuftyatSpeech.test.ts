import {
  prepareMuftyatKkSpeech,
  prepareTajweedLetterSpeech,
} from "../tajweedMuftyatSpeech";
import { prepareTajweedArabicSpeech } from "../tajweedArabicTts";

describe("prepareMuftyatKkSpeech", () => {
  it("trims and collapses duplicate dots", () => {
    expect(prepareMuftyatKkSpeech("  мәтін. .  ")).toBe("мәтін.");
  });

  it("returns empty for blank input", () => {
    expect(prepareMuftyatKkSpeech("   ")).toBe("");
  });

  it("cleans OCR artifacts before sending Kazakh text to TTS", () => {
    expect(prepareMuftyatKkSpeech("дыбыс-. сыз")).toBe("дыбыссыз");
    expect(prepareMuftyatKkSpeech("әр. қайсысына")).toBe("әрқайсысына");
    expect(prepareMuftyatKkSpeech("кажет")).toBe("қажет");
  });
});

describe("tajweed letter speech text", () => {
  it("normalizes bare letter", () => {
    expect(prepareTajweedArabicSpeech("ب")).toBe("ب");
    expect(prepareTajweedArabicSpeech("  خ  ")).toBe("خ");
  });

  it("normalizes example word with harakat", () => {
    expect(prepareTajweedArabicSpeech("  خَبَر  ")).toBe("خَبَر");
  });

  it("speaks short letter sounds without extra name suffixes", () => {
    expect(prepareTajweedLetterSpeech("ا")).toBe("أَ");
    expect(prepareTajweedLetterSpeech("ب")).toBe("بَ");
    expect(prepareTajweedLetterSpeech("س")).toBe("سَ");
    expect(prepareTajweedLetterSpeech("ش")).toBe("شَ");
    expect(prepareTajweedLetterSpeech("غ")).toBe("غَ");
  });

  it("does not feed full Arabic letter names to TTS", () => {
    const spoken = ["ب", "ت", "س", "ش", "ق", "ك", "ي"].map(prepareTajweedLetterSpeech).join(" ");
    expect(spoken).not.toMatch(/اء|ين|اف|ام|ون/u);
  });
});
