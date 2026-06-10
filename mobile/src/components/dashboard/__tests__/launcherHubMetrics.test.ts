import { Platform } from "react-native";
import {
  chunkLauncherGridRows,
  computeLauncherHubMetrics,
  estimateLauncherLayoutHeight,
  maxGridItemSizeForAvailableHeight,
  tileSizeForFilledViewport,
  tileSizeForOpenFlexGrid,
} from "../launcherHubMetrics";

describe("launcherHubMetrics", () => {
  const nativeOs = Platform.OS;

  afterEach(() => {
    Platform.OS = nativeOs;
  });

  it("computes larger 3-column grid sizes for phone width", () => {
    Platform.OS = "android";
    const m = computeLauncherHubMetrics(390);
    expect(m.gridItemSize).toBeGreaterThanOrEqual(64);
    expect(m.openMinHeight).toBeGreaterThan(m.closedMinHeight);
  });

  it("uses one tile size for grid and side dock; center is a wide pill", () => {
    Platform.OS = "android";
    const m = computeLauncherHubMetrics(390, { windowHeight: 844 });
    expect(m.gridItemSize).toBe(m.fabCore);
    expect(m.gridItemSize).toBe(m.sideSlotSize);
    expect(m.gridItemSize).toBeGreaterThanOrEqual(68);
    expect(m.fabPillWidth).toBeGreaterThan(m.fabPillHeight);
    expect(m.fabPillWidth).toBeGreaterThan(m.gridItemSize);
  });

  it("shrinks tiles on short screens to fit one-page budget", () => {
    Platform.OS = "ios";
    const height = 844;
    const tall = computeLauncherHubMetrics(390, {
      windowHeight: height,
      safeTop: 47,
      safeBottom: 34,
      headerHeight: 56,
    });
    const short = computeLauncherHubMetrics(390, {
      windowHeight: 640,
      safeTop: 47,
      safeBottom: 34,
      headerHeight: 56,
    });
    expect(short.gridItemSize).toBeLessThanOrEqual(tall.gridItemSize);
    expect(short.gridItemSize).toBeGreaterThanOrEqual(68);
  });

  it("uses larger tiles when launcher is open on the same screen", () => {
    Platform.OS = "android";
    const common = {
      windowHeight: 844,
      safeTop: 47,
      safeBottom: 34,
      headerHeight: 56,
    };
    const closed = computeLauncherHubMetrics(390, common);
    const opened = computeLauncherHubMetrics(390, { ...common, launcherOpen: true });
    expect(opened.gridItemSize).toBeGreaterThan(closed.gridItemSize);
  });

  it("tileSizeForOpenFlexGrid yields larger tiles than legacy fill on same budget", () => {
    const legacy = tileSizeForFilledViewport(620, 8);
    const dockH = 76;
    const flex = tileSizeForOpenFlexGrid(620, 8, dockH);
    expect(flex).toBeGreaterThan(legacy);
  });

  it("tileSizeForFilledViewport fits launcher chrome budget", () => {
    const size = tileSizeForFilledViewport(500, 8);
    expect(estimateLauncherLayoutHeight(size, 8)).toBeLessThanOrEqual(500);
  });

  it("chunks twelve items into four rows", () => {
    const rows = chunkLauncherGridRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual([1, 2, 3]);
    expect(rows[3]).toEqual([10, 11, 12]);
  });
});
