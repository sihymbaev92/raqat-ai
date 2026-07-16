import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { surahDisplayTitle } from "../../constants/surahTitleKk";
import { kk } from "../../i18n/kk";
import type { MushafBookPageStyles } from "../../quran/mushafBookPageStyles";

type Props = {
  primarySurah: number;
  primaryAyah: number;
  mushafPageNumber: number;
  styles: MushafBookPageStyles;
};

/** Хатым жоғарғы жол: сол — қазақша сүре аты, оң — бет нөмірі. */
export function MushafBookPageChrome({
  primarySurah,
  mushafPageNumber,
  styles: st,
}: Props) {
  const surahLine = useMemo(
    () => surahDisplayTitle(primarySurah, ""),
    [primarySurah]
  );
  const pageLine = useMemo(
    () => kk.quran.mushafChromePage(mushafPageNumber),
    [mushafPageNumber]
  );
  const pageA11y = useMemo(
    () => kk.quran.mushafChromePage(mushafPageNumber),
    [mushafPageNumber]
  );

  return (
    <View
      style={{ alignSelf: "stretch", width: "100%" }}
      accessibilityLabel={pageA11y}
      accessible
    >
      <View style={st.pageChromeRow}>
        <Text style={st.pageChromeSurah} numberOfLines={1}>
          {surahLine}
        </Text>
        <Text style={st.pageChromePart} numberOfLines={1}>
          {pageLine}
        </Text>
      </View>
    </View>
  );
}
