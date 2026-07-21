import {
  officialIslamicSourceHomeUrl,
  officialSiteLocalePath,
} from "./officialIslamicSources";
import { MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT } from "../components/embeddedOfficialSiteNavigation";
import { FATUA_KZ_LABEL_KK, kk, MUFTYAT_KZ_LABEL_KK } from "../i18n/kk";
import { getCurrentLocale } from "../i18n/runtime";

export type KmdbHubWebTabId = "muftyat" | "fatua" | "mosques";

export type KmdbHubWebTabDef = {
  id: KmdbHubWebTabId;
  label: string;
  url: string;
  title: string;
  userAgentTag: string;
};

export const KMDB_HUB_WEB_TAB_DEFAULT: KmdbHubWebTabId = "muftyat";

export function getKmdbHubWebTabs(): KmdbHubWebTabDef[] {
  const locale = getCurrentLocale();
  const muftyatPath = officialSiteLocalePath(locale, "muftyat");
  return [
    {
      id: "muftyat",
      label: kk.kmdbHub.tabMuftyat,
      url: officialIslamicSourceHomeUrl("muftyat", locale),
      title: MUFTYAT_KZ_LABEL_KK,
      userAgentTag: "RaqatMuftyat/1",
    },
    {
      id: "fatua",
      label: kk.kmdbHub.tabFatua,
      url: officialIslamicSourceHomeUrl("fatua", locale),
      title: FATUA_KZ_LABEL_KK,
      userAgentTag: "RaqatFatua/1",
    },
    {
      id: "mosques",
      label: kk.kmdbHub.tabMosques,
      url: `https://www.muftyat.kz/${muftyatPath}/mosques/`,
      title: kk.kmdbHub.tabMosques,
      userAgentTag: "RaqatMuftyat/1",
    },
  ];
}

export function kmdbHubWebTabById(
  tabId: KmdbHubWebTabId,
  tabs: readonly KmdbHubWebTabDef[] = getKmdbHubWebTabs()
): KmdbHubWebTabDef {
  return tabs.find((tab) => tab.id === tabId) ?? tabs[0]!;
}

export function kmdbHubWebTabAllowedHosts(tabId: KmdbHubWebTabId): readonly string[] {
  return tabId === "fatua" ? ["fatua.kz"] : ["muftyat.kz", "fatua.kz"];
}

export function kmdbHubWebTabUsesWebView(tabId: KmdbHubWebTabId): boolean {
  return tabId !== "mosques";
}

/** Muftyat.kz — намаз жолағын WebView-та жасыру (қолданбада намaz модулі бар). */
export function kmdbHubWebTabExtraPageInject(tabId: KmdbHubWebTabId): string | undefined {
  return tabId === "muftyat" ? MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT : undefined;
}

export function kmdbHubWebTabSitePresentation(
  tabId: KmdbHubWebTabId,
  windowWidth?: number
): "mobile" | "desktop" {
  if (tabId !== "muftyat") return "mobile";
  if (windowWidth != null && windowWidth >= 900) return "desktop";
  return "mobile";
}
