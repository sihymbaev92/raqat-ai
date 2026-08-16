/**
 * React Native эквиваленті: Flutter KhatmQuranScreen (ListView + Html/font color + RTL).
 * Хатым/сүре scroll режимінде — әр аят бөлек блок, оңнан солға.
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
import { quranArabicAyahStyleForEdition } from "../../quran/quranTurkishPrintTypography";
import { useI18n } from "../../i18n/useI18n";

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
  const t = useI18n();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.max(280, screenWidth);
  const arabicTextStyle = quranArabicAyahStyleForEdition(mushafAyahTxt, arabicScriptEdition);
  const metrics = useMemo(
    () =>
      buildQuranArabicFlowMetrics({
        contentWidth,
        baseFontSize: typeof arabicTextStyle.fontSize === "number" ? arabicTextStyle.fontSize : 24,
        baseTextStyle: arabicTextStyle,
        ayahScrollStyle: true,
        turkishMedinaParity: arabicScriptEdition === "turkish",
      }),
    [contentWidth, arabicTextStyle, arabicScriptEdition]
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
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
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
                direction: "rtl",
              }}
            >
              <View style={{ width: "100%", alignItems: "flex-end" }}>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    backgroundColor: isDark ? "rgba(255,255,255,0.08)" : CREAM_BORDER,
                  }}
                >
                  <Text style={{ fontSize: 12, color: muted, writingDirection: "ltr" }}>
                    {t.quran.mushafAyahA11y(item.numberInSurah)}
                  </Text>
                </View>
              </View>
              <View style={{ height: 8 }} />
              <Pressable
                onPress={onPressAyah ? () => onPressAyah(item.numberInSurah) : undefined}
                accessibilityRole={onPressAyah ? "button" : undefined}
                style={[
                  quranSurahArabicWrapStyle(),
                  {
                    width: "100%",
                    alignSelf: "stretch",
                    direction: "rtl",
                    alignItems: "stretch",
                  },
                ]}
              >
                <TajweedColoredArabicText
                  taggedText={tagged}
                  plainText={plain}
                  baseStyle={{
                    ...metrics.baseTextStyle,
                    color: ink,
                    width: "100%",
                    textAlign: "right",
                    writingDirection: "rtl",
                  }}
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
