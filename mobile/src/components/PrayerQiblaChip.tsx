import React, { useEffect, useState } from "react";
import { AppState, View, Platform } from "react-native";
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

  const ringOuter = size === "lg" ? 46 : size === "sm" ? 32 : variant === "hero" ? 38 : 34;
  const compassBox = size === "lg" ? 38 : size === "sm" ? 24 : variant === "hero" ? 30 : 26;
  const pointerSize = size === "lg" ? 38 : size === "sm" ? 24 : variant === "hero" ? 30 : 26;
  const chipSize = compassBox + (size === "sm" ? 6 : 8);
  const heroOuterRing =
    variant === "hero"
      ? qiblaAligned
        ? "rgba(52, 251, 153, 0.72)"
        : "rgba(255, 255, 255, 0.46)"
      : qiblaAligned
        ? "rgba(52, 251, 153, 0.95)"
        : `${colors.accent}55`;
  const islandNudge =
    Platform.OS === "ios"
      ? Math.min(6, Math.max(0, insets.top - 46) * 0.35)
      : Math.min(4, Math.max(0, insets.top - 26) * 0.2);
  const headerQiblaDownNudge = Math.round(3 + islandNudge * 0.22);
  const verticalNudge = variant === "header" ? headerQiblaDownNudge : 0;

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
        }}
      >
        <Pressable
          onPress={onPress}
          onLongPress={() => setCameraOpen(true)}
          delayLongPress={380}
          style={{
            width: chipSize,
            height: chipSize,
            borderRadius: chipSize / 2,
            backgroundColor: qiblaAligned
              ? "rgba(52, 211, 153, 0.42)"
              : bearingReady
                ? variant === "hero"
                  ? "rgba(255, 255, 255, 0.14)"
                  : `${colors.success}28`
                : variant === "hero"
                  ? "rgba(255, 255, 255, 0.10)"
                  : colors.accentSurfaceStrong,
            borderWidth: qiblaAligned ? 2 : variant === "hero" ? 1.75 : 1.5,
            borderColor: heroOuterRing,
            alignItems: "center",
            justifyContent: "center",
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
              android: { elevation: qiblaAligned ? 8 : 2 },
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
              showDialHalo={variant === "hero"}
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
