import {
  ensureTurkishHatimFitSession,
  getTurkishHatimLockedFitScale,
  refineTurkishHatimFitOnceFromLayout,
  resetTurkishHatimFitSession,
  turkishHatimFitSessionKey,
} from "../mushafTurkishHatimFitSession";

describe("mushafTurkishHatimFitSession", () => {
  beforeEach(() => {
    resetTurkishHatimFitSession();
  });

  it("builds stable session keys from viewport metrics", () => {
    const key = turkishHatimFitSessionKey({
      edition: "turkish",
      pagerWidth: 390,
      viewportHeight: 720,
      linesAreaH: 560,
      baseFontSize: 28,
      bundledReady: true,
    });
    expect(key).toBe("turkish:390:720:560:28:1");
  });

  it("seeds one locked scale per session and reuses it across pages", () => {
    const key = turkishHatimFitSessionKey({
      edition: "turkish",
      pagerWidth: 390,
      viewportHeight: 720,
      linesAreaH: 560,
      baseFontSize: 28,
      bundledReady: true,
    });
    ensureTurkishHatimFitSession(key, 0.92);
    expect(getTurkishHatimLockedFitScale(key)).toBe(0.92);

    ensureTurkishHatimFitSession(key, 0.75);
    expect(getTurkishHatimLockedFitScale(key)).toBe(0.92);
  });

  it("resets locked scale when session key changes", () => {
    const a = turkishHatimFitSessionKey({
      edition: "turkish",
      pagerWidth: 390,
      viewportHeight: 720,
      linesAreaH: 560,
      baseFontSize: 28,
      bundledReady: true,
    });
    const b = turkishHatimFitSessionKey({
      edition: "turkish",
      pagerWidth: 420,
      viewportHeight: 720,
      linesAreaH: 560,
      baseFontSize: 28,
      bundledReady: true,
    });
    ensureTurkishHatimFitSession(a, 0.9);
    ensureTurkishHatimFitSession(b, 0.85);
    expect(getTurkishHatimLockedFitScale(a)).toBeNull();
    expect(getTurkishHatimLockedFitScale(b)).toBe(0.85);
  });

  it("refines locked scale down when active page overflows", () => {
    const key = turkishHatimFitSessionKey({
      edition: "turkish",
      pagerWidth: 390,
      viewportHeight: 720,
      linesAreaH: 400,
      baseFontSize: 28,
      bundledReady: true,
    });
    ensureTurkishHatimFitSession(key, 0.95);
    refineTurkishHatimFitOnceFromLayout(key, {
      contentHeight: 520,
      linesAreaH: 400,
      baseFontSize: 28,
    });
    const after = getTurkishHatimLockedFitScale(key)!;
    expect(after).toBeLessThan(0.95);

    refineTurkishHatimFitOnceFromLayout(key, {
      contentHeight: 580,
      linesAreaH: 400,
      baseFontSize: 28,
    });
    expect(getTurkishHatimLockedFitScale(key)).toBeLessThan(after);
  });
});
