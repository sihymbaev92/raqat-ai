import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Linking,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import { QiblaSensorProvider, useQiblaSensor } from "../context/QiblaSensorContext";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { QiblaArrowPointer } from "../components/QiblaArrowPointer";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { qiblaAlignHint, QIBLA_ALIGN_THRESHOLD_DEG, type QiblaAlignHint } from "../lib/qiblaHints";
import { angleDiff } from "../lib/qibla";
import { useAppLocale } from "../i18n/runtime";
import { useI18n } from "../i18n/useI18n";
import { qiblaDialSize, useQiblaLandscapeFullscreen } from "../hooks/useQiblaLandscapeFullscreen";
import { appBottomSafeInset, useDeviceSafeAreaInsets } from "../theme/deviceSafeArea";

const { width: initialWidth } = Dimensions.get("window");

/** Көрсету үшін 0.1° дәлдік (солтүстік = 0…360). */
function formatDeg1(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return (Math.round(n * 10) / 10).toFixed(1);
}

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

function formatAccuracyMeters(m: number | null | undefined, t: ReturnType<typeof useI18n>): string {
  if (m == null || !Number.isFinite(m)) return "—";
  if (m >= 1000) return t.qibla.accuracyKm((m / 1000).toFixed(1));
  return t.qibla.accuracyM(Math.max(1, Math.round(m)));
}

export function QiblaScreen() {
  useAppLocale();
  return (
    <QiblaSensorProvider>
      <QiblaScreenContent />
    </QiblaSensorProvider>
  );
}

