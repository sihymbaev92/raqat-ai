import {
  type DashboardNewsItem,
} from "../content/dashboardNewsItems";
import { KB_ARTICLES_OFFLINE_SEED } from "../content/kbArticlesSeed";
import type { KbSiteFilter } from "../types/islamicKb";
import {
  fetchPlatformIslamicKbBrowse,
  fetchPlatformIslamicKbSearch,
  type PlatformIslamicKbArticle,
} from "./platformApiClient";
import { loadOfficialHomeNewsItems } from "./officialSitesBootstrap";
import {
  readOfficialHomeFeedCacheSnapshot,
  type OfficialHomeFeedCacheSnapshot,
} from "../storage/officialHomeFeedCache";
import { getRaqatApiBase } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { getValidAccessToken } from "../storage/authTokens";

export type KbArticlesFeedSource = "api_search" | "api_browse" | "live_scrape" | "cache" | "seed";

export type KbArticlesFeedResult = {
  items: PlatformIslamicKbArticle[];
  source: KbArticlesFeedSource;
  cacheSnapshot: OfficialHomeFeedCacheSnapshot | null;
  error: "network" | "api" | "no_api" | null;
};

const BROWSE_LIMIT = 20;

function filterBySite(items: PlatformIslamicKbArticle[], site: KbSiteFilter): PlatformIslamicKbArticle[] {
  if (!site) return items;
  return items.filter((a) => a.site === site);
}

export function dashboardNewsToArticles(items: DashboardNewsItem[]): PlatformIslamicKbArticle[] {
  return items.map(dashboardNewsToArticle);
}

function dashboardNewsToArticle(item: DashboardNewsItem): PlatformIslamicKbArticle {
  let site = "fatua";
  if (item.id.startsWith("home-muftyat")) site = "muftyat";
  else if (item.id.startsWith("home-fatua")) site = "fatua";
  const docMatch = item.id.match(/^kb-(\d+)$/);
  return {
    document_id: docMatch ? parseInt(docMatch[1]!, 10) : Math.abs(hashCode(item.id)),
    site,
    source_label: item.sourceLabel ?? site,
    title: item.title,
    excerpt: item.subtitle ?? "",
    url: item.articleUrl ?? "",
    image_url: item.imageUrl ?? null,
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/** Мақала тізімі: API → live scrape → кэш → офлайн seed. */
export async function loadKbArticlesFeed(opts: {
  query: string;
  site: KbSiteFilter;
}): Promise<KbArticlesFeedResult> {
  const term = opts.query.trim();
  const base = getRaqatApiBase();
  const cacheSnapshot = await readOfficialHomeFeedCacheSnapshot();

  if (term.length >= 2) {
    if (!base) {
      const cached = filterBySite(
        dashboardNewsToArticles(cacheSnapshot?.items ?? []),
        opts.site
      ).filter((a) => `${a.title}\n${a.excerpt}`.toLowerCase().includes(term.toLowerCase()));
      if (cached.length) {
        return { items: cached, source: "cache", cacheSnapshot, error: "no_api" };
      }
      const seeded = filterBySite(KB_ARTICLES_OFFLINE_SEED, opts.site).filter((a) =>
        `${a.title}\n${a.excerpt}`.toLowerCase().includes(term.toLowerCase())
      );
      return {
        items: seeded,
        source: "seed",
        cacheSnapshot,
        error: seeded.length ? null : "no_api",
      };
    }
    try {
      const bearer = ((await getValidAccessToken()) ?? "").trim();
      const res = await fetchPlatformIslamicKbSearch(base, term, {
        authorizationBearer: bearer || undefined,
        aiSecret: getRaqatContentReadSecret(),
        limit: BROWSE_LIMIT,
        site: opts.site || undefined,
        timeoutMs: 12_000,
      });
      if (res.ok && (res.results?.length ?? 0) > 0) {
        return { items: res.results ?? [], source: "api_search", cacheSnapshot, error: null };
      }
    } catch {
      /* fallback below */
    }
  } else if (opts.site && base) {
    try {
      const bearer = ((await getValidAccessToken()) ?? "").trim();
      const res = await fetchPlatformIslamicKbBrowse(base, {
        authorizationBearer: bearer || undefined,
        aiSecret: getRaqatContentReadSecret(),
        limit: BROWSE_LIMIT,
        site: opts.site,
        timeoutMs: 12_000,
      });
      if (res.ok && (res.results?.length ?? 0) > 0) {
        return { items: res.results ?? [], source: "api_browse", cacheSnapshot, error: null };
      }
    } catch {
      /* fallback below */
    }
  } else if (!term) {
    try {
      const news = await loadOfficialHomeNewsItems();
      const mapped = filterBySite(dashboardNewsToArticles(news), opts.site);
      if (mapped.length) {
        return { items: mapped, source: "live_scrape", cacheSnapshot, error: null };
      }
    } catch {
      /* fallback below */
    }
  }

  const cachedItems = cacheSnapshot?.items?.length
    ? filterBySite(dashboardNewsToArticles(cacheSnapshot.items), opts.site)
    : [];
  if (cachedItems.length) {
    return { items: cachedItems, source: "cache", cacheSnapshot, error: term.length >= 2 ? "network" : null };
  }

  const seed = filterBySite(KB_ARTICLES_OFFLINE_SEED, opts.site);
  return {
    items: seed,
    source: "seed",
    cacheSnapshot,
    error: seed.length ? null : "network",
  };
}

export function kbFeedSourceLabel(source: KbArticlesFeedSource): string {
  switch (source) {
    case "api_search":
    case "api_browse":
      return "ҚМДБ индекс";
    case "live_scrape":
      return "Ресми сайт";
    case "cache":
      return "Сақталған тізім";
    case "seed":
      return "Офлайн үзінді";
    default:
      return source;
  }
}
