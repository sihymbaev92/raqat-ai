import { hatimPageTurnPalette, HATIM_PAGE_TURN_MS } from "../HatimPageTurnOverlay";

describe("HatimPageTurnOverlay", () => {
  it("uses a lighter curl leaf on dark mushaf desks", () => {
    const dark = hatimPageTurnPalette("#121212", true);
    const light = hatimPageTurnPalette("#FEF9F3", false);

    expect(dark.curlFace).not.toBe("#121212");
    expect(dark.ambientDim).toContain("0.42");
    expect(light.curlFace).toBe("#FEF9F3");
  });

  it("keeps a soft fold gradient instead of a hard crease line", () => {
    const palette = hatimPageTurnPalette("#FEF9F3", false);
    expect(palette.foldShadow[1]).toContain("0.16");
    expect(HATIM_PAGE_TURN_MS).toBeGreaterThanOrEqual(500);
  });
});
