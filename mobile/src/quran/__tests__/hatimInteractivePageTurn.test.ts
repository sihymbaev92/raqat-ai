import {
  hatimPageGrabAnchor,
  hatimPageGrabEdge,
  hatimPageTurnCanDrag,
  hatimPageTurnCornerSkewDeg,
  hatimPageTurnDirectionFromDx,
  hatimPageTurnProgressFromDx,
  hatimPageTurnShouldCommit,
  hatimPageTurnSignedDx,
  hatimPageTurnSwapDelayMs,
} from "../hatimInteractivePageTurn";

describe("hatimInteractivePageTurn", () => {
  it("detects left/right edge grabs", () => {
    expect(hatimPageGrabEdge(40, 400)).toBe("left");
    expect(hatimPageGrabEdge(360, 400)).toBe("right");
    expect(hatimPageGrabEdge(200, 400)).toBe("none");
  });

  it("allows drag from anywhere via horizontal dx", () => {
    expect(hatimPageTurnDirectionFromDx(12)).toBe("forward");
    expect(hatimPageTurnDirectionFromDx(-12)).toBe("backward");
    const center = hatimPageGrabAnchor(200, 300, 400, 700, 40);
    expect(center?.direction).toBe("forward");
    expect(center?.grabXRatio).toBeCloseTo(0.5, 1);
  });

  it("tracks drag progress with near-linear finger follow", () => {
    expect(hatimPageTurnProgressFromDx(0, 390)).toBe(0);
    expect(hatimPageTurnProgressFromDx(140, 390)).toBeGreaterThan(0.35);
    expect(hatimPageTurnProgressFromDx(400, 390)).toBe(1);
  });

  it("commits turn after enough drag or fast flick", () => {
    expect(hatimPageTurnShouldCommit(40, 0, 390, 0.12)).toBe(false);
    expect(hatimPageTurnShouldCommit(120, 0, 390, 0.22)).toBe(true);
    expect(hatimPageTurnShouldCommit(90, 0, 390, 0.2)).toBe(true);
    expect(hatimPageTurnShouldCommit(30, 0.6, 390, 0.1)).toBe(true);
  });

  it("blocks drag at first/last page", () => {
    expect(hatimPageTurnCanDrag("backward", 0, 604)).toBe(false);
    expect(hatimPageTurnCanDrag("forward", 603, 604)).toBe(false);
    expect(hatimPageTurnCanDrag("forward", 10, 604)).toBe(true);
  });

  it("uses signed dx per direction", () => {
    expect(hatimPageTurnSignedDx("forward", -12)).toBe(0);
    expect(hatimPageTurnSignedDx("forward", 24)).toBe(24);
    expect(hatimPageTurnSignedDx("backward", -18)).toBe(-18);
  });

  it("skews curl from grab height", () => {
    expect(hatimPageTurnCornerSkewDeg("forward", 0.1, 1)).toBeLessThan(0);
    expect(hatimPageTurnCornerSkewDeg("forward", 0.9, 1)).toBeGreaterThan(0);
  });

  it("swaps page immediately for simple fade", () => {
    expect(hatimPageTurnSwapDelayMs(0)).toBe(0);
    expect(hatimPageTurnSwapDelayMs(0.5)).toBe(0);
    expect(hatimPageTurnSwapDelayMs(0.5, 420)).toBe(0);
  });
});
