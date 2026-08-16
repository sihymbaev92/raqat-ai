import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { surahTitleForLocale } from "../../constants/surahTitleKk";
import { useAppLocale } from "../../i18n/runtime";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { useI18n } from "../../i18n/useI18n";
import type { MushafBookPageStyles } from "../../quran/mushafBookPageStyles";

type Props = {
  primarySurah: number;
  primaryAyah: number;
  mushafPageNumber: number;
  styles: MushafBookPageStyles;
  /** Араб блок horizontal padding-імен chrome жиегін туралау (Түрік хатым). */
  horizontalInset?: number;
};

/** Хатым жоғарғы жол: сол — қазақша сүре аты, оң — бет нөмірі. */
export function MushafBookPageChrome({
  primarySurah,
  mushafPageNumber,
  styles: st,
  horizontalInset,
}: Props) {
  const t = useI18n();
  const locale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const surahLine = useMemo(
    () => surahTitleForLocale(primarySurah, locale, { tr }),
    [primarySurah, locale, tr]
  );
  const pageLine = useMemo(
    () => t.quran.mushafChromePage(mushafPageNumber),
    [mushafPageNumber, t]
  );
  const pageA11y = useMemo(
    () => t.quran.mushafChromePage(mushafPageNumber),
    [mushafPageNumber, t]
  );

  return (
    <View
      style={{ alignSelf: "stretch", width: "100%" }}
      accessibilityLabel={pageA11y}
      accessible
    >
      <View
        style={[
          st.pageChromeRow,
          horizontalInset != null
            ? { paddingHorizontal: horizontalInset, marginBottom: 6, paddingTop: 4 }
            : null,
        ]}
      >
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
