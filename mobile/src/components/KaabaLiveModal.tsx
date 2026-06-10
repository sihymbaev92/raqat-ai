import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../theme/colors";

/** Ресми Saudi Quran TV live channel. Жеке video ID-лар live эфирде ауысып кетеді. */
const SAUDI_QURAN_TV_CHANNEL_ID = "UCos52azQNBgW63_9uDJoPDA";

type KaabaLiveSource =
  | { kind: "channel"; channelId: string }
  | { kind: "video"; videoId: string };

/** Қағба/Харам тікелей эфир (қажылық бөлімі). Channel live — негізгі, video ID-лар — резерв. */
const KAABA_LIVE_SOURCES: readonly KaabaLiveSource[] = [
  { kind: "channel", channelId: SAUDI_QURAN_TV_CHANNEL_ID },
  { kind: "video", videoId: "Xn0Q7_W51-g" },
  { kind: "video", videoId: "u_WCem8-Jaw" },
  { kind: "video", videoId: "KPOsMGIju8k" },
] as const;

const YOUTUBE_ORIGIN = "https://www.youtube.com";
const YOUTUBE_LIVE_CHANNEL_URL = "https://www.youtube.com/@SaudiQuranTv/live";

const EMBED_UA =
  "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 RaqatKaabaLive/1";

/** Web iframe үшін: бет origin-і (postMessage командалары сәйкес келуі үшін). */
function webEmbedOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return YOUTUBE_ORIGIN;
}

function liveEmbedSrc(source: KaabaLiveSource, origin: string = YOUTUBE_ORIGIN): string {
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
  if (source.kind === "channel") {
    q.set("channel", source.channelId);
    return `https://www.youtube.com/embed/live_stream?${q.toString()}`;
  }
  return `https://www.youtube.com/embed/${source.videoId}?${q.toString()}`;
}

function liveNativeUrl(source: KaabaLiveSource): string {
  if (source.kind === "channel") {
    return YOUTUBE_LIVE_CHANNEL_URL;
  }
  return `https://www.youtube.com/watch?v=${source.videoId}`;
}

function isAllowedNativeYoutubeUrl(raw: string): boolean {
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
      host === "google.com" ||
      host.endsWith(".google.com")
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
  reloadLabel: string;
  backupLabel: string;
};

export function KaabaLiveModal({
  visible,
  onClose,
  colors,
  title,
  soundOnLabel,
  soundOffLabel,
  closeLabel,
  reloadLabel,
  backupLabel,
}: Props) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const webRef = useRef<WebView>(null);
  const iframeRef = useRef<{ contentWindow?: { postMessage: (m: string, t: string) => void } } | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [reloadTick, setReloadTick] = useState(0);
  const [muted, setMuted] = useState(true);
  const [loading, setLoading] = useState(true);

  const liveSource = KAABA_LIVE_SOURCES[sourceIndex] ?? KAABA_LIVE_SOURCES[0]!;
  const sourceKey =
    (liveSource.kind === "channel" ? `channel-${liveSource.channelId}` : `video-${liveSource.videoId}`) +
    `-${reloadTick}`;
  const embedSrc = useMemo(() => liveEmbedSrc(liveSource, webEmbedOrigin()), [liveSource]);
  const nativeSource = useMemo(() => ({ uri: liveNativeUrl(liveSource) }), [liveSource]);

  useEffect(() => {
    if (!visible) return;
    setSourceIndex(0);
    setReloadTick(0);
    setMuted(true);
    setLoading(true);
  }, [visible]);

  const tryNextSource = useCallback(() => {
    setSourceIndex((i) => {
      setLoading(true);
      setReloadTick((tick) => tick + 1);
      if (i + 1 >= KAABA_LIVE_SOURCES.length) return 0;
      return i + 1;
    });
  }, []);

  const reloadCurrentSource = useCallback(() => {
    setLoading(true);
    setReloadTick((tick) => tick + 1);
  }, []);

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

  const onWebViewNav = (ev: WebViewNavigation) => {
    const u = ev.url || "";
    if (!isAllowedNativeYoutubeUrl(u)) {
      webRef.current?.goBack();
    }
  };

  const shouldStartWebViewLoad = (ev: WebViewNavigation) => isAllowedNativeYoutubeUrl(ev.url || "");

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
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
                onLoadEnd={() => setLoading(false)}
                onError={onWebViewError}
                onHttpError={onWebViewError}
                onShouldStartLoadWithRequest={shouldStartWebViewLoad}
                onNavigationStateChange={onWebViewNav}
              />
            )}
          {loading ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : null}
        </View>

        <View style={[styles.controls, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          {isWeb ? (
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
          ) : (
            <View style={styles.nativeControlsRow}>
              <Pressable
                onPress={reloadCurrentSource}
                style={({ pressed }) => [
                  styles.nativeBtn,
                  { backgroundColor: "rgba(255,255,255,0.14)" },
                  pressed && { opacity: 0.9 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={reloadLabel}
              >
                <MaterialIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.soundBtnTxt}>{reloadLabel}</Text>
              </Pressable>
              <Pressable
                onPress={tryNextSource}
                style={({ pressed }) => [
                  styles.nativeBtn,
                  { backgroundColor: colors.accent },
                  pressed && { opacity: 0.9 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={backupLabel}
              >
                <MaterialIcons name="live-tv" size={20} color="#fff" />
                <Text style={styles.soundBtnTxt}>{backupLabel}</Text>
              </Pressable>
            </View>
          )}
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
  controls: { paddingHorizontal: 16, paddingTop: 12, alignItems: "center", gap: 10 },
  nativeControlsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  nativeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 999,
    ...Platform.select({ android: { elevation: 3 }, default: {} }),
  },
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
