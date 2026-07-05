import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";
import { RaqatYoutubePlayer } from "./RaqatYoutubePlayer";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../theme/colors";
import { modalSafeAreaInsets } from "../theme/modalSafeArea";

/** Мекке тікелей эфир — Saudi Quran TV (ресми Haramain feed). */
export const MAKKAH_LIVE_YOUTUBE_CHANNEL_ID = "UC48uQMZ8V4jFmY_S_69A7ww";

/** @deprecated Lofi/test ID — native-та channel live қолданылады. */
export const MAKKAH_LIVE_YOUTUBE_VIDEO_ID = "jfKfPfyJRdk";

export const MAKKAH_LIVE_YOUTUBE_LIVE_URL = `https://www.youtube.com/live/${MAKKAH_LIVE_YOUTUBE_VIDEO_ID}`;

/** Saudi Quran TV — резервтік YouTube live channel. */
export const SAUDI_QURAN_TV_CHANNEL_ID = "UCos52azQNBgW63_9uDJoPDA";

type KaabaLiveSource =
  | { kind: "youtube-channel"; channelId: string }
  | { kind: "video"; videoId: string }
  | { kind: "page"; uri: string };

/** Makkah Live — толық жұмыс істейтін сайт (WebView-та тікелей). */
export const MAKKAH_LIVE_PRIMARY_URL = "https://makkahlive.net/makkahlive.aspx";

/** Native: тек YouTube live (makkahlive.net WebView жоқ). Web: сайт резерві бар. */
export const KAABA_LIVE_NATIVE_SOURCES: readonly KaabaLiveSource[] = [
  { kind: "youtube-channel", channelId: SAUDI_QURAN_TV_CHANNEL_ID },
  { kind: "youtube-channel", channelId: MAKKAH_LIVE_YOUTUBE_CHANNEL_ID },
] as const;

/** Web: YouTube + makkahlive.net резерві. */
export const KAABA_LIVE_SOURCES: readonly KaabaLiveSource[] = [
  ...KAABA_LIVE_NATIVE_SOURCES,
  { kind: "page", uri: MAKKAH_LIVE_PRIMARY_URL },
] as const;

const YOUTUBE_ORIGIN = "https://www.youtube.com";
const YOUTUBE_NOCOOKIE_ORIGIN = "https://www.youtube-nocookie.com";
const KAABA_LIVE_AUTO_FALLBACK_MS = 18000;
const KAABA_LIVE_MAKKAH_SITE_FALLBACK_MS = 35000;
const KAABA_LIVE_WEB_PLAYER_HEALTH_MS = 5500;

export type YoutubeLiveEmbedOptions = {
  /** Flutter YoutubePlayerFlags.mute — false = дыбыс бірден (autoplay саясатына байланысты). */
  mute?: boolean;
  live?: boolean;
  hd?: boolean;
  captionsOff?: boolean;
};

/** YouTube embed — Error 152/153 болмауы үшін міндетті player options. */
function youtubeEmbedPlayerParams(
  origin: string,
  extra?: Record<string, string>,
  opts?: YoutubeLiveEmbedOptions
): URLSearchParams {
  const mute = opts?.mute !== false;
  return new URLSearchParams({
    autoplay: "1",
    mute: mute ? "1" : "0",
    playsinline: "1",
    rel: "0",
    enablejsapi: "1",
    modestbranding: "1",
    fs: "1",
    controls: "1",
    disablekb: "1",
    origin,
    ...(opts?.live ? { live: "1" } : null),
    ...(opts?.captionsOff ? { cc_load_policy: "3" } : null),
    ...(opts?.hd ? { vq: "hd720" } : null),
    ...extra,
  });
}

