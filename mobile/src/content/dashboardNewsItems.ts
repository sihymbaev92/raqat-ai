import type { ImageSourcePropType } from "react-native";
import { KURBAN_AIT_DASHBOARD_HERO } from "./kurbanAitBlockContent";
import { getKurbanAitDashboardTopics } from "./kurbanAitDashboardTopics";
import type { PlatformIslamicKbArticle, PlatformHomeFeedItem } from "../services/platformApiClient";
import type { OfficialHomeFeedItem } from "../services/officialSiteHomeFeed";
import type { MoreStackParamList } from "../navigation/types";
import { upgradeRemoteFeedImageUrl } from "../utils/remoteImageUrlQuality";

export type DashboardNewsTarget = {
  screen: keyof MoreStackParamList;
  params?: MoreStackParamList[keyof MoreStackParamList];
};

export type DashboardNewsItem = {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  imageUrl?: string | null;
  sourceLabel?: string;
  articleUrl?: string | null;
  target?: DashboardNewsTarget;
};

/** API жоқ/бос болса — Құрбан айт тақырыптары (офлайн fallback). */
export function buildDashboardKurbanAitNewsItems(): DashboardNewsItem[] {
  return getKurbanAitDashboardTopics().map((topic) => ({
    id: topic.id,
    title: topic.title,
    subtitle: topic.subtitle ?? "",
    image: KURBAN_AIT_DASHBOARD_HERO,
    target: {
      screen: "KurbanAit",
      params: { focusSectionId: topic.id },
    },
  }));
}

/** Fatua/Muftyat мақаласын карусель элементіне айналдыру. */
export function kbArticleToDashboardNewsItem(a: PlatformIslamicKbArticle): DashboardNewsItem {
  const imageUrlRaw = (a.image_url ?? "").trim() || null;
  const imageUrl = imageUrlRaw ? upgradeRemoteFeedImageUrl(imageUrlRaw) : null;
  return {
    id: `kb-${a.document_id}`,
    title: a.title,
    subtitle: a.excerpt?.trim() || a.source_label,
    image: imageUrl ? { uri: imageUrl } : KURBAN_AIT_DASHBOARD_HERO,
    imageUrl,
    sourceLabel: a.source_label,
    articleUrl: a.url,
  };
}

/** API home-feed → карусель элементі. */
export function platformHomeFeedToDashboardNewsItem(
  item: PlatformHomeFeedItem,
  index: number
): DashboardNewsItem {
  return officialHomeFeedToDashboardNewsItem(
    {
      site: item.site,
      sourceLabel: item.source_label,
      title: item.title,
      subtitle: item.subtitle ?? item.source_label,
      url: item.url,
      imageUrl: item.image_url,
    },
    index
  );
}

/** fatua.kz / muftyat.kz басты бет каруселі. */
export function officialHomeFeedToDashboardNewsItem(
  item: OfficialHomeFeedItem,
  index: number
): DashboardNewsItem {
  const imageUrl = upgradeRemoteFeedImageUrl(item.imageUrl);
  return {
    id: `home-${item.site}-${index}-${item.url}`,
    title: item.title,
    subtitle: item.subtitle || item.sourceLabel,
    image: { uri: imageUrl },
    imageUrl,
    sourceLabel: item.sourceLabel,
    articleUrl: item.url,
  };
}

/** Тек суреті бар KB мақалалары. */
export function kbArticlesWithImages(
  articles: PlatformIslamicKbArticle[]
): PlatformIslamicKbArticle[] {
  return articles.filter((a) => Boolean((a.image_url ?? "").trim()));
}

/** Fatua → Muftyat → Fatua… чередование. */
export function interleaveDashboardKbArticles(
  fatua: PlatformIslamicKbArticle[],
  muftyat: PlatformIslamicKbArticle[]
): PlatformIslamicKbArticle[] {
  const out: PlatformIslamicKbArticle[] = [];
  const max = Math.max(fatua.length, muftyat.length);
  for (let i = 0; i < max; i += 1) {
    if (fatua[i]) out.push(fatua[i]!);
    if (muftyat[i]) out.push(muftyat[i]!);
  }
  return out;
}

/** Карусель ауысым интервалы (ms). */
export const DASHBOARD_NEWS_ROTATE_MS = 7000;

export const DASHBOARD_NEWS_BROWSE_LIMIT = 6;
