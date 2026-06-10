import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { getRaqatApiBase, hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import {
  fetchPlatformIslamicKbBrowse,
  type PlatformIslamicKbArticle,
  type PlatformIslamicKbBrowseResponse,
} from "../services/platformApiClient";
import { loadOfficialHomeNewsItems } from "../services/officialSitesBootstrap";
import { getValidAccessToken } from "../storage/authTokens";
import { readOfficialHomeFeedCache, OFFICIAL_HOME_FEED_TTL_MS } from "../storage/officialHomeFeedCache";
import {
  DASHBOARD_NEWS_BROWSE_LIMIT,
  buildDashboardKurbanAitNewsItems,
  interleaveDashboardKbArticles,
  kbArticleToDashboardNewsItem,
  kbArticlesWithImages,
  type DashboardNewsItem,
} from "../content/dashboardNewsItems";

type State = {
  items: DashboardNewsItem[];
  loading: boolean;
  usingFallback: boolean;
};

function mapKbArticles(articles: PlatformIslamicKbArticle[]) {
  return kbArticlesWithImages(articles).map(kbArticleToDashboardNewsItem);
}

/** API ok=false болса бос; ok жоқ болса results қолданылады. */
export function kbBrowseArticles(res: PlatformIslamicKbBrowseResponse): PlatformIslamicKbArticle[] {
  if (res.ok === false) return [];
  return res.results ?? [];
}

export function useDashboardNewsItems(): State {
  const [items, setItems] = useState<DashboardNewsItem[]>(() => buildDashboardKurbanAitNewsItems());
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(true);
  const loadSeqRef = useRef(0);

  const applyFallback = useCallback(() => {
    setItems(buildDashboardKurbanAitNewsItems());
    setUsingFallback(true);
  }, []);

  const loadFromKbBrowse = useCallback(async (): Promise<DashboardNewsItem[]> => {
    await hydrateRaqatApiBaseOverride();
    const apiBase = getRaqatApiBase();
    if (!apiBase) return [];

    const bearer = ((await getValidAccessToken()) ?? "").trim();
    const common = {
      authorizationBearer: bearer || undefined,
      aiSecret: getRaqatContentReadSecret(),
      timeoutMs: 15_000,
      limit: DASHBOARD_NEWS_BROWSE_LIMIT * 2,
    };

    const [fatuaRes, muftyatRes] = await Promise.all([
      fetchPlatformIslamicKbBrowse(apiBase, { ...common, site: "fatua" }),
      fetchPlatformIslamicKbBrowse(apiBase, { ...common, site: "muftyat" }),
    ]);
    const merged = interleaveDashboardKbArticles(
      sortArticlesWithImagesFirst(kbBrowseArticles(fatuaRes)),
      sortArticlesWithImagesFirst(kbBrowseArticles(muftyatRes))
    );
    return mapKbArticles(merged);
  }, []);

  const load = useCallback(async () => {
    const seq = ++loadSeqRef.current;
    setLoading(true);
    try {
      const cached = await readOfficialHomeFeedCache();
      if (seq !== loadSeqRef.current) return;
      const hasCached = Boolean(cached?.length);
      if (cached?.length) {
        // Кэш экранды тез толтырады, бірақ жаңа ресми feed-ті бәрібір сұраймыз.
        setItems(cached);
        setUsingFallback(false);
        setLoading(false);
      }

      const officialItems = await loadOfficialHomeNewsItems().catch(() => [] as DashboardNewsItem[]);
      if (seq !== loadSeqRef.current) return;
      if (officialItems.length > 0) {
        setItems(officialItems);
        setUsingFallback(false);
        return;
      }

      const kbItems = await loadFromKbBrowse().catch(() => [] as DashboardNewsItem[]);
      if (seq !== loadSeqRef.current) return;
      if (kbItems.length > 0) {
        setItems(kbItems);
        setUsingFallback(false);
        return;
      }

      if (!hasCached) {
        applyFallback();
      }
    } catch {
      if (seq === loadSeqRef.current) applyFallback();
    } finally {
      if (seq === loadSeqRef.current) setLoading(false);
    }
  }, [applyFallback, loadFromKbBrowse]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), OFFICIAL_HOME_FEED_TTL_MS);
    const onAppState = (next: AppStateStatus) => {
      if (next === "active") void load();
    };
    const sub = AppState.addEventListener("change", onAppState);
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [load]);

  return { items, loading, usingFallback };
}

export function sortArticlesWithImagesFirst(
  articles: PlatformIslamicKbArticle[]
): PlatformIslamicKbArticle[] {
  return [...articles].sort((a, b) => {
    const aImg = Boolean((a.image_url ?? "").trim());
    const bImg = Boolean((b.image_url ?? "").trim());
    if (aImg === bImg) return 0;
    return aImg ? -1 : 1;
  });
}
