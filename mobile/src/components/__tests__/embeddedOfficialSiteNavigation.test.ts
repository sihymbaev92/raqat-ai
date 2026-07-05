import {
  HALAL_DAMU_WEBVIEW_HOSTS,
  MUFTYAT_WEBVIEW_HOSTS,
  OFFICIAL_SITE_DESKTOP_VIEWPORT_INJECT,
  OFFICIAL_SITE_SPA_HISTORY_INJECT,
  buildOfficialSiteUserAgent,
  isEmbeddedSiteHostAllowed,
  shouldStayInOfficialSiteWebView,
} from "../embeddedOfficialSiteNavigation";

describe("embeddedOfficialSiteNavigation", () => {
  it("exports SPA history inject for embedded official sites", () => {
    expect(OFFICIAL_SITE_SPA_HISTORY_INJECT).toContain("__raqatSpaHistory");
    expect(OFFICIAL_SITE_SPA_HISTORY_INJECT).toContain("raqat-spa-nav");
  });

  it("allows same-site navigation for halaldamu", () => {
    expect(shouldStayInOfficialSiteWebView("https://halaldamu.kz/company/test/", HALAL_DAMU_WEBVIEW_HOSTS)).toBe(
      true
    );
    expect(shouldStayInOfficialSiteWebView("https://www.halaldamu.kz/?s=foo", HALAL_DAMU_WEBVIEW_HOSTS)).toBe(true);
  });

  it("opens youtube and unrelated hosts externally for muftyat", () => {
    expect(
      shouldStayInOfficialSiteWebView("https://www.youtube.com/watch?v=abc", MUFTYAT_WEBVIEW_HOSTS)
    ).toBe(false);
    expect(shouldStayInOfficialSiteWebView("https://google.com/", MUFTYAT_WEBVIEW_HOSTS)).toBe(false);
    expect(shouldStayInOfficialSiteWebView("tel:+77001234567", MUFTYAT_WEBVIEW_HOSTS)).toBe(false);
  });

  it("keeps fatua.kz inside muftyat webview", () => {
    expect(shouldStayInOfficialSiteWebView("https://fatua.kz/kk/article", MUFTYAT_WEBVIEW_HOSTS)).toBe(true);
    expect(shouldStayInOfficialSiteWebView("https://www.muftyat.kz/kk/news", MUFTYAT_WEBVIEW_HOSTS)).toBe(true);
  });

  it("exports desktop viewport inject for muftyat embed", () => {
    expect(OFFICIAL_SITE_DESKTOP_VIEWPORT_INJECT).toContain("minimum-scale=0.2");
    expect(buildOfficialSiteUserAgent("RaqatMuftyat/1", "desktop")).toContain("Windows NT");
  });
});
