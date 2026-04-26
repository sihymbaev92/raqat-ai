import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View } from "react-native";
import type { ThemeColors } from "../theme/colors";
import { angleDiff } from "../lib/qibla";

type Props = {
  colors: ThemeColors;
  /** Контейнер өлшемі (пиксель) */
  size: number;
  /** Магнитометр + бағыт бойынша бұру (градус UI-да көрсетілмейді) */
  rotateDeg: number;
  /** Құбыла бағытына шамамен тура (qiblaHints aligned) */
  aligned?: boolean;
  /** Сақина сыртқы қабық (halo/ring) — false болса тек иін қалған «таза» көрініс */
  showDialRing?: boolean;
};

const ROT_INTERP_LO = -50000;
const ROT_INTERP_HI = 50000;

/**
 * Құбыла бағыты — сақина + **жуан/dөң (көлеңкелі) үшбұрыш**, сабы жоқ.
 * Animated.spring; жеңіл тыныс пульсі.
 */
export function QiblaArrowPointer({
  colors,
  size,
  rotateDeg,
  aligned,
  showDialRing = true,
}: Props) {
  const compact = size <= 24;
  /** 25–47px: header сияқты кіші контейнер; 48+: толық сақина (бұрынғы min 30px жуандығы). */
  let headH: number;
  let triW: number;
  if (compact) {
    headH = Math.max(8, Math.round(size * 0.38));
    triW = Math.max(5, Math.round(size * 0.16));
  } else if (size < 48) {
    headH = Math.max(Math.min(30, Math.round(size * 0.45)), Math.round(size * 0.32));
    triW = Math.max(Math.min(18, Math.round(size * 0.22)), Math.round(size * 0.14));
  } else {
    headH = Math.max(30, Math.round(size * 0.4));
    triW = Math.max(17, Math.round(size * 0.165));
  }
  const stroke = aligned ? colors.success : colors.accent;
  const showDial = !compact && size >= 34;
  const ringInset = Math.max(2, Math.round(size * 0.042));

  const lastRotRef = useRef(rotateDeg);
  const rotAnim = useRef(new Animated.Value(rotateDeg)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const step = angleDiff(lastRotRef.current, rotateDeg);
    lastRotRef.current += step;
    Animated.spring(rotAnim, {
      toValue: lastRotRef.current,
      useNativeDriver: true,
      friction: 4.4,
      tension: 96,
      restDisplacementThreshold: 0.12,
      restSpeedThreshold: 0.12,
    }).start();
  }, [rotateDeg, rotAnim]);

  useEffect(() => {
    if (compact) {
      pulseAnim.setValue(1);
      return;
    }
    pulseLoopRef.current?.stop();
    const scaleTo = aligned ? 1.05 : 1.028;
    const halfMs = aligned ? 720 : 920;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: scaleTo,
          duration: halfMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: halfMs,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoopRef.current = loop;
    loop.start();
    return () => {
      loop.stop();
      pulseLoopRef.current = null;
    };
  }, [aligned, compact, pulseAnim]);

  const rotateStr = rotAnim.interpolate({
    inputRange: [ROT_INTERP_LO, ROT_INTERP_HI],
    outputRange: [`${ROT_INTERP_LO}deg`, `${ROT_INTERP_HI}deg`],
  });

  if (compact) {
    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.compactSpin,
            {
              width: size,
              height: size,
              transform: [{ rotate: rotateStr }],
            },
          ]}
        >
          <View
            style={[
              styles.compactHead,
              {
                borderLeftWidth: triW,
                borderRightWidth: triW,
                borderBottomWidth: headH,
                borderBottomColor: stroke,
                /* Жұмсақ шек: жеңіл көлеңке қабаты */
                ...Platform.select({
                  ios: {
                    shadowColor: stroke,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.45,
                    shadowRadius: Math.max(1.5, size * 0.08),
                  },
                  android: { elevation: 3 },
                  default: {},
                }),
              },
            ]}
          />
        </Animated.View>
      </View>
    );
  }

  const glow =
    aligned &&
    !compact &&
    Platform.select({
      ios: {
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.95,
        shadowRadius: Math.max(10, size * 0.15),
      },
      android: { elevation: 8 },
      default: {},
    });

  const dialW = size - ringInset * 2;
  const haloW = dialW + Math.max(4, Math.round(size * 0.06));
  const tri = {
    borderLeftWidth: triW,
    borderRightWidth: triW,
    borderBottomWidth: headH,
    borderBottomColor: stroke,
  };
  const ringTint = aligned ? colors.success : colors.accent;
  const dialLeft = (size - dialW) / 2;
  const dialTop = (size - dialW) / 2;
  const haloLeft = (size - haloW) / 2;
  const haloTop = (size - haloW) / 2;

  return (
    <View style={[styles.wrap, { width: size, height: size }, glow]}>
      {aligned && !compact ? (
        <View
          pointerEvents="none"
          style={[
            styles.alignedGlow,
            {
              width: size * 0.92,
              height: size * 0.92,
              borderRadius: (size * 0.92) / 2,
              backgroundColor: `${colors.success}22`,
              borderColor: `${colors.success}88`,
            },
          ]}
        />
      ) : null}
      {showDial && showDialRing ? (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.dialHalo,
              {
                left: haloLeft,
                top: haloTop,
                width: haloW,
                height: haloW,
                borderRadius: haloW / 2,
                borderColor: `${ringTint}28`,
                backgroundColor: `${ringTint}06`,
              },
            ]}
          />
          <View
            pointerEvents="none"
            style={[
              styles.dialRing,
              {
                left: dialLeft,
                top: dialTop,
                width: dialW,
                height: dialW,
                borderRadius: dialW / 2,
                borderColor: aligned ? `${colors.success}66` : `${colors.accent}55`,
                backgroundColor: aligned ? `${colors.success}12` : `${colors.accent}0f`,
              },
            ]}
          />
        </>
      ) : null}

      <Animated.View
        style={[
          styles.spin,
          { width: size, height: size },
          {
            transform: [{ rotate: rotateStr }, { scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.col}>
          <View style={styles.headLayer}>
            <View
              style={[
                styles.head,
                {
                  borderLeftWidth: triW,
                  borderRightWidth: triW,
                  borderBottomWidth: headH,
                  borderBottomColor: "rgba(0,0,0,0.28)",
                },
              ]}
            />
          </View>
          <View
            style={[
              styles.head,
              tri,
              { zIndex: 1 },
              Platform.select({
                ios: {
                  shadowColor: stroke,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.38,
                  shadowRadius: Math.max(3, size * 0.06),
                },
                android: { elevation: 4 },
                default: {},
              }),
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  alignedGlow: {
    position: "absolute",
    borderWidth: 1.5,
  },
  dialHalo: {
    position: "absolute",
    borderWidth: 1,
  },
  dialRing: {
    position: "absolute",
    borderWidth: 2,
  },
  spin: {
    alignItems: "center",
    justifyContent: "center",
  },
  compactSpin: {
    alignItems: "center",
    justifyContent: "center",
  },
  compactHead: {
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  col: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headLayer: {
    position: "absolute",
    zIndex: 0,
    opacity: Platform.OS === "android" ? 0.14 : 0.2,
    transform: [{ translateY: 2 }],
  },
  head: {
    width: 0,
    height: 0,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
