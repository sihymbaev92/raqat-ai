import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Video, ResizeMode, type AVPlaybackStatus } from "expo-av";
import { useKeepAwake } from "expo-keep-awake";
import * as ScreenOrientation from "expo-screen-orientation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useDeviceSafeAreaInsets } from "../theme/deviceSafeArea";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import {
  MAKKAH_LIVE_HLS_SOURCES,
  makkahLiveSourceNeedsQualityPin,
} from "../config/makkahLiveYoutube";
import { resolveHighestQualityHlsUrl } from "../utils/makkahLiveHlsResolve";

type Props = {
  title: string;
  backLabel: string;
  loadingLabel: string;
  errorLabel: string;
  retryLabel: string;
  expandLabel: string;
  collapseLabel: string;
  onBack: () => void;
  onFullscreenChange?: (fullscreen: boolean) => void;
};

const HLS_HEADERS = {
  Accept: "*/*",
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
} as const;

const APP_BAR_BODY_H = 52;
const META_PANE_MIN_H = 72;
const FHD_REFRESH_MS = 8 * 60_000;

async function enableLiveAudioSession(): Promise<void> {
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
    /* */
  }
}

async function lockPortrait(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    if (Platform.OS === "android") {
      await new Promise<void>((r) => setTimeout(r, 40));
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  } catch {
    /* */
  }
}

async function lockLandscape(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  } catch {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    } catch {
      /* */
    }
  }
}