function QiblaScreenContent() {
  const { colors } = useAppTheme();
  const t = useI18n();
  const { width: layoutWidth, height: layoutHeight } = useWindowDimensions();
  const deviceInsets = useDeviceSafeAreaInsets();
  const bottomInset = appBottomSafeInset(deviceInsets);
  const { landscape, enterLandscape, exitLandscape } = useQiblaLandscapeFullscreen();
  const {
    perm,
    bearing,
    heading,
    headingHasSample,
    rotateDeg,
    refreshBearing,
    positionFailed,
    locationSource,
    locationAccuracyM,
    motionMode,
    setMotionMode,
    headingAccuracyDeg,
    compassQuality,
    resetHeadingSmoothing,
  } = useQiblaSensor();
  const onlineGps = locationSource === "gps";
  const dialSize = qiblaDialSize({
    width: layoutWidth,
    height: layoutHeight,
    landscape,
    onlineGps,
  });
  const styles = useMemo(() => makeStyles(colors, layoutWidth), [colors, layoutWidth]);
  const [manualWebHeading, setManualWebHeading] = useState<number | null>(null);
  const effectiveHeading = headingHasSample ? heading : manualWebHeading;
  const effectiveHeadingHasSample = headingHasSample || manualWebHeading != null;
  const effectiveRotateDeg =
    bearing == null || effectiveHeading == null ? rotateDeg : angleDiff(effectiveHeading, bearing);
  const alignHint = qiblaAlignHint(effectiveRotateDeg, bearing, { headingReady: effectiveHeadingHasSample });
  const mainHint = screenHint(alignHint, bearing);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationSecLeft, setCalibrationSecLeft] = useState(12);
  const [calibrationResult, setCalibrationResult] = useState<"high" | "medium" | "low" | null>(null);
  const rotateDegRef = useRef(effectiveRotateDeg);
  const compassQualityRef = useRef(compassQuality);
  const showWebCompassPermission = Platform.OS === "web" && bearing != null && !headingHasSample;
  rotateDegRef.current = effectiveRotateDeg;
  compassQualityRef.current = compassQuality;

  useFocusEffect(
    useCallback(() => {
      setMotionMode("fast");
      void refreshBearing();
    }, [refreshBearing, setMotionMode])
  );

  useEffect(() => {
    if (headingHasSample) {
      setManualWebHeading(null);
    }
  }, [headingHasSample]);

  const shiftManualWebHeading = useCallback((delta: number) => {
    setManualWebHeading((prev) => {
      const base = prev ?? 0;
      return ((base + delta) % 360 + 360) % 360;
    });
  }, []);

  useEffect(() => {
    if (!calibrating) return;
    setCalibrationSecLeft(12);
    resetHeadingSmoothing();
    const tick = setInterval(() => {
      setCalibrationSecLeft((prev) => {
        if (prev <= 1) {
          clearInterval(tick);
          setCalibrating(false);
          void refreshBearing();
          const q = compassQualityRef.current;
          if (q === "high") {
            setCalibrationResult("high");
          } else if (q === "medium") {
            setCalibrationResult("medium");
          } else if (q === "low") {
            setCalibrationResult("low");
          } else {
            /** Sensor accuracy әлі жоқ — туралау бойынша емес, үлгі бар-жоғы. */
            setCalibrationResult(headingHasSample ? "medium" : "low");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [calibrating, refreshBearing, resetHeadingSmoothing, headingHasSample]);

  const openAppSettings = () => {
    void Linking.openSettings();
  };

  if (perm === "unknown") {
    return (
      <View style={styles.center}>
        <RaqatOrnamentSpinner size={52} />
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

  const compassNode =
    bearing != null && !effectiveHeadingHasSample ? (
      <View
        style={{
          width: dialSize,
          height: dialSize,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <RaqatOrnamentSpinner size={landscape ? 64 : 52} />
      </View>
    ) : (
      <QiblaArrowPointer
        colors={colors}
        size={dialSize}
        rotateDeg={effectiveRotateDeg}
        aligned={alignHint === "aligned" && bearing != null}
        showDialRing
        showDialHalo
        showTopMarker
        showPivotHub
        showAlignLed
        needlePulse
        ornamentNeedle
      />
    );

  const preciseReadout =
    bearing != null ? (
      <View style={[styles.preciseNums, landscape && styles.preciseNumsLandscape]}>
        {onlineGps ? (
          <Text style={[styles.onlineBadge, landscape && styles.onlineBadgeLandscape]}>
            {t.qibla.locationSourceOnline}
          </Text>
        ) : null}
        <Text style={[styles.preciseNumLine, landscape && styles.preciseNumLineLandscape]}>
          {kk.qibla.azimuthReadout(formatDeg1(bearing))}
        </Text>
        <Text style={[styles.preciseNumLine, landscape && styles.preciseNumLineLandscape]}>
          {kk.qibla.headingReadout(formatDeg1(effectiveHeading))}
        </Text>
        <Text style={[styles.preciseNumLine, landscape && styles.preciseNumLineLandscape]}>
          {kk.qibla.compassQualityReadout(compassQuality, formatDeg1(headingAccuracyDeg))}
        </Text>
        <Text style={[styles.preciseNumLine, landscape && styles.preciseNumLineLandscape]}>
          {onlineGps
            ? kk.qibla.locationAccuracyReadout(formatAccuracyMeters(locationAccuracyM, t))
            : kk.qibla.locationSourceCity}
        </Text>
      </View>
    ) : null;

  if (landscape) {
    return (
      <View
        style={[
          styles.landscapeRoot,
          {
            paddingTop: deviceInsets.top + 8,
            paddingBottom: bottomInset + 8,
            paddingLeft: deviceInsets.left + 12,
            paddingRight: deviceInsets.right + 12,
          },
        ]}
      >
        <StatusBar style="auto" />
        <View style={styles.landscapeCompassWrap}>{compassNode}</View>
        <Text
          style={[
            styles.mainHint,
            styles.landscapeMainHint,
            alignHint === "aligned" && bearing != null && { color: colors.success },
          ]}
        >
          {mainHint}
        </Text>
        {preciseReadout}
        {bearing != null && alignHint !== "none" ? (
          <Text style={[styles.offsetLine, styles.landscapeOffsetLine]} accessibilityLiveRegion="polite">
            {alignHint === "aligned"
              ? kk.qibla.offsetInZone(QIBLA_ALIGN_THRESHOLD_DEG)
              : alignHint === "turn_cw"
                ? kk.qibla.offsetPreciseCw(effectiveRotateDeg)
                : kk.qibla.offsetPreciseCcw(effectiveRotateDeg)}
          </Text>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.landscapeCollapseBtn, pressed && { opacity: 0.9 }]}
          onPress={exitLandscape}
          accessibilityRole="button"
          accessibilityLabel={t.qibla.collapsePortraitA11y}
        >
          <MaterialIcons name="fullscreen-exit" size={22} color={colors.accent} />
          <Text style={styles.landscapeCollapseTxt}>{t.qibla.collapsePortrait}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.arrowPanel, { position: "relative" }]}>{compassNode}</View>

      {onlineGps ? <Text style={styles.onlineBanner}>{t.qibla.locationSourceOnline}</Text> : null}

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

      {preciseReadout}

      {showWebCompassPermission ? (
        <View style={styles.webCompassCard}>
          <Text style={styles.webCompassTitle}>{kk.qibla.webCompassTitle}</Text>
          <Text style={styles.webCompassBody}>{kk.qibla.webCompassBody}</Text>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            onPress={() => void refreshBearing()}
          >
            <Text style={styles.primaryBtnTxt}>{kk.qibla.webCompassCta}</Text>
          </Pressable>
          <Text style={styles.webCompassBody}>{kk.qibla.webCompassManualBody}</Text>
          <View style={styles.webCompassControls}>
            <Pressable
              style={({ pressed }) => [styles.webCompassControlBtn, pressed && { opacity: 0.85 }]}
              onPress={() => shiftManualWebHeading(-5)}
              accessibilityRole="button"
            >
              <Text style={styles.webCompassControlTxt}>{kk.qibla.webCompassLeft}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.webCompassControlBtn, pressed && { opacity: 0.85 }]}
              onPress={() => setManualWebHeading(null)}
              accessibilityRole="button"
            >
              <Text style={styles.webCompassControlTxt}>{kk.qibla.webCompassReset}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.webCompassControlBtn, pressed && { opacity: 0.85 }]}
              onPress={() => shiftManualWebHeading(5)}
              accessibilityRole="button"
            >
              <Text style={styles.webCompassControlTxt}>{kk.qibla.webCompassRight}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {bearing != null && alignHint !== "none" ? (
        <Text style={styles.offsetLine} accessibilityLiveRegion="polite">
          {alignHint === "aligned"
            ? kk.qibla.offsetInZone(QIBLA_ALIGN_THRESHOLD_DEG)
            : alignHint === "turn_cw"
              ? kk.qibla.offsetPreciseCw(effectiveRotateDeg)
              : kk.qibla.offsetPreciseCcw(effectiveRotateDeg)}
        </Text>
      ) : null}

      <View style={styles.motionModeRow}>
        <Pressable
          style={({ pressed }) => [
            styles.modeChip,
            motionMode === "fast" && styles.modeChipActive,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => setMotionMode("fast")}
        >
          <Text style={[styles.modeTxt, motionMode === "fast" && styles.modeTxtActive]}>
            {kk.qibla.motionFast}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.modeChip,
            motionMode === "balanced" && styles.modeChipActive,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => setMotionMode("balanced")}
        >
          <Text style={[styles.modeTxt, motionMode === "balanced" && styles.modeTxtActive]}>
            {kk.qibla.motionBalanced}
          </Text>
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

      {Platform.OS !== "web" ? (
        <Pressable
          style={({ pressed }) => [styles.expandBtn, pressed && { opacity: 0.9 }]}
          onPress={enterLandscape}
          accessibilityRole="button"
          accessibilityLabel={t.qibla.expandLandscapeA11y}
        >
          <MaterialIcons name="screen-rotation" size={22} color="#fff" />
          <Text style={styles.expandBtnTxt}>{t.qibla.expandLandscape}</Text>
        </Pressable>
      ) : null}

      <Text style={styles.hint}>{kk.qibla.magnetHint}</Text>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors, layoutWidth: number = initialWidth) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.bg },
    pad: { padding: 20, paddingBottom: 32 },
    landscapeRoot: {
      flex: 1,
      backgroundColor: colors.bg,
      alignItems: "center",
      justifyContent: "center",
    },
    landscapeCompassWrap: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    landscapeMainHint: {
      fontSize: 18,
      lineHeight: 26,
      marginBottom: 10,
    },
    landscapeOffsetLine: {
      fontSize: 17,
      marginBottom: 16,
    },
    landscapeCollapseBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    landscapeCollapseTxt: {
      color: colors.accent,
      fontWeight: "700",
      fontSize: 15,
    },
    onlineBanner: {
      alignSelf: "stretch",
      textAlign: "center",
      color: colors.success,
      fontSize: 13,
      fontWeight: "800",
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: `${colors.success}18`,
      borderWidth: 1,
      borderColor: `${colors.success}44`,
      overflow: "hidden",
    },
    onlineBadge: {
      color: colors.success,
      fontSize: 13,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 6,
    },
    onlineBadgeLandscape: {
      fontSize: 15,
    },
    expandBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 8,
      marginBottom: 4,
    },
    expandBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
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
    preciseNums: {
      alignSelf: "stretch",
      marginBottom: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    preciseNumsLandscape: {
      alignSelf: "center",
      minWidth: Math.min(layoutWidth - 48, 420),
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 6,
    },
    preciseNumLine: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
      textAlign: "center",
      ...(Platform.OS === "ios" ? ({ fontVariant: ["tabular-nums"] } as const) : {}),
    },
    preciseNumLineLandscape: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: "700",
    },
    webCompassCard: {
      alignSelf: "stretch",
      marginBottom: 12,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    webCompassTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "800",
      lineHeight: 21,
      marginBottom: 4,
      textAlign: "center",
    },
    webCompassBody: {
      color: colors.muted,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 10,
      textAlign: "center",
    },
    webCompassControls: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      marginTop: 2,
    },
    webCompassControlBtn: {
      flex: 1,
      alignItems: "center",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    webCompassControlTxt: {
      color: colors.accent,
      fontSize: 13,
      fontWeight: "800",
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
    motionModeRow: {
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
      minWidth: layoutWidth - 84,
    },
    hint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  });
}
