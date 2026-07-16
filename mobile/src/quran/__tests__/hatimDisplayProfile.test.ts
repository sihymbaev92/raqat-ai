import {
  hatimAyahBlockPaddingForProfile,
  hatimDisplayMarginProfile,
  resolveHatimDisplayProfile,
} from "../hatimDisplayProfile";
import { resolveHatimMushafLayout } from "../hatimMushafLayoutPolicy";

describe("hatimDisplayProfile", () => {
  it("detects fold cover vs inner vs phone", () => {
    expect(resolveHatimDisplayProfile(374, 832)).toBe("foldCover");
    expect(resolveHatimDisplayProfile(430, 844)).toBe("phone");
    expect(resolveHatimDisplayProfile(720, 1600)).toBe("foldInner");
    expect(resolveHatimDisplayProfile(1024, 1366)).toBe("tablet");
  });

  it("uses tighter margins on fold cover", () => {
    const cover = hatimDisplayMarginProfile(374, 832);
    const phone = hatimDisplayMarginProfile(430, 844);
    expect(cover.id).toBe("foldCover");
    expect(phone.id).toBe("phone");
    expect(cover.ayahEdgeInset).toBeLessThan(phone.ayahEdgeInset);
    const coverPad = hatimAyahBlockPaddingForProfile(cover);
    const phonePad = hatimAyahBlockPaddingForProfile(phone);
    expect(coverPad.paddingLeft).toBeLessThan(phonePad.paddingLeft);
  });

  it("resolveHatimMushafLayout uses unified QCF4 metrics", () => {
    const cover = resolveHatimMushafLayout(374, "android");
    const phone = resolveHatimMushafLayout(430, "android");
    expect(cover.useHatimQcf4Metrics).toBe(true);
    expect(phone.useHatimQcf4Metrics).toBe(true);
    expect(cover.linePadding).toBe(phone.linePadding);
    expect(cover.bookPageWidth).toBeLessThanOrEqual(phone.bookPageWidth);
  });
});
