import {
  LAUNCHER_SWIPE_DIST_PX,
  LAUNCHER_SWIPE_VEL,
  shouldCloseLauncherFromSwipe,
  shouldOpenLauncherFromSwipe,
} from "../launcherSwipeGesture";

describe("launcherSwipeGesture", () => {
  it("opens on upward swipe distance", () => {
    expect(shouldOpenLauncherFromSwipe(-LAUNCHER_SWIPE_DIST_PX - 1, 0)).toBe(true);
    expect(shouldOpenLauncherFromSwipe(-10, 0)).toBe(false);
  });

  it("opens on fast upward flick", () => {
    expect(shouldOpenLauncherFromSwipe(-5, -LAUNCHER_SWIPE_VEL - 1)).toBe(true);
  });

  it("closes on downward swipe distance", () => {
    expect(shouldCloseLauncherFromSwipe(LAUNCHER_SWIPE_DIST_PX + 1, 0)).toBe(true);
    expect(shouldCloseLauncherFromSwipe(10, 0)).toBe(false);
  });

  it("closes on fast downward flick", () => {
    expect(shouldCloseLauncherFromSwipe(5, LAUNCHER_SWIPE_VEL + 1)).toBe(true);
  });
});
