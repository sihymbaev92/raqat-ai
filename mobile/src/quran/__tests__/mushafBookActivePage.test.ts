import { isMushafBookRenderPageActive } from "../mushafBookActivePage";

describe("isMushafBookRenderPageActive", () => {
  it("keeps only the visible page and immediate neighbours active by default", () => {
    expect(isMushafBookRenderPageActive(9, 10)).toBe(true);
    expect(isMushafBookRenderPageActive(10, 10)).toBe(true);
    expect(isMushafBookRenderPageActive(11, 10)).toBe(true);
    expect(isMushafBookRenderPageActive(8, 10)).toBe(false);
    expect(isMushafBookRenderPageActive(12, 10)).toBe(false);
  });

  it("treats invalid indexes as inactive", () => {
    expect(isMushafBookRenderPageActive(Number.NaN, 10)).toBe(false);
    expect(isMushafBookRenderPageActive(10, Number.POSITIVE_INFINITY)).toBe(false);
  });
});
