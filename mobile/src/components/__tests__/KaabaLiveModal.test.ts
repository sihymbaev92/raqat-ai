jest.mock("react-native-youtube-iframe", () => ({
  __esModule: true,
  default: "YoutubePlayer",
  PLAYER_STATES: {
    PLAYING: "playing",
    BUFFERING: "buffering",
    ENDED: "ended",
    UNSTARTED: "unstarted",
  },
}));
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
  KAABA_LIVE_NATIVE_SOURCES,
  MAKKAH_LIVE_PRIMARY_URL,
  MAKKAH_LIVE_YOUTUBE_CHANNEL_ID,
  SAUDI_QURAN_TV_CHANNEL_ID,
  KAABA_LIVE_WEBVIEW_USER_AGENT,
  buildKaabaLiveNativeWebViewSource,
  kaabaLiveSourcesForNative,
  kaabaLiveSourcesForWeb,
  liveEmbedSrc,
  isYouTubePlayerErrorMessage,
  isYouTubePlayerHealthyMessage,
} = require("../KaabaLiveModal") as typeof import("../KaabaLiveModal");

describe("KaabaLiveModal", () => {
  it("native starts with Saudi Quran TV YouTube live channel", () => {
    const native = kaabaLiveSourcesForNative();
    expect(native[0]).toEqual({ kind: "youtube-channel", channelId: SAUDI_QURAN_TV_CHANNEL_ID });
    const src = liveEmbedSrc(native[0]!, "https://rahatomir.com", "native", { mute: false });
    expect(src).toContain("youtube-nocookie.com/embed/live_stream");
    expect(src).toContain(`channel=${SAUDI_QURAN_TV_CHANNEL_ID}`);
    expect(src).toContain("autoplay=1");
    expect(src).toContain("mute=0");
    expect(src).toContain("playsinline=1");
    expect(src).toContain("rel=0");
  });

  it("native sources exclude makkahlive.net WebView page", () => {
    expect(KAABA_LIVE_NATIVE_SOURCES).toHaveLength(2);
    expect(KAABA_LIVE_NATIVE_SOURCES.every((s) => s.kind === "youtube-channel")).toBe(true);
    expect(kaabaLiveSourcesForNative()).toEqual(KAABA_LIVE_NATIVE_SOURCES);
  });

  it("web keeps makkahlive.net as fallback after YouTube channels", () => {
    expect(KAABA_LIVE_SOURCES).toHaveLength(3);
    expect(KAABA_LIVE_SOURCES[2]).toEqual({ kind: "page", uri: MAKKAH_LIVE_PRIMARY_URL });
    expect(kaabaLiveSourcesForWeb()).toHaveLength(3);
  });

  it("uses youtube.com embed with widget_referrer on web for channel live", () => {
    const src = liveEmbedSrc(
      { kind: "youtube-channel", channelId: MAKKAH_LIVE_YOUTUBE_CHANNEL_ID },
      "https://rahatomir.com",
      "web"
    );
    expect(src).toContain("youtube.com/embed/live_stream");
    expect(src).toContain(`channel=${MAKKAH_LIVE_YOUTUBE_CHANNEL_ID}`);
    expect(src).toContain("widget_referrer=https%3A%2F%2Frahatomir.com");
  });

  it("wraps YouTube embed in HTML iframe for native WebView helper", () => {
    const embed = liveEmbedSrc(
      { kind: "youtube-channel", channelId: MAKKAH_LIVE_YOUTUBE_CHANNEL_ID },
      "https://rahatomir.com",
      "native"
    );
    const source = buildKaabaLiveNativeWebViewSource(embed);
    expect("html" in source).toBe(true);
    if ("html" in source) {
      expect(source.html).toContain("<iframe");
      expect(source.html).toContain(MAKKAH_LIVE_YOUTUBE_CHANNEL_ID);
      expect(source.html).toContain("autoplay=1");
      expect(source.html).toContain("playsinline=1");
      expect(source.html).toContain("rel=0");
      expect(source.baseUrl).toBe("https://www.youtube.com");
    }
  });

  it("uses standard mobile browser user agent without custom app token", () => {
    expect(KAABA_LIVE_WEBVIEW_USER_AGENT).toMatch(/Safari/i);
    expect(KAABA_LIVE_WEBVIEW_USER_AGENT).not.toMatch(/Raqat|WebView|wv\)/i);
  });

  it("loads makkahlive page directly without HTML wrapper", () => {
    const source = buildKaabaLiveNativeWebViewSource(MAKKAH_LIVE_PRIMARY_URL);
    expect(source).toEqual({ uri: MAKKAH_LIVE_PRIMARY_URL });
  });

  it("embeds video IDs for in-app playback (nocookie on native)", () => {
    const webSrc = liveEmbedSrc({ kind: "video", videoId: "abc123xyz" }, "https://rahatomir.com", "web");
    expect(webSrc).toContain("youtube.com/embed/abc123xyz");
    expect(webSrc).toContain("origin=https%3A%2F%2Frahatomir.com");

    const nativeSrc = liveEmbedSrc({ kind: "video", videoId: "abc123xyz" }, "https://rahatomir.com", "native");
    expect(nativeSrc).toContain("youtube-nocookie.com/embed/abc123xyz");
    expect(nativeSrc).toContain("playsinline=1");
  });

  it("detects YouTube iframe player error and healthy state messages", () => {
    expect(isYouTubePlayerErrorMessage(JSON.stringify({ event: "onError", info: 150 }))).toBe(true);
    expect(isYouTubePlayerHealthyMessage(JSON.stringify({ event: "onStateChange", info: 1 }))).toBe(true);
    expect(isYouTubePlayerHealthyMessage(JSON.stringify({ event: "onStateChange", info: -1 }))).toBe(false);
  });
});
