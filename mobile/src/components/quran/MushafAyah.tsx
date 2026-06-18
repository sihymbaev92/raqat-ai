import React, { useEffect, useMemo } from "react";
import { View, Text, type TextStyle, type ViewStyle } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
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
import { TajweedColoredArabicText } from "../TajweedColoredArabicText";
import { MushafAyahRow, type MushafAyahRowStyles } from "./MushafAyahRow";
import { mushafArabicLineHeightForAyah } from "../../quran/mushafAyahArabicLineHeight";
import { kk } from "../../i18n/kk";
import type { CachedAyah } from "../../storage/quranSurahCache";
import type { AyahMarkerStyleId } from "../../storage/quranReaderPrefs";

export type MushafAyahSurahStyles = MushafAyahRowStyles & {
  mushafAyahTxt: TextStyle;
  mushafAyahArabicTap: ViewStyle;
  mushafAyahArabicTapPressed: ViewStyle;
  ayahArabicTapDisabled: ViewStyle;
  ayahArabicLoadingOverlay: ViewStyle;
  ayahSectionCaption: TextStyle;
  ayahKiril: TextStyle;
  ayahKk: TextStyle;
  noKkHint: TextStyle;
  /** Кітап мұсаф: транскрипция/мағына — жұмсақ қаріп пен сия */
  mushafAyahSectionCaption: TextStyle;
  mushafAyahKiril: TextStyle;
  mushafAyahKk: TextStyle;
  mushafNoKkHint: TextStyle;
  mushafInlineAudioControl: ViewStyle;
  mushafInlineAudioText: TextStyle;
};

type Props = {
  item: CachedAyah;
  /** Шығыс аят нөмірі (1-based) */
  markerLabel: string;
  showTajweedColors: boolean;
  showReaderArabic: boolean;
  showReaderTranslit: boolean;
  showReaderMeaning: boolean;
  kirilRead: string;
  kkLine: string;
  isDark: boolean;
  accentColor: string;
  playingAyahInSurah: number | null;
  ayahAudioIsPlaying: boolean;
  loadingAyahAudio: number | null;
  resumeHighlightAyah: number | null;
  bookmarkRingColor?: string;
  markerStyleId: AyahMarkerStyleId;
  mushafMarkerStroke: string;
  mushafMarkerFill: string;
  mushafMarkerInk: string;
  styles: MushafAyahSurahStyles;
  onPressArabic: (ayahInSurah: number) => void;
  onLongPressAyah: (item: CachedAyah) => void;
};

