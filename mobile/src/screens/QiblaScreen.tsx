import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useQiblaSensor } from "../context/QiblaSensorContext";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { menuIconAssets } from "../theme/menuIconAssets";
import { QiblaArrowPointer } from "../components/QiblaArrowPointer";
import { qiblaAlignHint, QIBLA_ALIGN_THRESHOLD_DEG, type QiblaAlignHint } from "../lib/qiblaHints";

const { width } = Dimensions.get("window");

function screenHint(h: QiblaAlignHint, bearing: number | null): string {
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

export function QiblaScreen() {
  const { colors } = useAppTheme();
  const { perm, bearing, rotateDeg, refreshBearing, positionFailed, locationSource, motionMode, setMotionMode } =
    useQiblaSensor();
  const dialSize = Math.min(width - 124, 196);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alignHint = qiblaAlignHint(rotateDeg, bearing);
  const mainHint = screenHint(alignHint, bearing);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationSecLeft, setCalibrationSecLeft] = useState(20);
  const [calibrationResult, setCalibrationResult] = useState<"high" | "medium" | "low" | null>(null);
  const rotateDegRef = useRef(rotateDeg);

  useEffect(() => {
    rotateDegRef.current = rotateDeg;
  }, [rotateDeg]);

  useFocusEffect(
    useCallback(() => {
      void refreshBearing();
    }, [refreshBearing])
  );

  useEffect(() => {
    if (!calibrating) return;
    setCalibrationSecLeft(20);
    const tick = setInterval(() => {
      setCalibrationSecLeft((prev) => {
        if (prev <= 1) {
          clearInterval(tick);
          setCalibrating(false);
          void refreshBearing();
          const diff = Math.abs(rotateDegRef.current);
          if (diff <= 8) {
            setCalibrationResult("high");
          } else if (diff <= 18) {
            setCalibrationResult("medium");
          } else {
            setCalibrationResult("low");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [calibrating, refreshBearing]);

  const openAppSettings = () => {
    void Linking.openSettings();
  };

  if (perm === "unknown") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.muted}>{kk.qibla.permLoading}</Text>
      </View>
    );
  }

  if (perm === "denied") {
    return (
      <View style={styles.pad}>
        <Text style={styles.errTitle}>{kk.qibla.deniedTitle}</Text>
        <Text style={styles.err}>{kk.qibla.deniedBody}</Text>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          onPress={openAppSettings}
        >
          <Text style={styles.primaryBtnTxt}>{kk.qibla.openSettings}</Text>
        </Pressable>
      </View>
    );
  }

  if (perm === "services_disabled") {
    return (
      <View style={styles.pad}>
        <Text style={styles.errTitle}>{kk.qibla.servicesOffTitle}</Text>
        <Text style={styles.err}>{kk.qibla.servicesOffBody}</Text>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          onPress={openAppSettings}
        >
          <Text style={styles.primaryBtnTxt}>{kk.qibla.openSettings}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
          onPress={() => void refreshBearing()}
        >
          <Text style={styles.secondaryBtnTxt}>{kk.qibla.retryLocation}</Text>
        </Pressable>
      </View>
    );
  }

  if (positionFailed && bearing == null) {
    return (
      <View style={styles.pad}>
        <Text style={styles.errTitle}>{kk.qibla.positionFailedTitle}</Text>
        <Text style={styles.err}>{kk.qibla.positionFailedBody}</Text>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
          onPress={() => void refreshBearing()}
        >
          <Text style={styles.primaryBtnTxt}>{kk.qibla.retryLocation}</Text>
        </Pressable>
        {Platform.OS === "android" ? (
          <Pressable
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
            onPress={openAppSettings}
          >
            <Text style={styles.secondaryBtnTxt}>{kk.qibla.openSettings}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.arrowPanel}>
        <QiblaArrowPointer
          colors={colors}
          size={dialSize}
          rotateDeg={rotateDeg}
          aligned={alignHint === "aligned" && bearing != null}
          showDialRing
        />
        <Image
          source={menuIconAssets.headerQibla}
          style={styles.kaabaImg}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
          accessibilityLabel="Kaaba"
        />
      </View>

      {locationSource === "city" ? (
        <Text style={styles.cityBanner}>{kk.qibla.cityApproxHint}</Text>
      ) : null}

      <Text
        style={[
          styles.mainHint,
          alignHint === "aligned" && bearing != null && { color: colors.success },
        ]}
      >
        {mainHint}
      </Text>

      {bearing != null ? (
        <Text style={styles.offsetLine} accessibilityLiveRegion="polite">
          {alignHint === "aligned"
            ? kk.qibla.offsetInZone(QIBLA_ALIGN_THRESHOLD_DEG)
            : alignHint === "turn_cw"
              ? kk.qibla.offsetPreciseCw(Math.max(1, Math.round(Math.abs(rotateDeg))))
              : kk.qibla.offsetPreciseCcw(Math.max(1, Math.round(Math.abs(rotateDeg))))}
        </Text>
      ) : null}

      <View style={styles.modeRow}>
        <Pressable
          style={({ pressed }) => [
            styles.modeChip,
            motionMode === "balanced" && styles.modeChipActive,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => setMotionMode("balanced")}
        >
          <Text style={[styles.modeTxt, motionMode === "balanced" && styles.modeTxtActive]}>Balanced</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.modeChip,
            motionMode === "fast" && styles.modeChipActive,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => setMotionMode("fast")}
        >
          <Text style={[styles.modeTxt, motionMode === "fast" && styles.modeTxtActive]}>Fast</Text>
        </Pressable>
      </View>

      <View style={styles.calibrationCard}>
        <Text style={styles.calibrationTitle}>{kk.qibla.calibrationTitle}</Text>
        <Text style={styles.calibrationBody}>
          {calibrating
            ? kk.qibla.calibrationRunning(calibrationSecLeft)
            : kk.qibla.calibrationBody}
        </Text>
        <Pressable
          style={({ pressed }) => [
            styles.secondaryBtn,
            calibrating && styles.calibrationBtnActive,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => {
            setCalibrationResult(null);
            setCalibrating((p) => !p);
          }}
        >
          <Text style={styles.secondaryBtnTxt}>
            {calibrating ? kk.qibla.calibrationStop : kk.qibla.calibrationStart}
          </Text>
        </Pressable>
        {calibrationResult ? (
          <Text
            style={[
              styles.calibrationBadge,
              calibrationResult === "high"
                ? styles.calibrationHigh
                : calibrationResult === "medium"
                  ? styles.calibrationMedium
                  : styles.calibrationLow,
            ]}
          >
            {calibrationResult === "high"
              ? kk.qibla.calibrationHigh
              : calibrationResult === "medium"
                ? kk.qibla.calibrationMedium
                : kk.qibla.calibrationLow}
          </Text>
        ) : null}
      </View>

      <Pressable
        style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
        onPress={() => void refreshBearing()}
      >
        <Text style={styles.secondaryBtnTxt}>{kk.qibla.retryLocation}</Text>
      </Pressable>

      <Text style={styles.hint}>{kk.qibla.magnetHint}</Text>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.bg },
    pad: { padding: 20, paddingBottom: 32 },
    center: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: "center",
      alignItems: "center",
    },
    muted: { color: colors.muted },
    cityBanner: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 10,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mainHint: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 24,
      marginBottom: 8,
      textAlign: "center",
    },
    offsetLine: {
      color: colors.muted,
      fontSize: 15,
      fontWeight: "600",
      lineHeight: 22,
      marginBottom: 14,
      textAlign: "center",
      letterSpacing: 0.2,
      ...(Platform.OS === "ios" ? ({ fontVariant: ["tabular-nums"] } as const) : {}),
    },
    errTitle: { color: colors.text, fontWeight: "700", fontSize: 18, marginBottom: 8 },
    err: { color: colors.muted, lineHeight: 22, marginBottom: 16 },
    primaryBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 10,
    },
    primaryBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
    secondaryBtn: {
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    secondaryBtnTxt: { color: colors.accent, fontWeight: "600", fontSize: 15 },
    modeRow: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      marginBottom: 12,
    },
    modeChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    modeChipActive: {
      borderColor: colors.accent,
      backgroundColor: "rgba(34,197,94,0.14)",
    },
    modeTxt: { color: colors.muted, fontSize: 13, fontWeight: "700" },
    modeTxtActive: { color: colors.accent },
    calibrationCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      backgroundColor: colors.card,
      marginBottom: 12,
      gap: 8,
    },
    calibrationTitle: { color: colors.text, fontWeight: "700", fontSize: 15 },
    calibrationBody: { color: colors.muted, lineHeight: 20, fontSize: 13 },
    calibrationBtnActive: {
      borderColor: colors.success,
      backgroundColor: `${colors.success}14`,
    },
    calibrationBadge: {
      alignSelf: "flex-start",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      fontSize: 12,
      fontWeight: "700",
      overflow: "hidden",
    },
    calibrationHigh: { color: colors.success, backgroundColor: `${colors.success}1f` },
    calibrationMedium: { color: "#b08900", backgroundColor: "#b089001f" },
    calibrationLow: { color: "#c0392b", backgroundColor: "#c0392b1f" },
    arrowPanel: {
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      paddingVertical: 6,
      paddingHorizontal: 4,
      minWidth: width - 84,
    },
    /** Эмодзи 🕋 орнына PNG — қоршаусыз, анық */
    kaabaImg: { width: 36, height: 36, marginTop: 8 },
    hint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  });
}
