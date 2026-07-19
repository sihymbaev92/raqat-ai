import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { useI18n } from "../i18n/useI18n";
import { useAppLocale } from "../i18n/runtime";
import type { MoreStackParamList } from "../navigation/types";
import { findKzTrustedHadith } from "../content/kzTrustedHadithCatalog";
import { hadithCollectionDisplayName } from "../content/hadithDisplay";
import {
  filterHadithCorpusForLocale,
  hadithTextForLocale,
  loadHadithCorpus,
  releaseHadithCorpusMemoryCache,
  type SahihHadithEntry,
} from "../storage/hadithCorpus";

type Props = NativeStackScreenProps<MoreStackParamList, "HadithHub">;

type HubRow = {
  id: string;
  title: string;
  cite: string;
  preview: string;
};

export function HadithHubScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const t = useI18n();
  const locale = useAppLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [rows, setRows] = useState<HubRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const corpus = filterHadithCorpusForLocale(await loadHadithCorpus(), locale);
        if (!alive) return;
        const next: HubRow[] = (corpus?.hadiths ?? []).map((h: SahihHadithEntry) => {
          const trusted = findKzTrustedHadith(h.id);
          const preview = hadithTextForLocale(h, locale);
          const coll = hadithCollectionDisplayName(h, locale);
          const title =
            locale === "kk" && trusted?.themeKk
              ? trusted.themeKk
              : `${coll} · №${h.reference}`;
          const cite =
            locale === "kk" && trusted?.sourceCitationKk
              ? trusted.sourceCitationKk
              : locale === "kk"
                ? h.sourceCitationKk?.trim() || `${coll}, № ${h.reference}`
                : `${coll}, № ${h.reference}`;
          return { id: h.id, title, cite, preview };
        });
        setRows(next);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      releaseHadithCorpusMemoryCache();
    };
  }, [locale]);

  const items = useMemo(() => {
    const q = deferredQuery.trim().toLocaleLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.title.toLocaleLowerCase().includes(q) ||
        r.cite.toLocaleLowerCase().includes(q) ||
        r.preview.toLocaleLowerCase().includes(q)
    );
  }, [rows, deferredQuery]);

  const openHadith = useCallback(
    (id: string) => navigation.navigate("HadithDetail", { hadithId: id }),
    [navigation]
  );

  const emptyMessage =
    !loading && rows.length === 0
      ? t.hadith.hub.emptyLocalePending
      : t.hadith.hub.emptySearch;

  const renderItem = useCallback(
    ({ item }: { item: HubRow }) => (
      <Pressable
        oyuBackdrop={false}
        onPress={() => openHadith(item.id)}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.cite}`}
      >
        <View style={styles.rowIcon}>
          <MaterialIcons name="menu-book" size={20} color={colors.accent} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{item.title}</Text>
          <Text style={styles.rowCite}>{item.cite}</Text>
          <Text style={styles.rowPreview} numberOfLines={2}>
            {item.preview}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
      </Pressable>
    ),
    [colors.accent, colors.muted, openHadith, styles]
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
          <Text style={styles.sectionHint}>{t.hadith.hub.listHint}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
      ListFooterComponent={
        rows.length > 0 ? (
          <Pressable
            oyuBackdrop={false}
            onPress={() => navigation.navigate("HadithList")}
            style={({ pressed }) => [styles.corpusBtn, pressed && { opacity: 0.92 }]}
            accessibilityRole="button"
            accessibilityLabel={t.hadith.openHadithList}
          >
            <MaterialIcons name="library-books" size={20} color={colors.accent} />
            <View style={styles.corpusText}>
              <Text style={styles.corpusTitle}>{t.hadith.fullCorpusTitle}</Text>
              <Text style={styles.corpusSub}>{t.hadith.fullCorpusSub}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        ) : null
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
    content: { paddingHorizontal: 16, paddingTop: 12 },
    searchCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#F3F4F6",
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 14,
    },
    searchInput: { flex: 1, color: text, fontSize: 15, fontWeight: "600", padding: 0 },
    listTitle: { color: text, fontSize: 18, fontWeight: "900", marginBottom: 4 },
    sectionHint: { color: muted, fontSize: 13, lineHeight: 19, marginBottom: 12, fontWeight: "600" },
    empty: { color: muted, textAlign: "center", marginTop: 28, fontWeight: "700", paddingHorizontal: 12 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "#E5E7EB",
    },
    rowIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    rowText: { flex: 1, minWidth: 0 },
    rowTitle: { color: text, fontSize: 15, fontWeight: "800" },
    rowCite: { color: colors.accent, fontSize: 12, fontWeight: "700", marginTop: 2 },
    rowPreview: { color: muted, fontSize: 13, lineHeight: 18, marginTop: 4, fontWeight: "600" },
    corpusBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 18,
      padding: 14,
      borderRadius: 14,
      backgroundColor: "#F9FAFB",
      borderWidth: 1,
      borderColor: "#E5E7EB",
    },
    corpusText: { flex: 1, minWidth: 0 },
    corpusTitle: { color: text, fontSize: 15, fontWeight: "800" },
    corpusSub: { color: muted, fontSize: 12, marginTop: 2, fontWeight: "600" },
  });
}
