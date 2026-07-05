import {
  MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT,
  OFFICIAL_SITE_DESKTOP_CHROME_BASE,
  OFFICIAL_SITE_DESKTOP_VIEWPORT_INJECT,
  OFFICIAL_SITE_SPA_HISTORY_INJECT,
  buildOfficialSiteUserAgent,
} from "../embeddedOfficialSiteNavigation";

describe("embeddedOfficialSiteNavigation desktop embed", () => {
  it("exports desktop UA builder for muftyat full-site embed", () => {
    expect(buildOfficialSiteUserAgent("RaqatMuftyat/1", "desktop")).toContain(
      OFFICIAL_SITE_DESKTOP_CHROME_BASE
    );
    expect(OFFICIAL_SITE_DESKTOP_VIEWPORT_INJECT).toContain("minimum-scale=0.2");
    expect(OFFICIAL_SITE_SPA_HISTORY_INJECT).toContain("__raqatSpaHistory");
  });

  it("exports muftyat prayer bar hide inject", () => {
    expect(MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT).toContain(".top_header");
    expect(MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT).toContain("__raqatMuftyatHidePrayer");
  });
});
