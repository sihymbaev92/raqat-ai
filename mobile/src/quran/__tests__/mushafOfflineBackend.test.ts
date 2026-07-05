import { canDownloadOverNetwork } from "../../services/networkDownloadGate";
import { isQcf4FontPackCached } from "../../services/quranFontCache";
import { canRenderQcf4MushafOnline } from "../mushafOfflineBackend";

jest.mock("../../services/networkDownloadGate", () => ({
  canDownloadOverNetwork: jest.fn(),
}));

jest.mock("../../services/quranFontCache", () => ({
  isQcf4FontPackCached: jest.fn(),
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
