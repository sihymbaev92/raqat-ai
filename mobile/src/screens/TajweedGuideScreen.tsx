import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import { TajweedGuideHome } from "../components/TajweedGuideHub";
import { TajweedMuftyatBook } from "../components/TajweedMuftyatBook";
import { useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { useHardwareBackPress } from "../navigation/useHardwareBackPress";
import type { MoreStackParamList } from "../navigation/types";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";

export function TajweedGuideScreen() {
  useAppLocale();
  const { tr } = useKkAutoTranslator();
  const { colors } = useAppTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [readerPage, setReaderPage] = useState<number | null>(null);
  useTabHomeBackHeader(navigation, colors);

  const exitReader = useCallback(() => setReaderPage(null), []);

  useHardwareBackPress(
    useCallback(() => {
      if (readerPage != null) {
        exitReader();
        return true;
      }
      return false;
    }, [exitReader, readerPage]),
    true
  );

  const onOpenPage = useCallback((page: number) => {
    setReaderPage(page);
  }, []);

  const onOpenColoredList = useCallback(() => {
    navigation.navigate("HatimTajweedList");
  }, [navigation]);

  const onOpenQuran = useCallback(() => {
    void (async () => {
      const { setQuranTajweedColorsEnabled } = await import("../storage/quranReaderPrefs");
      const { navigateToQuranSurah } = await import("../navigation/navigateToMoreStack");
      await setQuranTajweedColorsEnabled(true);
      navigateToQuranSurah(
        {
          surahNumber: 1,
          englishName: "Al-Fatiha",
          arabicName: "الفاتحة",
        },
        navigation
      );
    })();
  }, [navigation]);

  if (readerPage != null) {
    return (
      <View style={[styles.readerRoot, { backgroundColor: colors.bg }]}>
        <View style={styles.readerTopBar}>
          <Text style={[styles.readerTitle, { color: colors.text }]} numberOfLines={1}>
            {tr(kk.tajweedGuide.sectionBook)} · {readerPage}
          </Text>
        </View>
        <TajweedMuftyatBook initialPage={readerPage} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.homeContent}
      keyboardShouldPersistTaps="handled"
    >
      <TajweedGuideHome
        onOpenPage={onOpenPage}
        onOpenQuran={onOpenQuran}
        onOpenColoredList={onOpenColoredList}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  homeContent: { paddingBottom: 28 },
  readerRoot: { flex: 1 },
  readerTopBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  readerTitle: { fontSize: 16, fontWeight: "700" },
});
