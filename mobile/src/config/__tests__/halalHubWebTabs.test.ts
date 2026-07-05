import { getHalalHubWebTabs, HALAL_HUB_WEB_TAB_DEFAULT, halalHubWebTabById, halalHubWebTabUsesWebView } from "../halalHubWebTabs";



describe("halalHubWebTabs", () => {

  it("exposes site, institutions and verify tabs in order", () => {

    const tabs = getHalalHubWebTabs();

    expect(tabs.map((tab) => tab.id)).toEqual(["site", "institutions", "verify"]);

    expect(tabs[0]?.label).toBe("halaldamu.kz");

    expect(tabs[1]?.label).toBe("Мекемелер");

    expect(tabs[2]?.label).toBe("Тексеру");

  });



  it("defaults to institutions tab", () => {

    expect(HALAL_HUB_WEB_TAB_DEFAULT).toBe("institutions");

    expect(halalHubWebTabById(HALAL_HUB_WEB_TAB_DEFAULT).id).toBe("institutions");

  });



  it("labels every tab", () => {

    for (const tab of getHalalHubWebTabs()) {

      expect(tab.label.trim().length).toBeGreaterThan(2);

    }

  });



  it("uses webview only on site tab", () => {

    expect(halalHubWebTabUsesWebView("site")).toBe(true);

    expect(halalHubWebTabUsesWebView("institutions")).toBe(false);

    expect(halalHubWebTabUsesWebView("verify")).toBe(false);

  });

});

