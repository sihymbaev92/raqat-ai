import {
  computeMushafPageAutoFitScale,
  mushafPageMinFitScale,
} from "../mushafPageAutoFit";

describe("mushafPageAutoFit", () => {
  it("computes min fit scale from hatim font floor", () => {
    expect(mushafPageMinFitScale(22)).toBeCloseTo(18 / 22, 2);
    expect(mushafPageMinFitScale(30)).toBeGreaterThanOrEqual(0.5);
  });

  it("shrinks scale when content exceeds viewport", () => {
    const next = computeMushafPageAutoFitScale(520, 400, 0.94, 0.72);
    expect(next).not.toBeNull();
    expect(next!).toBeLessThan(0.94);
    expect(next!).toBeGreaterThanOrEqual(0.72);
  });

  it("returns null when content already fits", () => {
    expect(computeMushafPageAutoFitScale(380, 400, 0.9, 0.72)).toBeNull();
  });
});
