import React, { useMemo } from "react";
import { View, type TextStyle, type ViewStyle } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { AyahArabicKaraokeText } from "./AyahArabicKaraokeText";
import { useQuranReaderTypography } from "./QuranReader";
import { buildQuranArabicFlowMetrics, QuranArabicFlowRoot } from "./QuranArabicAyahFlow";
import { quranSurahArabicWrapStyle } from "../../quran/quranResponsiveLayout";
import {
  quranReaderAyahContainerStyle,
  quranReaderAyahHostStyle,
  quranReaderAyahTextLayoutStyle,
  type QuranReaderFontSizeMode,
} from "../../quran/quranReaderViewportMetrics";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import {
  resolveEditionArabicTextStyle,
  quranArabicAyahStyleForEdition,
} from "../../quran/quranTurkishPrintTypography";
import { useTurkishPrintFontsReady } from "../../quran/useTurkishPrintFontsReady";

type Props = {
  plainText: string;
  taggedText?: string | null;
  showTajweedColors: boolean;
  isDark: boolean;
  arabicScriptEdition: QuranArabicScriptEditionId;
  baseTextStyle: TextStyle;
  audioFocus: boolean;
  audioLoading: boolean;
  mushafTextScale?: number;
  fontSizeMode?: QuranReaderFontSizeMode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  hostStyle?: ViewStyle;
  pressedHostStyle?: ViewStyle;
  disabledHostStyle?: ViewStyle;
  containerStyle?: ViewStyle;
  loadingOverlay?: React.ReactNode;
  /** Pressable/flow root қойма — mushaf stack ribbon ішінде */
  bareText?: boolean;
};

/**
 * Сүре scroll аят — viewport engine (Quran.com/Sajda):
 * FONT_CONFIG matrix, flexShrink 1, overflow visible, Android glyph-safe padding.
 */
export function QuranReaderAyahArabic({
  plainText,
  taggedText,
  showTajweedColors,
  isDark,
  arabicScriptEdition,
  baseTextStyle,
  audioFocus,
  audioLoading,
  mushafTextScale = 1,
  fontSizeMode,
  onPress,
  onLongPress,
  disabled,
  accessibilityLabel,
  hostStyle,
  pressedHostStyle,
  disabledHostStyle,
  containerStyle,
  loadingOverlay,
  bareText = false,
}: Props) {
  const turkishPrint = arabicScriptEdition === "turkish";
  const turkishFontsReady = useTurkishPrintFontsReady(arabicScriptEdition);
  const viewport = useQuranReaderTypography({
    fontSizeMode,
    mushafTextScale,
    turkishPrint,
  });

  const metrics = useMemo(() => {
    const editionStyle = resolveEditionArabicTextStyle(baseTextStyle, arabicScriptEdition, {
      fontsReady: turkishFontsReady,
    });
    const layoutStyle = quranReaderAyahTextLayoutStyle(editionStyle);
    return buildQuranArabicFlowMetrics({
      contentWidth: viewport.contentWidth,
      baseFontSize: viewport.fontSize,
      baseLineHeight: viewport.lineHeight,
      baseTextStyle: {
        ...layoutStyle,
        fontSize: viewport.fontSize,
        lineHeight: viewport.lineHeight,
      },
      ayahScrollStyle: true,
      readerEngine: true,
      parentHandlesHorizontalInset: true,
      turkishMedinaParity: turkishPrint,
    });
  }, [viewport, baseTextStyle, arabicScriptEdition, turkishFontsReady, turkishPrint]);

  const renderedStyle = useMemo(
    () =>
      quranArabicAyahStyleForEdition(metrics.baseTextStyle, arabicScriptEdition, {
        fontsReady: turkishFontsReady,
      }),
    [metrics.baseTextStyle, arabicScriptEdition, turkishFontsReady]
  );

  const textNode = (
    <AyahArabicKaraokeText
      plainText={plainText}
      taggedText={taggedText}
      showTajweedColors={showTajweedColors}
      isDark={isDark}
      baseStyle={renderedStyle}
      nestedInText={false}
      audioFocus={audioFocus}
      audioLoading={audioLoading}
    />
  );

  if (bareText) {
    return textNode;
  }

  return (
    <QuranArabicFlowRoot metrics={metrics}>
      <View style={[quranSurahArabicWrapStyle(), quranReaderAyahContainerStyle(), containerStyle]}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          disabled={disabled}
          style={({ pressed }) => [
            quranReaderAyahHostStyle(),
            hostStyle,
            pressed && !disabled && pressedHostStyle,
            disabled && disabledHostStyle,
          ]}
          accessibilityRole={onPress ? "button" : undefined}
          accessibilityState={{ busy: audioLoading }}
          accessibilityLabel={accessibilityLabel}
        >
          {textNode}
          {loadingOverlay}
        </Pressable>
      </View>
    </QuranArabicFlowRoot>
  );
}
