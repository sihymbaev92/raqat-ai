import React, { memo, useEffect, useMemo } from "react";
import { View, Text, useWindowDimensions, type TextStyle, type ViewStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { AyahArabicKaraokeText } from "./AyahArabicKaraokeText";
import { buildQuranArabicFlowMetrics, QuranArabicFlowRoot } from "./QuranArabicAyahFlow";
import { quranSurahArabicWrapStyle } from "../../quran/quranResponsiveLayout";
import { kk } from "../../i18n/kk";
import { useAppLocale, type AppLocale } from "../../i18n/runtime";
import { getQuranTranslitOverride } from "../../content/quranTranslitOverrides";
import { resolveQuranTranslitForDisplay } from "../../utils/quranTranslitDisplay";
import {
  displayCachedAyahArabic,
  quranAyahMeaningForLocale,
  type CachedAyah,
} from "../../storage/quranSurahCache";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";

export type QuranSurahAyahListRowStyles = {
  ayahRow: ViewStyle;
  ayahRowAudioFocus: ViewStyle;
  ayahIndexInline: TextStyle;
  ayahMainTap: ViewStyle;
  ayahCol: ViewStyle;
  ayahArBlock: ViewStyle;
  ayahArabicTap: ViewStyle;
  ayahArabicTapPressed: ViewStyle;
  ayahArabicTapDisabled: ViewStyle;
  ayahArabicLoadingOverlay: ViewStyle;
  ayahTxt: TextStyle;
  ayahBelowArabic: ViewStyle;
  ayahSectionCaption: TextStyle;
  ayahKiril: TextStyle;
  ayahKk: TextStyle;
  noKkHint: TextStyle;
  ayahInlineAudioControl: ViewStyle;
  ayahInlineAudioText: TextStyle;
};

type Props = {
  item: CachedAyah;
  surahNumber: number;
  styles: QuranSurahAyahListRowStyles;
  isDark: boolean;
  accentColor: string;
  showReaderArabic: boolean;
  showReaderTranslit: boolean;
  showReaderMeaning: boolean;
  showTajweedForDisplay: boolean;
  arabicScriptEdition: QuranArabicScriptEditionId;
  locale: AppLocale;
  playingAyahInSurah: number | null;
  loadingAyahAudio: number | null;
  ayahAudioIsPlaying: boolean;
  onPlay: (ayahN: number) => void;
  onLongPress: (item: CachedAyah) => void;
};

function QuranSurahAyahListRowInner({
  item,
  surahNumber,
  styles,
  isDark,
  accentColor,
  showReaderArabic,
  showReaderTranslit,
  showReaderMeaning,
  showTajweedForDisplay,
  arabicScriptEdition,
  locale,
  playingAyahInSurah,
  loadingAyahAudio,
  ayahAudioIsPlaying,
  onPlay,
  onLongPress,
}: Props) {
  useAppLocale();
  const ayahN = item.numberInSurah;
  const kkLine = quranAyahMeaningForLocale({ ...item, surahNumber }, locale);
  const kirilRead = useMemo(
    () =>
      getQuranTranslitOverride(surahNumber, ayahN) ??
      resolveQuranTranslitForDisplay(item.translit, displayCachedAyahArabic(item, arabicScriptEdition)),
    [surahNumber, ayahN, item.translit, item, arabicScriptEdition]
  );
  const hasLoadedAudio = playingAyahInSurah === ayahN;
  const isPlayingNow = hasLoadedAudio && ayahAudioIsPlaying;
  const isLoad = loadingAyahAudio === ayahN;
  const isAudioFocus = hasLoadedAudio || isLoad;
  const audioA11y = isLoad
    ? kk.quran.ayahPlaySudaisA11y(ayahN)
    : isPlayingNow
      ? kk.quran.ayahPauseSudaisA11y(ayahN)
      : hasLoadedAudio
        ? kk.quran.ayahResumeSudaisA11y(ayahN)
        : kk.quran.ayahPlaySudaisA11y(ayahN);

  const arabicPlain = displayCachedAyahArabic(item, arabicScriptEdition);
  const showArBlock =
    showReaderArabic &&
    (showTajweedForDisplay && (item.textTajweed ?? "").includes("[")
      ? true
      : Boolean(arabicPlain));
  const playPulse = useSharedValue(0);

  useEffect(() => {
    if (isAudioFocus) {
      playPulse.value = withRepeat(
        withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })),
        -1,
        false
      );
    } else {
      cancelAnimation(playPulse);
      playPulse.value = withTiming(0, { duration: 160 });
    }
  }, [isAudioFocus, playPulse]);

  const playHighlightStyle = useAnimatedStyle(() => ({
    borderRadius: 18,
    backgroundColor: interpolateColor(
      playPulse.value,
      [0, 1],
      ["rgba(0,0,0,0)", isDark ? "rgba(255,255,255,0.08)" : "rgba(15,118,110,0.08)"]
    ),
  }));

  const { width: windowWidth } = useWindowDimensions();
  const baseFs = typeof styles.ayahTxt.fontSize === "number" ? styles.ayahTxt.fontSize : 22;
  const listMetrics = useMemo(
    () =>
      buildQuranArabicFlowMetrics({
        contentWidth: Math.max(280, windowWidth - 48),
        baseFontSize: baseFs,
        baseTextStyle: styles.ayahTxt,
        ayahScrollStyle: true,
      }),
    [windowWidth, baseFs, styles.ayahTxt]
  );

  const arabicBody = showArBlock ? (
    <QuranArabicFlowRoot metrics={listMetrics}>
      <View style={quranSurahArabicWrapStyle()}>
        <Pressable
          onPress={() => onPlay(ayahN)}
          onLongPress={() => onLongPress(item)}
          disabled={isLoad}
          style={({ pressed }) => [
            styles.ayahArabicTap,
            pressed && !isLoad && styles.ayahArabicTapPressed,
            isLoad && styles.ayahArabicTapDisabled,
          ]}
          accessibilityRole="button"
          accessibilityState={{ busy: isLoad }}
          accessibilityLabel={audioA11y}
        >
          <AyahArabicKaraokeText
            plainText={arabicPlain}
            taggedText={showTajweedForDisplay ? item.textTajweed : undefined}
            showTajweedColors={showTajweedForDisplay}
            isDark={isDark}
            baseStyle={listMetrics.baseTextStyle}
            nestedInText={false}
            audioFocus={hasLoadedAudio}
            audioLoading={isLoad}
          />
          {isLoad ? (
            <View style={styles.ayahArabicLoadingOverlay} pointerEvents="none">
              <RaqatOrnamentSpinner size={20} />
            </View>
          ) : null}
        </Pressable>
      </View>
    </QuranArabicFlowRoot>
  ) : null;

  return (
    <Animated.View style={playHighlightStyle}>
    <Pressable
      onPress={() => onPlay(ayahN)}
      onLongPress={() => onLongPress(item)}
      style={[styles.ayahRow, isAudioFocus && styles.ayahRowAudioFocus]}
    >
      <Text style={styles.ayahIndexInline}>{`${surahNumber}:${ayahN}`}</Text>
      <View style={styles.ayahMainTap} accessible={false}>
        <View style={styles.ayahCol}>
          {showArBlock ? <View style={styles.ayahArBlock}>{arabicBody}</View> : null}
          <View style={styles.ayahBelowArabic}>
            {showReaderTranslit && kirilRead ? (
              <>
                <Text style={styles.ayahSectionCaption}>{kk.quran.translitCaption}</Text>
                <Text style={styles.ayahKiril}>{kirilRead}</Text>
              </>
            ) : null}
            {showReaderMeaning && kkLine ? (
              <>
                <Text style={styles.ayahSectionCaption}>{kk.quran.meaningKk}</Text>
                <Text style={styles.ayahKk}>{kkLine}</Text>
              </>
            ) : null}
            {isAudioFocus ? (
              <Pressable
                oyuBackdrop={false}
                onPress={() => onPlay(ayahN)}
                disabled={isLoad}
                accessibilityRole="button"
                accessibilityState={{ busy: isLoad }}
                accessibilityLabel={audioA11y}
                style={({ pressed }) => [styles.ayahInlineAudioControl, pressed && { opacity: 0.82 }]}
              >
                {isLoad ? (
                  <RaqatOrnamentSpinner size={16} />
                ) : (
                  <MaterialIcons name={isPlayingNow ? "pause" : "play-arrow"} size={18} color={accentColor} />
                )}
                <Text style={styles.ayahInlineAudioText}>
                  {isLoad
                    ? kk.quran.ayahAudioLoadingAction
                    : isPlayingNow
                      ? kk.quran.ayahAudioPauseAction
                      : kk.quran.ayahAudioResumeAction}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
    </Animated.View>
  );
}

function rowPropsEqual(prev: Props, next: Props): boolean {
  if (prev.item !== next.item) return false;
  if (prev.surahNumber !== next.surahNumber) return false;
  if (prev.isDark !== next.isDark) return false;
  if (prev.accentColor !== next.accentColor) return false;
  if (prev.showReaderArabic !== next.showReaderArabic) return false;
  if (prev.showReaderTranslit !== next.showReaderTranslit) return false;
  if (prev.showReaderMeaning !== next.showReaderMeaning) return false;
  if (prev.showTajweedForDisplay !== next.showTajweedForDisplay) return false;
  if (prev.arabicScriptEdition !== next.arabicScriptEdition) return false;
  const ayahN = prev.item.numberInSurah;
  const wasFocus = prev.playingAyahInSurah === ayahN || prev.loadingAyahAudio === ayahN;
  const isFocus = next.playingAyahInSurah === ayahN || next.loadingAyahAudio === ayahN;
  if (wasFocus || isFocus) {
    if (prev.playingAyahInSurah !== next.playingAyahInSurah) return false;
    if (prev.loadingAyahAudio !== next.loadingAyahAudio) return false;
    if (prev.ayahAudioIsPlaying !== next.ayahAudioIsPlaying) return false;
  }
  return prev.styles === next.styles && prev.onPlay === next.onPlay && prev.onLongPress === next.onLongPress;
}

export const QuranSurahAyahListRow = memo(QuranSurahAyahListRowInner, rowPropsEqual);
