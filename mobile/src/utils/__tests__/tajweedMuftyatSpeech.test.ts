import {
  prepareMuftyatKkSpeech,
  prepareTajweedLetterSpeech,
} from "../tajweedMuftyatSpeech";
import { prepareTajweedArabicSpeech } from "../tajweedArabicTts";

jest.mock("expo-av", () => ({
  Audio: {
    Sound: { createAsync: jest.fn() },
    setAudioModeAsync: jest.fn(async () => undefined),
  },
  InterruptionModeAndroid: { DuckOthers: 1 },
  InterruptionModeIOS: { DuckOthers: 1 },
}));

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
    expect(prepareMuftyatKkSpeech("Тиләует сәждесі")).toBe("Тіләуат сәждесі");
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

  it("speaks full Kazakh letter names (TTS fallback)", () => {
    expect(prepareTajweedLetterSpeech("ا", "алиф")).toBe("алиф");
    expect(prepareTajweedLetterSpeech("ب", "бә")).toBe("бә");
    expect(prepareTajweedLetterSpeech("ت", "тә")).toBe("тә");
    expect(prepareTajweedLetterSpeech("ث", "сә")).toBe("сә");
    expect(prepareTajweedLetterSpeech("ا")).toBe("алиф");
    expect(prepareTajweedLetterSpeech("ب")).toBe("бә");
  });

  it("uses Kazakh names rather than Arabic letter spellings", () => {
    const spoken = ["ب", "ت", "ث", "س"].map((ar) => prepareTajweedLetterSpeech(ar)).join(" ");
    expect(spoken).toBe("бә тә сә син");
  });
});
