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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../theme/colors";
import { modalSafeAreaInsets } from "../theme/modalSafeArea";

/** Ресми Saudi Quran TV live channel. Жеке video ID-лар live эфирде ауысып кетуі мүмкін. */
const SAUDI_QURAN_TV_CHANNEL_ID = "UCos52azQNBgW63_9uDJoPDA";

type KaabaLiveSource =
  | { kind: "video"; videoId: string }
  | { kind: "page"; uri: string };

/** Тұрақты Makkah Live сайты — YouTube ID ауысқанда да жұмыс істейді. */
export const MAKKAH_LIVE_PRIMARY_URL = "https://makkahlive.net/makkahlive.aspx";

/** Экранда көрсетілмейтін ішкі fallback: біреуі ашылмаса, келесісіне автомат өтеді. */
export const KAABA_LIVE_SOURCES: readonly KaabaLiveSource[] = [
  { kind: "page", uri: MAKKAH_LIVE_PRIMARY_URL },
  { kind: "page", uri: "https://saudiatv.sba.sa/Channel-%D9%82%D9%86%D8%A7%D8%A9-%D8%A7%D9%84%D9%82%D8%B1%D8%A7%D9%86-%D8%A7%D9%84%D9%83%D8%B1%D9%8A%D9%85--11" },
  { kind: "page", uri: "https://www.youtube.com/SaudiQuranTv/live" },
  { kind: "page", uri: `https://www.youtube.com/channel/${SAUDI_QURAN_TV_CHANNEL_ID}/live` },
] as const;

const YOUTUBE_ORIGIN = "https://www.youtube.com";
const YOUTUBE_NOCOOKIE_ORIGIN = "https://www.youtube-nocookie.com";
const KAABA_LIVE_AUTO_FALLBACK_MS = 15000;
const KAABA_LIVE_WEB_PLAYER_HEALTH_MS = 5500;
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
    if (/Video unavailable|This video is unavailable|Playback on other websites|An error occurred|Error 153/i.test(text)) {
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

const EMBED_UA =
  "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 RaqatKaabaLive/1";

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
  platform: "web" | "native" = "native"
): string {
  if (source.kind === "page") {
    if (isSaudiQuranTvLivePage(source.uri)) {
      const q = new URLSearchParams({
        channel: SAUDI_QURAN_TV_CHANNEL_ID,
        autoplay: "1",
        mute: "1",
        playsinline: "1",
        enablejsapi: "1",
        rel: "0",
        modestbranding: "1",
        fs: "1",
        origin,
      });
      if (platform === "web") {
        q.set("widget_referrer", origin);
        return `https://www.youtube.com/embed/live_stream?${q.toString()}`;
      }
      return `${YOUTUBE_NOCOOKIE_ORIGIN}/embed/live_stream?${q.toString()}`;
    }
    return source.uri;
  }
  const q = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    enablejsapi: "1",
    rel: "0",
    modestbranding: "1",
    fs: "1",
    origin,
  });
  return `https://www.youtube.com/embed/${source.videoId}?${q.toString()}`;
}

export function kaabaLiveSourcesForWeb(): readonly KaabaLiveSource[] {
  const seen = new Set<string>();
  return KAABA_LIVE_SOURCES.filter((source) => {
    const key = source.kind === "page" && isSaudiQuranTvLivePage(source.uri) ? "youtube-live" : JSON.stringify(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isYouTubeEmbedUrl(src: string): boolean {
  try {
    const host = new URL(src).hostname.toLowerCase();
    return host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtube-nocookie.com" || host.endsWith(".youtube-nocookie.com");
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
};

export function KaabaLiveModal({
  visible,
  onClose,
  colors,
  title,
  soundOnLabel,
  soundOffLabel,
  closeLabel,
}: Props) {
  const insets = useSafeAreaInsets();
  const modalInsets = modalSafeAreaInsets(insets);
  const isWeb = Platform.OS === "web";
  const webRef = useRef<WebView>(null);
  const iframeRef = useRef<{ contentWindow?: { postMessage: (m: string, t: string) => void } } | null>(null);
  const webPlayerHealthyRef = useRef(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showBrowserFallback, setShowBrowserFallback] = useState(false);
  const liveSources = useMemo(() => (isWeb ? kaabaLiveSourcesForWeb() : KAABA_LIVE_SOURCES), [isWeb]);
  const controlsBottomPadding =
    Platform.OS === "android" ? Math.max(modalInsets.bottom, 48) + 12 : Math.max(modalInsets.bottom, 12) + 8;

  const liveSource = liveSources[sourceIndex] ?? liveSources[0]!;
  const sourceKey =
    (liveSource.kind === "video" ? `video-${liveSource.videoId}` : `page-${liveSource.uri}`) + `-${reloadTick}`;
  const embedSrc = useMemo(
    () => liveEmbedSrc(liveSource, webEmbedOrigin(), isWeb ? "web" : "native"),
    [liveSource, isWeb]
  );
  const nativeSource = useMemo(() => ({ uri: embedSrc }), [embedSrc]);
  const isYoutubeWebEmbed = isWeb && isYouTubeEmbedUrl(embedSrc);
  const isMakkahLiveEmbed = isMakkahLivePage(embedSrc);

  useEffect(() => {
    if (!visible) return;
    setSourceIndex(0);
    setReloadTick(0);
    setMuted(true);
    setLoading(true);
    setShowBrowserFallback(false);
  }, [visible]);

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
    const ms = isMakkahLiveEmbed ? 25000 : KAABA_LIVE_AUTO_FALLBACK_MS;
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
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

        <View style={styles.videoWrap}>
          {isWeb
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
                userAgent={EMBED_UA}
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
                injectedJavaScript={KAABA_LIVE_ERROR_DETECT_JS}
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
              <Text style={styles.fallbackHint}>Makkah Live сайтын браузерде ашыңыз</Text>
              <Pressable
                onPress={openMakkahLiveInBrowser}
                style={({ pressed }) => [styles.fallbackBtn, pressed && { opacity: 0.88 }]}
                accessibilityRole="button"
                accessibilityLabel="Makkah Live сайтын ашу"
              >
                <MaterialIcons name="open-in-new" size={20} color="#fff" />
                <Text style={styles.fallbackBtnTxt}>Makkah Live ашу</Text>
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
