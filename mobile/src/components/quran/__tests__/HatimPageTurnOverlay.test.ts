import { hatimPageTurnPalette, HATIM_PAGE_TURN_MS } from "../HatimPageTurnOverlay";

describe("HatimPageTurnOverlay", () => {
  it("keeps a short simple fade duration", () => {
    expect(HATIM_PAGE_TURN_MS).toBeGreaterThanOrEqual(200);
    expect(HATIM_PAGE_TURN_MS).toBeLessThanOrEqual(320);
  });

  it("still exposes light/dark palette helpers", () => {
    const dark = hatimPageTurnPalette("#121212", true);
    const light = hatimPageTurnPalette("#FEF9F3", false);
    expect(dark.curlFace).not.toBe("#121212");
    expect(light.curlFace).toBe("#FEF9F3");
  });
});
