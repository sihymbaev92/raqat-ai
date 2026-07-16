import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import { TajweedGuideHome } from "../components/TajweedGuideHub";
import { TajweedMuftyatBook } from "../components/TajweedMuftyatBook";
import { TabHomeBackButton, useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { useHardwareBackPress } from "../navigation/useHardwareBackPress";
import type { MoreStackParamList } from "../navigation/types";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";

export function TajweedGuideScreen() {
  useAppLocale();
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
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    }, [exitReader, navigation, readerPage]),
    true
  );

  const onOpenPage = useCallback((page: number) => {
    setReaderPage(page);
  }, []);

  if (readerPage != null) {
    return (
      <View style={[styles.readerRoot, { backgroundColor: colors.bg }]}>
        <View style={styles.readerTopBar}>
          <Pressable
            oyuBackdrop={false}
            onPress={exitReader}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.78 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.common.back}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.readerTitle, { color: colors.text }]} numberOfLines={1}>
            {kk.tajweedGuide.sectionBook} · {readerPage}
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
      <View style={styles.homeTopRow}>
        <TabHomeBackButton navigation={navigation} colors={colors} />
      </View>
      <TajweedGuideHome onOpenPage={onOpenPage} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  homeContent: { paddingBottom: 28 },
  homeTopRow: { paddingHorizontal: 8, paddingTop: 4 },
  readerRoot: { flex: 1 },
  readerTopBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  readerTitle: { flex: 1, fontSize: 16, fontWeight: "800" },
});
