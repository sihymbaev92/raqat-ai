import {
  hatimAyahBlockPaddingForProfile,
  hatimDisplayMarginProfile,
  resolveHatimDisplayProfile,
} from "../hatimDisplayProfile";
import { resolveHatimMushafLayout } from "../hatimMushafLayoutPolicy";

describe("hatimDisplayProfile", () => {
  it("detects fold cover vs inner vs phone", () => {
    expect(resolveHatimDisplayProfile(374, 832)).toBe("foldCover");
    expect(resolveHatimDisplayProfile(390, 844)).toBe("phone");
    expect(resolveHatimDisplayProfile(720, 1600)).toBe("foldInner");
    expect(resolveHatimDisplayProfile(1024, 1366)).toBe("tablet");
  });

  it("uses tighter margins on fold cover", () => {
    const cover = hatimDisplayMarginProfile(374, 832);
    const phone = hatimDisplayMarginProfile(390, 844);
    expect(cover.id).toBe("foldCover");
    expect(cover.ayahEdgeInset).toBeLessThan(phone.ayahEdgeInset);
    const coverPad = hatimAyahBlockPaddingForProfile(cover);
    const phonePad = hatimAyahBlockPaddingForProfile(phone);
    expect(coverPad.paddingLeft).toBeLessThan(phonePad.paddingLeft);
  });

  it("resolveHatimMushafLayout applies display profile margins", () => {
    const cover = resolveHatimMushafLayout(374, "android", { windowWidth: 374, windowHeight: 832 });
    const phone = resolveHatimMushafLayout(390, "android", { windowWidth: 390, windowHeight: 844 });
    expect(cover.displayProfile).toBe("foldCover");
    expect(phone.displayProfile).toBe("phone");
    expect(cover.ayahBlockPadding.paddingLeft).toBeLessThan(phone.ayahBlockPadding.paddingLeft);
  });
});
