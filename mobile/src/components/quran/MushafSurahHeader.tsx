import React from "react";
import { View, Text, type ViewStyle, type TextStyle } from "react-native";
import { KazakhOrnamentBand } from "../KazakhOrnamentBand";
import type { ThemeColors } from "../../theme/colors";
import { QURAN_BASMALA_READER_AR } from "../../constants/quranUthmani";
import { kk } from "../../i18n/kk";

export type MushafSurahHeaderStyles = {
  mushafSurahTitleBlock: ViewStyle;
  mushafSurahTitlePaper: ViewStyle;
  mushafSurahTitleAr: TextStyle;
  bismillahBanner: ViewStyle;
  mushafBismillahBanner: ViewStyle;
  bismillahBannerTxt: TextStyle;
  mushafBismillahBannerTxt: TextStyle;
};

type Props = {
  colors: ThemeColors;
  mushafLayout: boolean;
  surahArabicTitleLine: string | null;
  showMushafBismillahBanner: boolean;
  styles: MushafSurahHeaderStyles;
};

/** Мұсаф сүре басындағы орнамент + араб атау + бисмиллә баннері. */
export function MushafSurahHeader({
  colors,
  mushafLayout,
  surahArabicTitleLine,
  showMushafBismillahBanner,
  styles: s,
}: Props) {
  return (
    <View>
      {mushafLayout && surahArabicTitleLine ? (
        <View style={s.mushafSurahTitleBlock}>
          <KazakhOrnamentBand colors={colors} compact tone="quranGold" bleed={12} />
          <View style={s.mushafSurahTitlePaper}>
            <Text style={s.mushafSurahTitleAr} accessibilityRole="header">
              {surahArabicTitleLine}
            </Text>
          </View>
        </View>
      ) : null}
      {showMushafBismillahBanner ? (
        <View
          style={[s.bismillahBanner, mushafLayout && s.mushafBismillahBanner]}
          accessibilityRole="text"
          accessibilityLabel={kk.quran.readerBismillahBannerA11y}
        >
          <Text style={[s.bismillahBannerTxt, mushafLayout && s.mushafBismillahBannerTxt]}>
            {QURAN_BASMALA_READER_AR}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
