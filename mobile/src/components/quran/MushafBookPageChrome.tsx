import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { juzForSurahAyah } from "../../data/quranJuzBoundaries";
import { kk } from "../../i18n/kk";
import type { MushafBookPageStyles } from "../../quran/mushafBookPageStyles";

type Props = {
  primarySurah: number;
  primaryAyah: number;
  mushafPageNumber: number;
  styles: MushafBookPageStyles;
};

/** Хатым жоғарғы жол: сол — джуз, оң — бет (Quran.com референс). */
export function MushafBookPageChrome({
  primarySurah,
  primaryAyah,
  mushafPageNumber,
  styles: st,
}: Props) {
  const juzLine = useMemo(
    () => kk.quran.mushafChromeJuz(juzForSurahAyah(primarySurah, primaryAyah)),
    [primarySurah, primaryAyah]
  );
  const pageLine = useMemo(
    () => kk.quran.mushafChromePage(mushafPageNumber),
    [mushafPageNumber]
  );

  return (
    <View style={{ alignSelf: "stretch", width: "100%" }}>
      <View style={st.pageChromeRow}>
        <Text style={st.pageChromeSurah} numberOfLines={1}>
          {juzLine}
        </Text>
        <Text style={st.pageChromePart} numberOfLines={1}>
          {pageLine}
        </Text>
      </View>
    </View>
  );
}
