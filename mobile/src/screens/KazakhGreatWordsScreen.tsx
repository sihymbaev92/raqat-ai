import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import type { MoreStackParamList } from "../navigation/types";
import { KAZAKH_GREAT_WORDS_ROOT_LEAD, KAZAKH_GREAT_WORDS_ROOT_TITLE } from "../content/kazakhGreatWordsContent";
import { useAppLocale } from "../i18n/runtime";
import {
  countEntriesForAuthor,
  getAuthorById,
  getGreatWordsAuthors,
  getMergedGreatWordsTopics,
  getGreatWordsStats,
  getReflectiveGreatWordsEntries,
  searchMergedGreatWordsTopics,
  searchGreatWordsEntries,
  type GreatWordsAuthor,
  type GreatWordsEntry,
  type GreatWordsMergedTopic,
} from "../content/greatWordsCatalog";
import { useGreatWordsCatalogReady } from "../content/useGreatWordsCatalogReady";

type Props = NativeStackScreenProps<MoreStackParamList, "KazakhGreatWords">;
type Nav = NativeStackNavigationProp<MoreStackParamList>;

export function KazakhGreatWordsScreen(_props: Props) {
  useAppLocale();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tr, translated } = useKkAutoTranslator();
  const g = kk.features.greatWordsGuide;
  const navigation = useNavigation<Nav>();
  const [q, setQ] = useState("");
  const { ready: catalogReady, loading: catalogLoading, failed: catalogFailed } = useGreatWordsCatalogReady();
  const [catalogTick, setCatalogTick] = useState(0);
  useEffect(() => {
    if (catalogReady) setCatalogTick((n) => n + 1);
  }, [catalogReady]);
  const stats = useMemo(() => getGreatWordsStats(), [catalogTick]);
  const authors = useMemo(
    () => getGreatWordsAuthors().filter((a) => a.id !== "editorial" && a.id !== "sana"),
    [catalogTick]
  );
  const mergedTopics = useMemo(() => getMergedGreatWordsTopics(10), [catalogTick]);
  const reflectiveEntries = useMemo(() => getReflectiveGreatWordsEntries(6), [catalogTick]);

  const searchHits = useMemo(() => {
    const query = q.trim();
    if (!query) return null as GreatWordsEntry[] | null;
    return searchGreatWordsEntries(query).filter((e) => e.authorId !== "sana");
  }, [q]);
  const topicHits = useMemo(() => {
    const query = q.trim();
    if (!query) return null as GreatWordsMergedTopic[] | null;
    return searchMergedGreatWordsTopics(query, 10)
      .map((topic) => ({
        ...topic,
        authorNames: topic.authorNames.filter((n) => n !== "Сананы ашатын сөздер"),
        entries: topic.entries.filter((e) => e.authorId !== "sana"),
      }))
      .filter((topic) => topic.entries.length > 0);
  }, [q]);
  const hubMergedTopics = useMemo(
    () =>
      mergedTopics
        .map((topic) => ({
          ...topic,
          authorNames: topic.authorNames.filter((n) => n !== "Сананы ашатын сөздер"),
          entries: topic.entries.filter((e) => e.authorId !== "sana"),
        }))
        .filter((topic) => topic.entries.length > 0)
        .slice(0, 10),
    [mergedTopics]
  );

  const searching = searchHits != null;
  const searchData = useMemo(() => (searchHits ?? []).slice(0, 80), [searchHits]);

  const renderAuthor = useCallback(
    ({ item }: { item: GreatWordsAuthor }) => {
      const n = countEntriesForAuthor(item.id);
      return (
        <Pressable
          style={({ pressed }) => [styles.authorCard, pressed && { opacity: 0.9 }]}
          onPress={() => navigation.navigate("KazakhGreatWordsAuthor", { authorId: item.id })}
          accessibilityRole="button"
          accessibilityLabel={g.authorCardA11y(tr(item.name), n)}
        >
          <Text style={styles.authorName} numberOfLines={2}>
            {tr(item.name)}
          </Text>
          <Text style={styles.authorPeriod} numberOfLines={1}>
            {tr(item.period)}
          </Text>
          <Text style={styles.authorCount}>{tr(g.worksCount(n))} ›</Text>
        </Pressable>
      );
    },
    [g, navigation, styles, tr]
  );

  const renderSearchHit = useCallback(
    ({ item }: { item: GreatWordsEntry }) => {
      const au = getAuthorById(item.authorId);
      return (
        <Pressable
          style={({ pressed }) => [styles.hitRow, pressed && { opacity: 0.9 }]}
          onPress={() => navigation.navigate("KazakhGreatWordsEntry", { entryId: item.id })}
          accessibilityRole="button"
          accessibilityLabel={`${tr(item.title)}. ${tr(au?.name ?? "")}`}
        >
          <Text style={styles.hitTitle} numberOfLines={2}>
            {tr(item.title)}
          </Text>
          <Text style={styles.hitMeta} numberOfLines={1}>
            {tr(au?.name ?? item.authorId)}
          </Text>
        </Pressable>
      );
    },
    [navigation, styles, tr]
  );

  const listHeader = useMemo(
    () => (
      <View>
        <Text style={styles.rootTitle} accessibilityRole="header">
          {tr(KAZAKH_GREAT_WORDS_ROOT_TITLE)}
        </Text>
        <Text style={styles.lead} selectable>
          {tr(KAZAKH_GREAT_WORDS_ROOT_LEAD)}
        </Text>
        <Text style={styles.statsLine} selectable>
          {tr(g.statsLine(stats.authors, stats.entries))}
        </Text>
        <Text style={styles.topicStatsLine} selectable>
          {tr(g.mergedStatsLine(stats.mergedTopics, stats.reflectiveEntries))}
        </Text>
        <Text style={styles.disclaimer} selectable>
          {tr(g.disclaimer)}
        </Text>
        <Text style={styles.disclaimerSecondary} selectable>
          {tr(g.editorialNote)}
        </Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={tr(g.searchPlaceholder)}
          placeholderTextColor={colors.muted}
          style={styles.search}
          accessibilityLabel={tr(g.searchA11y)}
        />

        {catalogLoading ? (
          <View style={styles.catalogLoading}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.catalogLoadingTxt}>{tr(g.loadingCatalog)}</Text>
          </View>
        ) : null}
        {catalogFailed ? <Text style={styles.catalogFailed}>{tr(g.catalogLoadFailed)}</Text> : null}

        {searching ? (
          <>
            {topicHits && topicHits.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>{tr(g.mergedTopicsTitle)}</Text>
                {topicHits.map((topic) => (
                  <MergedTopicRow
                    key={topic.id}
                    topic={topic}
                    colors={colors}
                    tr={tr}
                    onPress={() => navigation.navigate("KazakhGreatWordsEntry", { entryId: topic.id })}
                  />
                ))}
              </>
            ) : null}
            <Text style={styles.sectionTitle}>{tr(g.searchResultsTitle)}</Text>
            {searchData.length === 0 ? <Text style={styles.empty}>{tr(g.emptySearch)}</Text> : null}
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>{tr(g.authorsSectionTitle)}</Text>
            <Text style={styles.sectionSub}>{tr(g.authorsSectionHint)}</Text>
          </>
        )}
      </View>
    ),
    [
      catalogFailed,
      catalogLoading,
      colors,
      g,
      navigation,
      q,
      searchData.length,
      searching,
      stats.authors,
      stats.entries,
      stats.mergedTopics,
      stats.reflectiveEntries,
      styles,
      topicHits,
      tr,
    ]
  );

  const listFooter = useMemo(() => {
    if (searching) {
      return (
        <View>
          {searchHits && searchHits.length > 80 ? (
            <Text style={styles.moreHint}>{g.searchMoreHint(searchHits.length)}</Text>
          ) : null}
          <GuideAutoTranslateBanner colors={colors} visible={translated} />
        </View>
      );
    }
    return (
      <View>
        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>{tr(g.reflectiveWritingsTitle)}</Text>
        <Text style={styles.sectionSub}>{tr(g.reflectiveWritingsHint)}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reflectiveRow}>
          {reflectiveEntries
            .filter((entry) => entry.authorId !== "sana")
            .map((entry) => {
              const au = getAuthorById(entry.authorId);
              return (
                <Pressable
                  key={entry.id}
                  style={({ pressed }) => [styles.reflectiveCard, pressed && { opacity: 0.9 }]}
                  onPress={() => navigation.navigate("KazakhGreatWordsEntry", { entryId: entry.id })}
                  accessibilityRole="button"
                  accessibilityLabel={`${tr(entry.title)}. ${tr(au?.name ?? "")}`}
                >
                  <Text style={styles.reflectiveMeta} numberOfLines={1}>
                    {tr(au?.name ?? entry.authorId)}
                  </Text>
                  <Text style={styles.reflectiveTitle} numberOfLines={3}>
                    {tr(entry.title)}
                  </Text>
                  <Text style={styles.reflectiveBody} numberOfLines={4}>
                    {tr(entry.body)}
                  </Text>
                </Pressable>
              );
            })}
        </ScrollView>

        <Text style={styles.sectionTitle}>{tr(g.mergedTopicsTitle)}</Text>
        <Text style={styles.sectionSub}>{tr(g.mergedTopicsHint)}</Text>
        {hubMergedTopics.map((topic) => (
          <MergedTopicRow
            key={topic.id}
            topic={topic}
            colors={colors}
            tr={tr}
            onPress={() => navigation.navigate("KazakhGreatWordsEntry", { entryId: topic.id })}
          />
        ))}
        <GuideAutoTranslateBanner colors={colors} visible={translated} />
      </View>
    );
  }, [
    colors,
    g,
    hubMergedTopics,
    navigation,
    reflectiveEntries,
    searchHits,
    searching,
    styles,
    tr,
    translated,
  ]);

  if (searching) {
    return (
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.content}
        data={searchData}
        keyExtractor={(e) => e.id}
        renderItem={renderSearchHit}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        windowSize={7}
        maxToRenderPerBatch={10}
      />
    );
  }

  return (
    <FlatList
      style={styles.root}
      contentContainerStyle={styles.content}
      data={authors}
      keyExtractor={(a) => a.id}
      renderItem={renderAuthor}
      numColumns={2}
      columnWrapperStyle={styles.authorRow}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={8}
      windowSize={7}
      maxToRenderPerBatch={8}
    />
  );
}

