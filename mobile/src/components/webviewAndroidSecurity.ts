/**
 * Android WebView: file:// / universal file XSS және mixed-content MITM-ге қарсы.
 * Барлық ресми сайт WebView-ларына қолданыңыз.
 */
export const SECURE_ANDROID_WEBVIEW_PROPS = {
  allowFileAccess: false,
  allowFileAccessFromFileURLs: false,
  allowUniversalAccessFromFileURLs: false,
  geolocationEnabled: false,
  setSupportMultipleWindows: false,
  /** HTTPS беттерде HTTP ресурс жүктемесін өшіру */
  mixedContentMode: "never" as const,
} as const;

/** HTML карта / inline — тек HTTPS origin (file:// және * жоқ). */
export const SECURE_HTML_WEBVIEW_ORIGIN_WHITELIST = ["https://*", "about:blank"] as const;

/** Mushaf SVG — CDN HTTPS немесе жергілікті file (офлайн). */
export const SECURE_MUSHAF_SVG_ORIGIN_WHITELIST = ["https://*", "file://*", "about:blank"] as const;
