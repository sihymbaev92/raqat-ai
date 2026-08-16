import React from "react";
import { Text, View, type TextStyle, type ViewStyle } from "react-native";
import { quranArabicNoClipTextStyle } from "../../quran/quranArabicNoClipTextStyle";
import {
  TURKISH_PRINT_HATIM_COMPACT_PADDING_H,
  TURKISH_PRINT_HATIM_MIN_HORIZONTAL_PADDING,
} from "../../quran/quranTurkishPrintTypography";
import {
  HATIM_AYAH_AUTO_FIT_BASE_FONT_SIZE,
  QURAN_HATIM_COMPACT_MIN_FONT,
  QURAN_HATIM_COMPACT_PADDING_H,
  QURAN_HATIM_COMPACT_PADDING_V,
  QURAN_AYAH_MIN_HORIZONTAL_PADDING,
  QURAN_SCREEN_HORIZONTAL_PADDING,
  hatimAyahAutoFitTextProps,
  hatimAyahAutoFitTextStyle,
  quranContinuousAyahSegmentStyle,
  quranContinuousFlowStyle,
  quranInlineAyahTextStyle,
  quranAyahScrollContainerStyle,
  quranAyahScrollArabicHostStyle,
  quranRtlContainerStyle,
  resolveQuranArabicTypography,
} from "../../quran/quranResponsiveLayout";

export type QuranArabicFlowMetrics = {
  fontSize: number;
  lineHeight: number;
  padH: number;
  padHMin: number;
  padV: number | undefined;
  baseTextStyle: TextStyle;
  inlineTextStyle: TextStyle;
  ayahScrollStyle?: boolean;
};

type MetricsInput = {
  contentWidth: number;
  baseFontSize: number;
  baseTextStyle: TextStyle;
  compact?: boolean;
  fitScale?: number;
  fitScaleFloor?: number;
  minFontSize?: number;
  /** Flutter KhatmQuranScreen: width * 0.065, clamp 22–28 */
  ayahScrollStyle?: boolean;
  skipWidthFactor?: boolean;
  /** QCF4 viewport line-height — compact factor қолданылмайды. */
  baseLineHeight?: number;
  medinaParity?: boolean;
  turkishPrintHatim?: boolean;
  /** Түрік Unicode хатым: тар horizontal pad (Medina өлшем + жиек). */
  turkishHatimEdge?: boolean;
  /** Parent arabicLinesBlock horizontal padding-ін есептейді — FlowRoot padH=0. */
  parentHandlesHorizontalInset?: boolean;
  /** QF 28px/2.0: fontSize/lineHeight формуласы өзгертілмейді. */
  turkishQfFixedSize?: boolean;
  /** Түрік Unicode: Medina QCF4 line-height (1.48×) барлық экранда. */
  turkishMedinaParity?: boolean;
  mushafTextScale?: number;
  /** Сүре scroll reader viewport engine — fontSize/lineHeight scale етілмейді. */
  readerEngine?: boolean;
};

/** Экран еніне + fitScale бойынша типография — әріптер жоғалмайды. */
export function buildQuranArabicFlowMetrics(input: MetricsInput): QuranArabicFlowMetrics {
  const readerLocked =
    input.readerEngine === true && input.baseLineHeight != null && input.baseFontSize > 0;
  const fixedQf =
    input.turkishQfFixedSize &&
    input.baseLineHeight != null &&
    input.baseFontSize > 0;
  const { fontSize, lineHeight: computedLineHeight } = readerLocked
    ? { fontSize: input.baseFontSize, lineHeight: input.baseLineHeight! }
    : fixedQf
    ? { fontSize: input.baseFontSize, lineHeight: input.baseLineHeight! }
    : resolveQuranArabicTypography(input.contentWidth, input.baseFontSize, {
        compact: input.compact,
        fitScale: input.fitScale,
        fitScaleFloor: input.fitScaleFloor,
        minFontSize: input.minFontSize ?? (input.compact ? QURAN_HATIM_COMPACT_MIN_FONT : undefined),
        ayahScrollStyle: input.ayahScrollStyle,
        skipWidthFactor: input.skipWidthFactor,
        medinaParity: input.medinaParity || input.turkishMedinaParity,
        turkishPrintHatim: input.turkishPrintHatim,
      });
  const viewportLocked =
    readerLocked ||
    fixedQf ||
    (input.turkishMedinaParity && input.baseLineHeight != null && input.baseFontSize > 0);
  const lineHeight = viewportLocked
    ? Math.round(input.baseLineHeight! * (fontSize / input.baseFontSize))
    : input.baseLineHeight != null && input.baseFontSize > 0
      ? Math.max(
          fontSize + (input.turkishPrintHatim ? 2 : 6),
          Math.round(input.baseLineHeight * (fontSize / input.baseFontSize))
        )
      : computedLineHeight;
  const noClip = quranArabicNoClipTextStyle(
    {
      ...input.baseTextStyle,
      fontSize,
      lineHeight,
      textAlign: "right",
      writingDirection: "rtl",
      letterSpacing: 0,
      width: "100%",
      alignSelf: "stretch" as const,
      maxWidth: "100%" as const,
      ...(input.readerEngine
        ? { flexShrink: 1 as const }
        : input.turkishPrintHatim || input.turkishMedinaParity
          ? { flexShrink: 0 as const }
          : null),
    },
    {
      compact: input.compact,
      turkishPrintHatim: input.turkishPrintHatim,
      turkishMedinaParity: input.turkishMedinaParity,
      turkishQfFixedSize: fixedQf,
      ayahScrollStyle: input.ayahScrollStyle,
    }
  );
  const resolvedLineHeight =
    typeof noClip.lineHeight === "number" ? noClip.lineHeight : lineHeight;
  const turkishEdge = Boolean(input.turkishHatimEdge || input.turkishPrintHatim);
  const padH = input.parentHandlesHorizontalInset
    ? 0
    : input.compact
      ? turkishEdge
        ? TURKISH_PRINT_HATIM_COMPACT_PADDING_H
        : QURAN_HATIM_COMPACT_PADDING_H
      : QURAN_SCREEN_HORIZONTAL_PADDING;
  const padHMin = input.parentHandlesHorizontalInset
    ? 0
    : turkishEdge
      ? TURKISH_PRINT_HATIM_MIN_HORIZONTAL_PADDING
      : QURAN_AYAH_MIN_HORIZONTAL_PADDING;
  return {
    fontSize,
    lineHeight: resolvedLineHeight,
    padH,
    padHMin,
    padV: input.compact
      ? input.turkishMedinaParity
        ? 0
        : input.turkishPrintHatim
          ? 4
          : QURAN_HATIM_COMPACT_PADDING_V
      : undefined,
    baseTextStyle: noClip,
    inlineTextStyle: quranInlineAyahTextStyle(fontSize, lineHeight, noClip),
    ayahScrollStyle: input.ayahScrollStyle,
  };
}

