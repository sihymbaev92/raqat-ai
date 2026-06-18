import React, { useEffect, useState } from "react";
import { Animated, AppState, Easing, Platform, StyleSheet, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QiblaArrowPointer } from "./QiblaArrowPointer";
import { QiblaArCameraModal } from "./QiblaArCameraModal";
import { useQiblaMotion, useQiblaStable } from "../context/QiblaSensorContext";
import { qiblaAlignHint } from "../lib/qiblaHints";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";

type Props = {
  colors: ThemeColors;
  onPress: () => void;
  /** hero: намаз карточкасы ортасы; header: шапка (legacy) */
  variant?: "hero" | "header";
  size?: "default" | "lg" | "sm";
};

/** Құбыла көрсеткісі — намаз hero ортасы немесе шапка. */
export function PrayerQiblaChip({ colors, onPress, variant = "hero", size = "default" }: Props) {
  const insets = useSafeAreaInsets();
  const [cameraOpen, setCameraOpen] = useState(false);
  const { bearing, resumeHeadingSubscription } = useQiblaStable();
  const { rotateDeg, headingHasSample } = useQiblaMotion();
  const bearingReady = bearing != null;
  const motionReady = bearingReady && headingHasSample;
  const qiblaAligned =
    motionReady && qiblaAlignHint(rotateDeg, bearing, { headingReady: true }) === "aligned";
  const alignPulse = React.useRef(new Animated.Value(0)).current;

  const ringOuter = size === "lg" ? 46 : size === "sm" ? 32 : variant === "hero" ? 38 : 34;
  const compassBox = size === "lg" ? 38 : size === "sm" ? 24 : variant === "hero" ? 30 : 26;
  const pointerSize = size === "lg" ? 38 : size === "sm" ? 24 : variant === "hero" ? 30 : 26;
  const chipSize = compassBox + (size === "sm" ? 6 : 8);
  const heroOuterRing =
    variant === "hero"
      ? qiblaAligned
        ? "rgba(52, 251, 153, 0.88)"
        : "rgba(255, 255, 255, 0.74)"
      : qiblaAligned
        ? "rgba(52, 251, 153, 0.95)"
        : `${colors.accent}55`;
  const islandNudge =
    Platform.OS === "ios"
      ? Math.min(6, Math.max(0, insets.top - 46) * 0.35)
      : Math.min(4, Math.max(0, insets.top - 26) * 0.2);
  const headerQiblaDownNudge = Math.round(3 + islandNudge * 0.22);
  const verticalNudge = variant === "header" ? headerQiblaDownNudge : 0;
  const alignedGlowSize = chipSize + (variant === "hero" ? 22 : 18);
  const alignedRaySize = chipSize + (variant === "hero" ? 34 : 26);
  const alignedGlowScale = alignPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.74, 1.34],
  });
  const alignedGlowOpacity = alignPulse.interpolate({
    inputRange: [0, 0.52, 1],
    outputRange: [0.5, 0.22, 0.05],
  });
  const alignedRayScale = alignPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.58, 1],
  });
  const alignedRayOpacity = alignPulse.interpolate({
    inputRange: [0, 0.42, 1],
    outputRange: [0.14, 0.52, 0.18],
  });

  useEffect(() => {
    if (!qiblaAligned) {
      alignPulse.stopAnimation();
      alignPulse.setValue(0);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(alignPulse, {
          toValue: 1,
          duration: 950,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(alignPulse, {
          toValue: 0,
          duration: 1050,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [alignPulse, qiblaAligned]);

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    resumeHeadingSubscription();
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") return;
      resumeHeadingSubscription();
    });
    return () => sub.remove();
  }, [resumeHeadingSubscription]);

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    if (headingHasSample) return undefined;
    const retry = setInterval(() => {
      resumeHeadingSubscription();
    }, 1600);
    return () => clearInterval(retry);
  }, [headingHasSample, resumeHeadingSubscription]);

  return (
    <>
      <View
        style={{
          width: ringOuter,
          alignItems: "center",
          justifyContent: "center",
          marginTop: verticalNudge,
          overflow: "visible",
        }}
      >
        {qiblaAligned ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.alignedGlow,
                {
                  width: alignedGlowSize,
                  height: alignedGlowSize,
                  borderRadius: alignedGlowSize / 2,
                  opacity: alignedGlowOpacity,
                  transform: [{ scale: alignedGlowScale }],
                },
              ]}
            />
            {["0deg", "45deg", "90deg", "135deg"].map((rotate) => (
              <Animated.View
                key={rotate}
                pointerEvents="none"
                style={[
                  styles.alignedRay,
                  {
                    width: alignedRaySize,
                    opacity: alignedRayOpacity,
                    transform: [{ rotate }, { scaleX: alignedRayScale }],
                  },
                ]}
              />
            ))}
          </>
        ) : null}
        <Pressable
          onPress={onPress}
          onLongPress={() => setCameraOpen(true)}
          delayLongPress={380}
          style={{
            width: chipSize,
            height: chipSize,
            borderRadius: chipSize / 2,
            backgroundColor: variant === "hero"
              ? qiblaAligned
                ? "rgba(52, 211, 153, 0.18)"
                : "rgba(255, 255, 255, 0.16)"
              : qiblaAligned
                ? "rgba(52, 211, 153, 0.42)"
                : bearingReady
                  ? `${colors.success}28`
                  : colors.accentSurfaceStrong,
            borderWidth: variant === "hero" ? 1.5 : qiblaAligned ? 2 : 1.5,
            borderColor: heroOuterRing,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            ...Platform.select({
              ios: qiblaAligned
                ? {
                    shadowColor: "#34F3A6",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.85,
                    shadowRadius: 10,
                  }
                : {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  },
              android: { elevation: variant === "hero" ? 0 : qiblaAligned ? 8 : 2 },
              default: {},
            }),
          }}
          accessibilityRole="button"
          accessibilityLabel={kk.tabs.qibla}
          accessibilityHint={`${kk.qibla.headerTapQibla}. ${kk.qibla.headerLongPressCamera}`}
        >
          <View style={{ opacity: motionReady ? 1 : 0.85 }} pointerEvents="none">
            <QiblaArrowPointer
              colors={colors}
              size={pointerSize}
              rotateDeg={rotateDeg}
              aligned={qiblaAligned}
              showDialRing={false}
              showDialHalo={false}
              showTopMarker={false}
              needlePulse
              showPivotHub={false}
              minimalDial
              centerOyuMedallion={false}
              ornamentArrow
              showAlignLed
              showAlignLedInMinimal
            />
          </View>
        </Pressable>
      </View>
      <QiblaArCameraModal visible={cameraOpen} colors={colors} onClose={() => setCameraOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  alignedGlow: {
    position: "absolute",
    backgroundColor: "rgba(52, 251, 153, 0.46)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.72)",
  },
  alignedRay: {
    position: "absolute",
    height: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
});
