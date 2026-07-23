import React, { useLayoutEffect, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import type { MoreStackParamList } from "../navigation/types";
import { getAuthorById, getEntryById } from "../content/greatWordsCatalog";
import { useAppLocale } from "../i18n/runtime";

type Props = NativeStackScreenProps<MoreStackParamList, "KazakhGreatWordsEntry">;

export function KazakhGreatWordsEntryScreen({ route, navigation }: Props) {
  useAppLocale();
  const { entryId } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tr, translated } = useKkAutoTranslator();
  const g = kk.features.greatWordsGuide;
  const entry = getEntryById(entryId);
  const author = entry ? getAuthorById(entry.authorId) : undefined;
  const mergedMeta =
    entry?.mergedCount && entry.mergedAuthorNames?.length
      ? `${tr(g.mergedTopicMeta(entry.mergedCount))} · ${entry.mergedAuthorNames.map((n) => tr(n)).join(", ")}`
      : null;

  useLayoutEffect(() => {
    const t = entry?.title?.trim();
    const short = t && t.length > 42 ? `${t.slice(0, 40)}…` : t;
    navigation.setOptions({ title: tr(short ?? g.entryScreenTitle) });
  }, [navigation, entry, g.entryScreenTitle, tr]);

  if (!entry) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{tr(g.entryNotFound)}</Text>
      </View>
    );
  }

  const authorName = tr(author?.name ?? entry.authorId);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.authorName} selectable accessibilityRole="header">
        {authorName}
      </Text>
      {author?.period ? <Text style={styles.authorPeriod}>{tr(author.period)}</Text> : null}
      <Text style={styles.title} accessibilityRole="header">
        {tr(entry.title)}
      </Text>
      <Text style={styles.meta} selectable>
        {mergedMeta ??
          `${tr(g.attributionPrefix)} ${authorName}${
            entry.karaSozNumber != null ? ` · ${tr(g.karaSozLabel(entry.karaSozNumber))}` : ""
          }`}
      </Text>
      <Text style={styles.body} selectable>
        {tr(entry.body)}
      </Text>
      <GuideAutoTranslateBanner colors={colors} visible={translated} />
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    muted: { color: colors.muted, fontSize: 15 },
    authorName: { fontSize: 15, fontWeight: "900", color: colors.accent, marginBottom: 2 },
    authorPeriod: { fontSize: 12, color: colors.muted, marginBottom: 10, fontWeight: "600" },
    title: { fontSize: 18, fontWeight: "900", color: colors.text, marginBottom: 8, lineHeight: 26 },
    meta: { fontSize: 12, color: colors.muted, marginBottom: 16, fontStyle: "italic" },
    body: { fontSize: 15, lineHeight: 24, color: colors.text, fontWeight: "500" },
  });
}
