import React, { useLayoutEffect, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { GuideAutoTranslateBanner } from "../components/GuideAutoTranslateBanner";
import type { MoreStackParamList } from "../navigation/types";
import { getAuthorById, getDisplayEntriesByAuthorId, type GreatWordsEntry } from "../content/greatWordsCatalog";

type Props = NativeStackScreenProps<MoreStackParamList, "KazakhGreatWordsAuthor">;

export function KazakhGreatWordsAuthorScreen({ route, navigation }: Props) {
  const { authorId } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { tr, translated } = useKkAutoTranslator();
  const g = kk.features.greatWordsGuide;
  const author = getAuthorById(authorId);
  const entries = useMemo(() => getDisplayEntriesByAuthorId(authorId), [authorId]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: author?.name ?? g.authorWorksTitle });
  }, [navigation, author?.name, g.authorWorksTitle]);

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
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
    muted: { color: colors.muted, fontSize: 15 },
    header: {
      padding: 16,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    name: { fontSize: 20, fontWeight: "900", color: colors.text },
    period: { fontSize: 12, color: colors.accent, fontWeight: "800", marginTop: 4 },
    bio: { fontSize: 13, lineHeight: 20, color: colors.muted, marginTop: 10 },
    count: { fontSize: 12, fontWeight: "700", color: colors.text, marginTop: 10 },
    listPad: { padding: 16, paddingBottom: 40 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginBottom: 8,
      gap: 8,
    },
    rowTitle: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.text },
    rowSub: { fontSize: 11, fontWeight: "800", color: colors.accent },
    rowChev: { fontSize: 20, color: colors.muted, fontWeight: "200" },
  });
}
