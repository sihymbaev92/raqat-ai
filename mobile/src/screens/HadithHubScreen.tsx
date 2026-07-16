import React, { useCallback, useDeferredValue, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, Platform } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useI18n } from "../i18n/useI18n";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import type { MoreStackParamList } from "../navigation/types";
import {
  getKzTrustedHadithItems,
  searchKzTrustedHadiths,
  type KzTrustedHadith,
} from "../content/kzTrustedHadithCatalog";

type Props = NativeStackScreenProps<MoreStackParamList, "HadithHub">;

export function HadithHubScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const t = useI18n();
  const { tr } = useKkAutoTranslator();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const allItems = useMemo(() => getKzTrustedHadithItems(), []);
  const items = useMemo(
    () => (deferredQuery.trim() ? searchKzTrustedHadiths(deferredQuery, 120) : allItems),
    [allItems, deferredQuery]
  );

  const openHadith = useCallback(
    (id: string) => navigation.navigate("HadithDetail", { hadithId: id }),
    [navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: KzTrustedHadith }) => (
      <Pressable
        oyuBackdrop={false}
        onPress={() => openHadith(item.id)}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={`${tr(item.themeKk)}. ${tr(item.sourceCitationKk)}`}
      >
        <View style={styles.rowIcon}>
          <MaterialIcons name="menu-book" size={20} color={colors.accent} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{tr(item.themeKk)}</Text>
          <Text style={styles.rowCite}>{tr(item.sourceCitationKk)}</Text>
          <Text style={styles.rowPreview} numberOfLines={2}>
            {tr(item.textKk)}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
      </Pressable>
    ),
    [colors.accent, colors.muted, openHadith, styles, tr]
  );

  return (
    <FlatList
      style={styles.root}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        { paddingBottom: 28 + Math.max(insets.bottom, 8) },
      ]}
      ListHeaderComponent={
        <View>
          <View style={styles.searchCard}>
            <MaterialIcons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t.hadith.hub.searchPlaceholderExamples}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query ? (
              <Pressable oyuBackdrop={false} onPress={() => setQuery("")} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.listTitle}>
            {`${t.hadith.title} · ${items.length}`}
          </Text>
          <Text style={styles.sectionHint}>
            {t.hadith.hub.listHint}
          </Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{t.hadith.hub.emptySearch}</Text>}
      ListFooterComponent={
        <Pressable
          oyuBackdrop={false}
          onPress={() => navigation.navigate("HadithList")}
          style={({ pressed }) => [styles.corpusBtn, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel={tr(kk.hadith.openHadithList)}
        >
          <MaterialIcons name="library-books" size={20} color={colors.accent} />
          <View style={styles.corpusText}>
            <Text style={styles.corpusTitle}>{tr(kk.hadith.fullCorpusTitle)}</Text>
            <Text style={styles.corpusSub}>{tr(kk.hadith.fullCorpusSub)}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
        </Pressable>
      }
    />
  );
}

function makeStyles(colors: ThemeColors) {
  const pageBg = "#FFFFFF";
  const text = "#111827";
  const muted = "#4B5563";
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: pageBg },
    content: { padding: 16 },
    sectionHint: { color: muted, fontSize: 12, lineHeight: 17, marginBottom: 10 },
    searchCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 10 : 4,
      marginBottom: 12,
      backgroundColor: colors.card,
    },
    searchInput: { flex: 1, color: text, fontSize: 15, fontWeight: "600", paddingVertical: 8 },
    listTitle: { color: text, fontSize: 15, fontWeight: "900", marginBottom: 4 },
    empty: { color: muted, textAlign: "center", marginTop: 20, fontWeight: "700" },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 8,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { color: text, fontSize: 15, fontWeight: "900" },
    rowCite: { color: colors.accent, fontSize: 12, fontWeight: "700", marginTop: 2 },
    rowPreview: { color: muted, fontSize: 12, lineHeight: 17, marginTop: 4, fontWeight: "600" },
    corpusBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    corpusText: { flex: 1, minWidth: 0 },
    corpusTitle: { color: text, fontSize: 14, fontWeight: "900" },
    corpusSub: { color: muted, fontSize: 12, lineHeight: 16, marginTop: 2, fontWeight: "600" },
  });
}
