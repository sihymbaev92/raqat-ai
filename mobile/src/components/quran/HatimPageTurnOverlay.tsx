import React from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export type HatimPageTurnDirection = "forward" | "backward";

export const HATIM_PAGE_TURN_MS = 520;

type PageTurnPalette = {
  curlFace: string;
  curlEdge: string;
  castShadow: string;
  ambientDim: string;
  foldShadow: readonly [string, string, string];
  edgeHighlight: readonly [string, string];
};

export function hatimPageTurnPalette(pageFace: string, isDark: boolean): PageTurnPalette {
  if (isDark) {
    return {
      curlFace: "#2C2C2C",
      curlEdge: "#181818",
      castShadow: "rgba(0,0,0,0.62)",
      ambientDim: "rgba(0,0,0,0.42)",
      foldShadow: ["rgba(0,0,0,0)", "rgba(0,0,0,0.55)", "rgba(0,0,0,0)"] as const,
      edgeHighlight: ["rgba(255,255,255,0.22)", "rgba(255,255,255,0)"] as const,
    };
  }
  return {
    curlFace: pageFace,
    curlEdge: "#E8DCC8",
    castShadow: "rgba(0,0,0,0.24)",
    ambientDim: "rgba(0,0,0,0.08)",
    foldShadow: ["rgba(0,0,0,0)", "rgba(0,0,0,0.16)", "rgba(0,0,0,0)"] as const,
    edgeHighlight: ["rgba(255,255,255,0.78)", "rgba(255,255,255,0)"] as const,
  };
}

type Props = {
  progress: Animated.Value;
  direction: HatimPageTurnDirection;
  pageWidth: number;
  pageFace: string;
  isDark: boolean;
};

export function HatimPageTurnOverlay({
  progress,
  direction,
  pageWidth,
  pageFace,
  isDark,
}: Props) {
  const forward = direction === "forward";
  const palette = hatimPageTurnPalette(pageFace, isDark);
  const panelWidth = Math.max(160, pageWidth * 0.5);
  const use3d = Platform.OS !== "android";

  const leafOpacity = progress.interpolate({
    inputRange: [0, 0.06, 0.78, 1],
    outputRange: [0, 1, isDark ? 0.92 : 0.96, 0],
  });
  const ambientOpacity = progress.interpolate({
    inputRange: [0, 0.12, 0.72, 1],
    outputRange: [0, 1, 0.85, 0],
  });
  const castOpacity = progress.interpolate({
    inputRange: [0, 0.18, 0.72, 1],
    outputRange: [0, 1, 0.72, 0],
  });
  const foldOpacity = progress.interpolate({
    inputRange: [0, 0.22, 0.68, 1],
    outputRange: [0, isDark ? 0.72 : 0.42, isDark ? 0.38 : 0.22, 0],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, forward ? pageWidth * 0.52 : -pageWidth * 0.52],
  });
  const scaleX = progress.interpolate({
    inputRange: [0, 0.58, 1],
    outputRange: [1, 0.42, 0.06],
  });
  const rotateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", forward ? "78deg" : "-78deg"],
  });
  const leafTransform = use3d
    ? [{ perspective: 1100 }, { translateX }, { rotateY }, { scaleX }]
    : [{ translateX }, { scaleX }];

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root]}>
      <View style={styles.centerStage}>
        <View style={[styles.pageStage, { width: pageWidth }]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: palette.ambientDim, opacity: ambientOpacity },
            ]}
          />
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: forward ? panelWidth * 0.35 : 0,
              right: forward ? 0 : panelWidth * 0.35,
              backgroundColor: palette.castShadow,
              opacity: castOpacity,
            }}
          />
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: forward ? pageWidth * 0.5 - 14 : pageWidth * 0.5 - 14,
              width: 28,
              opacity: foldOpacity,
            }}
          >
            <LinearGradient
              colors={[...palette.foldShadow]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: forward ? 0 : pageWidth - panelWidth,
              width: panelWidth,
              opacity: leafOpacity,
              shadowColor: "#000",
              shadowOffset: { width: forward ? 14 : -14, height: 2 },
              shadowRadius: isDark ? 28 : 20,
              shadowOpacity: isDark ? 0.72 : 0.38,
              elevation: 28,
              transform: leafTransform,
            }}
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.curlFace, overflow: "hidden" }]}>
              <LinearGradient
                colors={
                  forward
                    ? ["rgba(0,0,0,0)", palette.curlEdge, "rgba(0,0,0,0.28)"]
                    : ["rgba(0,0,0,0.28)", palette.curlEdge, "rgba(0,0,0,0)"]
                }
                start={{ x: forward ? 0.72 : 0, y: 0.5 }}
                end={{ x: forward ? 1 : 0.28, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={[...palette.edgeHighlight]}
                start={{ x: forward ? 1 : 0, y: 0.5 }}
                end={{ x: forward ? 0.84 : 0.16, y: 0.5 }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: 18,
                  ...(forward ? { right: 0 } : { left: 0 }),
                }}
              />
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

export function runHatimPageTurnAnimation(
  progress: Animated.Value,
  onDone: () => void
): void {
  progress.stopAnimation();
  progress.setValue(0);
  Animated.timing(progress, {
    toValue: 1,
    duration: HATIM_PAGE_TURN_MS,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  }).start(({ finished }) => {
    if (finished) onDone();
  });
}

const styles = StyleSheet.create({
  root: { zIndex: 40, elevation: 40 },
  centerStage: { flex: 1, alignItems: "center", overflow: "visible" },
  pageStage: { flex: 1, position: "relative", overflow: "visible" },
});
