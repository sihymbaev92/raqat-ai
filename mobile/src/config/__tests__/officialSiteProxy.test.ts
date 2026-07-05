import {
  coerceOfficialSiteNavigationUrl,
  isOfficialIslamicSiteUrl,
  isOfficialSiteProxyUrl,
  resolveOfficialSiteEmbedUrl,
} from "../config/officialSiteProxy";

describe("officialSiteProxy", () => {
  it("wraps fatua and muftyat home URLs", () => {
    const out = resolveOfficialSiteEmbedUrl(
      "https://fatua.kz/kk/",
      "https://api.rahatomir.com"
    );
    expect(out).toContain("/api/v1/official-site/proxy?url=");
    expect(out).toContain("fatua.kz");
  });

  it("does not double-wrap proxy URLs", () => {
    const proxied = resolveOfficialSiteEmbedUrl(
      "https://www.muftyat.kz/kk/",
      "https://api.rahatomir.com"
    );
    expect(resolveOfficialSiteEmbedUrl(proxied, "https://api.rahatomir.com")).toBe(proxied);
  });

  it("coerces direct navigation to proxy", () => {
    const coerced = coerceOfficialSiteNavigationUrl(
      "https://fatua.kz/kk/fatwas/read/1/",
      "https://api.rahatomir.com"
    );
    expect(isOfficialSiteProxyUrl(coerced)).toBe(true);
  });

  it("ignores non-official hosts", () => {
    expect(
      resolveOfficialSiteEmbedUrl("https://halaldamu.kz/", "https://api.rahatomir.com")
    ).toBe("https://halaldamu.kz/");
    expect(isOfficialIslamicSiteUrl("https://halaldamu.kz/")).toBe(false);
  });
});
