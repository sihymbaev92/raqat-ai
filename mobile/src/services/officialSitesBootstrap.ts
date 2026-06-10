import {
  DASHBOARD_NEWS_BROWSE_LIMIT,
  officialHomeFeedToDashboardNewsItem,
  platformHomeFeedToDashboardNewsItem,
  type DashboardNewsItem,
} from "../content/dashboardNewsItems";
import { fetchOfficialSiteHomeFeeds } from "./officialSiteHomeFeed";
import {
  fetchPlatformHomeNewsFeed,
  type PlatformHomeFeedItem,
  type PlatformHomeFeedResponse,
} from "./platformApiClient";
import { getRaqatApiBase, hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { getValidAccessToken } from "../storage/authTokens";
import { writeOfficialHomeFeedCache } from "../storage/officialHomeFeedCache";

let prefetchInFlight: Promise<DashboardNewsItem[] | null> | null = null;

function mapDirect(items: Awaited<ReturnType<typeof fetchOfficialSiteHomeFeeds>>) {
  return items.map(officialHomeFeedToDashboardNewsItem);
}

function mapApi(items: PlatformHomeFeedItem[]) {
  return items.map(platformHomeFeedToDashboardNewsItem);
}

function newsFeedScore(items: DashboardNewsItem[]): number {
  const withImage = items.filter((i) => Boolean((i.imageUrl ?? "").trim())).length;
  return withImage * 10 + items.length;
}

/** API ok=false болса бос; API vs direct — картинкасы көп/ұзын тізім жеңеді. */
export function pickRicherOfficialNewsFeed(
  apiRes: PlatformHomeFeedResponse,
  apiItems: DashboardNewsItem[],
  directItems: DashboardNewsItem[]
): DashboardNewsItem[] {
  if (apiRes.ok === false) return directItems;
  if (directItems.length === 0) return apiItems;
  if (apiItems.length === 0) return directItems;
  return newsFeedScore(apiItems) >= newsFeedScore(directItems) ? apiItems : directItems;
}

/** API proxy → тікелей сайт fetch (fatua.kz + muftyat.kz). */
export async function loadOfficialHomeNewsItems(): Promise<DashboardNewsItem[]> {
  await hydrateRaqatApiBaseOverride();
  const apiBase = getRaqatApiBase();
  const bearer = ((await getValidAccessToken()) ?? "").trim();
  const common = {
    authorizationBearer: bearer || undefined,
    aiSecret: getRaqatContentReadSecret(),
    timeoutMs: 15_000,
  };

  const [apiRes, directFeeds] = await Promise.all([
    apiBase
      ? fetchPlatformHomeNewsFeed(apiBase, { ...common, limit: DASHBOARD_NEWS_BROWSE_LIMIT }).catch(
          () => ({ ok: false as const, results: [] as PlatformHomeFeedItem[] })
        )
      : Promise.resolve({ ok: false as const, results: [] as PlatformHomeFeedItem[] }),
    fetchOfficialSiteHomeFeeds(DASHBOARD_NEWS_BROWSE_LIMIT).catch(() => []),
  ]);

  const apiItems = mapApi(apiRes.results ?? []);
  const directItems = mapDirect(directFeeds);
  const items = pickRicherOfficialNewsFeed(apiRes, apiItems, directItems);
  if (items.length > 0) {
    void writeOfficialHomeFeedCache(items);
  }
  return items;
}

/** Қолданба іске қосылғанда — жаңалықтар кэшін алдын ала толтыру. */
export function prefetchOfficialHomeNewsFeed(): Promise<DashboardNewsItem[] | null> {
  if (prefetchInFlight) return prefetchInFlight;
  prefetchInFlight = (async () => {
    try {
      const items = await loadOfficialHomeNewsItems();
      return items.length > 0 ? items : null;
    } catch {
      return null;
    } finally {
      prefetchInFlight = null;
    }
  })();
  return prefetchInFlight;
}
