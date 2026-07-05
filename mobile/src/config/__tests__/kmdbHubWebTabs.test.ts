import {

  FATUA_KK_HOME_URL,

  MUFTYAT_KK_HOME_URL,

  MUFTYAT_KK_MOSQUES_MAP_URL,

} from "../officialIslamicSources";

import {

  getKmdbHubWebTabs,

  KMDB_HUB_WEB_TAB_DEFAULT,

  kmdbHubWebTabById,

  kmdbHubWebTabAllowedHosts,

  kmdbHubWebTabExtraPageInject,

  kmdbHubWebTabSitePresentation,

  kmdbHubWebTabUsesWebView,

} from "../kmdbHubWebTabs";



describe("kmdbHubWebTabs", () => {

  it("exposes muftyat, fatua and mosques tabs in order", () => {

    const tabs = getKmdbHubWebTabs();



    expect(tabs.map((tab) => tab.id)).toEqual(["muftyat", "fatua", "mosques"]);

    expect(tabs[0].url).toBe(MUFTYAT_KK_HOME_URL);

    expect(tabs[1].url).toBe(FATUA_KK_HOME_URL);

    expect(tabs[2].label).toBe("Мешіттер");

    expect(tabs[2].url).toBe(MUFTYAT_KK_MOSQUES_MAP_URL);

  });



  it("defaults to muftyat tab", () => {

    expect(KMDB_HUB_WEB_TAB_DEFAULT).toBe("muftyat");

    expect(kmdbHubWebTabById(KMDB_HUB_WEB_TAB_DEFAULT).id).toBe("muftyat");

  });



  it("labels every tab", () => {

    for (const tab of getKmdbHubWebTabs()) {

      expect(tab.label.trim().length).toBeGreaterThan(2);

      expect(tab.title.trim().length).toBeGreaterThan(2);

      expect(kmdbHubWebTabAllowedHosts(tab.id).length).toBeGreaterThan(0);

    }

  });



  it("uses native mosques pane instead of webview for mosques tab", () => {

    expect(kmdbHubWebTabUsesWebView("muftyat")).toBe(true);

    expect(kmdbHubWebTabUsesWebView("fatua")).toBe(true);

    expect(kmdbHubWebTabUsesWebView("mosques")).toBe(false);

  });



  it("hides muftyat prayer bar in embedded webview", () => {
    expect(kmdbHubWebTabExtraPageInject("muftyat")).toContain("raqat-muftyat-hide-prayer");
    expect(kmdbHubWebTabExtraPageInject("mosques")).toBeUndefined();
    expect(kmdbHubWebTabExtraPageInject("fatua")).toBeUndefined();
  });

  it("uses desktop presentation for muftyat on wide screens only", () => {
    expect(kmdbHubWebTabSitePresentation("muftyat", 720)).toBe("desktop");
    expect(kmdbHubWebTabSitePresentation("muftyat", 400)).toBe("mobile");
    expect(kmdbHubWebTabSitePresentation("fatua")).toBe("mobile");
    expect(kmdbHubWebTabSitePresentation("mosques")).toBe("mobile");
  });

});

