import {
  clearHalalDamuMapMarkersCache,
  decodeHalalDamuHtmlEntities,
  fetchHalalDamuCompaniesNearby,
  fetchHalalDamuCompanyMapMarkers,
  halalDamuCompanyWebUrl,
  halalDamuRegistryWebSearchUrl,
  halalDamuSiteHomeUrl,
  searchHalalDamuAdditives,
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

  it("uses proxy on web when production api base is set", () => {
    getRaqatApiBase.mockReturnValue("https://api.rahatomir.com");
    expect(shouldUseHalalDamuPlatformProxy()).toBe(true);
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

describe("fetchHalalDamuCompanyMapMarkers", () => {
  const { getRaqatApiBase } = jest.requireMock("../../config/raqatApiBase") as {
    getRaqatApiBase: jest.Mock;
  };
  const rn = jest.requireMock("react-native") as { Platform: { OS: string } };
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearHalalDamuMapMarkersCache();
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_DIRECT;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY;
    getRaqatApiBase.mockReturnValue("https://api.rahatomir.com");
    rn.Platform.OS = "android";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_DIRECT;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY;
    clearHalalDamuMapMarkersCache();
  });

  it("falls back to halaldamu.kz when platform proxy returns 403", async () => {
    process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY = "1";
    expect(shouldUseHalalDamuPlatformProxy()).toBe(true);

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response("blocked", { status: 403 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            items: [
              {
                id: 1,
                title: "Test Halal",
                lat: 43.2,
                lon: 76.9,
                certificate_status: "active",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    global.fetch = fetchMock as typeof fetch;

    const { markers, error } = await fetchHalalDamuCompanyMapMarkers();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("api.rahatomir.com");
    expect(String(fetchMock.mock.calls[1][0])).toContain("halaldamu.kz/wp-json");
    expect(markers).toHaveLength(1);
    expect(markers[0]?.title).toBe("Test Halal");
    expect(error).toBeUndefined();
  });
});

describe("fetchHalalDamuCompaniesNearby", () => {
  const { getRaqatApiBase } = jest.requireMock("../../config/raqatApiBase") as {
    getRaqatApiBase: jest.Mock;
  };
  const rn = jest.requireMock("react-native") as { Platform: { OS: string } };
  const originalFetch = global.fetch;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_DIRECT;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY;
    getRaqatApiBase.mockReturnValue("https://api.rahatomir.com");
    rn.Platform.OS = "android";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_DIRECT;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY;
  });

  it("falls back to halaldamu.kz when platform proxy returns 403", async () => {
    process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY = "1";
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response("blocked", { status: 403 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            items: [
              {
                id: 7,
                title: "Nearby Halal",
                lat: 43.24,
                lon: 76.91,
                address: "Алматы",
                certificate_status: "active",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    global.fetch = fetchMock as typeof fetch;

    const { items } = await fetchHalalDamuCompaniesNearby(43.24, 76.91, 5);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("api.rahatomir.com");
    expect(String(fetchMock.mock.calls[1][0])).toContain("halaldamu.kz/wp-json");
    expect(items.some((c) => c.id === 7)).toBe(true);
  });
});

describe("searchHalalDamuAdditives", () => {
  const { getRaqatApiBase } = jest.requireMock("../../config/raqatApiBase") as {
    getRaqatApiBase: jest.Mock;
  };
  const rn = jest.requireMock("react-native") as { Platform: { OS: string } };
  const originalFetch = global.fetch;

  beforeEach(() => {
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_DIRECT;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY;
    getRaqatApiBase.mockReturnValue("https://api.rahatomir.com");
    rn.Platform.OS = "android";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_DIRECT;
    delete process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY;
  });

  it("falls back to halaldamu.kz when platform proxy returns 403", async () => {
    process.env.EXPO_PUBLIC_HALAL_DAMU_USE_PROXY = "1";
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(new Response("blocked", { status: 403 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            items: [{ id: 471, title: "E471", description: "test", risk: "MUSHKIL" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    global.fetch = fetchMock as typeof fetch;

    const { items } = await searchHalalDamuAdditives("E471");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("halaldamu.kz/wp-json");
    expect(items.some((a) => a.title.includes("E471"))).toBe(true);
  });
});
