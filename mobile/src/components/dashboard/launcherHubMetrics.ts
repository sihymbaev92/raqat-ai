import { Platform } from "react-native";
import { DASHBOARD_RADIAL_ITEMS } from "../../config/dashboardRadialItems";

export type LauncherHubMetrics = {
  fabCore: number;
  fabRing: number;
  /** Ортадағы ұзын pill (төртбұрыш емес). */
  fabPillWidth: number;
  fabPillHeight: number;
  fabPillRadius: number;
  fabPillLogoSize: number;
  gridItemSize: number;
  gridCorner: number;
  sideSlotSize: number;
  sideCorner: number;
  dockGap: number;
  sideWrapWidth: number;
  gridGap: number;
  fabIconPlus: number;
  fabIconClose: number;
  gridBlockHeight: number;
  dockRowHeight: number;
  layoutHeight: number;
  /** @deprecated layoutHeight-пен бірдей — орын алмастыру жоқ */
  closedMinHeight: number;
  openMinHeight: number;
};

export type ComputeLauncherHubMetricsOpts = {
  windowHeight?: number;
  safeBottom?: number;
  safeTop?: number;
  headerHeight?: number;
  /** Басты бет: намаз summary + жаңалық блоктары (px). */
  prayerReservePx?: number;
  newsReservePx?: number;
  /** Launcher ашық — намaz strip + толық биіктікке tile. */
  launcherOpen?: boolean;
};

/** Launcher ашық: namaz hero жасырылады — орнына үстіңгі header. */
export const DASHBOARD_PRAYER_OPEN_PX = 0;
/** Launcher ашық: «келесі намаз» header (қала + хижра + strip + progress). */
export const DASHBOARD_PRAYER_LAUNCHER_HEADER_PX = 98;
/** Басты бет: толық намаз кестесі (meta + 6 жол + green strip). */
export const DASHBOARD_PRAYER_RESERVE_PX = 278;
export const DASHBOARD_NEWS_RESERVE_PX = 172;
const SCROLL_CHROME_PX = 10;
/** Жабық launcher root биіктігі резерві — grid/open layout тұрақты (px). */
export const LAUNCHER_FAB_DOWN_OFFSET_PX = 46;
/** «Қызметтер» pill — ашық/жабық бір translateY (px). */
export const LAUNCHER_FAB_TRANSLATE_Y_PX = 0;
/** @deprecated LAUNCHER_FAB_TRANSLATE_Y_PX қолданылады */
export const LAUNCHER_FAB_CLOSED_TRANSLATE_PX = LAUNCHER_FAB_TRANSLATE_Y_PX;
const LAUNCHER_GRID_COLUMNS = 3;

