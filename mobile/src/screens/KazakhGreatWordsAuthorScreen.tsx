import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import type { MoreStackParamList } from "../navigation/types";
import { getAuthorById, getDisplayEntriesByAuthorId, type GreatWordsEntry } from "../content/greatWordsCatalog";
import { useGreatWordsCatalogReady } from "../content/useGreatWordsCatalogReady";
import { useAppLocale } from "../i18n/runtime";

type Props = NativeStackScreenProps<MoreStackParamList, "KazakhGreatWordsAuthor">;

export function KazakhGreatWordsAuthorScreen({ route, navigation }: Props) {
  useAppLocale();
  const { authorId } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tr, translated } = useKkAutoTranslator();
  const g = kk.features.greatWordsGuide;
  const { ready: catalogReady, loading: catalogLoading } = useGreatWordsCatalogReady();
  const [catalogTick, setCatalogTick] = useState(0);
  useEffect(() => {
    if (catalogReady) setCatalogTick((n) => n + 1);
  }, [catalogReady]);
  const author = useMemo(() => getAuthorById(authorId), [authorId, catalogTick]);
  const entries = useMemo(() => getDisplayEntriesByAuthorId(authorId), [authorId, catalogTick]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: author?.name ?? g.authorWorksTitle });
  }, [navigation, author?.name, g.authorWorksTitle]);

  if (catalogLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.muted}>{tr(g.loadingCatalog)}</Text>
      </View>
    );
  }

  if (!author) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{g.authorNotFound}</Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: GreatWordsEntry }) => (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
      onPress={() => navigation.navigate("KazakhGreatWordsEntry", { entryId: item.id })}
      accessibilityRole="button"
      accessibilityLabel={g.entryRowA11y(item.title)}
    >
      <Text style={styles.rowTitle} numberOfLines={3}>
        {tr(item.title)}
      </Text>
      {item.mergedCount ? (
        <Text style={styles.rowSub} numberOfLines={1}>
          {g.mergedEntryCount(item.mergedCount)}
        </Text>
      ) : null}
      <Text style={styles.rowChev}>›</Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.name}>{author.name}</Text>
        <Text style={styles.period}>{author.period}</Text>
        <Text style={styles.bio} selectable>
          {tr(author.bio)}
        </Text>
        <Text style={styles.count}>{tr(g.worksInBook(entries.length))}</Text>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listPad}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={<GuideAutoTranslateBanner colors={colors} visible={translated} />}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 24 },
    muted: { fontSize: 15, color: colors.muted, textAlign: "center" },
    header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    name: { fontSize: 22, fontWeight: "900", color: colors.text },
    period: { fontSize: 13, color: colors.muted, marginTop: 4 },
    bio: { fontSize: 14, lineHeight: 21, color: colors.text, marginTop: 10 },
    count: { fontSize: 13, fontWeight: "700", color: colors.accent, marginTop: 10 },
    listPad: { paddingHorizontal: 16, paddingBottom: 24 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: colors.text },
    rowSub: { fontSize: 12, color: colors.muted },
    rowChev: { fontSize: 22, color: colors.muted },
  });
}
