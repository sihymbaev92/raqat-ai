import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../config/officialIslamicSources";
import { prefetchMosques2gisCatalog } from "../data/mosques2gisCatalog";
import { halalDamuSiteHomeUrl } from "../api/halalDamuWp";
import { runWhenHeavyWorkAllowed } from "../utils/uiDefer";

let moreStackWarm: Promise<void> | null = null;
let kmdbWarm: Promise<void> | null = null;
let halalWarm: Promise<void> | null = null;

function warmMoreStack(): Promise<void> {
  if (!moreStackWarm) {
    moreStackWarm = Promise.all([
      import("../navigation/MoreStack"),
      import("../components/OfficialSiteFullWebView"),
      import("../screens/OfficialIslamicWebScreen"),
    ]).then(() => undefined);
  }
  return moreStackWarm;
}

/** Бір URL үшін DNS/TLS + WebView chunk (basу алдында). */
export function warmOfficialSiteUrl(url: string): void {
  const raw = url.trim();
  if (!raw) return;
  const lower = raw.toLowerCase();
  if (lower.includes("halaldamu.kz")) {
    warmHalalHubScreen();
    void import("../components/officialSiteWebViewReload").then((m) =>
      m.prefetchOfficialSiteWebPages([raw])
    );
    return;
  }
  if (lower.includes("fatua.kz") || lower.includes("muftyat.kz")) {
    warmKmdbHubScreen();
    void import("../components/officialSiteWebViewReload").then((m) =>
      m.prefetchOfficialSiteWebPages([raw])
    );
  }
}

function ensureKmdbWarm(): Promise<void> {
  if (!kmdbWarm) {
    kmdbWarm = warmMoreStack()
      .then(() =>
        Promise.all([
          import("../screens/KmdbHubScreen"),
          import("../components/OfficialSiteFullWebView"),
          import("../components/kmdb/NearbyMosquesPanel"),
        ])
      )
      .then(async () => {
        await runWhenHeavyWorkAllowed();
        void import("../components/officialSiteWebViewReload").then((m) =>
          m.prefetchOfficialSiteWebPages([MUFTYAT_KK_HOME_URL, FATUA_KK_HOME_URL])
        );
        void prefetchMosques2gisCatalog();
      })
      .then(() => undefined)
      .catch(() => undefined);
  }
  return kmdbWarm;
}

/** Dashboard «ҚМДБ» батырмасын basу алдында — chunk + muftyat/fatua DNS/TLS + мешіт каталогы. */
export function warmKmdbHubScreen(): void {
  void ensureKmdbWarm();
}

function ensureHalalWarm(): Promise<void> {
  if (!halalWarm) {
    const siteUrl = halalDamuSiteHomeUrl();
    void import("../components/officialSiteWebViewReload").then((m) =>
      m.prefetchOfficialSiteWebPages([siteUrl])
    );
    halalWarm = warmMoreStack()
      .then(() =>
        Promise.all([
          import("../screens/HalalScreen"),
          import("../components/OfficialSiteFullWebView"),
        ])
      )
      .then(async () => {
        await runWhenHeavyWorkAllowed();
        const m = await import("../services/halalHubBootstrap");
        // Каталогты навигациядан кейін — басуды бөгемеу
        m.getHalalHubInstantCatalog();
        void m.prefetchHalalDamuHub();
      })
      .then(() => undefined)
      .catch(() => undefined);
  }
  return halalWarm;
}

/** Dashboard «Halal Damu» батырмасын basу алдында. */
export function warmHalalHubScreen(): void {
  void ensureHalalWarm();
}
