import React, { useCallback, useMemo, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { clampMushafTextScale } from "../../quran/mushafTextScale";

type Props = {
  children: React.ReactNode;
  scale: number;
  enabled?: boolean;
  onScaleChange: (next: number) => void;
  onScaleCommit: (next: number) => void;
};

/** Хатым QCF4: pinch zoom → mushafTextScale (P2 roadmap). */
export function HatimMushafPinchZoomHost({
  children,
  scale,
  enabled = true,
  onScaleChange,
  onScaleCommit,
}: Props) {
  const scaleRef = useRef(scale);
  const pinchBaseRef = useRef(scale);
  scaleRef.current = scale;

  const onPinchStart = useCallback(() => {
    pinchBaseRef.current = scaleRef.current;
  }, []);

  const onPinchUpdate = useCallback(
    (factor: number) => {
      onScaleChange(clampMushafTextScale(pinchBaseRef.current * factor));
    },
    [onScaleChange]
  );

  const onPinchEnd = useCallback(
    (factor: number) => {
      const next = clampMushafTextScale(pinchBaseRef.current * factor);
      onScaleChange(next);
      onScaleCommit(next);
    },
    [onScaleChange, onScaleCommit]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(enabled && Platform.OS !== "web")
        .onStart(() => {
          runOnJS(onPinchStart)();
        })
        .onUpdate((event) => {
          runOnJS(onPinchUpdate)(event.scale);
        })
        .onEnd((event) => {
          runOnJS(onPinchEnd)(event.scale);
        }),
    [enabled, onPinchEnd, onPinchStart, onPinchUpdate]
  );

  if (!enabled || Platform.OS === "web") {
    return <View style={styles.fill}>{children}</View>;
  }

  return (
    <GestureDetector gesture={pinchGesture}>
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 0 },
});
