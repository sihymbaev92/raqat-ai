/**
 * React Native эквиваленті: Flutter KhatmQuranScreen (ListView + Html/font color + RTL).
 * Хатым/сүре scroll режимінде — әр аят бөлек блок, responsive wrap.
 */
import React, { useMemo } from "react";
import { FlatList, Text, View, useWindowDimensions, type TextStyle } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { TajweedColoredArabicText } from "../TajweedColoredArabicText";
import {
  buildQuranArabicFlowMetrics,
  QuranArabicFlowRoot,
} from "./QuranArabicAyahFlow";
import { displayCachedAyahArabic, type CachedAyah } from "../../storage/quranSurahCache";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import { quranSurahArabicWrapStyle } from "../../quran/quranResponsiveLayout";

const CREAM_BG = "#FDFBF7";
const CREAM_BORDER = "#EFEBE9";
const INK = "#3E2723";
const MUTED = "#5D4037";

type Props = {
  ayahs: CachedAyah[];
  arabicScriptEdition: QuranArabicScriptEditionId;
  showTajweedColors: boolean;
  isDark: boolean;
  mushafAyahTxt: TextStyle;
  onPressAyah?: (ayahInSurah: number) => void;
  ListHeaderComponent?: React.ReactElement | null;
};

export function KhatmTajweedAyahScroll({
  ayahs,
  arabicScriptEdition,
  showTajweedColors,
  isDark,
  mushafAyahTxt,
  onPressAyah,
  ListHeaderComponent,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const metrics = useMemo(
    () =>
      buildQuranArabicFlowMetrics({
        contentWidth: screenWidth,
        baseFontSize: typeof mushafAyahTxt.fontSize === "number" ? mushafAyahTxt.fontSize : 24,
        baseTextStyle: mushafAyahTxt,
        ayahScrollStyle: true,
      }),
    [screenWidth, mushafAyahTxt]
  );

  const bg = isDark ? undefined : CREAM_BG;
  const borderColor = isDark ? "rgba(255,255,255,0.12)" : CREAM_BORDER;
  const ink = isDark ? "#F5F2EB" : INK;
  const muted = isDark ? "rgba(245,242,235,0.72)" : MUTED;

  return (
    <FlatList
      data={ayahs}
      keyExtractor={(a) => `khatm-ayah-${a.numberInSurah}`}
      ListHeaderComponent={ListHeaderComponent ?? undefined}
      contentContainerStyle={{
        paddingVertical: 16,
        paddingHorizontal: 0,
        backgroundColor: bg,
      }}
      style={{ flex: 1, backgroundColor: bg }}
      renderItem={({ item }) => {
        const plain = displayCachedAyahArabic(item, arabicScriptEdition);
        const tagged = showTajweedColors ? (item.textTajweed ?? plain) : plain;
        const showBlock =
          showTajweedColors && (item.textTajweed ?? "").trim()
            ? true
            : Boolean(plain);
        if (!showBlock) return null;

        return (
          <QuranArabicFlowRoot metrics={metrics}>
            <View
              style={{
                width: "100%",
                marginBottom: 24,
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
                paddingBottom: 12,
              }}
            >
              <View style={{ alignItems: "flex-end", width: "100%" }}>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : CREAM_BORDER,
                  }}
                >
                  <Text style={{ fontSize: 12, color: muted }}>Аят {item.numberInSurah}</Text>
                </View>
              </View>
              <View style={{ height: 8 }} />
              <Pressable
                oyuBackdrop={false}
                onPress={onPressAyah ? () => onPressAyah(item.numberInSurah) : undefined}
                accessibilityRole={onPressAyah ? "button" : undefined}
                style={quranSurahArabicWrapStyle()}
              >
                <TajweedColoredArabicText
                  taggedText={tagged}
                  plainText={plain}
                  baseStyle={{ ...metrics.baseTextStyle, color: ink }}
                  isDark={isDark}
                  nestedInText={false}
                />
              </Pressable>
            </View>
          </QuranArabicFlowRoot>
        );
      }}
    />
  );
}
