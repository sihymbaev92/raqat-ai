import { Platform, type ViewStyle } from "react-native";

/**
 * Хатым кітап: араб кітап бағыты.
 * Құран оң жақтан басталады: оңға тарту — келесі бет, солға тарту — алдыңғы бет.
 * `inverted` өшірілген: FlatList тұрақты, ал визуал қатар төмендегі helper арқылы RTL қылады.
 */
export const MUSHAF_BOOK_PAGER_INVERTED = false;
export const MUSHAF_BOOK_PAGER_NATIVE_SCROLL_ENABLED = false;

export const mushafBookPagerHostStyle: ViewStyle = {
  flex: 1,
  minHeight: 0,
  direction: "ltr",
};

/** FlatList / GestureHandlerFlatList горизонталь беттер. */
export const mushafBookPagerListProps = {
  horizontal: true as const,
  pagingEnabled: true as const,
  inverted: MUSHAF_BOOK_PAGER_INVERTED,
  showsHorizontalScrollIndicator: false as const,
  decelerationRate: "fast" as const,
  disableIntervalMomentum: true as const,
  style: { flex: 1, direction: "ltr" as const },
};

export function clampMushafBookPageIndex(index: number, pageCount: number): number {
  if (pageCount <= 0) return 0;
  return Math.max(0, Math.min(pageCount - 1, Math.round(index)));
}

export function mushafBookVisualIndexForPageIndex(index: number, pageCount: number): number {
  if (pageCount <= 0) return 0;
  return pageCount - 1 - clampMushafBookPageIndex(index, pageCount);
}

export function mushafBookPageOffsetForIndex(
  index: number,
  viewportWidth: number,
  pageCount: number
): number {
  return mushafBookVisualIndexForPageIndex(index, pageCount) * Math.max(0, viewportWidth);
}

export function mushafBookOffsetForVisualIndex(index: number, viewportWidth: number): number {
  return Math.max(0, Math.round(index)) * Math.max(0, viewportWidth);
}

export function mushafBookPageIndexForSwipe(
  currentIndex: number,
  pageCount: number,
  dx: number,
  vx: number,
  viewportWidth: number
): number {
  const threshold = Math.min(82, Math.max(42, viewportWidth * 0.14));
  const fastSwipe = Math.abs(vx) >= 0.55;
  if (dx >= threshold || (fastSwipe && vx > 0)) {
    return clampMushafBookPageIndex(currentIndex + 1, pageCount);
  }
  if (dx <= -threshold || (fastSwipe && vx < 0)) {
    return clampMushafBookPageIndex(currentIndex - 1, pageCount);
  }
  return clampMushafBookPageIndex(currentIndex, pageCount);
}
