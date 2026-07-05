import {
  DASHBOARD_NEWS_BROWSE_LIMIT,
  officialHomeFeedToDashboardNewsItem,
  type DashboardNewsItem,
} from "../content/dashboardNewsItems";
import { fetchOfficialSiteHomeFeeds } from "./officialSiteHomeFeed";
import { writeOfficialHomeFeedCache } from "../storage/officialHomeFeedCache";

let prefetchInFlight: Promise<DashboardNewsItem[] | null> | null = null;

function mapDirect(items: Awaited<ReturnType<typeof fetchOfficialSiteHomeFeeds>>) {
  return items.map(officialHomeFeedToDashboardNewsItem);
}

/**
 * Fatua/Muftyat жаңалықтары — HTML parse.
 * Native: тікелей сайт; web/CORS: `/api/v1/official-site/proxy` (JWT/AI жоқ).
 */
export async function loadOfficialHomeNewsItems(): Promise<DashboardNewsItem[]> {
  const directFeeds = await fetchOfficialSiteHomeFeeds(DASHBOARD_NEWS_BROWSE_LIMIT).catch(() => []);
  const items = mapDirect(directFeeds);
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
