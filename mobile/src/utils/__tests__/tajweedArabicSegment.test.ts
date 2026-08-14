import { segmentTajweedArabicLetters, prepareTajweedExampleSpeech } from "../tajweedArabicSegment";

describe("segmentTajweedArabicLetters", () => {
  it("splits harakat word into letter clusters", () => {
    expect(segmentTajweedArabicLetters("أَدَبَ")).toEqual(["أَ", "دَ", "بَ"]);
    expect(segmentTajweedArabicLetters("وَزَعَ")).toEqual(["وَ", "زَ", "عَ"]);
    expect(segmentTajweedArabicLetters("  دَرَجَ  ")).toEqual(["دَ", "رَ", "جَ"]);
  });

  it("keeps shadda and sukun on the same cluster", () => {
    expect(segmentTajweedArabicLetters("حَجّ")).toEqual(["حَ", "جّ"]);
    expect(segmentTajweedArabicLetters("أَنْ")).toEqual(["أَ", "نْ"]);
  });

  it("handles single letter examples", () => {
    expect(segmentTajweedArabicLetters("ا")).toEqual(["ا"]);
    expect(segmentTajweedArabicLetters("ب")).toEqual(["ب"]);
  });
});

describe("prepareTajweedExampleSpeech", () => {
  it("normalizes NFC without altering tashkeel", () => {
    expect(prepareTajweedExampleSpeech("  أَدَبَ  ")).toBe("أَدَبَ");
    expect(prepareTajweedExampleSpeech("ب")).toBe("ب");
  });
});
