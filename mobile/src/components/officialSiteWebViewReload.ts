import { NativeModules, Platform } from "react-native";
import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../config/officialIslamicSources";
import { halalDamuSiteHomeUrl } from "../api/halalDamuWp";
import {
  OFFICIAL_SITE_MOBILE_VIEWPORT_INJECT,
  OFFICIAL_SITE_SPA_HISTORY_INJECT,
} from "./embeddedOfficialSiteNavigation";

/** Viewport + SPA history — service worker purge жоқ (жылдам бірінші жүктеу). */
export const OFFICIAL_SITE_FAST_BEFORE_LOAD_INJECT = `${OFFICIAL_SITE_MOBILE_VIEWPORT_INJECT}\n${OFFICIAL_SITE_SPA_HISTORY_INJECT}`;

/** ҚМДБ + Halal Damu басты беттер — DNS/TLS/HTML warm-up. */
export const OFFICIAL_SITE_PREFETCH_URLS = [
  halalDamuSiteHomeUrl(),
  MUFTYAT_KK_HOME_URL,
  FATUA_KK_HOME_URL,
] as const;

const prefetchInflight = new Map<string, Promise<void>>();

/** Желіні алдын ала қыздыру (WebView аскылмай тұрып). */
export async function prefetchOfficialSiteWebPages(
  urls: readonly string[] = OFFICIAL_SITE_PREFETCH_URLS
): Promise<void> {
  const list = urls.filter(Boolean);
  if (list.length === 0) return;

  if (Platform.OS === "android") {
    try {
      const mod = NativeModules.PrayerWidget as
        | { warmupOfficialSiteUrls?: (urls: string[]) => Promise<boolean> }
        | undefined;
      if (mod?.warmupOfficialSiteUrls) {
        void mod.warmupOfficialSiteUrls([...list]).catch(() => undefined);
      }
    } catch {
      /* native модуль жоқ */
    }
  }

  await Promise.allSettled(
    list.map((url) => {
      const hit = prefetchInflight.get(url);
      if (hit) return hit;
      const task = (async () => {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 8_000);
          await fetch(url, {
            method: "GET",
            signal: ctrl.signal,
            headers: { Accept: "text/html,application/xhtml+xml" },
          });
          clearTimeout(timer);
        } catch {
          /* best-effort */
        } finally {
          prefetchInflight.delete(url);
        }
      })();
      prefetchInflight.set(url, task);
      return task;
    })
  );
}

/** Қолмен жаңарту кезінде кэштен аулақ болу үшін URL-ге уақыт белгісі. */
export function withEmbeddedSiteCacheBust(url: string, bustToken: number): string {
  if (!url || bustToken <= 0) return url;
  const hashIdx = url.indexOf("#");
  const base = hashIdx >= 0 ? url.slice(0, hashIdx) : url;
  const hash = hashIdx >= 0 ? url.slice(hashIdx) : "";
  const sep = base.includes("?") ? "&" : "?";
  const nonce = bustToken % 1_000_000;
  return `${base}${sep}_raqat=${bustToken}&_nc=${nonce}${hash}`;
}

/** HTTP сұрауына — CDN/прокси кэшін айналып өту. */
export const OFFICIAL_SITE_NO_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

/** WordPress/Elementor service worker + Cache API — ескі бетті ұстап қалмауы үшін. */
export const OFFICIAL_SITE_SW_CACHE_PURGE_INJECT = `
(function () {
  try {
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        regs.forEach(function (r) {
          try { r.unregister(); } catch (e) {}
        });
      });
    }
    if (window.caches && caches.keys) {
      caches.keys().then(function (keys) {
        keys.forEach(function (k) {
          try { caches.delete(k); } catch (e) {}
        });
      });
    }
  } catch (e) {}
})();
true;
`;

/** Android WebView диск кэшін тазалау (барлық қолданба WebView үшін). */
export async function clearOfficialSiteWebCache(): Promise<void> {
  if (Platform.OS !== "android") return;
  try {
    const mod = NativeModules.PrayerWidget as { clearOfficialSiteWebCache?: () => Promise<void> } | undefined;
    if (mod?.clearOfficialSiteWebCache) {
      await mod.clearOfficialSiteWebCache();
    }
  } catch {
    /* native модуль жоқ болса — JS reload жеткілікті */
  }
}
