import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  View,
  type ImageResizeMode,
  type ImageSourcePropType,
  type StyleProp,
  type ImageStyle,
} from "react-native";
import { Accelerometer } from "expo-sensors";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

type Props = {
  source: ImageSourcePropType;
  /** Image стилі (width/height, scale, translateY т.б.) */
  imageStyle: StyleProp<ImageStyle>;
  resizeMode: ImageResizeMode;
  /** false болса — сенсорсыз, қарапайым Image */
  trackingActive: boolean;
  /** Еңкейу шегі (градус) */
  maxDeg?: number;
};

const staticImage = (source: ImageSourcePropType, imageStyle: StyleProp<ImageStyle>, resizeMode: ImageResizeMode) => (
  <Image source={source} style={imageStyle} resizeMode={resizeMode} accessibilityIgnoresInvertColors />
);

/**
 * 2D суретке «3D» ұқсас еңкейту: құрылғыны еңкейту (акселерометр).
 * Нақты 3D модель емес — кітап бетін бұрып қарағандағы иллюзия.
 */
export function TiltParallaxImage({
  source,
  imageStyle,
  resizeMode,
  trackingActive,
  maxDeg = 12,
}: Props) {
  const [sensorOk, setSensorOk] = useState<boolean | null>(null);
  const rx = useRef(new Animated.Value(0)).current;
  const ry = useRef(new Animated.Value(0)).current;
  const smoothRx = useRef(0);
  const smoothRy = useRef(0);

  useEffect(() => {
    if (Platform.OS === "web") {
      setSensorOk(false);
      return undefined;
    }
    let cancelled = false;
    void (async () => {
      const ok = await Accelerometer.isAvailableAsync();
      if (cancelled) return;
      setSensorOk(ok);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!trackingActive || sensorOk !== true) {
      smoothRx.current = 0;
      smoothRy.current = 0;
      rx.setValue(0);
      ry.setValue(0);
      return undefined;
    }

    Accelerometer.setUpdateInterval(90);
    const sub = Accelerometer.addListener(({ x, y }) => {
      const targetRx = clamp(-y * 42, -maxDeg, maxDeg);
      const targetRy = clamp(x * 42, -maxDeg, maxDeg);
      smoothRx.current = smoothRx.current * 0.78 + targetRx * 0.22;
      smoothRy.current = smoothRy.current * 0.78 + targetRy * 0.22;
      rx.setValue(smoothRx.current);
      ry.setValue(smoothRy.current);
    });

    return () => {
      sub.remove();
      smoothRx.current = 0;
      smoothRy.current = 0;
      rx.setValue(0);
      ry.setValue(0);
    };
  }, [trackingActive, sensorOk, maxDeg, rx, ry]);

  if (sensorOk !== true || !trackingActive) {
    return staticImage(source, imageStyle, resizeMode);
  }

  const rotateX = rx.interpolate({
    inputRange: [-maxDeg, maxDeg],
    outputRange: [`-${maxDeg}deg`, `${maxDeg}deg`],
    extrapolate: "clamp",
  });
  const rotateY = ry.interpolate({
    inputRange: [-maxDeg, maxDeg],
    outputRange: [`-${maxDeg}deg`, `${maxDeg}deg`],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1, overflow: "hidden" }} accessibilityIgnoresInvertColors>
      <Animated.View
        style={{
          flex: 1,
          transform: [{ perspective: 900 }, { rotateX: rotateX }, { rotateY: rotateY }],
        }}
        needsOffscreenAlphaCompositing
      >
        <Image source={source} style={imageStyle} resizeMode={resizeMode} accessibilityIgnoresInvertColors />
      </Animated.View>
    </View>
  );
}