export function launcherGridRowCount(itemCount = DASHBOARD_RADIAL_ITEMS.length): number {
  return Math.ceil(itemCount / LAUNCHER_GRID_COLUMNS);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function estimateGridBlockHeight(
  tileSize: number,
  gridGap: number,
  rowCount = launcherGridRowCount()
): number {
  return tileSize * rowCount + gridGap * (rowCount - 1);
}

export function estimateDockRowHeight(tileSize: number): number {
  return tileSize + 8;
}

/** Launcher ашық: FAB pill — tile өлшеміне байlanбас. */
export function estimateOpenDockRowHeight(fabPillHeight: number): number {
  return fabPillHeight + 6;
}

/** Launcher толық биіктігі — grid + dock, әрқашан бірдей. */
export function estimateLauncherLayoutHeight(tileSize: number, gridGap: number): number {
  return (
    2 +
    estimateGridBlockHeight(tileSize, gridGap) +
    6 +
    estimateDockRowHeight(tileSize) +
    SCROLL_CHROME_PX
  );
}

/** Жабық күй: dock + төменгі inset (FAB ашық/жабық бір орын). */
export function estimateLauncherClosedHeight(_tileSize: number, fabPillHeight?: number): number {
  const pillH = fabPillHeight ?? 48;
  return estimateOpenDockRowHeight(pillH) + LAUNCHER_FAB_DOWN_OFFSET_PX + 8;
}

/** Launcher grid + dock — tile-сыз тұрақты хром (px). */
export function estimateLauncherFixedChromePx(): number {
  return 2 + 6 + 8 + SCROLL_CHROME_PX;
}

/** Қолжетімді биіктікке tile — grid + dock толық сыйу (legacy). */
export function tileSizeForFilledViewport(
  availableHeight: number,
  gridGap: number,
  rowCount = launcherGridRowCount()
): number {
  if (availableHeight <= 0) return 72;
  const rowGaps = (rowCount - 1) * gridGap;
  return Math.floor(
    (availableHeight - estimateLauncherFixedChromePx() - rowGaps) / (rowCount + 1)
  );
}

/** Launcher ашық (flex): dock бөлек, grid 4 қатар — tile биіктігі. */
export function tileSizeForOpenFlexGrid(
  availableHeight: number,
  gridGap: number,
  dockRowHeight: number,
  rowCount = launcherGridRowCount()
): number {
  if (availableHeight <= 0) return 72;
  const chrome = 4 + SCROLL_CHROME_PX;
  const gridH = availableHeight - dockRowHeight - chrome;
  const rowGaps = (rowCount - 1) * gridGap;
  return Math.floor((gridH - rowGaps) / rowCount);
}

export function maxGridItemSizeForAvailableHeight(
  availableHeight: number,
  gridGap: number
): number {
  if (availableHeight <= 0) return 72;
  let lo = 56;
  let hi = 140;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (estimateLauncherLayoutHeight(mid, gridGap) <= availableHeight) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo;
}

function tileFromWidth(
  windowWidth: number,
  gridGap: number,
  isNativePhone: boolean,
  launcherOpen: boolean
): number {
  const padX = launcherOpen ? (isNativePhone ? 2 : 6) : isNativePhone ? 16 : 24;
  const contentW = Math.max(280, windowWidth - padX * 2);
  const cellW = (contentW - gridGap * 2) / 3;
  const minTile = launcherOpen ? (isNativePhone ? 76 : 68) : isNativePhone ? 68 : 64;
  const maxTile = launcherOpen ? (isNativePhone ? 999 : 999) : isNativePhone ? 120 : 96;
  return Math.floor(clamp(cellW, minTile, maxTile));
}

export function computeLauncherHubMetrics(
  windowWidth: number,
  opts: ComputeLauncherHubMetricsOpts = {}
): LauncherHubMetrics {
  const isNativePhone = Platform.OS === "ios" || Platform.OS === "android";
  const launcherOpen = opts.launcherOpen === true;
  const gridGap = launcherOpen ? (isNativePhone ? 3 : 4) : isNativePhone ? 8 : 6;
  const widthTile = tileFromWidth(windowWidth, gridGap, isNativePhone, launcherOpen);

  let tileSize = widthTile;
  const {
    windowHeight,
    safeBottom = 0,
    safeTop = 0,
    headerHeight = 0,
    prayerReservePx: prayerReservePxOpt,
    newsReservePx: newsReservePxOpt,
  } = opts;

  const prayerReservePx = launcherOpen
    ? DASHBOARD_PRAYER_OPEN_PX
    : (prayerReservePxOpt ?? DASHBOARD_PRAYER_RESERVE_PX);
  const newsReservePx = launcherOpen ? 0 : (newsReservePxOpt ?? 0);

  if (windowHeight != null && windowHeight > 0) {
    const reservedTop = headerHeight + safeTop + prayerReservePx + newsReservePx + SCROLL_CHROME_PX;
    const available = windowHeight - reservedTop - safeBottom;
    if (launcherOpen) {
      const fabPillH = Math.round(clamp(widthTile * 0.56, 42, 52));
      const dockH = estimateOpenDockRowHeight(fabPillH);
      const headerPx = DASHBOARD_PRAYER_LAUNCHER_HEADER_PX;
      const fillTile = tileSizeForOpenFlexGrid(available - headerPx - 3, gridGap, dockH);
      tileSize = Math.min(widthTile, fillTile);
    } else {
      const heightTile = maxGridItemSizeForAvailableHeight(available, gridGap);
      tileSize = Math.min(widthTile, heightTile);
    }
  }

  const minTile = launcherOpen ? (isNativePhone ? 76 : 68) : isNativePhone ? 68 : 64;
  const maxTile = launcherOpen ? 999 : isNativePhone ? 120 : 96;
  tileSize = Math.round(clamp(tileSize, minTile, maxTile));

  const corner = Math.round(tileSize * 0.2);
  const dashPad = launcherOpen ? 8 : 24;
  const contentW = Math.max(280, windowWidth - dashPad);
  const dockGapVal = isNativePhone ? 12 : 8;
  const fabPillHeight = Math.round(clamp(tileSize * 0.56, 42, 52));
  const fabPillWidth = Math.round(
    clamp(contentW - tileSize * 2 - dockGapVal * 2, tileSize * 1.55, Math.min(contentW * 0.52, 200))
  );
  const fabPillRadius = Math.round(fabPillHeight / 2);
  const fabPillLogoSize = Math.round(fabPillHeight * 0.58);
  const dockRowHeight = estimateOpenDockRowHeight(fabPillHeight);
  const gridBlockHeight = estimateGridBlockHeight(tileSize, gridGap);
  const layoutHeight = estimateLauncherLayoutHeight(tileSize, gridGap);

  return {
    fabCore: tileSize,
    fabRing: tileSize,
    fabPillWidth,
    fabPillHeight,
    fabPillRadius,
    fabPillLogoSize,
    gridItemSize: tileSize,
    gridCorner: corner,
    sideSlotSize: tileSize,
    sideCorner: corner,
    dockGap: isNativePhone ? 12 : 8,
    sideWrapWidth: tileSize,
    gridGap,
    fabIconPlus: Math.round(tileSize * 0.54),
    fabIconClose: Math.round(tileSize * 0.48),
    gridBlockHeight,
    dockRowHeight,
    layoutHeight,
    closedMinHeight: estimateLauncherClosedHeight(tileSize, fabPillHeight),
    openMinHeight: layoutHeight,
  };
}

/** 3 бағана — қатарларға бөлу. */
export function chunkLauncherGridRows<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += LAUNCHER_GRID_COLUMNS) {
    rows.push(items.slice(i, i + LAUNCHER_GRID_COLUMNS));
  }
  return rows;
}
