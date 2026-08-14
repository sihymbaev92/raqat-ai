import React from "react";
import { StyleSheet, type ImageSourcePropType } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { RasterImage } from "@/ui/RasterImage";
import {
  clampZoomScale,
  IMAGE_ZOOM_DOUBLE_TAP_SCALE,
  IMAGE_ZOOM_MAX_SCALE,
  IMAGE_ZOOM_MIN_SCALE,
} from "./zoomImageLimits";

type Props = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  /** Android decode target — lightbox ашу жылдамдығы */
  resizeMultiplier?: number;
};

function resetZoom(
  scale: SharedValue<number>,
  savedScale: SharedValue<number>,
  translateX: SharedValue<number>,
  translateY: SharedValue<number>,
  savedTranslateX: SharedValue<number>,
  savedTranslateY: SharedValue<number>
) {
  "worklet";
  scale.value = withTiming(IMAGE_ZOOM_MIN_SCALE);
  savedScale.value = IMAGE_ZOOM_MIN_SCALE;
  translateX.value = withTiming(0);
  translateY.value = withTiming(0);
  savedTranslateX.value = 0;
  savedTranslateY.value = 0;
}

/**
 * Толық экран сурет: pinch масштабы, pan (үлкейткенде), екі рет басу.
 */
export function ZoomableImageContent({ source, width, height, resizeMultiplier }: Props) {
  const scale = useSharedValue(IMAGE_ZOOM_MIN_SCALE);
  const savedScale = useSharedValue(IMAGE_ZOOM_MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = clampZoomScale(savedScale.value * event.scale);
    })
    .onEnd(() => {
      if (scale.value <= IMAGE_ZOOM_MIN_SCALE) {
        resetZoom(scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY);
        return;
      }
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_event, state) => {
      if (scale.value > IMAGE_ZOOM_MIN_SCALE) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onEnd(() => {
      if (scale.value > IMAGE_ZOOM_MIN_SCALE) {
        resetZoom(scale, savedScale, translateX, translateY, savedTranslateX, savedTranslateY);
        return;
      }
      scale.value = withTiming(IMAGE_ZOOM_DOUBLE_TAP_SCALE);
      savedScale.value = IMAGE_ZOOM_DOUBLE_TAP_SCALE;
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.frame, { width, height }, animatedStyle]}>
        <RasterImage
          source={source}
          style={{ width, height }}
          resizeMode="contain"
          resizeMultiplier={resizeMultiplier}
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  frame: {
    justifyContent: "center",
    alignItems: "center",
  },
});
