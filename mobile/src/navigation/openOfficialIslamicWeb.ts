import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OfficialIslamicSourceId } from "../config/officialIslamicSources";
import type { MoreStackParamList } from "./types";

export function officialIslamicSiteFromUrl(url: string): OfficialIslamicSourceId {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("fatua.kz")) return "fatua";
  } catch {
    /* ignore invalid url */
  }
  return "muftyat";
}

export function openOfficialIslamicWeb(
  navigation: NativeStackNavigationProp<MoreStackParamList>,
  site: OfficialIslamicSourceId,
  url?: string
): void {
  const trimmed = url?.trim();
  navigation.navigate("OfficialIslamicWeb", {
    site,
    url: trimmed || undefined,
  });
}

export function openOfficialIslamicWebFromUrl(
  navigation: NativeStackNavigationProp<MoreStackParamList>,
  url: string
): void {
  openOfficialIslamicWeb(navigation, officialIslamicSiteFromUrl(url), url);
}
