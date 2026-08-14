import { qiblaDialSize } from "../../hooks/useQiblaLandscapeFullscreen";

describe("qiblaDialSize", () => {
  it("uses larger cap when online GPS in portrait", () => {
    const offline = qiblaDialSize({ width: 400, height: 800, landscape: false, onlineGps: false });
    const online = qiblaDialSize({ width: 400, height: 800, landscape: false, onlineGps: true });
    expect(online).toBeGreaterThan(offline);
    expect(online).toBe(300);
  });

  it("fills landscape short side", () => {
    expect(qiblaDialSize({ width: 900, height: 400, landscape: true, onlineGps: true })).toBe(328);
  });
});
