import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, type ImageSourcePropType, Platform, StyleSheet, View } from "react-native";
import type { ThemeColors } from "../theme/colors";
import { angleDiff } from "../lib/qibla";
import { qiblaNeedleSpinDeg, qiblaOrnamentSpinDeg } from "../lib/qiblaArrowGeometry";
import { kazakhOyuKoshkarBand } from "../theme/ornamentAssets";
import {
  QIBLA_ARROW_ORNAMENT_ASPECT,
  qiblaArrowOrnament,
} from "../theme/qiblaAssets";

type Props = {
  colors: ThemeColors;
  /** Контейнер өлшемі (пиксель) */
  size: number;
  /** Телефон үсті (heading) мен құбыла (bearing) арасындағы бұрыш — иін осы бұрышпен сағат тілі бойынша бұрылуы керек. */
  rotateDeg: number;
  /** Құбыла бағытына шамамен тура (qiblaHints aligned) */
  aligned?: boolean;
  /** Сақина сыртқы қабық (halo+шеңбер) — әдепкі өшірулі (компас сақинасы жоқ) */
  showDialRing?: boolean;
  /** showDialRing болғанда: halo (сыртқы әлсіз дөңгелек) — false = тек жіңішке шеңбер, бастапқы бет сияқты */
  showDialHalo?: boolean;
  /** Сақина үстіндегі тұрақты ▲ (эран алды = құбыла белгісі) — false бастапқы бетте */
  showTopMarker?: boolean;
  /** Иінді жеңіл «тыныс» масштабы — бастапқы бетте әдетте өшірулі */
  needlePulse?: boolean;
  /** Құбылаға турағанда төменгі жасыл «шам» пульсі — әдепкі өшірулі */
  showAlignLed?: boolean;
  /** Диаль ортасындағы пивот нүктесі — әдепкі өшірулі (тек оюлы иін көрінеді). */
  showPivotHub?: boolean;
  /**
   * Шапка/hero: тек сақина + иін — компас LED/сыртқы жарық жоқ, иін сақина ішінде сәл маржамен.
   * Ұш бағыты (rotateDeg+180) бұру арқылы құбыла азимутына (магнит + bearing).
   */
  minimalDial?: boolean;
  /** minimalDial болғанда да төменгі жасыл LED пульсі (шапка құбыла туралағанда). */
  showAlignLedInMinimal?: boolean;
  /** Иін сабын қазақы ою жолақ текстурасымен көрсету (ұш — дәстүрлі үшбұрыш). */
  ornamentNeedle?: boolean;
  /** Мөлдір PNG оюлы стрелка (құбыла иіні) — vector/ornamentNeedle орнына. */
  ornamentArrow?: boolean;
  /**
   * Орталықта бұрылмайтын дөңгелек ою медальоны (көшпар жолақ PNG).
   * Иін әлі `rotateDeg+180°` бойынша бұрылып, ұшы құбылаға қарайды; медальон тек фон ретінде ортада тұрады.
   */
  centerOyuMedallion?: boolean;
};

const ROT_INTERP_LO = -50000;
const ROT_INTERP_HI = 50000;

/**
 * Құбыла бағыты — сақина + **иін** (саб + үшбұрыш ұш). Ұш бағыты: rotateDeg + 180° (heading/ұш геометриясын үйлестіру).
 * showTopMarker: сақина үстіндегі ▲; showDialHalo: сыртқы halo; needlePulse: иінді scale анимациясы.
 * Әдепкі: компас сақинасы/LED жоқ; пивот — диаль ортасы: сабтың **үстіңгі шеті** сол нүктеде (көрінбейтін hub бос орны жоқ).
 */
