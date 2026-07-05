import { mushafBookShouldResumeFromStorage } from "../useMushafBookAyahFocus";

describe("useMushafBookAyahFocus helpers", () => {
  it("loads hatim resume only for continuous mushaf without explicit route focus", () => {
    expect(
      mushafBookShouldResumeFromStorage({
        continuousMushaf: true,
      })
    ).toBe(true);
    expect(
      mushafBookShouldResumeFromStorage({
        continuousMushaf: true,
        focusSurah: 2,
        focusAyah: 6,
      })
    ).toBe(false);
    expect(
      mushafBookShouldResumeFromStorage({
        continuousMushaf: true,
        initialPage: 3,
      })
    ).toBe(false);
    expect(mushafBookShouldResumeFromStorage({ continuousMushaf: false })).toBe(false);
  });
});
