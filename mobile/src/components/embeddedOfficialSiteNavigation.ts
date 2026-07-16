import { Linking } from "react-native";

const EXTERNAL_SCHEME_RE =
  /^(?:tel|mailto|sms|intent|whatsapp|tg|geo|market|viber|fb|fb-messenger):/i;

/** Әлеуметтік бейне / дүкен — әрқашан сыртқы браузер. */
export const HALAL_DAMU_WEBVIEW_HOSTS = ["halaldamu.kz"] as const;
/** Muftyat ішіндегі fatua.kz сілтемелері қолданба ішінде қалады. */
export const MUFTYAT_WEBVIEW_HOSTS = ["muftyat.kz", "fatua.kz"] as const;
/** Fatua ресми сайты (жеке allowlist). */
export const FATUA_WEBVIEW_HOSTS = ["fatua.kz"] as const;

/** EmbeddedSiteSheet / AI сілтемелері — тек ресми host allowlist. */
export const DEFAULT_EMBEDDED_SITE_HOSTS = [
  ...HALAL_DAMU_WEBVIEW_HOSTS,
  ...MUFTYAT_WEBVIEW_HOSTS,
  "rahatomir.com",
] as const;

export const OFFICIAL_SITE_DESKTOP_CHROME_BASE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export const OFFICIAL_SITE_MOBILE_CHROME_BASE =
  "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36";

export type OfficialSitePresentation = "mobile" | "desktop";

export function buildOfficialSiteUserAgent(
  tag: string,
  presentation: OfficialSitePresentation = "mobile"
): string {
  const base =
    presentation === "desktop" ? OFFICIAL_SITE_DESKTOP_CHROME_BASE : OFFICIAL_SITE_MOBILE_CHROME_BASE;
  return `${base} ${tag}`;
}

export function normalizeEmbeddedSiteHost(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

const ALWAYS_EXTERNAL_HOST_ROOTS = [
  "youtube.com",
  "youtu.be",
  "instagram.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "t.me",
  "play.google.com",
  "apps.apple.com",
] as const;

function isAlwaysExternalHost(hostname: string): boolean {
  const h = normalizeEmbeddedSiteHost(hostname);
  return ALWAYS_EXTERNAL_HOST_ROOTS.some((root) => h === root || h.endsWith(`.${root}`));
}

export function isEmbeddedSiteHostAllowed(
  hostname: string,
  allowedHosts: readonly string[]
): boolean {
  const h = normalizeEmbeddedSiteHost(hostname);
  return allowedHosts.some((allowed) => {
    const a = normalizeEmbeddedSiteHost(allowed);
    return h === a || h.endsWith(`.${a}`);
  });
}

/**
 * WebView ішінде қалу керек пе, әлде Linking арқылы сыртқа ашу керек пе.
 */
export function shouldStayInOfficialSiteWebView(
  rawUrl: string | null | undefined,
  allowedHosts: readonly string[]
): boolean {
  const u = (rawUrl ?? "").trim();
  if (!u || /^about:blank/i.test(u)) return true;
  /** javascript: — WebView XSS векторы; ешқашан іште қалдырмау. */
  if (/^javascript:/i.test(u)) return false;
  if (EXTERNAL_SCHEME_RE.test(u)) return false;
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (isAlwaysExternalHost(parsed.hostname)) return false;
    return isEmbeddedSiteHostAllowed(parsed.hostname, allowedHosts);
  } catch {
    return false;
  }
}

export function openEmbeddedSiteUrlExternally(url: string): void {
  void Linking.openURL(url).catch(() => {});
}

export const OFFICIAL_SITE_MOBILE_VIEWPORT_INJECT = `
(function () {
  try {
    var d = document;
    var head = d.getElementsByTagName("head")[0];
    if (!head) return;
    var m = d.querySelector('meta[name="viewport"]');
    if (!m) {
      m = d.createElement("meta");
      m.setAttribute("name", "viewport");
      head.insertBefore(m, head.firstChild);
    }
    m.setAttribute(
      "content",
      "width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover"
    );
    var b = d.body;
    if (b) {
      b.style.margin = "0";
      b.style.maxWidth = "100%";
      b.style.boxSizing = "border-box";
      b.style.overflowX = "auto";
      b.style.paddingLeft = "max(8px, env(safe-area-inset-left, 0px))";
      b.style.paddingRight = "max(8px, env(safe-area-inset-right, 0px))";
      b.style.paddingBottom = "max(8px, env(safe-area-inset-bottom, 0px))";
    }
    var de = d.documentElement;
    if (de) {
      de.style.maxWidth = "100%";
      de.style.overflowX = "auto";
    }
  } catch (e) {}
})();
true;
`;

