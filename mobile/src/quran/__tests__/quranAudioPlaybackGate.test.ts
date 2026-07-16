import {
  isQuranAudioCached,
  quranAudioCachePathForUrl,
  resolveCachedOrRemoteQuranAudioUri,
} from "../../services/quranAudioCache";
import { planQuranAyahAudioPlayback } from "../quranAudioPlaybackGate";

jest.mock("../../services/quranAudioCache", () => ({
  isQuranAudioCached: jest.fn(),
  quranAudioCachePathForUrl: jest.fn(),
  resolveCachedOrRemoteQuranAudioUri: jest.fn(),
}));

const mockCached = isQuranAudioCached as jest.MockedFunction<typeof isQuranAudioCached>;
const mockPath = quranAudioCachePathForUrl as jest.MockedFunction<typeof quranAudioCachePathForUrl>;
const mockResolve = resolveCachedOrRemoteQuranAudioUri as jest.MockedFunction<
  typeof resolveCachedOrRemoteQuranAudioUri
>;

describe("planQuranAyahAudioPlayback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns cache path when ayah mp3 is cached", async () => {
    mockCached.mockResolvedValue(true);
    mockResolve.mockResolvedValue("file:///cache/abc.mp3");
    const plan = await planQuranAyahAudioPlayback("https://cdn.example/a.mp3");
    expect(plan).toEqual({
      remoteUri: "https://cdn.example/a.mp3",
      uri: "file:///cache/abc.mp3",
      source: "cache",
      needsNetwork: false,
    });
  });

  it("streams remote when not cached", async () => {
    mockCached.mockResolvedValue(false);
    mockPath.mockReturnValue("file:///cache/abc.mp3");
    const plan = await planQuranAyahAudioPlayback("https://cdn.example/a.mp3");
    expect(plan).toEqual({
      remoteUri: "https://cdn.example/a.mp3",
      uri: "https://cdn.example/a.mp3",
      source: "stream",
      needsNetwork: true,
    });
  });
});
