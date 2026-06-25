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
  MAKKAH_LIVE_PRIMARY_URL,
  isYouTubePlayerErrorMessage,
  isYouTubePlayerHealthyMessage,
  kaabaLiveSourcesForWeb,
  liveEmbedSrc,
} = require("../KaabaLiveModal") as typeof import("../KaabaLiveModal");

describe("KaabaLiveModal", () => {
  it("starts with Makkah Live site instead of YouTube embed", () => {
    const first = KAABA_LIVE_SOURCES[0];
    const src = liveEmbedSrc(first!, "https://rahatomir.com", "native");

    expect(first?.kind).toBe("page");
    expect(first?.uri).toBe(MAKKAH_LIVE_PRIMARY_URL);
    expect(src).toBe(MAKKAH_LIVE_PRIMARY_URL);
  });

  it("keeps four internal fallback sources", () => {
    expect(KAABA_LIVE_SOURCES).toHaveLength(4);
  });

  it("deduplicates repeated YouTube live sources on web after Makkah Live and Saudi TV", () => {
    const webSources = kaabaLiveSourcesForWeb();

    expect(webSources).toHaveLength(3);
    expect(liveEmbedSrc(webSources[0]!, "https://rahatomir.com", "web")).toContain("makkahlive.net");
    expect(liveEmbedSrc(webSources[1]!, "https://rahatomir.com", "web")).toContain("saudiatv.sba.sa");
    expect(liveEmbedSrc(webSources[2]!, "https://rahatomir.com", "web")).toContain("youtube.com/embed/live_stream");
  });

  it("uses widget_referrer on web YouTube embed", () => {
    const yt = { kind: "page" as const, uri: "https://www.youtube.com/SaudiQuranTv/live" };
    const src = liveEmbedSrc(yt, "https://rahatomir.com", "web");
    expect(src).toContain("widget_referrer=https%3A%2F%2Frahatomir.com");
  });

  it("detects YouTube iframe player error and healthy state messages", () => {
    expect(isYouTubePlayerErrorMessage(JSON.stringify({ event: "onError", info: 150 }))).toBe(true);
    expect(isYouTubePlayerHealthyMessage(JSON.stringify({ event: "onStateChange", info: 1 }))).toBe(true);
    expect(isYouTubePlayerHealthyMessage(JSON.stringify({ event: "onStateChange", info: -1 }))).toBe(false);
  });
});
