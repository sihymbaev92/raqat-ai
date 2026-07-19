import type { ViewStyle } from "react-native";
import type { Animated } from "react-native";
import type { HatimPageTurnDirection } from "../components/quran/HatimPageTurnOverlay";

/**
 * Қарапайым бет ауысу: мөлдірлік + сәл жылжу.
 * Peel/clip жоқ — аят ені ешқашан қысылмайды.
 */
export function hatimPageTurnTopAnimatedStyle(
  progress: Animated.AnimatedInterpolation<number>,
  direction: HatimPageTurnDirection,
  pageWidth: number
): Animated.WithAnimatedObject<
  Pick<ViewStyle, "width" | "alignSelf" | "opacity" | "transform">
> {
  const w = Math.max(1, pageWidth);
  const forward = direction === "forward";
  return {
    width: w,
    alignSelf: "center",
    opacity: progress.interpolate({
      inputRange: [0, 0.55, 1],
      outputRange: [1, 0.55, 0],
    }),
    transform: [
      {
        translateX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, forward ? w * 0.1 : -w * 0.1],
        }),
      },
    ],
  };
}

/** @deprecated peel алынды — idle толық ен. */
export function hatimPagePeelClipAnimatedStyle(
  progress: Animated.AnimatedInterpolation<number>,
  direction: HatimPageTurnDirection,
  pageWidth: number
): Animated.WithAnimatedObject<Pick<ViewStyle, "width" | "alignSelf" | "overflow">> {
  void progress;
  void direction;
  return hatimPageIdleShellStyle(pageWidth);
}

/** Бет тыныш күйі — толық ен, ортада. */
export function hatimPageIdleShellStyle(pageWidth: number): Pick<
  ViewStyle,
  "width" | "alignSelf" | "overflow" | "opacity"
> {
  return {
    width: Math.max(1, pageWidth),
    alignSelf: "center",
    overflow: "visible",
    opacity: 1,
  };
}
