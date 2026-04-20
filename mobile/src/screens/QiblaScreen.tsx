import React, { useCallback, useMemo } from "react";
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
import { qiblaAlignHint, type QiblaAlignHint } from "../lib/qiblaHints";

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
  const dialSize = Math.min(width - 80, 240);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const alignHint = qiblaAlignHint(rotateDeg, bearing);
  const mainHint = screenHint(alignHint, bearing);

  useFocusEffect(
    useCallback(() => {
      void refreshBearing();
    }, [refreshBearing])
  );

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
          showDialRing={false}
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
      marginBottom: 16,
      textAlign: "center",
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
      backgroundColor: "rgba(56,189,248,0.12)",
    },
    modeTxt: { color: colors.muted, fontSize: 13, fontWeight: "700" },
    modeTxtActive: { color: colors.accent },
    arrowPanel: {
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
      minWidth: width - 40,
    },
    /** Эмодзи 🕋 орнына PNG — қоршаусыз, анық */
    kaabaImg: { width: 44, height: 44, marginTop: 10 },
    hint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  });
}
