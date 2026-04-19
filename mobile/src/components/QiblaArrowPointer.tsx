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
};

const ROT_INTERP_LO = -50000;
const ROT_INTERP_HI = 50000;

/**
 * Компассыз құбыла — жіңішке сақина + жебе (ұш, саб, нок).
 * Animated.spring; жеңіл тыныс пульсі.
 */
export function QiblaArrowPointer({ colors, size, rotateDeg, aligned }: Props) {
  const headH = Math.max(16, Math.round(size * 0.23));
  const triW = Math.max(12, Math.round(size * 0.14));
  const shaftH = Math.max(20, Math.round(size * 0.4));
  const shaftW = Math.max(6, Math.round(size * 0.072));
  const stroke = aligned ? colors.success : colors.accent;
  const showDial = size >= 34;
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
      friction: 7,
      tension: 38,
      restDisplacementThreshold: 0.4,
      restSpeedThreshold: 0.4,
    }).start();
  }, [rotateDeg, rotAnim]);

  useEffect(() => {
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
  }, [aligned, pulseAnim]);

  const rotateStr = rotAnim.interpolate({
    inputRange: [ROT_INTERP_LO, ROT_INTERP_HI],
    outputRange: [`${ROT_INTERP_LO}deg`, `${ROT_INTERP_HI}deg`],
  });

  const glow =
    aligned &&
    Platform.select({
      ios: {
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.85,
        shadowRadius: Math.max(8, size * 0.12),
      },
      android: { elevation: 3 },
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
      {showDial ? (
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
          {/* Көлеңке қабаты */}
          <View style={styles.headLayer}>
            <View
              style={[
                styles.head,
                {
                  borderLeftWidth: triW,
                  borderRightWidth: triW,
                  borderBottomWidth: headH,
                  borderBottomColor: "rgba(0,0,0,0.35)",
                },
              ]}
            />
          </View>
          <View style={[styles.head, tri, { zIndex: 1 }]} />

          <View style={[styles.shaftWrap, { width: shaftW, height: shaftH }]}>
            <View
              style={[
                styles.shaft,
                {
                  width: shaftW,
                  height: shaftH,
                  backgroundColor: stroke,
                  borderRadius: shaftW / 2,
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOpacity: 0.14,
                      shadowRadius: 2.5,
                      shadowOffset: { width: 0, height: 1 },
                    },
                    android: { elevation: 1 },
                    default: {},
                  }),
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.sheen,
                {
                  width: Math.max(2, Math.round(shaftW * 0.38)),
                  height: Math.round(shaftH * 0.62),
                  borderRadius: 2,
                },
              ]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.shaftShade,
                {
                  width: Math.max(1, Math.round(shaftW * 0.22)),
                  height: Math.round(shaftH * 0.45),
                  borderRadius: 1,
                },
              ]}
            />
          </View>

          <View
            style={[
              styles.nock,
              {
                width: Math.round(shaftW * 2.6),
                height: 5,
                backgroundColor: stroke,
                opacity: aligned ? 0.92 : 0.78,
                borderRadius: 3,
              },
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
    justifyContent: "flex-start",
    paddingTop: 2,
  },
  col: {
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },
  headLayer: {
    position: "absolute",
    top: 5,
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
  shaftWrap: {
    marginTop: -1,
    overflow: "hidden",
    alignItems: "center",
  },
  shaft: {},
  sheen: {
    position: "absolute",
    left: "16%",
    top: "10%",
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  shaftShade: {
    position: "absolute",
    right: "12%",
    top: "18%",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  nock: {
    marginTop: -1,
  },
});