/** WebView: кәдімгі мобильді Chrome/Safari — custom app token жоқ (YouTube блоктамайды). */
export const KAABA_LIVE_WEBVIEW_USER_AGENT = Platform.select({
  ios:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  default:
    "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
})!;
const KAABA_LIVE_ERROR_DETECT_JS = `
(function () {
  function postError(reason) {
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: "kaaba-live-error", reason: reason || "unknown" }));
    } catch (e) {}
  }
  function allPlayers() {
    return Array.prototype.slice.call(document.querySelectorAll("video, iframe"));
  }
  window.__rqMute = function () {
    allPlayers().forEach(function (node) {
      if (node.tagName === "VIDEO") {
        node.muted = true;
      } else if (node.contentWindow) {
        node.contentWindow.postMessage(JSON.stringify({ event: "command", func: "mute", args: [] }), "*");
      }
    });
  };
  window.__rqUnmute = function () {
    allPlayers().forEach(function (node) {
      if (node.tagName === "VIDEO") {
        node.muted = false;
        node.volume = 1;
        node.play && node.play().catch(function () {});
      } else if (node.contentWindow) {
        node.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
        node.contentWindow.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [100] }), "*");
        node.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
      }
    });
  };
  function checkForDeadStream() {
    var text = ((document.body && document.body.innerText) || "").slice(0, 8000);
    if (/Video unavailable|This video is unavailable|Playback on other websites|An error occurred|Error 153|Error 152/i.test(text)) {
      postError("dead-stream");
      return;
    }
    var video = document.querySelector("video");
    if (video) {
      video.muted = true;
      video.play && video.play().catch(function () {});
      try {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: "kaaba-live-healthy" }));
      } catch (e) {}
    }
    var player = document.querySelector("video, iframe[src*='youtube'], .plyr");
    if (player && player.scrollIntoView) {
      try { player.scrollIntoView({ block: "start", behavior: "instant" }); } catch (e) {}
    }
  }
  setTimeout(checkForDeadStream, 1600);
  setTimeout(checkForDeadStream, 5200);
})();
true;
`;

/** makkahlive.net — толық сайт: iframe ішіндегі YouTube қателерін елемей, видеоны muted autoplay. */
const MAKKAH_LIVE_SITE_BOOT_JS = `
(function () {
  function post(type) {
    try {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: type }));
    } catch (e) {}
  }
  function allPlayers() {
    return Array.prototype.slice.call(document.querySelectorAll("video, iframe"));
  }
  window.__rqMute = function () {
    allPlayers().forEach(function (node) {
      if (node.tagName === "VIDEO") {
        node.muted = true;
      } else if (node.contentWindow) {
        node.contentWindow.postMessage(JSON.stringify({ event: "command", func: "mute", args: [] }), "*");
      }
    });
  };
  window.__rqUnmute = function () {
    allPlayers().forEach(function (node) {
      if (node.tagName === "VIDEO") {
        node.muted = false;
        node.volume = 1;
        node.play && node.play().catch(function () {});
      } else if (node.contentWindow) {
        node.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
        node.contentWindow.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [100] }), "*");
        node.contentWindow.postMessage(JSON.stringify({ event: "command", func: "playVideo", args: [] }), "*");
      }
    });
  };
  function boot() {
    var video = document.querySelector("video");
    if (video) {
      video.muted = true;
      video.playsInline = true;
      video.play && video.play().catch(function () {});
      post("kaaba-live-healthy");
      try { video.scrollIntoView({ block: "center", behavior: "instant" }); } catch (e) {}
    }
    var frame = document.querySelector("iframe[src*='youtube'], iframe[src*='googlevideo'], .plyr, #player");
    if (frame && frame.scrollIntoView) {
      try { frame.scrollIntoView({ block: "center", behavior: "instant" }); } catch (e) {}
    }
  }
  setTimeout(boot, 700);
  setTimeout(boot, 2200);
  setTimeout(boot, 5500);
})();
true;
`;

function youtubeLiveChannelEmbedUrl(
  channelId: string,
  origin: string,
  platform: "web" | "native",
  opts?: YoutubeLiveEmbedOptions
): string {
  const q = youtubeEmbedPlayerParams(origin, undefined, opts);
  q.set("channel", channelId);
  if (platform === "web") {
    q.set("widget_referrer", origin);
    return `${YOUTUBE_ORIGIN}/embed/live_stream?${q.toString()}`;
  }
  return `${YOUTUBE_NOCOOKIE_ORIGIN}/embed/live_stream?${q.toString()}`;
}

/** Web iframe үшін: бет origin-і (postMessage командалары сәйкес келуі үшін). */
function webEmbedOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return YOUTUBE_ORIGIN;
}

