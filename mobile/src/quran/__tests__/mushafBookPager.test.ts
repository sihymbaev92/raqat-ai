import {
  MUSHAF_BOOK_PAGER_NATIVE_SCROLL_ENABLED,
  MUSHAF_BOOK_PAGER_INVERTED,
  mushafBookOffsetForVisualIndex,
  mushafBookPageOffsetForIndex,
  mushafBookPageIndexForSwipe,
  mushafBookPagerListProps,
  mushafBookVisualIndexForPageIndex,
} from "../mushafBookPager";

describe("mushafBookPager", () => {
  it("uses non-inverted horizontal pager with Arabic book gesture mapping", () => {
    expect(MUSHAF_BOOK_PAGER_INVERTED).toBe(false);
    expect(mushafBookPagerListProps.inverted).toBe(false);
    expect(mushafBookPagerListProps.horizontal).toBe(true);
    expect(mushafBookPagerListProps.disableIntervalMomentum).toBe(true);
    expect(MUSHAF_BOOK_PAGER_NATIVE_SCROLL_ENABLED).toBe(false);
  });

  it("maps a right swipe to the next page", () => {
    expect(mushafBookPageIndexForSwipe(4, 10, 80, 0.2, 390)).toBe(5);
    expect(mushafBookPageIndexForSwipe(4, 10, 8, 0.7, 390)).toBe(5);
  });

  it("maps a left swipe to the previous page", () => {
    expect(mushafBookPageIndexForSwipe(4, 10, -80, -0.2, 390)).toBe(3);
    expect(mushafBookPageIndexForSwipe(4, 10, -8, -0.7, 390)).toBe(3);
  });

  it("clamps swipe navigation at the first and last page", () => {
    expect(mushafBookPageIndexForSwipe(0, 10, -80, -0.2, 390)).toBe(0);
    expect(mushafBookPageIndexForSwipe(9, 10, 80, 0.2, 390)).toBe(9);
  });

  it("never advances more than one logical page per swipe gesture", () => {
    expect(mushafBookPageIndexForSwipe(4, 604, 5000, 4.8, 390)).toBe(5);
    expect(mushafBookPageIndexForSwipe(4, 604, -5000, -4.8, 390)).toBe(3);
  });

  it("keeps single page stepping even on wide screens", () => {
    expect(mushafBookPageIndexForSwipe(4, 604, 5000, 4.8, 960)).toBe(5);
    expect(mushafBookPageIndexForSwipe(4, 604, -5000, -4.8, 960)).toBe(3);
  });

  it("renders logical pages in reverse visual order for Arabic book transitions", () => {
    expect(mushafBookVisualIndexForPageIndex(0, 10)).toBe(9);
    expect(mushafBookVisualIndexForPageIndex(5, 10)).toBe(4);
    expect(mushafBookVisualIndexForPageIndex(9, 10)).toBe(0);
  });

  it("uses reverse visual offsets for logical page transitions", () => {
    expect(mushafBookPageOffsetForIndex(0, 390, 10)).toBe(3510);
    expect(mushafBookPageOffsetForIndex(5, 390, 10)).toBe(1560);
    expect(mushafBookPageOffsetForIndex(9, 390, 10)).toBe(0);
    expect(mushafBookOffsetForVisualIndex(5, 390)).toBe(1950);
  });
});
