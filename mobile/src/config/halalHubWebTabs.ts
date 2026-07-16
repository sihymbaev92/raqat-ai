import { kk } from "../i18n/kk";

export type HalalHubWebTabId = "site" | "institutions" | "map" | "verify";

export type HalalHubWebTabDef = {
  id: HalalHubWebTabId;
  label: string;
};

/** Скриншот: «Мекемелер» — негізгі каталог табы. */
export const HALAL_HUB_WEB_TAB_DEFAULT: HalalHubWebTabId = "institutions";

export function getHalalHubWebTabs(): HalalHubWebTabDef[] {
  return [
    { id: "site", label: kk.features.halalTabSite },
    { id: "institutions", label: kk.features.halalTabInstitutions },
    { id: "map", label: kk.features.halalTabMap },
    { id: "verify", label: kk.features.halalTabVerify },
  ];
}

export function halalHubWebTabById(
  tabId: HalalHubWebTabId,
  tabs: readonly HalalHubWebTabDef[] = getHalalHubWebTabs(),
): HalalHubWebTabDef {
  return tabs.find((tab) => tab.id === tabId) ?? tabs[0]!;
}

export function halalHubWebTabUsesWebView(tabId: HalalHubWebTabId): boolean {
  return tabId === "site";
}
