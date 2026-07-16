import { Linking } from "react-native";
import { halalDamuSiteHomeUrl } from "../api/halalDamuWp";
import {
  navigateToMoreStackScreen,
  type StackNavLike,
} from "../navigation/navigateToMoreStack";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../navigation/types";
import {
  openOfficialIslamicWeb,
  officialIslamicSiteFromUrl,
} from "../navigation/openOfficialIslamicWeb";
import type { KmdbHubWebTabId } from "./kmdbHubWebTabs";
import { getBundledRaqatApiBase } from "./raqatApiBase";
import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "./officialIslamicSources";
import { warmOfficialSiteUrl } from "../services/hubScreenWarmup";

const OFFICIAL_HOSTS = new Set(["fatua.kz", "muftyat.kz", "imgs.muftyat.kz"]);

export function normalizeOfficialSiteHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

export function isOfficialIslamicSiteUrl(url: string | null | undefined): boolean {
  const raw = (url ?? "").trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    return OFFICIAL_HOSTS.has(normalizeOfficialSiteHost(parsed.hostname));
  } catch {
    return false;
  }
}

export function isOfficialSiteProxyUrl(url: string | null | undefined): boolean {
  const raw = (url ?? "").trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.pathname.includes("/api/v1/official-site/proxy");
  } catch {
    return false;
  }
}

/** VPS API арқылы fatua/muftyat — ISP/WebView «соединение» қатесін айналдыру. */
export function resolveOfficialSiteEmbedUrl(
  originalUrl: string,
  apiBase?: string | null
): string {
  const raw = (originalUrl ?? "").trim();
  if (!raw || !isOfficialIslamicSiteUrl(raw) || isOfficialSiteProxyUrl(raw)) {
    return raw;
  }
  const base = (apiBase ?? getBundledRaqatApiBase() ?? "https://api.rahatomir.com").replace(/\/+$/, "");
  if (!base) return raw;
  return `${base}/api/v1/official-site/proxy?url=${encodeURIComponent(raw)}`;
}

/** WebView навигация: тікелей fatua/muftyat сілтемесін proxy URL-ге ауыстыру. */
export function coerceOfficialSiteNavigationUrl(
  nextUrl: string,
  apiBase?: string | null
): string {
  if (isOfficialSiteProxyUrl(nextUrl)) return nextUrl;
  if (!isOfficialIslamicSiteUrl(nextUrl)) return nextUrl;
  return resolveOfficialSiteEmbedUrl(nextUrl, apiBase);
}

export const OFFICIAL_SITE_PROXY_HOSTS = ["api.rahatomir.com", "rahatomir.com"] as const;

function normalizeSiteHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function isHalalDamuSiteUrl(url: string): boolean {
  const h = normalizeSiteHost(url);
  return h === "halaldamu.kz" || h.endsWith(".halaldamu.kz");
}

export function isFatuaSiteUrl(url: string): boolean {
  const h = normalizeSiteHost(url);
  return h === "fatua.kz" || h.endsWith(".fatua.kz");
}

export function isMuftyatSiteUrl(url: string): boolean {
  const h = normalizeSiteHost(url);
  return h === "muftyat.kz" || h.endsWith(".muftyat.kz");
}

function isOfficialPartnerHomeUrl(url: string): boolean {
  const raw = url.trim().replace(/\/+$/, "");
  return (
    raw === FATUA_KK_HOME_URL.replace(/\/+$/, "") ||
    raw === MUFTYAT_KK_HOME_URL.replace(/\/+$/, "") ||
    raw === halalDamuSiteHomeUrl().replace(/\/+$/, "")
  );
}

function kmdbHubTabForUrl(url: string): KmdbHubWebTabId {
  return isFatuaSiteUrl(url) ? "fatua" : "muftyat";
}

/** Сыртқы браузер — header «open-in-new» үшін. */
export function openOfficialSiteExternally(url: string): void {
  const raw = (url ?? "").trim();
  if (!raw) return;
  void Linking.openURL(raw).catch(() => {});
}

/**
 * Fatua.kz / Muftyat.kz / halaldamu.kz — қолданба ішіндегі WebView (жылдам, жарнамасыз).
 * Navigation жоқ болса — сыртқы браузер.
 */
export function openOfficialSiteInApp(url: string, navigation?: StackNavLike): void {
  const raw = (url ?? "").trim();
  if (!raw) return;

  if (!navigation) {
    openOfficialSiteExternally(raw);
    return;
  }

  void warmOfficialSiteUrl(raw);

  if (isHalalDamuSiteUrl(raw)) {
    navigateToMoreStackScreen(
      "Halal",
      { initialTab: "site", siteUrl: raw },
      navigation
    );
    return;
  }

  if (isFatuaSiteUrl(raw) || isMuftyatSiteUrl(raw)) {
    if (isOfficialPartnerHomeUrl(raw)) {
      navigateToMoreStackScreen(
        "KmdbHub",
        { initialTab: kmdbHubTabForUrl(raw) },
        navigation
      );
      return;
    }
    openOfficialIslamicWeb(
      navigation as NativeStackNavigationProp<MoreStackParamList>,
      officialIslamicSiteFromUrl(raw),
      raw
    );
    return;
  }

  openOfficialSiteExternally(raw);
}
