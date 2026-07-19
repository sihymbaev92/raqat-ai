import {
  LAUNCHER_TILE_INSET_RATIO,
  LAUNCHER_TILE_IMAGE_DEFAULT,
  launcherTileImageStyle,
  launcherTileInsetPx,
} from "../dashboardLauncherTileImage";
import { dashboardHomeTileImage } from "../dashboardHomeTileImages";
import { DASHBOARD_RADIAL_ITEMS } from "../dashboardRadialItems";

describe("dashboardLauncherTileImage", () => {
  it("uses uniform contain inset for all tiles", () => {
    expect(LAUNCHER_TILE_IMAGE_DEFAULT.resizeMode).toBe("contain");
    expect(LAUNCHER_TILE_IMAGE_DEFAULT.paddingRatio).toBe(LAUNCHER_TILE_INSET_RATIO);
    expect(launcherTileImageStyle("quran").resizeMode).toBe("contain");
    expect(launcherTileImageStyle("halal").paddingRatio).toBe(0.07);
  });

  it("computes inset px from tile size", () => {
    expect(launcherTileInsetPx(100)).toBe(Math.round(100 * LAUNCHER_TILE_INSET_RATIO));
  });

  it("tasbih tile avoids cropping the bead asset", () => {
    const tasbih = launcherTileImageStyle("tasbih");
    expect(tasbih.resizeMode).toBe("contain");
    expect(tasbih.paddingRatio).toBe(0.075);
    expect(tasbih.scale).toBe(0.94);
  });

  it("halal and kmdb tiles use contain (no crop)", () => {
    expect(launcherTileImageStyle("halal").resizeMode).toBe("contain");
    expect(launcherTileImageStyle("kmdb").resizeMode).toBe("contain");
    expect(launcherTileImageStyle("halal").scale).toBe(0.92);
    expect(launcherTileImageStyle("kmdb").scale).toBe(1.12);
  });

  it("hajj tile is slightly enlarged", () => {
    const hajj = launcherTileImageStyle("hajj");
    expect(hajj.resizeMode).toBe("contain");
    expect(hajj.paddingRatio).toBe(0.02);
    expect(hajj.scale).toBe(1.2);
  });

  it("has a small home thumbnail for every dashboard tile", () => {
    for (const item of DASHBOARD_RADIAL_ITEMS) {
      expect(dashboardHomeTileImage(item.key)).toBeTruthy();
    }
  });
});
