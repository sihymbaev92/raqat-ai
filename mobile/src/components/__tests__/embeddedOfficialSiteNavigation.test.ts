import {
  HALAL_DAMU_WEBVIEW_HOSTS,
  MUFTYAT_WEBVIEW_HOSTS,
  OFFICIAL_SITE_SPA_HISTORY_INJECT,
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

  it("normalizes www host matching", () => {
    expect(isEmbeddedSiteHostAllowed("www.muftyat.kz", MUFTYAT_WEBVIEW_HOSTS)).toBe(true);
    expect(isEmbeddedSiteHostAllowed("cdn.muftyat.kz", MUFTYAT_WEBVIEW_HOSTS)).toBe(true);
  });
});
