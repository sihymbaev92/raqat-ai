import React, { useMemo } from "react";
import { Text, type TextStyle } from "react-native";
import { TajweedColoredArabicText, inlineTajweedSpanStyle } from "../TajweedColoredArabicText";
import { tajweedColorForRule } from "../../content/tajweedRulesCatalog";
import { useQuranKaraokeDurationMs, useQuranKaraokeWordIndex } from "../../context/quranKaraokeSync";
import { ayahArabicWordBoundaries, splitAyahArabicWords } from "../../utils/quranAyahAudioKaraoke";
import { hasTajweedMarkup } from "../../utils/hasTajweedMarkup";
import { tajweedWordColorSpans, type TajweedRuleKey } from "../../utils/alquranTajweedParse";

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
 * Тәжуид қосулы болса түстер сақталады; караоке тек фон жарығы ретінде қосылады.
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
  const tagged = (taggedText ?? "").trim();
  const tajweedOn = showTajweedColors && hasTajweedMarkup(tagged);

  const currentWordIdx = useMemo(() => {
    if (!wordCount) return 0;
    return Math.min(wordCount - 1, Math.max(0, syncedWordIndex));
  }, [wordCount, syncedWordIndex]);

  const useKaraoke = audioFocus && !audioLoading && wordCount > 0 && syncedDurationMs > 0;

  if (!useKaraoke) {
    if (tajweedOn) {
      return (
        <TajweedColoredArabicText
          taggedText={tagged}
          plainText={plainText}
          baseStyle={baseStyle}
          isDark={isDark}
          nestedInText={nestedInText}
        />
      );
    }
    if (nestedInText) return plainText;
    return <Text style={baseStyle}>{plainText}</Text>;
  }

  const readBg = isDark ? "rgba(52, 211, 153, 0.22)" : "rgba(16, 185, 129, 0.2)";
  const currentBg = isDark ? "rgba(52, 211, 153, 0.42)" : "rgba(5, 150, 105, 0.28)";
  const upcomingOpacity = isDark ? 0.78 : 0.88;
  const readOpacity = isDark ? 0.72 : 0.78;

  if (tajweedOn) {
    const spans = tajweedWordColorSpans(tagged, trimmed);
    const words: Array<{ text: string; rule?: TajweedRuleKey }> = spans.length
      ? spans
      : splitAyahArabicWords(trimmed).map((text) => ({ text }));
    const nodes = words.map((span, idx) => {
      const color =
        span.rule != null ? tajweedColorForRule(span.rule as TajweedRuleKey, isDark) : undefined;
      const isCurrent = idx === currentWordIdx;
      const isRead = idx < currentWordIdx;
      return (
        <Text
          key={`kw-${idx}-${span.rule ?? "p"}`}
          style={[
            inlineTajweedSpanStyle(baseStyle, color, { compact: true }),
            {
              backgroundColor: isCurrent ? currentBg : isRead ? readBg : undefined,
              borderRadius: isCurrent ? 3 : 2,
              opacity: isCurrent ? 1 : isRead ? readOpacity : upcomingOpacity,
            },
          ]}
        >
          {span.text}
          {idx < words.length - 1 ? " " : ""}
        </Text>
      );
    });
    if (nestedInText) return nodes;
    return <Text style={baseStyle}>{nodes}</Text>;
  }

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