/** Мұсаф режиміндегі бір аят: маркер + араб + транскрипция/мағына; басу — ойнату, ұстау — мәзір. */
export function MushafAyah({
  item,
  markerLabel,
  showTajweedColors,
  showReaderArabic,
  showReaderTranslit,
  showReaderMeaning,
  kirilRead,
  kkLine,
  isDark,
  accentColor,
  playingAyahInSurah,
  ayahAudioIsPlaying,
  loadingAyahAudio,
  resumeHighlightAyah,
  bookmarkRingColor,
  markerStyleId,
  mushafMarkerStroke,
  mushafMarkerFill,
  mushafMarkerInk,
  styles: st,
  onPressArabic,
  onLongPressAyah,
}: Props) {
  const ayahN = item.numberInSurah;
  const hasLoadedAudio = playingAyahInSurah === ayahN;
  const isPlayingNow = hasLoadedAudio && ayahAudioIsPlaying;
  const playPulse = useSharedValue(0);

  useEffect(() => {
    if (isPlayingNow) {
      playPulse.value = withRepeat(
        withSequence(withTiming(1, { duration: 880 }), withTiming(0, { duration: 880 })),
        -1,
        true
      );
    } else {
      cancelAnimation(playPulse);
      playPulse.value = 0;
    }
  }, [isPlayingNow, playPulse]);

  const playHighlightStyle = useAnimatedStyle(() => ({
    opacity: 1 - playPulse.value * 0.04,
    backgroundColor: interpolateColor(playPulse.value, [0, 1], ["transparent", `${accentColor}18`]),
    borderRadius: 8,
  }));
  const isLoad = loadingAyahAudio === ayahN;
  const audioA11y = isLoad
    ? kk.quran.ayahPlaySudaisA11y(ayahN)
    : isPlayingNow
      ? kk.quran.ayahPauseSudaisA11y(ayahN)
      : hasLoadedAudio
        ? kk.quran.ayahResumeSudaisA11y(ayahN)
        : kk.quran.ayahPlaySudaisA11y(ayahN);
  const isAudioFocus = hasLoadedAudio || isLoad;
  const showArBlock =
    showReaderArabic &&
    (showTajweedColors && (item.textTajweed ?? "").includes("[") ? true : Boolean(item.text?.trim()));

  const mushafArabTextStyle = useMemo(() => {
    const baseLh = st.mushafAyahTxt.lineHeight;
    if (typeof baseLh === "number") {
      return {
        ...st.mushafAyahTxt,
        lineHeight: mushafArabicLineHeightForAyah(baseLh, item.text ?? ""),
      };
    }
    return st.mushafAyahTxt;
  }, [item.text, st.mushafAyahTxt]);

  const arabicBody =
    showArBlock ? (
      <Pressable
        oyuBackdrop={false}
        onPress={() => onPressArabic(ayahN)}
        onLongPress={() => onLongPressAyah(item)}
        disabled={isLoad}
        style={({ pressed }) => [
          st.mushafAyahArabicTap,
          pressed && !isLoad && st.mushafAyahArabicTapPressed,
          isLoad && st.ayahArabicTapDisabled,
        ]}
        accessibilityRole="button"
        accessibilityState={{ busy: isLoad }}
        accessibilityLabel={audioA11y}
      >
        {showTajweedColors && (item.textTajweed ?? "").includes("[") ? (
          <TajweedColoredArabicText
            taggedText={item.textTajweed!}
            plainText={item.text}
            baseStyle={mushafArabTextStyle}
            isDark={isDark}
          />
        ) : (
          <Text style={mushafArabTextStyle}>{item.text}</Text>
        )}
        {isLoad ? (
          <View style={st.ayahArabicLoadingOverlay} pointerEvents="none">
            <RaqatOrnamentSpinner size={18} />
          </View>
        ) : null}
      </Pressable>
    ) : null;

  return (
    <Animated.View style={playHighlightStyle}>
    <MushafAyahRow
      markerLabel={markerLabel}
      markerStyleId={markerStyleId}
      showResumeHighlight={resumeHighlightAyah === ayahN}
      isAudioFocus={isAudioFocus}
      bookmarkRingColor={bookmarkRingColor}
      mushafMarkerStroke={mushafMarkerStroke}
      mushafMarkerFill={mushafMarkerFill}
      mushafMarkerInk={mushafMarkerInk}
      arabicBody={arabicBody}
      belowArabic={
        <>
          {showReaderTranslit && kirilRead ? (
            <>
              <Text style={st.mushafAyahSectionCaption}>{kk.quran.translitCaption}</Text>
              <Text style={st.mushafAyahKiril}>{kirilRead}</Text>
            </>
          ) : null}
          {showReaderMeaning && kkLine ? (
            <>
              <Text style={st.mushafAyahSectionCaption}>{kk.quran.meaningKk}</Text>
              <Text style={st.mushafAyahKk}>{kkLine}</Text>
            </>
          ) : null}
          {isAudioFocus ? (
            <Pressable
              oyuBackdrop={false}
              onPress={() => onPressArabic(ayahN)}
              disabled={isLoad}
              accessibilityRole="button"
              accessibilityState={{ busy: isLoad }}
              accessibilityLabel={audioA11y}
              style={({ pressed }) => [st.mushafInlineAudioControl, pressed && { opacity: 0.82 }]}
            >
              {isLoad ? (
                <RaqatOrnamentSpinner size={16} />
              ) : (
                <MaterialIcons name={isPlayingNow ? "pause" : "play-arrow"} size={18} color={accentColor} />
              )}
              <Text style={st.mushafInlineAudioText}>
                {isLoad
                  ? kk.quran.ayahAudioLoadingAction
                  : isPlayingNow
                    ? kk.quran.ayahAudioPauseAction
                    : kk.quran.ayahAudioResumeAction}
              </Text>
            </Pressable>
          ) : null}
        </>
      }
      styles={st}
    />
    </Animated.View>
  );
}
