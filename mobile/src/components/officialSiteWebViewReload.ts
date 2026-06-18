import { NativeModules, Platform } from "react-native";

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
