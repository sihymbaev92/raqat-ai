import {
  OFFICIAL_SITE_FAST_BEFORE_LOAD_INJECT,
  OFFICIAL_SITE_NO_CACHE_HEADERS,
  OFFICIAL_SITE_PREFETCH_URLS,
  OFFICIAL_SITE_SW_CACHE_PURGE_INJECT,
  clearOfficialSiteWebCache,
} from "../officialSiteWebViewReload";
import { withEmbeddedSiteCacheBust } from "../officialSiteWebViewReload";

describe("officialSiteWebViewReload", () => {
  it("withEmbeddedSiteCacheBust adds unique query params", () => {
    const out = withEmbeddedSiteCacheBust("https://halaldamu.kz/", 1_710_000_000_123);
    expect(out).toContain("_raqat=1710000000123");
    expect(out).toContain("_nc=123");
    expect(out.startsWith("https://halaldamu.kz/?")).toBe(true);
  });

  it("preserves hash fragment", () => {
    const out = withEmbeddedSiteCacheBust("https://muftyat.kz/kk/#news", 99);
    expect(out).toContain("#news");
    expect(out).toContain("_raqat=99");
  });

  it("no-cache headers are set", () => {
    expect(OFFICIAL_SITE_NO_CACHE_HEADERS["Cache-Control"]).toMatch(/no-cache/);
  });

  it("fast before-load inject skips service worker purge", () => {
    expect(OFFICIAL_SITE_FAST_BEFORE_LOAD_INJECT).not.toContain("unregister");
    expect(OFFICIAL_SITE_FAST_BEFORE_LOAD_INJECT).toContain("viewport");
  });

  it("prefetch URLs include halal and muftyat homes", () => {
    expect(OFFICIAL_SITE_PREFETCH_URLS.some((u) => u.includes("halaldamu"))).toBe(true);
    expect(OFFICIAL_SITE_PREFETCH_URLS.some((u) => u.includes("muftyat"))).toBe(true);
  });
});
