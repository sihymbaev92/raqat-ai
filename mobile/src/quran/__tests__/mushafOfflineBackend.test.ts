import { canDownloadOverNetwork } from "../../services/networkDownloadGate";
import { isQcf4FontPackCached } from "../../services/quranFontCache";
import { canRenderQcf4MushafOnline, shouldHatimUseTextHafsOffline } from "../mushafOfflineBackend";

jest.mock("../../services/networkDownloadGate", () => ({
  canDownloadOverNetwork: jest.fn(),
}));

jest.mock("../../services/quranFontCache", () => ({
  isQcf4FontPackCached: jest.fn(),
}));

jest.mock("../webHatimIndexedDb", () => ({
  hasAnyQcf4PageInWebIndexedDb: jest.fn().mockResolvedValue(false),
}));

const mockNet = canDownloadOverNetwork as jest.MockedFunction<typeof canDownloadOverNetwork>;
const mockFonts = isQcf4FontPackCached as jest.MockedFunction<typeof isQcf4FontPackCached>;

describe("canRenderQcf4MushafOnline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns false when offline", async () => {
    mockNet.mockResolvedValue({ ok: false, reason: "network offline" });
    mockFonts.mockResolvedValue(true);
    await expect(canRenderQcf4MushafOnline()).resolves.toBe(false);
  });

  it("returns false when fonts are not cached", async () => {
    mockNet.mockResolvedValue({ ok: true });
    mockFonts.mockResolvedValue(false);
    await expect(canRenderQcf4MushafOnline()).resolves.toBe(false);
  });

  it("returns true when online and fonts cached", async () => {
    mockNet.mockResolvedValue({ ok: true });
    mockFonts.mockResolvedValue(true);
    await expect(canRenderQcf4MushafOnline()).resolves.toBe(true);
  });
});

describe("shouldHatimUseTextHafsOffline", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when offline and fonts not cached", async () => {
    mockNet.mockResolvedValue({ ok: false, reason: "network offline" });
    mockFonts.mockResolvedValue(false);
    await expect(shouldHatimUseTextHafsOffline()).resolves.toBe(true);
  });

  it("returns false when online even if fonts not cached", async () => {
    mockNet.mockResolvedValue({ ok: true });
    mockFonts.mockResolvedValue(false);
    await expect(shouldHatimUseTextHafsOffline()).resolves.toBe(false);
  });

  it("returns true on web when browser is offline", async () => {
    const originalNavigator = global.navigator;
    Object.defineProperty(global, "navigator", {
      value: { onLine: false },
      configurable: true,
    });
    mockNet.mockResolvedValue({ ok: true });
    mockFonts.mockResolvedValue(false);
    const Platform = require("react-native").Platform;
    const originalOS = Platform.OS;
    Platform.OS = "web";
    try {
      await expect(shouldHatimUseTextHafsOffline()).resolves.toBe(true);
    } finally {
      Platform.OS = originalOS;
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        configurable: true,
      });
    }
  });
});