export function QiblaArrowPointer({
  colors,
  size,
  rotateDeg,
  aligned,
  showDialRing = false,
  showDialHalo = false,
  showTopMarker = false,
  needlePulse = true,
  showAlignLed = false,
  showPivotHub = false,
  minimalDial = false,
  showAlignLedInMinimal = false,
  ornamentNeedle = false,
  ornamentArrow = false,
  centerOyuMedallion = false,
}: Props) {
  const useOrnamentArrow = ornamentArrow && !ornamentNeedle;
  /**
   * RN `rotate`: оң = сағат тілі. rotateDeg = angleDiff(heading, bearing).
   * Векторлық иін: ұш төмен (+Y) → +180°. Оюлы PNG: ұш ~52° → `qiblaOrnamentSpinDeg`.
   */
  const spinDeg = useOrnamentArrow ? qiblaOrnamentSpinDeg(rotateDeg) : qiblaNeedleSpinDeg(rotateDeg);
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
  /** Шапка сияқты кіші minimalDial: сақина ішінде иін — өлшем 28+ жеткілікті. */
  const showDial = !compact && (minimalDial ? size >= 26 : size >= 34);
  /** minimalDial: сақинаны әрдайым көрсету (шапкада showDialRing=false болса да). */
  const showDialRingEffective = showDialRing || minimalDial;
  const ringInset = minimalDial
    ? Math.max(2, Math.round(size * 0.048))
    : Math.max(2, Math.round(size * 0.038));
  const ringTint = aligned ? colors.success : colors.accent;
  const alignLedOn = showAlignLed && (!minimalDial || showAlignLedInMinimal);

  const lastRotRef = useRef(spinDeg);
  const rotAnim = useRef(new Animated.Value(spinDeg)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const alignLedOpacity = useRef(new Animated.Value(0.4)).current;
  const alignLedLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const step = angleDiff(lastRotRef.current, spinDeg);
    if (Math.abs(step) < 0.015) return;
    lastRotRef.current += step;
    const abs = Math.abs(step);
    /** Кіші қадам — бірден; үлкен — қысқа timing (spring қуып қалмасын). */
    if (abs <= 10) {
      rotAnim.setValue(lastRotRef.current);
      return;
    }
    Animated.timing(rotAnim, {
      toValue: lastRotRef.current,
      duration: Math.min(40, Math.max(14, abs * 0.28)),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [spinDeg, rotAnim]);

  useEffect(() => {
    if (compact || !needlePulse) {
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
  }, [aligned, compact, needlePulse, pulseAnim]);

  useEffect(() => {
    alignLedLoopRef.current?.stop();
    if (!alignLedOn) {
      alignLedOpacity.setValue(0.4);
      return;
    }
    if (compact) {
      alignLedOpacity.setValue(aligned ? 1 : 0.38);
      return;
    }
    if (aligned) {
      alignLedOpacity.setValue(1);
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(alignLedOpacity, {
            toValue: 0.55,
            duration: 550,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(alignLedOpacity, {
            toValue: 1,
            duration: 550,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
      alignLedLoopRef.current = loop;
      loop.start();
      return () => {
        loop.stop();
        alignLedLoopRef.current = null;
      };
    }
    alignLedOpacity.setValue(0.38);
    return undefined;
  }, [aligned, alignLedOpacity, compact, alignLedOn]);

  const rotateStr = rotAnim.interpolate({
    inputRange: [ROT_INTERP_LO, ROT_INTERP_HI],
    outputRange: [`${ROT_INTERP_LO}deg`, `${ROT_INTERP_HI}deg`],
  });

  /** Шапка: орталық нүкте жоқ — иін сақина ортасынан басталады, тігінен ығысусыз */
  const needleNudgeY = minimalDial && !showPivotHub ? 0 : 2;

  const ornamentArrowNode = useOrnamentArrow ? (
    <OrnamentArrowImage size={size} compact={compact} />
  ) : null;

  if (useOrnamentArrow && compact) {
    const ledS = Math.max(5, Math.round(size * 0.22));
    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        <Animated.View
          style={[
            styles.compactSpin,
            {
              width: size,
              height: size,
              transform: [{ rotate: rotateStr }, ...(needlePulse ? [{ scale: pulseAnim }] : [])],
            },
          ]}
        >
          <View style={styles.needleMount} pointerEvents="none">
            {ornamentArrowNode}
          </View>
        </Animated.View>
        {alignLedOn ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: Math.max(2, Math.round(size * 0.06)),
              alignSelf: "center",
              width: ledS,
              height: ledS,
              borderRadius: ledS / 2,
              backgroundColor: aligned ? stroke : `${colors.muted}99`,
              opacity: alignLedOpacity,
              zIndex: 50,
            }}
          />
        ) : null}
      </View>
    );
  }

  if (compact) {
    const cShaftW = Math.max(3, Math.round(size * 0.06));
    const cShaftGap = Math.max(2, Math.round(size * 0.03));
    const cShaftLen = Math.max(5, Math.round(size * 0.36 + cShaftGap * 0.85));
    const cHubD = Math.max(6, Math.round(size * 0.2));
    const cHubR = cHubD / 2;
    const cTipH = Math.max(7, Math.round(headH * 0.62));
    const cTipBase = Math.max(11, Math.round(triW * 2.05));
    const ledS = Math.max(5, Math.round(size * 0.22));
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
          <View style={styles.needleMount} pointerEvents="none">
            <View
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: size,
                height: size,
                transform: [{ translateY: needleNudgeY }],
              }}
            >
              {showPivotHub ? (
                <View
                  style={[
                    styles.pivotHub,
                    {
                      position: "absolute",
                      left: (size - cHubD) / 2,
                      top: size / 2 - cHubR,
                      width: cHubD,
                      height: cHubD,
                      borderRadius: cHubR,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.pivotHubInner,
                      {
                        width: cHubD - 4,
                        height: cHubD - 4,
                        borderRadius: (cHubD - 4) / 2,
                        backgroundColor: stroke,
                        borderColor: "rgba(255,255,255,0.45)",
                      },
                    ]}
                  />
                </View>
              ) : null}
              <View
                style={{
                  position: "absolute",
                  left: (size - cShaftW - 4) / 2,
                  top: showPivotHub ? size / 2 + cHubR + cShaftGap : size / 2,
                  width: cShaftW + 4,
                  alignItems: "center",
                }}
              >
                {ornamentNeedle ? (
                  <KazakhOyuNeedleShaft
                    shaftLenPx={cShaftLen}
                    bandW={Math.max(Math.round(cShaftW + 3), Math.round(cTipBase * 0.36))}
                    tipBase={cTipBase}
                    tipH={cTipH}
                    stroke={stroke}
                    size={size}
                    compact
                  />
                ) : (
                  <>
                    <View
                      style={{
                        width: cShaftW,
                        height: cShaftLen,
                        backgroundColor: stroke,
                        marginBottom: -0.5,
                        borderBottomLeftRadius: Math.min(cShaftW * 0.6, 4),
                        borderBottomRightRadius: Math.min(cShaftW * 0.6, 4),
                        borderTopLeftRadius: 1,
                        borderTopRightRadius: 1,
                        borderLeftWidth: 1,
                        borderLeftColor: "rgba(255,255,255,0.28)",
                      }}
                    />
                    <View style={{ marginTop: -1, alignItems: "center" }}>
                      <View
                        style={[
                          {
                            width: 0,
                            height: 0,
                            borderLeftWidth: cTipBase / 2,
                            borderRightWidth: cTipBase / 2,
                            borderTopWidth: cTipH,
                            borderLeftColor: "transparent",
                            borderRightColor: "transparent",
                            borderTopColor: stroke,
                          },
                          Platform.select({
                            ios: {
                              shadowColor: stroke,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.35,
                              shadowRadius: Math.max(1.2, size * 0.06),
                            },
                            android: { elevation: 3 },
                            default: {},
                          }),
                        ]}
                      />
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
        {alignLedOn ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: Math.max(2, Math.round(size * 0.06)),
              alignSelf: "center",
              width: ledS,
              height: ledS,
              borderRadius: ledS / 2,
              backgroundColor: aligned ? stroke : `${colors.muted}99`,
              opacity: alignLedOpacity,
              zIndex: 50,
              ...(Platform.OS === "ios" && aligned
                ? {
                    shadowColor: colors.success,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.95,
                    shadowRadius: 4,
                  }
                : {}),
              ...(Platform.OS === "android" ? { elevation: aligned ? 4 : 0 } : {}),
            }}
          />
        ) : null}
      </View>
    );
  }

  const dialW = size - ringInset * 2;
  const haloW = dialW + Math.max(5, Math.round(size * 0.078));
  /** Саб: minimalDial шапкада — түбі қалынырақ, ұшқа қарай жіңішкеретін пропорция. */
  const shaftW =
    minimalDial && !compact
      ? Math.max(3, Math.min(5, Math.round(size * 0.05)))
      : Math.max(2, Math.min(4, Math.round(size * 0.02)));
  const innerR = showDial ? dialW / 2 : size / 2 - ringInset;
  /** Диаль ортасындағы «ось» шенкелі — пивот. */
  const hubD = Math.round(Math.max(9, Math.min(size * 0.11, 17)));
  const hubR = hubD / 2;
  const rimPad = minimalDial ? Math.max(0, Math.round(size * 0.024)) : 0;
  let tipH = Math.max(14, Math.min(Math.round(size * 0.13), 30));
  let tipBase = Math.max(16, Math.min(Math.round(size * 0.17), 34));
  if (minimalDial && size < 48) {
    tipH = Math.max(12, Math.round(tipH * 1.15));
    /** Оюлы ұш кішірейеді; классикалық үшбұрыш ұш шапкада анық көрінуі керек */
    tipBase = ornamentNeedle
      ? Math.max(7, Math.round(tipBase * 0.5))
      : Math.max(11, Math.round(tipBase * 0.72));
  }
  const tipReach = tipH + 1;
  /** Сақина шетіне дейін созылған саб; minimalDial — маржа минималды */
  const tipClearance = minimalDial ? Math.max(2, size * 0.036) : Math.max(4, size * 0.054);
  const hubClear = minimalDial ? hubR * 0.06 : hubR * 0.09;
  const innerTrim = minimalDial ? 0 : Math.round(size * 0.004);
  /** Саб орталық пивот шеңберінің ішіне кірмейді — визуалды бос жол, ұзындығы сақинаға қарай сақталады */
  const shaftGapBelowHub =
    showPivotHub || !minimalDial ? Math.max(2, Math.round(size * 0.026)) : 0;
  const hubClearEff = showPivotHub ? hubClear : 0;
  const shaftLen = Math.max(
    Math.round(headH * (minimalDial ? 0.8 : 0.54)),
    Math.round(
      innerR -
        tipReach -
        (minimalDial ? Math.max(1, tipClearance - 1) : tipClearance) -
        hubClearEff -
        rimPad -
        innerTrim +
        shaftGapBelowHub * (minimalDial ? 1.08 : 0.92)
    )
  );
  const dialLeft = (size - dialW) / 2;
  const dialTop = (size - dialW) / 2;
  const haloLeft = (size - haloW) / 2;
  const haloTop = (size - haloW) / 2;
  /** Иін жолының ені — оюлы саб үшін bandW кеңірек болуы мүмкін. */
  const bandWOrn = Math.max(10, Math.round(shaftW * 5), Math.round(tipBase * 0.42));
  const needleTrackW = ornamentNeedle
    ? Math.max(triW * 2 + 6, bandWOrn + 8, tipBase + 8)
    : Math.max(triW * 2 + 6, Math.round(tipBase) + 8);
  const ledSize = Math.max(7, Math.min(Math.round(size * 0.12), 14));
  const medallionD = centerOyuMedallion && !useOrnamentArrow
    ? Math.max(12, Math.min(Math.round(size * 0.48), Math.floor(size * 0.58)))
    : 0;

  if (useOrnamentArrow) {
    return (
      <View style={[styles.wrap, { width: size, height: size }]}>
        {showDial && showDialRingEffective ? (
          <>
            {showDialHalo ? (
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
                    borderWidth: minimalDial ? 1.5 : 1,
                    borderColor: minimalDial ? `${ringTint}44` : `${ringTint}28`,
                    backgroundColor: minimalDial ? `${ringTint}0a` : `${ringTint}06`,
                  },
                ]}
              />
            ) : null}
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
                  borderWidth: minimalDial ? (showDialHalo ? 2 : 1.25) : showDialHalo ? 2 : 1.5,
                  borderColor: aligned
                    ? minimalDial
                      ? `${colors.success}bb`
                      : `${colors.success}66`
                    : minimalDial
                      ? `${colors.accent}99`
                      : `${colors.accent}55`,
                  backgroundColor:
                    showDialHalo && aligned
                      ? `${colors.success}12`
                      : showDialHalo
                        ? `${colors.accent}0f`
                        : "transparent",
                },
              ]}
            />
          </>
        ) : null}
        <Animated.View
          style={[
            styles.spin,
            { width: size, height: size, zIndex: 2 },
            {
              transform: [{ rotate: rotateStr }, ...(needlePulse ? [{ scale: pulseAnim }] : [])],
            },
          ]}
        >
          <View style={styles.needleMount} pointerEvents="none">
            {ornamentArrowNode}
          </View>
        </Animated.View>
        {alignLedOn ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: Math.max(4, Math.round(size * 0.035)),
              alignSelf: "center",
              width: ledSize,
              height: ledSize,
              borderRadius: ledSize / 2,
              backgroundColor: aligned ? colors.success : `${colors.muted}88`,
              opacity: alignLedOpacity,
              zIndex: 50,
            }}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {centerOyuMedallion ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: (size - medallionD) / 2,
            top: (size - medallionD) / 2,
            width: medallionD,
            height: medallionD,
            borderRadius: medallionD / 2,
            overflow: "hidden",
            zIndex: 0,
            backgroundColor: "rgba(124, 58, 10, 0.09)",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(124, 58, 10, 0.38)",
          }}
        >
          <Image
            source={kazakhOyuKoshkarBand as ImageSourcePropType}
            style={{
              position: "absolute",
              width: medallionD * 2.85,
              height: medallionD * 0.92,
              left: -medallionD * 0.52,
              top: medallionD * 0.04,
              opacity: 0.96,
              transform: [{ rotate: "-90deg" }],
            }}
            resizeMode="cover"
          />
        </View>
      ) : null}
      {showDial && showDialRingEffective ? (
        <>
          {showDialHalo ? (
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
                  borderWidth: minimalDial ? 1.5 : 1,
                  borderColor: minimalDial ? `${ringTint}44` : `${ringTint}28`,
                  backgroundColor: minimalDial ? `${ringTint}0a` : `${ringTint}06`,
                },
              ]}
            />
          ) : null}
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
                borderWidth: minimalDial ? (showDialHalo ? 2 : 1.25) : showDialHalo ? 2 : 1.5,
                borderColor: aligned
                  ? minimalDial
                    ? `${colors.success}bb`
                    : `${colors.success}66`
                  : minimalDial
                    ? `${colors.accent}99`
                    : `${colors.accent}55`,
                backgroundColor:
                  showDialHalo && aligned
                    ? `${colors.success}12`
                    : showDialHalo
                      ? `${colors.accent}0f`
                      : "transparent",
              },
            ]}
          />
        </>
      ) : null}
      {showDial && showTopMarker ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: ringInset + 1,
            zIndex: 30,
            width: 0,
            height: 0,
            borderLeftWidth: Math.max(6, Math.round(size * 0.044)),
            borderRightWidth: Math.max(6, Math.round(size * 0.044)),
            borderTopWidth: Math.max(7, Math.round(size * 0.048)),
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: ringTint,
            opacity: 0.92,
          }}
        />
      ) : null}

      <Animated.View
        style={[
          styles.spin,
          { width: size, height: size, zIndex: 2 },
          {
            transform: [{ rotate: rotateStr }, ...(needlePulse ? [{ scale: pulseAnim }] : [])],
          },
        ]}
      >
        <View style={styles.needleMount} pointerEvents="none">
          {/*
           * Пивот — диаль ортасы (size/2, size/2). Сабтың үстіңгі шеті сол нүктеде: ортадан «шыққан» емес,
           * тігінен құбылаға қарай созылған иін (көрінбейтін hub бос орны жоқ).
           */}
          <View
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: size,
              height: size,
              transform: [{ translateY: needleNudgeY }],
            }}
          >
            {showPivotHub ? (
              <View
                style={[
                  styles.pivotHub,
                  {
                    position: "absolute",
                    left: (size - hubD) / 2,
                    top: size / 2 - hubR,
                    width: hubD,
                    height: hubD,
                    borderRadius: hubR,
                  },
                ]}
              >
                <View
                  style={[
                    styles.pivotHubInner,
                    {
                      width: hubD - 4,
                      height: hubD - 4,
                      borderRadius: (hubD - 4) / 2,
                      backgroundColor: stroke,
                      borderColor: "rgba(255,255,255,0.5)",
                    },
                  ]}
                />
              </View>
            ) : null}
            <View
              style={{
                position: "absolute",
                left: (size - needleTrackW) / 2,
                top: showPivotHub ? size / 2 + hubR + shaftGapBelowHub : size / 2,
                width: needleTrackW,
                alignItems: "center",
              }}
            >
              {ornamentNeedle ? (
                <KazakhOyuNeedleShaft
                  shaftLenPx={shaftLen}
                  bandW={bandWOrn}
                  tipBase={tipBase}
                  tipH={tipH}
                  stroke={stroke}
                  size={size}
                />
              ) : (
                <>
                  <View
                    style={[
                      styles.shaftReal,
                      {
                        width: minimalDial ? Math.max(shaftW, Math.round(size * 0.042)) : shaftW,
                        height: shaftLen,
                        backgroundColor: stroke,
                        borderBottomLeftRadius: Math.min(shaftW * 0.55, 5),
                        borderBottomRightRadius: Math.min(shaftW * 0.55, 5),
                        borderTopLeftRadius: minimalDial ? 2 : 1,
                        borderTopRightRadius: minimalDial ? 2 : 1,
                        borderLeftWidth: minimalDial
                          ? Math.min(2.5, Math.max(1.5, Math.round(shaftW * 0.34)))
                          : Math.min(2, Math.max(1, Math.round(shaftW * 0.28))),
                        borderLeftColor: "rgba(255,255,255,0.32)",
                      },
                      Platform.select({
                        ios: {
                          shadowColor: stroke,
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.28,
                          shadowRadius: 2.5,
                        },
                        android: { elevation: 2 },
                        default: {},
                      }),
                    ]}
                  />
                  <View style={{ alignItems: "center", marginTop: -1, width: Math.max(tipBase + 8, triW * 2 + 10) }}>
                    <View
                      style={[
                        {
                          width: 0,
                          height: 0,
                          borderLeftWidth: tipBase / 2,
                          borderRightWidth: tipBase / 2,
                          borderTopWidth: tipH,
                          borderLeftColor: "transparent",
                          borderRightColor: "transparent",
                          borderTopColor: stroke,
                        },
                        Platform.select({
                          ios: {
                            shadowColor: stroke,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.38,
                            shadowRadius: Math.max(2.5, size * 0.05),
                          },
                          android: { elevation: 4 },
                          default: {},
                        }),
                      ]}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Animated.View>
      {alignLedOn ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: Math.max(4, Math.round(size * 0.035)),
            alignSelf: "center",
            width: ledSize,
            height: ledSize,
            borderRadius: ledSize / 2,
            backgroundColor: aligned ? colors.success : `${colors.muted}88`,
            opacity: alignLedOpacity,
            zIndex: 50,
            borderWidth: aligned ? 1 : 0,
            borderColor: "rgba(255,255,255,0.45)",
            ...(Platform.OS === "ios" && aligned
              ? {
                  shadowColor: colors.success,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 1,
                  shadowRadius: Math.max(6, size * 0.08),
                }
              : {}),
            ...(Platform.OS === "android" ? { elevation: aligned ? 6 : 1 } : {}),
          }}
        />
      ) : null}
    </View>
  );
}

