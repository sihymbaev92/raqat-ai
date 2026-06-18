jest.mock("react-native-webview", () => ({
  WebView: "WebView",
}));

import {
  shouldLoadEmbeddedSiteUrl,
  shouldOpenEmbeddedSiteUrlExternally,
  withEmbeddedSiteCacheBust,
} from "../EmbeddedSiteSheet";

describe("EmbeddedSiteSheet navigation guards", () => {
  it("keeps regular http/https pages inside the embedded sheet", () => {
    expect(shouldLoadEmbeddedSiteUrl("https://halaldamu.kz/")).toBe(true);
    expect(shouldLoadEmbeddedSiteUrl("http://example.com/page")).toBe(true);
    expect(shouldOpenEmbeddedSiteUrlExternally("https://halaldamu.kz/")).toBe(false);
  });

  it("blocks app/intent schemes from taking down the embedded WebView", () => {
    expect(shouldLoadEmbeddedSiteUrl("intent://scan/#Intent;scheme=zxing;end")).toBe(false);
    expect(shouldOpenEmbeddedSiteUrlExternally("intent://scan/#Intent;scheme=zxing;end")).toBe(true);
    expect(shouldOpenEmbeddedSiteUrlExternally("tel:+77001234567")).toBe(true);
    expect(shouldOpenEmbeddedSiteUrlExternally("whatsapp://send?phone=77001234567")).toBe(true);
  });
});

describe("withEmbeddedSiteCacheBust", () => {
  it("appends bust token only when reload requested", () => {
    expect(withEmbeddedSiteCacheBust("https://halaldamu.kz/", 0)).toBe("https://halaldamu.kz/");
    expect(withEmbeddedSiteCacheBust("https://halaldamu.kz/", 3)).toBe("https://halaldamu.kz/?_raqat=3&_nc=3");
    expect(withEmbeddedSiteCacheBust("https://halaldamu.kz/?s=test", 2)).toBe(
      "https://halaldamu.kz/?s=test&_raqat=2&_nc=2"
    );
  });
});