/** muftyat.kz — толық desktop бет (намаз жолағы, тіл таңдау) pinch-zoom арқылы. */
export const OFFICIAL_SITE_DESKTOP_VIEWPORT_INJECT = `
(function () {
  try {
    var d = document;
    var head = d.getElementsByTagName("head")[0];
    if (!head) return;
    var m = d.querySelector('meta[name="viewport"]');
    if (!m) {
      m = d.createElement("meta");
      m.setAttribute("name", "viewport");
      head.insertBefore(m, head.firstChild);
    }
    var layoutW = 1280;
    var screenW = window.innerWidth || d.documentElement.clientWidth || 360;
    var fitScale = Math.max(0.2, Math.min(1, screenW / layoutW));
    m.setAttribute(
      "content",
      "width=" + layoutW + ", initial-scale=" + fitScale + ", minimum-scale=0.2, maximum-scale=5, user-scalable=yes, viewport-fit=cover"
    );
    var b = d.body;
    if (b) {
      b.style.margin = "0";
      b.style.maxWidth = "100%";
      b.style.boxSizing = "border-box";
      b.style.overflowX = "auto";
      b.style.paddingLeft = "max(4px, env(safe-area-inset-left, 0px))";
      b.style.paddingRight = "max(4px, env(safe-area-inset-right, 0px))";
      b.style.paddingBottom = "max(4px, env(safe-area-inset-bottom, 0px))";
    }
    var de = d.documentElement;
    if (de) {
      de.style.maxWidth = "100%";
      de.style.overflowX = "auto";
    }
  } catch (e) {}
})();
true;
`;

/** muftyat.kz WebView — намаз жолағы/кесте жоғарғы жолағы (қолданбада бөлек модуль бар). */
export const MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT = `
(function () {
  function applyHide() {
    try {
      var styleId = "raqat-muftyat-hide-prayer";
      if (!document.getElementById(styleId)) {
        var st = document.createElement("style");
        st.id = styleId;
        st.textContent =
          ".header .top_header, .top_header, .block_timeNamaz, .table_namaz, .select_city.select_city_2 { display: none !important; visibility: hidden !important; height: 0 !important; min-height: 0 !important; max-height: 0 !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }";
        (document.head || document.documentElement).appendChild(st);
      }
    } catch (e) {}
  }
  applyHide();
  if (!window.__raqatMuftyatHidePrayer) {
    window.__raqatMuftyatHidePrayer = true;
    try {
      var obs = new MutationObserver(function () { applyHide(); });
      obs.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
  }
})();
true;
`;

/** SPA (halaldamu / muftyat) — pushState тарихын RN-ге жіберу, «Артқа» дұрыс жұмыс істесін. */
export const OFFICIAL_SITE_SPA_HISTORY_INJECT = `
(function () {
  if (window.__raqatSpaHistory) return;
  window.__raqatSpaHistory = { stack: [location.href], index: 0 };
  function post() {
    if (!window.ReactNativeWebView) return;
    var h = window.__raqatSpaHistory;
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "raqat-spa-nav",
        url: location.href,
        index: h.index,
        canGoBack: h.index > 0
      })
    );
  }
  function syncPush() {
    var h = window.__raqatSpaHistory;
    var url = location.href;
    if (h.stack[h.index] === url) return;
    h.stack = h.stack.slice(0, h.index + 1);
    h.stack.push(url);
    h.index = h.stack.length - 1;
    post();
  }
  var _push = history.pushState;
  var _replace = history.replaceState;
  history.pushState = function () {
    _push.apply(this, arguments);
    syncPush();
  };
  history.replaceState = function () {
    _replace.apply(this, arguments);
    var h = window.__raqatSpaHistory;
    if (h.stack[h.index] !== location.href) h.stack[h.index] = location.href;
    post();
  };
  window.addEventListener("popstate", function () {
    var h = window.__raqatSpaHistory;
    var url = location.href;
    var idx = h.stack.lastIndexOf(url);
    if (idx >= 0) {
      h.index = idx;
      h.stack = h.stack.slice(0, idx + 1);
    } else if (h.index > 0) {
      h.index -= 1;
      h.stack[h.index] = url;
      h.stack = h.stack.slice(0, h.index + 1);
    } else {
      h.stack = [url];
      h.index = 0;
    }
    post();
  });
  document.addEventListener("click", function () {
    setTimeout(post, 0);
  }, true);
  post();
})();
true;
`;
