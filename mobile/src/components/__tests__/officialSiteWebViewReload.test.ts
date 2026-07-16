jest.mock("react-native-webview", () => ({
  WebView: "WebView",
}));

import {
  OFFICIAL_SITE_NO_CACHE_HEADERS,
  OFFICIAL_SITE_SW_CACHE_PURGE_INJECT,
  clearOfficialSiteWebCache,
} from "../officialSiteWebViewReload";
import { withEmbeddedSiteCacheBust } from "../EmbeddedSiteWebView";
import { OFFICIAL_SITE_MOBILE_VIEWPORT_INJECT } from "../embeddedOfficialSiteNavigation";

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

  it("sw purge inject unregisters service workers", () => {
    expect(OFFICIAL_SITE_SW_CACHE_PURGE_INJECT).toContain("unregister");
    expect(OFFICIAL_SITE_SW_CACHE_PURGE_INJECT).toContain("caches.delete");
  });
});
