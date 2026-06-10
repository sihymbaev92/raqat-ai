import {
  isLikelyFemaleArabicVoice,
  isLikelyMaleArabicVoice,
  pickArabicVoiceFromList,
  prepareTajweedArabicSpeech,
  buildTajweedArabicSpeakOptions,
} from "../tajweedArabicTts";
import { Platform } from "react-native";

describe("prepareTajweedArabicSpeech", () => {
  it("keeps a single letter unchanged aside from trim", () => {
    expect(prepareTajweedArabicSpeech("  ب  ")).toBe("ب");
  });

  it("normalizes Latin commas to Arabic comma", () => {
    expect(prepareTajweedArabicSpeech("أ , ب")).toContain("،");
  });
});

describe("pickArabicVoiceFromList", () => {
  const female = {
    identifier: "com.apple.voice.compact.ar-SA.Zahra-compact",
    language: "ar-SA",
    name: "Zahra",
  };
  const male = {
    identifier: "com.apple.voice.compact.ar-SA.Maged-compact",
    language: "ar-SA",
    name: "Maged",
  };
  const androidMale = {
    identifier: "com.google.android.tts:ar-xa-x-arz-local",
    language: "ar-xa",
    name: "Arabic",
  };

  it("preferMale picks male over female", () => {
    const picked = pickArabicVoiceFromList([female, male], true);
    expect(picked.voice).toContain("Maged");
  });

  it("detects likely male Arabic voices", () => {
    expect(isLikelyMaleArabicVoice(male)).toBe(true);
    expect(isLikelyMaleArabicVoice(androidMale)).toBe(true);
    expect(isLikelyFemaleArabicVoice(female)).toBe(true);
  });

  it("buildTajweedArabicSpeakOptions lowers pitch for letters without voice id", () => {
    const opts = buildTajweedArabicSpeakOptions({ language: "ar-SA" }, { preferMale: true });
    const expectedPitch = Platform.OS === "android" ? 0.92 : 0.88;
    expect(opts.pitch).toBe(expectedPitch);
    expect(opts.voice).toBeUndefined();
  });

  it("buildTajweedArabicSpeakOptions uses voice id on iOS/web when set", () => {
    const opts = buildTajweedArabicSpeakOptions(
      { language: "ar-SA", voice: "com.apple.voice.compact.ar-SA.Maged-compact" },
      { preferMale: true }
    );
    if (Platform.OS === "android") {
      expect(opts.voice).toBeUndefined();
    } else {
      expect(opts.voice).toContain("Maged");
    }
  });
});
