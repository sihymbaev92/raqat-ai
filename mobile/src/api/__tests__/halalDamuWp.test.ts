import {
  decodeHalalDamuHtmlEntities,
  halalDamuCompanyWebUrl,
  halalDamuRegistryWebSearchUrl,
  halalDamuSiteHomeUrl,
  shouldUseHalalDamuPlatformProxy,
} from "../halalDamuWp";

jest.mock("../../config/halalDamuUrl", () => ({
  getHalalDamuUrl: () => "https://halaldamu.kz",
}));

jest.mock("../../config/raqatApiBase", () => ({
  getRaqatApiBase: jest.fn(() => ""),
}));

jest.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

describe("decodeHalalDamuHtmlEntities", () => {
  it("decodes numeric and common entities", () => {
    expect(decodeHalalDamuHtmlEntities("&#171;Kinza&#187;")).toBe("«Kinza»");
    expect(decodeHalalDamuHtmlEntities("A &amp; B")).toBe("A & B");
  });
});

describe("halalDamuCompanyWebUrl", () => {
  it("uses slug path when present", () => {
    expect(halalDamuCompanyWebUrl({ id: 9, slug: "kinza-halal" })).toBe("https://halaldamu.kz/company/kinza-halal/");
  });

  it("falls back to company_id query", () => {
    expect(halalDamuCompanyWebUrl({ id: 42, slug: "" })).toBe("https://halaldamu.kz/?company_id=42");
  });
});

describe("halalDamuSiteHomeUrl", () => {
  it("returns site root", () => {
    expect(halalDamuSiteHomeUrl()).toBe("https://halaldamu.kz/");
  });
});

describe("shouldUseHalalDamuPlatformProxy", () => {
  const { getRaqatApiBase } = jest.requireMock("../../config/raqatApiBase") as {
    getRaqatApiBase: jest.Mock;
  };
  const rn = jest.requireMock("react-native") as { Platform: { OS: string } };

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_DIRECT;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY;
    getRaqatApiBase.mockReturnValue("");
    rn.Platform.OS = "web";
  });

  it("is false on web even when production api base is set", () => {
    getRaqatApiBase.mockReturnValue("https://api.rahatomir.com");
    expect(shouldUseHalalDamuPlatformProxy()).toBe(false);
  });

  it("uses proxy on native with api.rahatomir.com", () => {
    rn.Platform.OS = "android";
    getRaqatApiBase.mockReturnValue("https://api.rahatomir.com");
    expect(shouldUseHalalDamuPlatformProxy()).toBe(true);
  });

  it("respects EXPO_PUBLIC_HALAL_DAMU_DIRECT=1", () => {
    rn.Platform.OS = "android";
    getRaqatApiBase.mockReturnValue("https://api.rahatomir.com");
    process.env.EXPO_PUBLIC_HALAL_DAMU_DIRECT = "1";
    expect(shouldUseHalalDamuPlatformProxy()).toBe(false);
  });
});

describe("halalDamuRegistryWebSearchUrl", () => {
  it("encodes search query for WP site search", () => {
    expect(halalDamuRegistryWebSearchUrl("4601234567890")).toBe(
      "https://halaldamu.kz/?s=4601234567890"
    );
  });

  it("returns home when query empty", () => {
    expect(halalDamuRegistryWebSearchUrl("  ")).toBe("https://halaldamu.kz/");
  });
});
