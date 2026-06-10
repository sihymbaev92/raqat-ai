import React, { useEffect, useMemo } from "react";
import { Image, StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { raqatLoadingSpinnerOrnament } from "../theme/ornamentAssets";
import { kk } from "../i18n/kk";

type Props = {
  /** true — айналады; false — жасырылады */
  active?: boolean;
  /** Диаметр (px) */
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const SPIN_DURATION_MS = 2_600;
/** Көрінетін минимум (инлайн батырмаларда да ою жоғалып кетпесін). */
const MIN_SIZE = 30;
/** Толық экран / орталық жүктелу. */
const SCREEN_SIZE = 68;

/** Кіші size-ты анық көрінетін өлшемге көтереді. */
export function resolveOrnamentSpinnerSize(requested: number): number {
  if (requested >= 48) return Math.max(requested, SCREEN_SIZE);
  if (requested >= 32) return requested + 4;
  return Math.max(MIN_SIZE, requested);
}

/**
 * Қазақы алтын ою — жүктелу индикаторы (мөлдір PNG, үздіксіз айналу).
 */
export function RaqatOrnamentSpinner({
  active = true,
  size = 56,
  style,
  accessibilityLabel = kk.common.loading,
}: Props) {
  const box = useMemo(() => resolveOrnamentSpinnerSize(size), [size]);
  const imageSize = box;
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      cancelAnimation(rotation);
      cancelAnimation(pulse);
      return;
    }
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: SPIN_DURATION_MS, easing: Easing.linear }),
      -1,
      false
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: SPIN_DURATION_MS / 2, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    return () => {
      cancelAnimation(rotation);
      cancelAnimation(pulse);
    };
  }, [active, rotation, pulse]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: 0.94 + pulse.value * 0.08 },
    ],
    opacity: 0.94 + pulse.value * 0.06,
  }));

  if (!active) return null;

  return (
    <View
      style={[styles.wrap, { width: box, height: box }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.spin, { width: box, height: box }, spinStyle]}>
        <Image
          source={raqatLoadingSpinnerOrnament}
          style={[styles.image, { width: imageSize, height: imageSize }]}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  spin: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  image: {
    backgroundColor: "transparent",
  },
});
