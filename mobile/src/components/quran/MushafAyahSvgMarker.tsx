import React from "react";
import { Image, Platform, StyleSheet, View, type TextStyle } from "react-native";
import Svg, { Circle, Path, Text as SvgText } from "react-native-svg";
import { QURAN_BOOK_FONT_FACE } from "../../fonts/quranBookFonts";
import { mushafRosettePath } from "../../quran/mushafRosettePath";

const AYAH_MARKER_BLUE_IMAGE = require("../../../assets/quran/ayah-marker-blue.png");

/** Аят нөмірі — Quran.com: Scheherazade; әдепкі: Lateef. */
const MARKER_NUMBER_FONT_QCOM =
  Platform.OS === "web"
    ? "Scheherazade New, Lateef, serif"
    : QURAN_BOOK_FONT_FACE.scheherazade;
const MARKER_NUMBER_FONT_DEFAULT =
  Platform.OS === "web" ? "Lateef, serif" : QURAN_BOOK_FONT_FACE.lateef;

type Props = {
  /** Үстемани / шығыс сан белгісі */
  label: string;
  /** Сыртқы контур */
  stroke: string;
  /** Ішкі бет */
  fill: string;
  /** Орталық сан түсі */
  textColor: TextStyle["color"];
  /** Дөңгелек белгінің диаметрі (px) */
  height?: number;
  /** Quran.com хатым — 8 тісті алтын дөңгелек */
  variant?: "default" | "qcom";
};

const VB = 52;

/** Аят нөмірі эмблемасы — көк түс (рамка + контур + сан көк, беті ашық көк). */
const MARKER_BLUE_FRAME = "#1D6FB8";
const MARKER_BLUE_FACE = "#EAF2FB";
const QCOM_MARKER_ASPECT = 0.76;
const QCOM_MARKER_NUMBER_COLOR = "#FFFFFF";

/**
 * Мұсаф / хатым аят соңы: басылымдағы безендірілген дөңгелек белгі.
 * Дизайн талабы: барлық темада аят нөмірі эмблемасы көк (тема түстері елемейді).
 */
export function MushafAyahSvgMarker({
  label,
  stroke = MARKER_BLUE_FRAME,
  fill = MARKER_BLUE_FACE,
  textColor = "#111111",
  height = 36,
  variant = "default",
}: Props) {
  const qcom = variant === "qcom";
  const size = qcom ? height : height;
  const labelLength = Array.from(label).length;
  const fs = qcom
    ? Math.max(
        labelLength >= 3 ? 10 : 12,
        Math.min(22, Math.round(size * (labelLength >= 3 ? 0.32 : labelLength === 2 ? 0.4 : 0.48)))
      )
    : Math.max(10, Math.min(14, Math.round(size * 0.34)));
  const numberFont = qcom ? MARKER_NUMBER_FONT_QCOM : MARKER_NUMBER_FONT_DEFAULT;

  if (qcom) {
    const markerW = Math.round(size * QCOM_MARKER_ASPECT);
    const numberCenterX = markerW / 2;
    const numberCenterY = size * 0.5;
    return (
      <View
        style={{ width: markerW, height: size }}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image source={AYAH_MARKER_BLUE_IMAGE} resizeMode="contain" style={styles.qcomImage} />
        <Image source={AYAH_MARKER_BLUE_IMAGE} resizeMode="contain" style={styles.qcomImageStrong} />
        <Svg
          width={markerW}
          height={size}
          viewBox={`0 0 ${markerW} ${size}`}
          style={styles.qcomNumberSvg}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <SvgText
            x={numberCenterX}
            y={numberCenterY + fs * 0.34}
            fontSize={fs}
            fontWeight="900"
            fill={QCOM_MARKER_NUMBER_COLOR}
            textAnchor="middle"
            fontFamily={numberFont}
          >
            {label}
          </SvgText>
        </Svg>
      </View>
    );
  }

  const cx = VB / 2;
  const cy = VB / 2;
  const rosette = mushafRosettePath(cx, cy, 20.5, 12);

  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${VB} ${VB}`}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d={rosette}
        fill={fill}
        stroke={stroke}
        strokeWidth={qcom ? 1.05 : 0.95}
        strokeLinejoin="round"
      />
      {!qcom ? (
        <>
          <Circle cx={cx} cy={cy} r={15.2} fill="none" stroke={stroke} strokeWidth={0.5} opacity={0.55} />
          <Circle cx={cx} cy={cy} r={11.5} fill="none" stroke={stroke} strokeWidth={0.35} opacity={0.35} />
        </>
      ) : (
        <Circle cx={cx} cy={cy} r={13.8} fill="none" stroke={stroke} strokeWidth={0.4} opacity={0.45} />
      )}
      <SvgText
        x={cx}
        y={cy + fs * 0.34}
        fontSize={fs}
        fontWeight="400"
        fill={textColor}
        textAnchor="middle"
        fontFamily={numberFont}
      >
        {label}
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  qcomImage: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  },
  qcomImageStrong: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    opacity: 0.72,
  },
  qcomNumberSvg: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
