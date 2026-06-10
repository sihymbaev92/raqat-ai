import {
  prepareMuftyatKkSpeech,
  prepareTajweedLetterNameSpeech,
} from "../tajweedMuftyatSpeech";
import { prepareTajweedArabicSpeech } from "../tajweedArabicTts";

describe("prepareMuftyatKkSpeech", () => {
  it("trims and collapses duplicate dots", () => {
    expect(prepareMuftyatKkSpeech("  мәтін. .  ")).toBe("мәтін.");
  });

  it("returns empty for blank input", () => {
    expect(prepareMuftyatKkSpeech("   ")).toBe("");
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

  it("speaks the clean letter name instead of an example word", () => {
    expect(prepareTajweedLetterNameSpeech("алиф", "ا")).toBe("алиф");
    expect(prepareTajweedLetterNameSpeech("син", "س")).toBe("син");
    expect(prepareTajweedLetterNameSpeech("шин", "ش")).toBe("шин");
    expect(prepareTajweedLetterNameSpeech("  ғойн  ", "غ")).toBe("ғойн");
  });
});
