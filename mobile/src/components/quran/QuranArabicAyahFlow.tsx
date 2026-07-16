import React from "react";
import { Text, View, type TextStyle, type ViewStyle } from "react-native";
import { quranArabicNoClipTextStyle } from "../../quran/quranArabicNoClipTextStyle";
import {
  HATIM_AYAH_AUTO_FIT_BASE_FONT_SIZE,
  QURAN_HATIM_COMPACT_MIN_FONT,
  QURAN_HATIM_COMPACT_PADDING_H,
  QURAN_HATIM_COMPACT_PADDING_V,
  QURAN_SCREEN_HORIZONTAL_PADDING,
  hatimAyahAutoFitTextProps,
  hatimAyahAutoFitTextStyle,
  quranContinuousAyahSegmentStyle,
  quranContinuousFlowStyle,
  quranInlineAyahTextStyle,
  quranRtlContainerStyle,
  resolveQuranArabicTypography,
} from "../../quran/quranResponsiveLayout";

export type QuranArabicFlowMetrics = {
  fontSize: number;
  lineHeight: number;
  padH: number;
  padV: number | undefined;
  baseTextStyle: TextStyle;
  inlineTextStyle: TextStyle;
};

type MetricsInput = {
  contentWidth: number;
  baseFontSize: number;
  baseTextStyle: TextStyle;
  compact?: boolean;
  fitScale?: number;
  /** Flutter KhatmQuranScreen: width * 0.065, clamp 22–28 */
  ayahScrollStyle?: boolean;
};

/** Экран еніне + fitScale бойынша типография — әріптер жоғалмайды. */
export function buildQuranArabicFlowMetrics(input: MetricsInput): QuranArabicFlowMetrics {
  const { fontSize, lineHeight } = resolveQuranArabicTypography(input.contentWidth, input.baseFontSize, {
    compact: input.compact,
    fitScale: input.fitScale,
    minFontSize: input.compact ? QURAN_HATIM_COMPACT_MIN_FONT : undefined,
    ayahScrollStyle: input.ayahScrollStyle,
  });
  const noClip = quranArabicNoClipTextStyle(
    {
      ...input.baseTextStyle,
      fontSize,
      lineHeight,
      textAlign: "right",
      writingDirection: "rtl",
      letterSpacing: 0,
    },
    { compact: input.compact }
  );
  return {
    fontSize,
    lineHeight,
    padH: input.compact ? QURAN_HATIM_COMPACT_PADDING_H : QURAN_SCREEN_HORIZONTAL_PADDING,
    padV: input.compact ? QURAN_HATIM_COMPACT_PADDING_V : undefined,
    baseTextStyle: noClip,
    inlineTextStyle: quranInlineAyahTextStyle(fontSize, lineHeight, noClip),
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
        ...quranRtlContainerStyle(metrics.padH, metrics.padV),
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
  children: React.ReactNode;
};

/** Үздіксіз аят ағыны: flexWrap wrap + direction rtl. */
export function QuranArabicFlowRow({ flowRef, onFlowLayout, children }: FlowProps) {
  return (
    <View
      ref={flowRef}
      style={quranContinuousFlowStyle()}
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
