import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useFocusEffect, useRoute, type RouteProp } from "@react-navigation/native";
import { QiblaSensorProvider, useQiblaSensor } from "../context/QiblaSensorContext";
import type { RootStackParamList } from "../navigation/types";
import { QiblaArCameraView } from "../components/QiblaArCameraView";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { QiblaArrowPointer } from "../components/QiblaArrowPointer";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { qiblaAlignHint, QIBLA_ALIGN_THRESHOLD_DEG, type QiblaAlignHint } from "../lib/qiblaHints";
import { angleDiff } from "../lib/qibla";
import { useAppLocale } from "../i18n/runtime";

const { width } = Dimensions.get("window");

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

function formatAccuracyMeters(m: number | null | undefined): string {
  if (m == null || !Number.isFinite(m)) return "—";
  if (m >= 1000) return `±${(m / 1000).toFixed(1)} км`;
  return `±${Math.max(1, Math.round(m))} м`;
}

type QiblaRoute = RouteProp<RootStackParamList, "Qibla">;

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
  const route = useRoute<QiblaRoute>();
  const initialMode = route.params?.mode === "camera" ? "camera" : "compass";
  const [viewMode, setViewMode] = useState<"compass" | "camera">(initialMode);

  useEffect(() => {
    if (route.params?.mode === "camera") setViewMode("camera");
  }, [route.params?.mode]);
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
  const dialSize = Math.min(width - 84, 260);
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.pad}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.modeRow}>
        <Pressable
          style={({ pressed }) => [
            styles.modeChip,
            viewMode === "compass" && styles.modeChipActive,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => setViewMode("compass")}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === "compass" }}
        >
          <Text style={[styles.modeTxt, viewMode === "compass" && styles.modeTxtActive]}>
            {kk.qibla.modeCompass}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.modeChip,
            viewMode === "camera" && styles.modeChipActive,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => setViewMode("camera")}
          accessibilityRole="button"
          accessibilityState={{ selected: viewMode === "camera" }}
        >
          <Text style={[styles.modeTxt, viewMode === "camera" && styles.modeTxtActive]}>
            {kk.qibla.modeCamera}
          </Text>
        </Pressable>
      </View>

      {viewMode === "camera" ? (
        <QiblaArCameraView
          colors={colors}
          layout="inline"
          style={styles.cameraPane}
          onClose={() => setViewMode("compass")}
        />
      ) : null}

      {viewMode === "compass" ? (
      <>
      <View style={[styles.arrowPanel, { position: "relative" }]}>
        {bearing != null && !effectiveHeadingHasSample ? (
          <View
            style={{
              width: dialSize,
              height: dialSize,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RaqatOrnamentSpinner size={52} />
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
        )}
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
        <View style={styles.preciseNums}>
          <Text style={styles.preciseNumLine}>{kk.qibla.azimuthReadout(formatDeg1(bearing))}</Text>
          <Text style={styles.preciseNumLine}>{kk.qibla.headingReadout(formatDeg1(effectiveHeading))}</Text>
          <Text style={styles.preciseNumLine}>
            {kk.qibla.compassQualityReadout(compassQuality, formatDeg1(headingAccuracyDeg))}
          </Text>
          <Text style={styles.preciseNumLine}>
            {locationSource === "gps"
              ? kk.qibla.locationAccuracyReadout(formatAccuracyMeters(locationAccuracyM))
              : kk.qibla.locationSourceCity}
          </Text>
        </View>
      ) : null}

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

      <Text style={styles.hint}>{kk.qibla.magnetHint}</Text>
      </>
      ) : null}
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
    preciseNumLine: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
      textAlign: "center",
      ...(Platform.OS === "ios" ? ({ fontVariant: ["tabular-nums"] } as const) : {}),
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
    cameraPane: { marginBottom: 16 },
    modeRow: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "center",
      marginBottom: 12,
    },
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
      minWidth: width - 84,
    },
    hint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  });
}
