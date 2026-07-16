import type { ViewStyle } from "react-native";
import type { Animated } from "react-native";
import type { HatimPageTurnDirection } from "../components/quran/HatimPageTurnOverlay";

/**
 * Парақ майысуы: аят мәтіні тік (skew/scale жоқ), тек clip + overlay leaf.
 * Hinge бағыты — HatimPageTurnOverlay leaf сәйкес.
 */
export function hatimPagePeelClipAnimatedStyle(
  progress: Animated.AnimatedInterpolation<number>,
  direction: HatimPageTurnDirection,
  pageWidth: number
): Animated.WithAnimatedObject<Pick<ViewStyle, "width" | "alignSelf" | "overflow">> {
  const w = Math.max(1, pageWidth);
  const forward = direction === "forward";
  return {
    width: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [w, Math.max(12, w * 0.14)],
    }),
    alignSelf: forward ? "flex-end" : "flex-start",
    overflow: "hidden",
  };
}