type RootProps = {
  metrics: QuranArabicFlowMetrics;
  sparseCenter?: boolean;
  compactFlex?: boolean;
  style?: ViewStyle;
  onLayoutWidth?: (width: number) => void;
  children: React.ReactNode;
};

/** RTL контейнер: direction rtl + horizontal padding ≥20px. */
export function QuranArabicFlowRoot({
  metrics,
  sparseCenter,
  compactFlex,
  style,
  onLayoutWidth,
  children,
}: RootProps) {
  return (
    <View
      onLayout={
        onLayoutWidth
          ? (e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0) onLayoutWidth(w);
            }
          : undefined
      }
      style={{
        ...(metrics.ayahScrollStyle
          ? {
              ...quranAyahScrollContainerStyle(metrics.padH, metrics.padV),
              ...quranAyahScrollArabicHostStyle(),
            }
          : quranRtlContainerStyle(metrics.padH, metrics.padV, {
              minHorizontalPadding: metrics.padHMin,
            })),
        flex: compactFlex ? 1 : undefined,
        justifyContent: sparseCenter ? "center" : "flex-start",
        ...style,
      }}
    >
      {children}
    </View>
  );
}

type FlowProps = {
  flowRef?: React.Ref<View>;
  onFlowLayout?: (height: number) => void;
  style?: ViewStyle;
  children: React.ReactNode;
};

/** Үздіксіз аят ағыны: flexWrap wrap + direction rtl. */
export function QuranArabicFlowRow({ flowRef, onFlowLayout, style, children }: FlowProps) {
  return (
    <View
      ref={flowRef}
      style={[quranContinuousFlowStyle(), style]}
      onLayout={onFlowLayout ? (e) => onFlowLayout(e.nativeEvent.layout.height) : undefined}
    >
      {children}
    </View>
  );
}

type SegmentProps = {
  segmentRef?: React.Ref<View>;
  onSegmentLayout?: () => void;
  style?: ViewStyle;
  children: React.ReactNode;
};

/** Бір аят: мәтін + маркер (RTL wrap). */
export function QuranArabicFlowSegment({ segmentRef, onSegmentLayout, style, children }: SegmentProps) {
  return (
    <View
      ref={segmentRef}
      collapsable={false}
      onLayout={onSegmentLayout}
      style={[quranContinuousAyahSegmentStyle(), style]}
    >
      {children}
    </View>
  );
}

type InlineTextProps = {
  metrics: QuranArabicFlowMetrics;
  highlightStyle?: TextStyle;
  /** Хатым бір бет: бір жол + adjustsFontSizeToFit. */
  hatimAutoFit?: boolean;
  children: React.ReactNode;
};

/** Inline араб `<Text>` — wrap + RTL, тәжуид span-дары ішінде еркін ағады. */
export function QuranArabicFlowInlineText({
  metrics,
  highlightStyle,
  hatimAutoFit = false,
  children,
}: InlineTextProps) {
  const fitFontSize = hatimAutoFit ? HATIM_AYAH_AUTO_FIT_BASE_FONT_SIZE : metrics.fontSize;
  const baseStyle = highlightStyle
    ? quranInlineAyahTextStyle(fitFontSize, metrics.lineHeight, highlightStyle)
    : { ...metrics.inlineTextStyle, fontSize: fitFontSize };
  const textStyle = hatimAutoFit ? [baseStyle, hatimAyahAutoFitTextStyle(fitFontSize)] : baseStyle;
  const fitProps = hatimAutoFit ? hatimAyahAutoFitTextProps() : null;
  return (
    <Text style={textStyle} {...(fitProps ?? {})} suppressHighlighting>
      {children}
    </Text>
  );
}
