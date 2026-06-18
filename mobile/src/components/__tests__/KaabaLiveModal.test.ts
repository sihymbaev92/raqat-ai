jest.mock("expo-av", () => ({
  Audio: { setAudioModeAsync: jest.fn(async () => undefined) },
  InterruptionModeAndroid: { DoNotMix: 1 },
  InterruptionModeIOS: { DoNotMix: 1 },
}));
jest.mock("react-native-webview", () => ({
  WebView: "WebView",
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  KAABA_LIVE_SOURCES,
  isYouTubePlayerErrorMessage,
  isYouTubePlayerHealthyMessage,
  kaabaLiveSourcesForWeb,
  liveEmbedSrc,
} = require("../KaabaLiveModal") as typeof import("../KaabaLiveModal");

describe("KaabaLiveModal", () => {
  it("starts with the official YouTube live embed instead of a blocked watch page", () => {
    const first = KAABA_LIVE_SOURCES[0];
    const src = liveEmbedSrc(first!, "https://rahatomir.com");

    expect(first?.kind).toBe("page");
    expect(src).toContain("https://www.youtube-nocookie.com/embed/live_stream?");
    expect(src).toContain("channel=UCos52azQNBgW63_9uDJoPDA");
    expect(src).toContain("origin=https%3A%2F%2Frahatomir.com");
  });

  it("keeps five internal fallback sources", () => {
    expect(KAABA_LIVE_SOURCES).toHaveLength(5);
  });

  it("deduplicates repeated YouTube live sources on web before non-YouTube fallbacks", () => {
    const webSources = kaabaLiveSourcesForWeb();

    expect(webSources).toHaveLength(3);
    expect(liveEmbedSrc(webSources[0]!, "https://rahatomir.com")).toContain(
      "youtube-nocookie.com/embed/live_stream"
    );
    expect(liveEmbedSrc(webSources[1]!, "https://rahatomir.com")).toContain("saudiatv.sba.sa");
    expect(liveEmbedSrc(webSources[2]!, "https://rahatomir.com")).toContain("makkahlive.net");
  });

  it("detects YouTube iframe player error and healthy state messages", () => {
    expect(isYouTubePlayerErrorMessage(JSON.stringify({ event: "onError", info: 150 }))).toBe(true);
    expect(isYouTubePlayerHealthyMessage(JSON.stringify({ event: "onStateChange", info: 1 }))).toBe(true);
    expect(isYouTubePlayerHealthyMessage(JSON.stringify({ event: "onStateChange", info: -1 }))).toBe(false);
  });
});