function MergedTopicRow({
  topic,
  colors,
  tr,
  onPress,
}: {
  topic: GreatWordsMergedTopic;
  colors: ThemeColors;
  tr: (text: string) => string;
  onPress: () => void;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      style={({ pressed }) => [styles.topicRow, pressed && { opacity: 0.9 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tr(topic.title)}
    >
      <View style={styles.topicRowText}>
        <Text style={styles.topicAuthors} numberOfLines={2}>
          {topic.authorNames.slice(0, 4).map((n) => tr(n)).join(", ")}
          {topic.authorNames.length > 4 ? "…" : ""}
        </Text>
        <Text style={styles.topicTitle} numberOfLines={2}>
          {tr(topic.title)}
        </Text>
        <Text style={styles.topicMeta} numberOfLines={1}>
          {topic.entries.length} {tr(kk.features.greatWordsGuide.topicEntriesSuffix)}
        </Text>
      </View>
      <Text style={styles.rowArrow}>›</Text>
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 36 },
    rootTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 10,
    },
    lead: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.muted,
      marginBottom: 10,
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
    },
    statsLine: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.accent,
      marginBottom: 3,
    },
    topicStatsLine: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.muted,
      marginBottom: 10,
    },
    disclaimer: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.muted,
      marginBottom: 8,
      paddingHorizontal: 11,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    disclaimerSecondary: {
      fontSize: 11,
      lineHeight: 17,
      color: colors.muted,
      marginBottom: 14,
      fontStyle: "italic",
    },
    search: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      marginBottom: 16,
      backgroundColor: colors.card,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 6,
    },
    sectionTitleSpaced: { marginTop: 8 },
    sectionSub: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.muted,
      marginBottom: 12,
    },
    authorRow: { justifyContent: "space-between", gap: 10, marginBottom: 10 },
    topicRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
    },
    topicRowText: { flex: 1, minWidth: 0 },
    topicAuthors: { fontSize: 12, fontWeight: "800", color: colors.accent, marginBottom: 4, lineHeight: 17 },
    topicTitle: { fontSize: 15, fontWeight: "900", color: colors.text },
    topicMeta: { fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 17 },
    rowArrow: { fontSize: 22, color: colors.muted, fontWeight: "200" },
    catalogLoading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
    },
    catalogLoadingTxt: { fontSize: 13, color: colors.muted, fontWeight: "600" },
    catalogFailed: {
      fontSize: 13,
      color: "#B91C1C",
      lineHeight: 18,
      marginBottom: 8,
      fontWeight: "600",
    },
    reflectiveRow: { gap: 10, paddingRight: 4, paddingBottom: 12 },
    reflectiveCard: {
      width: 220,
      minHeight: 176,
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 12,
    },
    reflectiveTitle: { fontSize: 15, lineHeight: 20, fontWeight: "900", color: colors.text, marginTop: 6 },
    reflectiveMeta: { fontSize: 12, color: colors.accent, fontWeight: "800" },
    reflectiveBody: { fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 8 },
    authorCard: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      padding: 12,
    },
    authorName: { fontSize: 15, fontWeight: "900", color: colors.text },
    authorPeriod: { fontSize: 11, color: colors.muted, marginTop: 4 },
    authorCount: { fontSize: 12, fontWeight: "700", color: colors.accent, marginTop: 8 },
    hitRow: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
    },
    hitTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
    hitMeta: { fontSize: 12, color: colors.muted, marginTop: 4 },
    empty: {
      fontSize: 14,
      color: colors.muted,
      textAlign: "center",
      marginTop: 12,
    },
    moreHint: { fontSize: 12, color: colors.muted, marginTop: 8, textAlign: "center" },
  });
}
