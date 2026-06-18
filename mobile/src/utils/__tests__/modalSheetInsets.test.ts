import { modalSheetBottomPadding } from "../modalSheetInsets";

describe("modalSheetBottomPadding", () => {
  it("uses inset when larger than platform base", () => {
    expect(modalSheetBottomPadding({ top: 0, right: 0, bottom: 34, left: 0 })).toBe(34);
  });

  it("falls back to platform base when inset is zero", () => {
    const pad = modalSheetBottomPadding({ top: 0, right: 0, bottom: 0, left: 0 });
    expect(pad).toBeGreaterThanOrEqual(12);
  });
});