/** Қағба HD HLS — жарты экран + толық экран (көлденең). */
export function MakkahLiveHlsPlayer({
  title,
  backLabel,
  loadingLabel,
  errorLabel,
  retryLabel,
  expandLabel,
  collapseLabel,
  onBack,
  onFullscreenChange,
}: Props) {
  useKeepAwake();
  const insets = useDeviceSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const videoRef = useRef<Video>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const errorStreakRef = useRef(0);
  const resolveGenRef = useRef(0);

  const layoutWidth = Math.max(1, width - insets.left - insets.right);

  const portraitVideoH = useMemo(() => {
    const ideal16x9 = Math.round((layoutWidth * 9) / 16);
    const capByScreen = Math.round(height * 0.46);
    const reserved = APP_BAR_BODY_H + META_PANE_MIN_H + 24;
    const capByStack = Math.max(160, Math.round(height - reserved));
    return Math.min(ideal16x9, capByScreen, capByStack);
  }, [height, layoutWidth]);

  const resolvePlayUrl = useCallback(async (idx: number) => {
    const gen = ++resolveGenRef.current;
    const master = MAKKAH_LIVE_HLS_SOURCES[idx] ?? MAKKAH_LIVE_HLS_SOURCES[0]!;
    setResolving(true);
    setReady(false);
    setPlayUrl(null);
    let uri = master;
    if (makkahLiveSourceNeedsQualityPin(idx)) {
      uri = await resolveHighestQualityHlsUrl(master);
    }
    if (gen !== resolveGenRef.current) return;
    setPlayUrl(uri);
    setResolving(false);
  }, []);

  useEffect(() => {
    void enableLiveAudioSession();
    void lockPortrait();
    return () => {
      resolveGenRef.current += 1;
      void videoRef.current?.stopAsync().catch(() => undefined);
      void videoRef.current?.unloadAsync().catch(() => undefined);
      setPlayUrl(null);
      void lockPortrait();
    };
  }, []);

  useEffect(() => {
    void resolvePlayUrl(sourceIndex);
  }, [sourceIndex, resolvePlayUrl]);

  useEffect(() => {
    if (sourceIndex !== 0) return;
    const t = setInterval(() => {
      void resolvePlayUrl(0);
    }, FHD_REFRESH_MS);
    return () => clearInterval(t);
  }, [sourceIndex, resolvePlayUrl]);

  useEffect(() => {
    onFullscreenChange?.(fullscreen);
  }, [fullscreen, onFullscreenChange]);

  useEffect(() => {
    if (fullscreen) {
      void lockLandscape();
      StatusBar.setHidden(true, "fade");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("#000000", true);
      }
    } else {
      void lockPortrait();
      StatusBar.setHidden(false, "fade");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("#000000", true);
      }
    }
    return () => {
      onFullscreenChange?.(false);
      StatusBar.setHidden(false, "fade");
      if (Platform.OS === "android") {
        StatusBar.setBackgroundColor("#000000", true);
      }
    };
  }, [fullscreen, onFullscreenChange]);

  const tryNextHlsSource = useCallback(() => {
    errorStreakRef.current += 1;
    if (errorStreakRef.current < 2) {
      void videoRef.current?.replayAsync().catch(() => undefined);
      return;
    }
    errorStreakRef.current = 0;
    setReady(false);
    setSourceIndex((idx) => {
      const next = idx + 1;
      if (next >= MAKKAH_LIVE_HLS_SOURCES.length) {
        setFailed(true);
        return idx;
      }
      return next;
    });
  }, []);

  const retry = useCallback(() => {
    errorStreakRef.current = 0;
    setFailed(false);
    setReady(false);
    setSourceIndex(0);
    void resolvePlayUrl(0);
  }, [resolvePlayUrl]);

  const onPlaybackStatus = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) {
        if (status.error) tryNextHlsSource();
        return;
      }
      errorStreakRef.current = 0;
      setReady(true);
      setFailed(false);
    },
    [tryNextHlsSource]
  );

  const enterFullscreen = useCallback(() => {
    setFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(() => {
    setFullscreen(false);
  }, []);

  const handleBack = useCallback(() => {
    if (fullscreen) {
      exitFullscreen();
      return;
    }
    onBack();
  }, [exitFullscreen, fullscreen, onBack]);

  const showLoading = resolving || !ready || !playUrl;

  const videoEl =
    playUrl != null ? (
      <Video
        key={`${playUrl}-${fullscreen ? "fs" : "half"}`}
        ref={videoRef}
        source={{ uri: playUrl, headers: { ...HLS_HEADERS } }}
        style={fullscreen ? styles.fsVideo : styles.video}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls={false}
        shouldPlay
        isMuted={false}
        isLooping={false}
        progressUpdateIntervalMillis={500}
        onPlaybackStatusUpdate={onPlaybackStatus}
        onError={tryNextHlsSource}
      />
    ) : null;

  const appBar = (
    <View style={[styles.appBar, { paddingHorizontal: Math.max(insets.left, 8) }]}>
      <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel={backLabel} style={styles.chromeBtn}>
        <MaterialIcons name="arrow-back" size={24} color="#fff" />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.chromeBtn} />
    </View>
  );

  if (failed) {
    return (
      <View style={styles.root}>
        {appBar}
        <View style={styles.center}>
          <Text style={styles.error}>{errorLabel}</Text>
          <Pressable
            onPress={retry}
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
          >
            <Text style={styles.retryBtnTxt}>{retryLabel}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const fullscreenOverlay = (
    <Modal
      visible={fullscreen}
      animationType="fade"
      presentationStyle="fullScreen"
      supportedOrientations={["landscape", "landscape-left", "landscape-right"]}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={exitFullscreen}
    >
      <View style={styles.fsRoot}>
        <View style={styles.fsVideoStage}>{fullscreen ? videoEl : null}</View>
        <View
          style={[
            styles.fsChrome,
            {
              paddingTop: Math.max(insets.top, 10),
              paddingLeft: Math.max(insets.left, 10),
              paddingRight: Math.max(insets.right, 10),
            },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={collapseLabel}
            style={styles.fsChromeBtn}
          >
            <MaterialIcons name="fullscreen-exit" size={26} color="#fff" />
          </Pressable>
        </View>
        {showLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color="#FFC107" size="large" />
            <Text style={styles.loading}>{loadingLabel}</Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );

  return (
    <View style={styles.root}>
      {fullscreenOverlay}
      {appBar}

      <View style={[styles.playerShell, { height: portraitVideoH, width: layoutWidth, alignSelf: "center" }]}>
        {!fullscreen ? videoEl : null}
        {showLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator color="#FFC107" size="large" />
            <Text style={styles.loading}>{loadingLabel}</Text>
          </View>
        ) : null}
        <View style={styles.playerBottomChrome} pointerEvents="box-none">
          <Pressable
            onPress={enterFullscreen}
            accessibilityRole="button"
            accessibilityLabel={expandLabel}
            style={({ pressed }) => [styles.expandBtn, pressed && { opacity: 0.88 }]}
          >
            <MaterialIcons name="fullscreen" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={[styles.metaPane, { paddingHorizontal: 16 + Math.max(insets.left, insets.right) }]}>
        <View style={styles.liveBadgeRow}>
          <View style={styles.liveDot} />
          <Text style={styles.metaHint}>LIVE · HD</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  fsRoot: {
    flex: 1,
    backgroundColor: "#000",
  },
  fsVideoStage: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fsVideo: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  appBar: {
    flexDirection: "row",
    alignItems: "center",
    height: APP_BAR_BODY_H,
    flexShrink: 0,
    backgroundColor: "#000",
    zIndex: 2,
  },
  chromeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  playerShell: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#000",
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    gap: 10,
    zIndex: 1,
  },
  loading: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "700" },
  playerBottomChrome: {
    position: "absolute",
    right: 10,
    bottom: 10,
    zIndex: 2,
  },
  expandBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    width: 40,
    height: 40,
    borderRadius: 999,
  },
  metaPane: {
    flex: 1,
    minHeight: META_PANE_MIN_H,
    paddingTop: 14,
    backgroundColor: "#000",
    flexShrink: 0,
  },
  liveBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  metaHint: { color: "#fff", fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },
  fsChrome: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  fsChromeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 999,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
  },
  error: { color: "#fff", fontSize: 15, textAlign: "center", fontWeight: "700", lineHeight: 22 },
  retryBtn: {
    backgroundColor: "#FFC107",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryBtnTxt: { color: "#111", fontSize: 14, fontWeight: "900" },
});
