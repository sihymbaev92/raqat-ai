import React from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { hatimPageTurnCornerSkewDeg } from "../../quran/hatimInteractivePageTurn";

export type HatimPageTurnDirection = "forward" | "backward";

export const HATIM_PAGE_TURN_MS = 680;

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
  /** Саусақпен ұстап тарту — progress 0…1 тікелей көрінеді. */
  interactive?: boolean;
  /** Бұрыштан ұстау биіктігі (0…1) — skew progress-пен есептеледі. */
  grabYRatio?: number;
  /** Нақты парақ майысқанда тек көлеңке (жасанды leaf жоқ). */
  shadowOnly?: boolean;
};

function HatimPageTurnOverlayInner({
  progress,
  direction,
  pageWidth,
  pageFace,
  isDark,
  interactive = false,
  grabYRatio = 0.5,
  shadowOnly = false,
}: Props) {
  const forward = direction === "forward";
  const palette = hatimPageTurnPalette(pageFace, isDark);
  const panelWidth = Math.max(160, pageWidth * 0.56);
  const use3d = Platform.OS !== "android";
  const maxSkewDeg = hatimPageTurnCornerSkewDeg(direction, grabYRatio, 1);

  const leafOpacity = interactive
    ? progress.interpolate({
        inputRange: [0, 0.02, 1],
        outputRange: [0, 1, 1],
      })
    : progress.interpolate({
        inputRange: [0, 0.05, 0.9, 1],
        outputRange: [0, 1, 1, 0.88],
      });
  const ambientOpacity = interactive
    ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, isDark ? 0.72 : 0.55],
      })
    : progress.interpolate({
        inputRange: [0, 0.1, 0.88, 1],
        outputRange: [0, 1, 0.92, 0.55],
      });
  const castOpacity = interactive
    ? progress.interpolate({
        inputRange: [0, 0.15, 1],
        outputRange: [0, 0.85, 0.65],
      })
    : progress.interpolate({
        inputRange: [0, 0.14, 0.82, 1],
        outputRange: [0, 1, 0.78, 0.42],
      });
  const foldOpacity = interactive
    ? progress.interpolate({
        inputRange: [0, 0.08, 0.75, 1],
        outputRange: [0, isDark ? 0.65 : 0.48, isDark ? 0.42 : 0.28, 0.12],
      })
    : progress.interpolate({
        inputRange: [0, 0.18, 0.84, 1],
        outputRange: [0, isDark ? 0.72 : 0.48, isDark ? 0.45 : 0.3, 0.15],
      });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, forward ? pageWidth * 0.62 : -pageWidth * 0.62],
  });
  const scaleX = progress.interpolate({
    inputRange: [0, 0.62, 1],
    outputRange: [1, 0.42, 0.08],
  });
  const rotateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", forward ? "78deg" : "-78deg"],
  });
  const rotateZ = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${maxSkewDeg}deg`],
  });
  const leafTransform = use3d
    ? [{ perspective: 1200 }, { translateX }, { rotateY }, { rotateZ }, { scaleX }]
    : [{ translateX }, { rotateZ }, { scaleX }];

  const showLeaf = !shadowOnly;

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
              left: forward ? panelWidth * 0.32 : 0,
              right: forward ? 0 : panelWidth * 0.32,
              backgroundColor: palette.castShadow,
              opacity: shadowOnly
                ? progress.interpolate({
                    inputRange: [0, 0.2, 0.85, 1],
                    outputRange: [0, isDark ? 0.55 : 0.38, isDark ? 0.42 : 0.28, 0],
                  })
                : castOpacity,
            }}
          />
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: pageWidth * 0.5 - 14,
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
          {showLeaf ? (
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: forward ? 0 : pageWidth - panelWidth,
              width: panelWidth,
              opacity: leafOpacity,
              shadowColor: "#000",
              shadowOffset: { width: forward ? 16 : -16, height: 3 },
              shadowRadius: isDark ? 30 : 22,
              shadowOpacity: isDark ? 0.75 : 0.4,
              elevation: 28,
              transform: leafTransform,
            }}
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.curlFace, overflow: "hidden" }]}>
              <LinearGradient
                colors={
                  forward
                    ? ["rgba(0,0,0,0)", palette.curlEdge, "rgba(0,0,0,0.32)"]
                    : ["rgba(0,0,0,0.32)", palette.curlEdge, "rgba(0,0,0,0)"]
                }
                start={{ x: forward ? 0.7 : 0, y: 0.5 }}
                end={{ x: forward ? 1 : 0.3, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={[...palette.edgeHighlight]}
                start={{ x: forward ? 1 : 0, y: 0.5 }}
                end={{ x: forward ? 0.82 : 0.18, y: 0.5 }}
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: 20,
                  ...(forward ? { right: 0 } : { left: 0 }),
                }}
              />
              {interactive ? (
                <LinearGradient
                  colors={
                    forward
                      ? ["rgba(255,255,255,0.14)", "rgba(0,0,0,0)"]
                      : ["rgba(0,0,0,0)", "rgba(255,255,255,0.12)"]
                  }
                  start={{ x: 0.5, y: forward ? 0 : 1 }}
                  end={{ x: 0.5, y: forward ? 1 : 0 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
            </View>
          </Animated.View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export const HatimPageTurnOverlay = React.memo(HatimPageTurnOverlayInner);

export function runHatimPageTurnAnimation(
  progress: Animated.Value,
  onDone: () => void,
  opts?: { fromProgress?: number }
): void {
  const from = Math.max(0, Math.min(1, opts?.fromProgress ?? 0));
  progress.stopAnimation();
  progress.setValue(from);
  const remaining = Math.max(220, Math.round(HATIM_PAGE_TURN_MS * (1 - from)));
  Animated.timing(progress, {
    toValue: 1,
    duration: remaining,
    easing: Easing.bezier(0.22, 0.61, 0.36, 1),
    useNativeDriver: true,
  }).start(({ finished }) => {
    if (finished) onDone();
  });
}

export function springHatimPageTurnBack(progress: Animated.Value, onDone?: () => void): void {
  progress.stopAnimation();
  Animated.spring(progress, {
    toValue: 0,
    useNativeDriver: true,
    bounciness: 1,
    speed: 12,
  }).start(() => onDone?.());
}

const styles = StyleSheet.create({
  root: { zIndex: 40, elevation: 40 },
  centerStage: { flex: 1, alignItems: "center", overflow: "visible" },
  pageStage: { flex: 1, position: "relative", overflow: "visible" },
});