export function liveEmbedSrc(
  source: KaabaLiveSource,
  origin: string = YOUTUBE_ORIGIN,
  platform: "web" | "native" = "native",
  embedOpts?: YoutubeLiveEmbedOptions
): string {
  if (source.kind === "youtube-channel") {
    return youtubeLiveChannelEmbedUrl(source.channelId, origin, platform, embedOpts);
  }
  if (source.kind === "page") {
    if (isSaudiQuranTvLivePage(source.uri)) {
      return youtubeLiveChannelEmbedUrl(SAUDI_QURAN_TV_CHANNEL_ID, origin, platform, embedOpts);
    }
    return source.uri;
  }
  const q = youtubeEmbedPlayerParams(origin, undefined, {
    live: true,
    hd: true,
    captionsOff: true,
    mute: embedOpts?.mute,
  });
  const base = platform === "native" ? YOUTUBE_NOCOOKIE_ORIGIN : YOUTUBE_ORIGIN;
  return `${base}/embed/${source.videoId}?${q.toString()}`;
}

export function kaabaLiveSourcesForWeb(): readonly KaabaLiveSource[] {
  const seen = new Set<string>();
  return KAABA_LIVE_SOURCES.filter((source) => {
    const key =
      source.kind === "youtube-channel"
        ? `yt-channel:${source.channelId}`
        : source.kind === "page" && isSaudiQuranTvLivePage(source.uri)
          ? "youtube-live"
          : JSON.stringify(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function kaabaLiveSourcesForNative(): readonly KaabaLiveSource[] {
  return KAABA_LIVE_NATIVE_SOURCES;
}

/** Native WebView: YouTube embed — HTML iframe (Error 153 fix). */
export function buildKaabaLiveNativeWebViewSource(
  embedUrl: string
): { uri: string } | { html: string; baseUrl: string } {
  if (!isYouTubeEmbedUrl(embedUrl)) {
    return { uri: embedUrl };
  }
  const safeSrc = embedUrl.replace(/"/g, "&quot;");
  const html = `<!DOCTYPE html>
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
  return { html, baseUrl: YOUTUBE_ORIGIN };
}

function isYouTubeEmbedUrl(src: string): boolean {
  try {
    const u = new URL(src);
    const host = u.hostname.toLowerCase();
    const isYtHost =
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com");
    if (!isYtHost) return false;
    return u.pathname.includes("/embed/");
  } catch {
    return false;
  }
}

export function isYouTubePlayerErrorMessage(raw: unknown): boolean {
  const data = typeof raw === "string" ? raw : "";
  if (!data) return false;
  try {
    const parsed = JSON.parse(data) as { event?: string; info?: unknown };
    if (parsed.event !== "onError") return false;
    return true;
  } catch {
    return false;
  }
}

export function isYouTubePlayerHealthyMessage(raw: unknown): boolean {
  const data = typeof raw === "string" ? raw : "";
  if (!data) return false;
  try {
    const parsed = JSON.parse(data) as { event?: string; info?: unknown };
    return parsed.event === "onStateChange" && (parsed.info === 1 || parsed.info === 3 || parsed.info === 5);
  } catch {
    return false;
  }
}

function isSaudiQuranTvLivePage(uri: string): boolean {
  try {
    const u = new URL(uri);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (host !== "youtube.com" && !host.endsWith(".youtube.com")) return false;
    return (
      path === "/saudiqurantv/live" ||
      path === "/@saudiqurantv/live" ||
      path === `/channel/${SAUDI_QURAN_TV_CHANNEL_ID.toLowerCase()}/live`
    );
  } catch {
    return false;
  }
}

function isMakkahLiveHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "makkahlive.net" ||
    h.endsWith(".makkahlive.net") ||
    h === "makkahlive.org" ||
    h.endsWith(".makkahlive.org")
  );
}

function isMakkahLivePage(uri: string): boolean {
  try {
    return isMakkahLiveHost(new URL(uri).hostname);
  } catch {
    return false;
  }
}

function isAllowedKaabaLiveUrl(raw: string): boolean {
  if (!raw || raw === "about:blank") return true;
  if (
    raw.startsWith("intent://") ||
    raw.startsWith("vnd.youtube:") ||
    raw.startsWith("market://") ||
    raw.startsWith("tel:") ||
    raw.startsWith("mailto:")
  ) {
    return false;
  }
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return (
      host === "youtube.com" ||
      host.endsWith(".youtube.com") ||
      host === "youtu.be" ||
      host === "youtube-nocookie.com" ||
      host.endsWith(".youtube-nocookie.com") ||
      host === "aloula.sa" ||
      host.endsWith(".aloula.sa") ||
      host === "makkahlive.net" ||
      host.endsWith(".makkahlive.net") ||
      host === "makkahlive.org" ||
      host.endsWith(".makkahlive.org") ||
      host === "qurantv.makkahlive.net" ||
      host === "sba.sa" ||
      host.endsWith(".sba.sa") ||
      host === "saudiatv.sba.sa" ||
      host.endsWith(".saudiatv.sba.sa") ||
      host === "ytimg.com" ||
      host.endsWith(".ytimg.com") ||
      host === "googlevideo.com" ||
      host.endsWith(".googlevideo.com") ||
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "googleapis.com" ||
      host.endsWith(".googleapis.com") ||
      host === "gstatic.com" ||
      host.endsWith(".gstatic.com") ||
      host === "ggpht.com" ||
      host.endsWith(".ggpht.com") ||
      host === "doubleclick.net" ||
      host.endsWith(".doubleclick.net")
    );
  } catch {
    return false;
  }
}

async function enableKaabaLiveAudioSession(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: false,
      staysActiveInBackground: false,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    /* WebView media can still play if Expo audio mode is unavailable. */
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
  colors: ThemeColors;
  title: string;
  soundOnLabel: string;
  soundOffLabel: string;
  closeLabel: string;
  /** Flutter MakkahLiveScreen: mute: false — дыбыс бірден (autoplay саясатына байланысты). */
  initialMuted?: boolean;
};

export function KaabaLivePlayerSurface({
  visible,
  onClose,
  colors,
  title,
  soundOnLabel,
  soundOffLabel,
  closeLabel,
  initialMuted = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const modalInsets = modalSafeAreaInsets(insets);
  const isWeb = Platform.OS === "web";
  const webRef = useRef<WebView>(null);
  const iframeRef = useRef<{ contentWindow?: { postMessage: (m: string, t: string) => void } } | null>(null);
  const webPlayerHealthyRef = useRef(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);
  const [muted, setMuted] = useState(initialMuted);
  const [loading, setLoading] = useState(true);
  const [showBrowserFallback, setShowBrowserFallback] = useState(false);
  const [playerLayout, setPlayerLayout] = useState({ w: 0, h: 0 });
  const liveSources = useMemo(
    () => (isWeb ? kaabaLiveSourcesForWeb() : kaabaLiveSourcesForNative()),
    [isWeb]
  );
  const controlsBottomPadding =
    Platform.OS === "android" ? Math.max(modalInsets.bottom, 48) + 12 : Math.max(modalInsets.bottom, 12) + 8;

  const liveSource = liveSources[sourceIndex] ?? liveSources[0]!;
  const sourceKey =
    (liveSource.kind === "youtube-channel"
      ? `channel-${liveSource.channelId}`
      : liveSource.kind === "video"
        ? `video-${liveSource.videoId}`
        : `page-${liveSource.uri}`) + `-${reloadTick}`;
  const embedSrc = useMemo(
    () => liveEmbedSrc(liveSource, webEmbedOrigin(), isWeb ? "web" : "native", { mute: muted }),
    [liveSource, isWeb, muted]
  );
  const nativeSource = useMemo(() => buildKaabaLiveNativeWebViewSource(embedSrc), [embedSrc]);
  const isYoutubeWebEmbed = isWeb && isYouTubeEmbedUrl(embedSrc);
  const isMakkahLiveEmbed = liveSource.kind === "page" && isMakkahLivePage(embedSrc);
  const useNativeYoutubePlayer =
    !isWeb && (liveSource.kind === "video" || liveSource.kind === "youtube-channel");
  const webViewInjectedJs = isMakkahLiveEmbed ? MAKKAH_LIVE_SITE_BOOT_JS : KAABA_LIVE_ERROR_DETECT_JS;

  useEffect(() => {
    if (!visible) return;
    if (!initialMuted) void enableKaabaLiveAudioSession();
  }, [visible, initialMuted]);

  useEffect(() => {
    if (!visible) return;
    setSourceIndex(0);
    setReloadTick(0);
    setMuted(initialMuted);
    setLoading(true);
    setShowBrowserFallback(false);
  }, [visible, initialMuted]);

  useEffect(() => {
    webPlayerHealthyRef.current = false;
  }, [sourceKey]);

  const tryNextSource = useCallback(() => {
    setSourceIndex((i) => {
      setLoading(true);
      setReloadTick((tick) => tick + 1);
      const next = i + 1 >= liveSources.length ? 0 : i + 1;
      if (i + 1 >= liveSources.length) {
        setShowBrowserFallback(true);
      }
      return next;
    });
  }, [liveSources.length]);

  const openMakkahLiveInBrowser = useCallback(() => {
    void Linking.openURL(MAKKAH_LIVE_PRIMARY_URL);
  }, []);

  useEffect(() => {
    if (!visible || !loading) return undefined;
    const ms = isMakkahLiveEmbed ? KAABA_LIVE_MAKKAH_SITE_FALLBACK_MS : KAABA_LIVE_AUTO_FALLBACK_MS;
    const timer = setTimeout(tryNextSource, ms);
    return () => clearTimeout(timer);
  }, [isMakkahLiveEmbed, loading, sourceKey, tryNextSource, visible]);

  useEffect(() => {
    if (!visible || !isWeb) return undefined;
    const onMessage = (event: { data?: unknown }) => {
      if (isYouTubePlayerErrorMessage(event.data)) {
        tryNextSource();
        return;
      }
      if (isYouTubePlayerHealthyMessage(event.data)) {
        webPlayerHealthyRef.current = true;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [isWeb, tryNextSource, visible]);

  useEffect(() => {
    if (!visible || !isYoutubeWebEmbed) return undefined;
    const timer = setTimeout(() => {
      if (!webPlayerHealthyRef.current) {
        tryNextSource();
      }
    }, KAABA_LIVE_WEB_PLAYER_HEALTH_MS);
    return () => clearTimeout(timer);
  }, [isYoutubeWebEmbed, sourceKey, tryNextSource, visible]);

  const postToIframe = (func: string, args: unknown[] = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "*"
    );
  };

  const applyWebSound = (nextMuted: boolean) => {
    const run = () => {
      if (nextMuted) {
        postToIframe("mute");
      } else {
        postToIframe("unMute");
        postToIframe("setVolume", [100]);
        postToIframe("playVideo");
      }
    };
    [0, 120, 350, 800, 1500].forEach((ms) => setTimeout(run, ms));
  };

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    if (useNativeYoutubePlayer) {
      if (!next) void enableKaabaLiveAudioSession();
      return;
    }
    if (isWeb) {
      applyWebSound(next);
      return;
    }
    void (async () => {
      if (!next) await enableKaabaLiveAudioSession();
      webRef.current?.injectJavaScript(
        next
          ? "window.__rqMute && window.__rqMute(); true;"
          : "window.__rqUnmute && window.__rqUnmute(); true;"
      );
    })();
  };

  const onWebViewError = () => {
    tryNextSource();
  };

  const onWebViewMessage = (event: { nativeEvent: { data?: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data || "{}") as { type?: string };
      if (payload.type === "kaaba-live-healthy") {
        setLoading(false);
        setShowBrowserFallback(false);
        return;
      }
      if (payload.type === "kaaba-live-error") {
        tryNextSource();
      }
    } catch {
      /* Ignore unrelated page messages. */
    }
  };

  const onWebViewNav = (ev: WebViewNavigation) => {
    const u = ev.url || "";
    if (!isAllowedKaabaLiveUrl(u)) {
      webRef.current?.goBack();
    }
  };

  const shouldStartWebViewLoad = (ev: WebViewNavigation) => isAllowedKaabaLiveUrl(ev.url || "");

  return (
    <View style={styles.root}>
        <View style={[styles.header, { paddingTop: modalInsets.top + 8 }]}>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </Pressable>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View
          style={styles.videoWrap}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            if (width > 0 && height > 0) {
              setPlayerLayout({ w: Math.round(width), h: Math.round(height) });
            }
          }}
        >
          {useNativeYoutubePlayer ? (
            <RaqatYoutubePlayer
              key={sourceKey}
              videoId={liveSource.kind === "video" ? liveSource.videoId : undefined}
              channelId={liveSource.kind === "youtube-channel" ? liveSource.channelId : undefined}
              width={playerLayout.w || undefined}
              height={playerLayout.h || undefined}
              play={visible}
              mute={muted}
              onReady={() => {
                setLoading(false);
                setShowBrowserFallback(false);
                if (!muted) void enableKaabaLiveAudioSession();
              }}
              onError={tryNextSource}
            />
          ) : isWeb
            ? React.createElement("iframe", {
                key: sourceKey,
                ref: iframeRef,
                src: embedSrc,
                referrerPolicy: "strict-origin-when-cross-origin",
                allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen",
                allowFullScreen: true,
                onLoad: () => setLoading(false),
                style: { width: "100%", height: "100%", border: "0", backgroundColor: "#000" },
              })
            : (
              <WebView
                key={sourceKey}
                ref={webRef}
                source={nativeSource}
                style={styles.web}
                userAgent={KAABA_LIVE_WEBVIEW_USER_AGENT}
                applicationNameForUserAgent=""
                originWhitelist={["https://*", "http://*"]}
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                allowsFullscreenVideo
                setSupportMultipleWindows={false}
                thirdPartyCookiesEnabled={Platform.OS === "android"}
                mixedContentMode="compatibility"
                androidLayerType="hardware"
                injectedJavaScript={webViewInjectedJs}
                onLoadEnd={() => setLoading(false)}
                onError={onWebViewError}
                onHttpError={onWebViewError}
                onMessage={onWebViewMessage}
                onShouldStartLoadWithRequest={shouldStartWebViewLoad}
                onNavigationStateChange={onWebViewNav}
              />
            )}
          {loading ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : null}
          {showBrowserFallback ? (
            <View style={styles.fallbackOverlay}>
              <Text style={styles.fallbackTitle}>Эфир қолданба ішінде ашылмады</Text>
              <Text style={styles.fallbackHint}>Makkah Live сайтында тікелей эфирді ашыңыз</Text>
              <Pressable
                onPress={openMakkahLiveInBrowser}
                style={({ pressed }) => [styles.fallbackBtn, pressed && { opacity: 0.88 }]}
                accessibilityRole="button"
                accessibilityLabel="Makkah Live сайтын ашу"
              >
                <MaterialIcons name="open-in-new" size={20} color="#fff" />
                <Text style={styles.fallbackBtnTxt}>Makkah Live</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={[styles.controls, { paddingBottom: controlsBottomPadding }]}>
          <Pressable
            onPress={toggleSound}
            style={({ pressed }) => [
              styles.soundBtn,
              { backgroundColor: muted ? "rgba(255,255,255,0.14)" : colors.accent },
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={muted ? soundOnLabel : soundOffLabel}
          >
            <MaterialIcons name={muted ? "volume-off" : "volume-up"} size={22} color="#fff" />
            <Text style={styles.soundBtnTxt}>{muted ? soundOnLabel : soundOffLabel}</Text>
          </Pressable>
        </View>
    </View>
  );
}

export function KaabaLiveModal(props: Props) {
  return (
    <Modal visible={props.visible} animationType="slide" onRequestClose={props.onClose} statusBarTranslucent>
      <KaabaLivePlayerSurface {...props} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  headerBtn: { width: 24, alignItems: "center", justifyContent: "center" },
  liveRow: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: "#FF3B30" },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "800", maxWidth: "82%" },
  videoWrap: { flex: 1, backgroundColor: "#000", justifyContent: "center" },
  web: { flex: 1, backgroundColor: "#000" },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  fallbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0,0,0,0.72)",
    gap: 10,
  },
  fallbackTitle: { color: "#fff", fontSize: 16, fontWeight: "800", textAlign: "center" },
  fallbackHint: { color: "rgba(255,255,255,0.78)", fontSize: 13, textAlign: "center", marginBottom: 6 },
  fallbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  fallbackBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
  controls: { paddingHorizontal: 16, paddingTop: 12, alignItems: "center", gap: 10 },
  soundBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 999,
    ...Platform.select({ android: { elevation: 3 }, default: {} }),
  },
  soundBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
