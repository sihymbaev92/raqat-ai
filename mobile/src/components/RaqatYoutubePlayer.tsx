import React, { useCallback, useMemo, useRef } from "react";
import { Platform, View, StyleSheet, useWindowDimensions } from "react-native";
import { WebView } from "react-native-webview";
import YoutubePlayer, { PLAYER_STATES } from "react-native-youtube-iframe";

/** Кәдімгі мобильді браузер UA — YouTube Error 152/153 (WebView блок) болмауы үшін. */
const YOUTUBE_PLAYER_WEBVIEW_USER_AGENT = Platform.select({
  ios:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  default:
    "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
})!;

const YOUTUBE_NOCOOKIE_ORIGIN = "https://www.youtube-nocookie.com";

export type RaqatYoutubePlayerProps = {
  videoId?: string;
  channelId?: string;
  play: boolean;
  mute: boolean;
  width?: number;
  height?: number;
  onReady?: () => void;
  onError?: () => void;
};

function channelLiveEmbedUrl(channelId: string, mute: boolean): string {
  const q = new URLSearchParams({
    autoplay: "1",
    mute: mute ? "1" : "0",
    playsinline: "1",
    rel: "0",
    enablejsapi: "1",
    modestbranding: "1",
    fs: "1",
    controls: "1",
    live: "1",
    cc_load_policy: "3",
    channel: channelId,
  });
  return `${YOUTUBE_NOCOOKIE_ORIGIN}/embed/live_stream?${q.toString()}`;
}

function buildChannelLiveHtml(embedUrl: string): string {
  const safeSrc = embedUrl.replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html lang="ar">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>html,body{margin:0;padding:0;background:#000;height:100%;overflow:hidden;}iframe{width:100%;height:100%;border:0;}</style>
</head>
<body>
<iframe
  src="${safeSrc}"
  title="Makkah Live"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
  allowfullscreen
></iframe>
</body>
</html>`;
}

const CHANNEL_BOOT_JS = `
(function () {
  function post(type) {
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: type }));
    } catch (e) {}
  }
  function boot() {
    var video = document.querySelector("video");
    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.play && video.play().catch(function () {});
      post("kaaba-live-healthy");
    }
  }
  setTimeout(boot, 600);
  setTimeout(boot, 1800);
  setTimeout(boot, 4000);
})();
true;
`;

/**
 * YouTube IFrame Player (react-native-youtube-iframe) + channel live embed.
 * Сыртқы makkahlive.net сайты емес — тек YouTube player.
 */
export function RaqatYoutubePlayer({
  videoId,
  channelId,
  play,
  mute,
  width: widthProp,
  height: heightProp,
  onReady,
  onError,
}: RaqatYoutubePlayerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const readyRef = useRef(false);
  const width = widthProp && widthProp > 0 ? widthProp : windowWidth;
  const height = heightProp && heightProp > 0 ? heightProp : Math.max(240, Math.round((windowWidth * 9) / 16));

  const markReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReady?.();
  }, [onReady]);

  const onChangeState = useCallback(
    (state: string) => {
      if (state === PLAYER_STATES.PLAYING || state === PLAYER_STATES.BUFFERING) {
        markReady();
      }
    },
    [markReady]
  );

  const channelSource = useMemo(() => {
    if (!channelId) return null;
    const embedUrl = channelLiveEmbedUrl(channelId, mute);
    return { html: buildChannelLiveHtml(embedUrl), baseUrl: "https://www.youtube.com" };
  }, [channelId, mute]);

  if (channelId && channelSource) {
    return (
      <View style={[styles.wrap, { width, height }]}>
        <WebView
          source={channelSource}
          style={styles.web}
          userAgent={YOUTUBE_PLAYER_WEBVIEW_USER_AGENT}
          applicationNameForUserAgent=""
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo
          setSupportMultipleWindows={false}
          thirdPartyCookiesEnabled={Platform.OS === "android"}
          mixedContentMode="compatibility"
          androidLayerType="hardware"
          injectedJavaScript={CHANNEL_BOOT_JS}
          onLoadEnd={markReady}
          onError={onError}
          onHttpError={onError}
          onMessage={(event) => {
            try {
              const payload = JSON.parse(event.nativeEvent.data || "{}") as { type?: string };
              if (payload.type === "kaaba-live-healthy") markReady();
            } catch {
              /* ignore */
            }
          }}
        />
      </View>
    );
  }

  if (!videoId) return null;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <YoutubePlayer
        height={height}
        width={width}
        play={play}
        mute={mute}
        videoId={videoId}
        forceAndroidAutoplay
        onReady={markReady}
        onError={onError}
        onChangeState={onChangeState}
        initialPlayerParams={{
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          preventFullScreen: false,
          iv_load_policy: 3,
          cc_load_policy: 3,
        }}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          userAgent: YOUTUBE_PLAYER_WEBVIEW_USER_AGENT,
          applicationNameForUserAgent: "",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  web: { flex: 1, width: "100%", backgroundColor: "#000" },
});
