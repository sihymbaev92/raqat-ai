import {
  coerceOfficialSiteNavigationUrl,
  isOfficialIslamicSiteUrl,
  isOfficialSiteProxyUrl,
  isFatuaSiteUrl,
  isHalalDamuSiteUrl,
  isMuftyatSiteUrl,
  openOfficialSiteInApp,
  resolveOfficialSiteEmbedUrl,
} from "../officialSiteProxy";
import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../officialIslamicSources";
import { halalDamuSiteHomeUrl } from "../../api/halalDamuWp";
import { navigateToMoreStackScreen } from "../../navigation/navigateToMoreStack";

jest.mock("../../navigation/navigateToMoreStack", () => ({
  navigateToMoreStackScreen: jest.fn(),
}));

jest.mock("../../services/hubScreenWarmup", () => ({
  warmOfficialSiteUrl: jest.fn(),
}));

describe("officialSiteProxy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  it("detects partner site hosts", () => {
    expect(isFatuaSiteUrl("https://fatua.kz/kk/")).toBe(true);
    expect(isMuftyatSiteUrl("https://www.muftyat.kz/kk/")).toBe(true);
    expect(isHalalDamuSiteUrl("https://halaldamu.kz/")).toBe(true);
  });

  it("openOfficialSiteInApp routes halal home to Halal screen", () => {
    openOfficialSiteInApp(halalDamuSiteHomeUrl(), { navigate: jest.fn(), dispatch: jest.fn() });
    expect(navigateToMoreStackScreen).toHaveBeenCalledWith(
      "Halal",
      expect.objectContaining({ initialTab: "site" }),
      expect.anything()
    );
  });

  it("openOfficialSiteInApp routes fatua home to KmdbHub", () => {
    openOfficialSiteInApp(FATUA_KK_HOME_URL, { navigate: jest.fn(), dispatch: jest.fn() });
    expect(navigateToMoreStackScreen).toHaveBeenCalledWith(
      "KmdbHub",
      expect.objectContaining({ initialTab: "fatua" }),
      expect.anything()
    );
  });

  it("openOfficialSiteInApp routes muftyat home to KmdbHub", () => {
    openOfficialSiteInApp(MUFTYAT_KK_HOME_URL, { navigate: jest.fn(), dispatch: jest.fn() });
    expect(navigateToMoreStackScreen).toHaveBeenCalledWith(
      "KmdbHub",
      expect.objectContaining({ initialTab: "muftyat" }),
      expect.anything()
    );
  });
});
