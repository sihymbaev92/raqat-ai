import {
  SECURE_ANDROID_WEBVIEW_PROPS,
  SECURE_HTML_WEBVIEW_ORIGIN_WHITELIST,
  SECURE_MUSHAF_SVG_ORIGIN_WHITELIST,
} from "../webviewAndroidSecurity";

describe("webviewAndroidSecurity", () => {
  it("disables file access and mixed content on Android WebView", () => {
    expect(SECURE_ANDROID_WEBVIEW_PROPS.allowFileAccess).toBe(false);
    expect(SECURE_ANDROID_WEBVIEW_PROPS.allowFileAccessFromFileURLs).toBe(false);
    expect(SECURE_ANDROID_WEBVIEW_PROPS.allowUniversalAccessFromFileURLs).toBe(false);
    expect(SECURE_ANDROID_WEBVIEW_PROPS.mixedContentMode).toBe("never");
    expect(SECURE_ANDROID_WEBVIEW_PROPS.setSupportMultipleWindows).toBe(false);
  });

  it("allows only HTTPS for official site HTML WebViews", () => {
    expect(SECURE_HTML_WEBVIEW_ORIGIN_WHITELIST).toEqual(["https://*", "about:blank"]);
  });

  it("allows HTTPS and local file for mushaf SVG offline CDN fallback", () => {
    expect(SECURE_MUSHAF_SVG_ORIGIN_WHITELIST).toContain("https://*");
    expect(SECURE_MUSHAF_SVG_ORIGIN_WHITELIST).toContain("file://*");
    expect(SECURE_MUSHAF_SVG_ORIGIN_WHITELIST).toContain("about:blank");
  });
});
