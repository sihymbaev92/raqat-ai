import React, { useMemo } from "react";
import { Text, type TextStyle } from "react-native";
import { TajweedColoredArabicText } from "../TajweedColoredArabicText";
import { useQuranKaraokeDurationMs, useQuranKaraokeWordIndex } from "../../context/quranKaraokeSync";
import { ayahArabicWordBoundaries, splitAyahArabicWords } from "../../utils/quranAyahAudioKaraoke";

type Props = {
  plainText: string;
  taggedText: string | null | undefined;
  showTajweedColors: boolean;
  isDark: boolean;
  baseStyle: TextStyle;
  /** Ата-ана `<Text>` ішінде — тәжуид үшін қосарланған Text қабығын қоймау. */
  nestedInText?: boolean;
  /** Осы аят үшін дыбыс жүктелген (ойнап тұрған немесе тынытылған) */
  audioFocus: boolean;
  /** Жүктелу — караоке режимін көрсетпейміз */
  audioLoading: boolean;
};

/**
 * Ойнату кезінде араб сөздерін кезекпен жарықтандыру — әріп-әріп емес, толық сөз.
 * UI: 3 Text сегменті (оқылған | қазіргі сөз | қалған).
 */
export const AyahArabicKaraokeText = React.memo(function AyahArabicKaraokeText({
  plainText,
  taggedText,
  showTajweedColors,
  isDark,
  baseStyle,
  nestedInText = false,
  audioFocus,
  audioLoading,
}: Props) {
  const syncedWordIndex = useQuranKaraokeWordIndex(audioFocus);
  const syncedDurationMs = useQuranKaraokeDurationMs(audioFocus);
  const trimmed = useMemo(() => plainText.trim(), [plainText]);
  const wordBounds = useMemo(() => ayahArabicWordBoundaries(trimmed), [trimmed]);
  const wordCount = wordBounds.length || splitAyahArabicWords(trimmed).length;

  const currentWordIdx = useMemo(() => {
    if (!wordCount) return 0;
    return Math.min(wordCount - 1, Math.max(0, syncedWordIndex));
  }, [wordCount, syncedWordIndex]);

  const useKaraoke = audioFocus && !audioLoading && wordCount > 0 && syncedDurationMs > 0;

  if (!useKaraoke) {
    if (showTajweedColors && (taggedText ?? "").includes("[")) {
      return (
        <TajweedColoredArabicText
          taggedText={taggedText!}
          plainText={plainText}
          baseStyle={baseStyle}
          isDark={isDark}
          nestedInText={nestedInText}
        />
      );
    }
    return <Text style={baseStyle}>{plainText}</Text>;
  }

  const readBg = isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(16, 185, 129, 0.2)";
  const currentBg = isDark ? "rgba(52, 211, 153, 0.42)" : "rgba(5, 150, 105, 0.28)";
  const upcomingOpacity = isDark ? 0.78 : 0.88;
  const readOpacity = isDark ? 0.72 : 0.78;

  const currentBound = wordBounds[currentWordIdx];
  const readText = currentBound ? trimmed.slice(0, currentBound.start) : "";
  const currentText = currentBound?.word ?? "";
  const restText = currentBound ? trimmed.slice(currentBound.end) : "";

  return (
    <Text style={baseStyle}>
      {readText ? (
        <Text style={[baseStyle, { backgroundColor: readBg, borderRadius: 2, opacity: readOpacity }]}>
          {readText}
        </Text>
      ) : null}
      {currentText ? (
        <Text style={[baseStyle, { backgroundColor: currentBg, borderRadius: 3, opacity: 1 }]}>
          {currentText}
        </Text>
      ) : null}
      {restText ? <Text style={[baseStyle, { opacity: upcomingOpacity }]}>{restText}</Text> : null}
    </Text>
  );
});