/** Мөлдір PNG — бұрылыс сыртқы `spinDeg` (qiblaOrnamentSpinDeg) арқылы; ішкі align жоқ. */
function OrnamentArrowImage({ size, compact }: { size: number; compact?: boolean }) {
  const h = Math.round(size * (compact ? 0.82 : 0.88));
  const w = Math.round(h * QIBLA_ARROW_ORNAMENT_ASPECT);
  return (
    <View
      style={{
        position: "absolute",
        left: (size - w) / 2,
        top: (size - h) / 2,
        width: w,
        height: h,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={qiblaArrowOrnament as ImageSourcePropType}
        style={{ width: w, height: h }}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

/** Ұш: қазақ оюымен қапталған ромб (классикалық үшбұрыш орнына). */
function KazakhOyuOrnamentTip({
  tipBase,
  tipH,
  stroke,
  size,
  compact,
}: {
  tipBase: number;
  tipH: number;
  stroke: string;
  size: number;
  compact?: boolean;
}) {
  const tipSq = Math.max(
    compact ? 6 : 10,
    Math.round(Math.min(tipBase * 0.52, tipH * 0.78))
  );
  const tipShadow = Platform.select({
    ios: {
      shadowColor: stroke,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: compact ? 0.3 : 0.34,
      shadowRadius: compact ? Math.max(1.2, size * 0.06) : Math.max(2.2, size * 0.048),
    },
    android: { elevation: compact ? 3 : 4 },
    default: {},
  });
  return (
    <View
      style={{
        minHeight: tipH,
        width: tipBase,
        alignItems: "center",
        justifyContent: "flex-start",
        marginTop: compact ? -1 : -2,
      }}
    >
      <View
        style={[
          {
            width: tipSq,
            height: tipSq,
            marginTop: -tipSq * 0.1,
            overflow: "hidden",
            transform: [{ rotate: "45deg" }],
            borderRadius: Math.min(3.5, tipSq * 0.22),
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(124, 58, 10, 0.48)",
            backgroundColor: "rgba(124, 58, 10, 0.07)",
          },
          tipShadow,
        ]}
      >
        <Image
          source={kazakhOyuKoshkarBand as ImageSourcePropType}
          style={{
            position: "absolute",
            left: -tipSq * 0.4,
            top: -tipSq * 0.22,
            width: tipSq * 4.2,
            height: tipSq * 2.1,
            transform: [{ rotate: "-90deg" }],
            opacity: 0.98,
          }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

/** Қазақы көшпелі ою жолын тігінен иін сабына созу; ұш — оюлы ромб.*/
function KazakhOyuNeedleShaft({
  shaftLenPx,
  bandW,
  tipBase,
  tipH,
  stroke,
  size,
  compact,
}: {
  shaftLenPx: number;
  bandW: number;
  tipBase: number;
  tipH: number;
  stroke: string;
  size: number;
  compact?: boolean;
}) {
  const imgSpan = Math.max(shaftLenPx * 1.15, bandW * 5);
  return (
    <View style={{ alignItems: "center", alignSelf: "center", width: Math.max(tipBase + 6, bandW + 8) }}>
      <View
        style={{
          width: bandW,
          height: shaftLenPx,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: Math.min(4.5, bandW * 0.48),
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: "rgba(124, 58, 10, 0.4)",
          backgroundColor: "rgba(124, 58, 10, 0.07)",
        }}
      >
        <Image
          source={kazakhOyuKoshkarBand as ImageSourcePropType}
          style={{
            width: imgSpan,
            height: bandW * 3.2,
            transform: [{ rotate: "-90deg" }],
            opacity: 0.97,
          }}
          resizeMode="cover"
        />
      </View>
      <KazakhOyuOrnamentTip tipBase={tipBase} tipH={tipH} stroke={stroke} size={size} compact={compact} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
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
  /** borderTop түсті — үшкір ұш диаль ортасынан сыртқа (+Y); spinDeg компаспен үйлеседі. */
  pointerTipDown: {
    alignItems: "center",
    justifyContent: "center",
  },
  /** Диаль ортасынан сыртқа қарай стрелка; бұру осы контейнер ортасына қатысты. */
  needleMount: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },
  needleCol: {
    position: "absolute",
    top: "50%",
    alignItems: "center",
    alignSelf: "center",
  },
  pivotHub: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.42)",
    backgroundColor: "rgba(0,0,0,0.12)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  pivotHubInner: {
    borderWidth: 1,
  },
  needleBody: {
    alignItems: "center",
    zIndex: 2,
  },
  shaftReal: {
    marginBottom: -1,
    overflow: "hidden",
  },
});
