import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { QiblaArrowPointer } from "./QiblaArrowPointer";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { useQiblaMotion, useQiblaStable } from "../context/QiblaSensorContext";
import { qiblaAlignHint, type QiblaAlignHint } from "../lib/qiblaHints";
import { kk } from "../i18n/kk";
import type { ThemeColors } from "../theme/colors";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

function overlayHint(h: QiblaAlignHint, bearing: number | null): string {
  if (bearing == null) return kk.qibla.hintPending;
  switch (h) {
    case "none":
      return kk.qibla.hintPending;
    case "aligned":
      return kk.qibla.hintAligned;
    case "turn_cw":
      return kk.qibla.hintTurnCw;
    case "turn_ccw":
      return kk.qibla.hintTurnCcw;
  }
}

type Props = {
  colors: ThemeColors;
  /** modal: толық экран; inline: Qibla экранындағы панель */
  layout: "modal" | "inline";
  style?: StyleProp<ViewStyle>;
  /** modal: жабу батырмасы */
  onClose?: () => void;
  /** modal: жоғарғы қатарда тақырып */
  title?: string;
};

/**
 * Алдыңғы камера + құбыла көрсеткісі: телефонды бұрағанда иін сенсор бойынша айналады.
 */
export function QiblaArCameraView({ colors, layout, style, onClose, title }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const { bearing, refreshBearing } = useQiblaStable();
  const { rotateDeg, headingHasSample } = useQiblaMotion();

  const bearingReady = bearing != null;
  const motionReady = bearingReady && headingHasSample;
  const alignHint = qiblaAlignHint(rotateDeg, bearing, { headingReady: headingHasSample });
  const aligned = alignHint === "aligned" && bearing != null;
  const mainHint = overlayHint(alignHint, bearing);

  const dialSize = useMemo(() => {
    if (layout === "inline") return Math.min(SCREEN_W - 48, 220);
    return Math.min(SCREEN_W, SCREEN_H) * 0.42;
  }, [layout]);

  const styles = useMemo(() => makeStyles(colors, layout), [colors, layout]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    void (async () => {
      if (!permission?.granted) {
        const r = await requestPermission();
        if (!r.granted) {
          setReady(false);
          return;
        }
      }
      setReady(true);
    })();
  }, [permission?.granted, requestPermission]);

  const requestCam = useCallback(() => {
    void requestPermission();
  }, [requestPermission]);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webFallback, style]}>
        <Text style={styles.webTitle}>{title ?? kk.tabs.qibla}</Text>
        <Text style={styles.webBody}>{kk.qibla.cameraWebUnavailable}</Text>
        {onClose ? (
          <Pressable onPress={onClose} style={({ pressed }) => [styles.webBtn, pressed && { opacity: 0.9 }]}>
            <Text style={styles.webBtnTxt}>{kk.common.done}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.root, style]}>
      {ready && permission?.granted ? (
        <CameraView style={StyleSheet.absoluteFill} facing="front" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.camPlaceholder]} />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.72)", "rgba(0,0,0,0.08)", "rgba(0,0,0,0.08)", "rgba(0,0,0,0.78)"]}
        locations={[0, 0.22, 0.72, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {layout === "modal" ? (
        <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.common.back}
          >
            <MaterialIcons name="close" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1}>
            {title ?? kk.qibla.cameraTitle}
          </Text>
          <Pressable
            onPress={() => void refreshBearing()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.qibla.retryLocation}
          >
            <MaterialIcons name="my-location" size={24} color="#fff" />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.centerOverlay} pointerEvents={permission?.granted ? "none" : "box-none"}>
        {!permission?.granted ? (
          <View style={styles.permCard}>
            <Text style={styles.permTitle}>{kk.qibla.cameraPermTitle}</Text>
            <Text style={styles.permBody}>{kk.qibla.cameraPermBody}</Text>
            <Pressable
              onPress={requestCam}
              style={({ pressed }) => [styles.permBtn, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
            >
              <Text style={styles.permBtnTxt}>{kk.qibla.cameraPermCta}</Text>
            </Pressable>
          </View>
        ) : !ready ? (
          <RaqatOrnamentSpinner size={48} />
        ) : !motionReady ? (
          <RaqatOrnamentSpinner size={48} />
        ) : (
          <View
            style={[
              styles.dialFrame,
              aligned && styles.dialFrameAligned,
              { width: dialSize + 28, height: dialSize + 28 },
            ]}
          >
            <QiblaArrowPointer
              colors={colors}
              size={dialSize}
              rotateDeg={rotateDeg}
              aligned={aligned}
              showDialRing
              showDialHalo
              showTopMarker
              needlePulse
              showAlignLed
              ornamentArrow
              centerOyuMedallion={false}
            />
          </View>
        )}
      </View>

      <View
        style={[
          styles.bottomHud,
          { paddingBottom: layout === "modal" ? insets.bottom + 16 : 12 },
        ]}
        pointerEvents="box-none"
      >
        <Text style={[styles.hintLine, aligned && styles.hintAligned]} accessibilityLiveRegion="polite">
          {mainHint}
        </Text>
        <Text style={styles.subHint}>{kk.qibla.cameraBodyHint}</Text>
        {layout === "inline" && onClose ? (
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.inlineCloseBtn, pressed && { opacity: 0.9 }]}
          >
            <Text style={styles.inlineCloseTxt}>{kk.qibla.cameraBackToCompass}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, layout: "modal" | "inline") {
  const inlineMinH = Math.min(SCREEN_H * 0.52, 420);
  return StyleSheet.create({
    root: {
      flex: layout === "modal" ? 1 : undefined,
      minHeight: layout === "inline" ? inlineMinH : undefined,
      backgroundColor: "#000",
      overflow: "hidden",
      borderRadius: layout === "inline" ? 16 : 0,
    },
    camPlaceholder: { backgroundColor: "#111" },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      zIndex: 3,
    },
    iconBtn: { padding: 10 },
    topTitle: {
      flex: 1,
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
      textAlign: "center",
    },
    centerOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },
    dialFrame: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.22)",
    },
    dialFrameAligned: {
      borderColor: colors.success,
      borderWidth: 2.5,
    },
    bottomHud: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 18,
      paddingTop: 12,
      zIndex: 3,
    },
    hintLine: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 22,
      textAlign: "center",
      marginBottom: 6,
    },
    hintAligned: { color: colors.success },
    subHint: {
      color: "rgba(255,255,255,0.72)",
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
    },
    permCard: {
      marginHorizontal: 24,
      padding: 18,
      borderRadius: 14,
      backgroundColor: "rgba(0,0,0,0.55)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      gap: 10,
    },
    permTitle: { color: "#fff", fontSize: 16, fontWeight: "800", textAlign: "center" },
    permBody: { color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 19, textAlign: "center" },
    permBtn: {
      alignSelf: "center",
      marginTop: 4,
      backgroundColor: colors.accent,
      paddingVertical: 11,
      paddingHorizontal: 18,
      borderRadius: 12,
    },
    permBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
    inlineCloseBtn: {
      alignSelf: "center",
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
    },
    inlineCloseTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
    webFallback: {
      padding: 20,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
    },
    webTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
    webBody: { color: colors.muted, fontSize: 14, lineHeight: 21 },
    webBtn: { alignSelf: "flex-end", paddingVertical: 8 },
    webBtnTxt: { color: colors.accent, fontWeight: "800", fontSize: 15 },
  });
}
