import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import {
  getScrapedHadithMuftyatBundle,
  searchScrapedHadithMuftyat,
  scrapedHadithSourceLabel,
  type ScrapedHadithMuftyatItem,
} from "../content/scrapedHadithMuftyat";
import { HadithCrossLinkBar } from "../components/hadith/HadithCrossLinkBar";

type Props = NativeStackScreenProps<MoreStackParamList, "ScrapedHadithMuftyatList">;

export function ScrapedHadithMuftyatListScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const bundle = useMemo(() => getScrapedHadithMuftyatBundle(), []);
  const [query, setQuery] = useState("");
  const items = useMemo(
    () => searchScrapedHadithMuftyat(query, bundle.itemCount),
    [bundle.itemCount, query]
  );

  const renderItem = ({ item }: { item: ScrapedHadithMuftyatItem }) => {
    const preview = item.text.replace(/\s+/g, " ").trim().slice(0, 140);
    return (
      <Pressable
        onPress={() => navigation.navigate("ScrapedHadithMuftyatDetail", { id: item.id })}
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        <Text style={styles.rowBadge}>{kk.hadith.muftyatExcerpts.articleExcerptBadge}</Text>
        <Text style={styles.rowSite}>{scrapedHadithSourceLabel(item.sourceSite)}</Text>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.rowPreview} numberOfLines={3}>
          {preview}
          {item.text.length > 140 ? "…" : ""}
        </Text>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} style={styles.chevron} />
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.crossLinkWrap}>
        <HadithCrossLinkBar navigation={navigation} active="kmdmb" />
      </View>
      <Text style={styles.lead}>{kk.hadith.muftyatExcerpts.lead}</Text>
      <Text style={styles.meta}>
        {bundle.countsBySite
          ? kk.hadith.muftyatExcerpts.countBySite(
              bundle.countsBySite.muftyat ?? 0,
              bundle.countsBySite.fatua ?? 0
            )
          : kk.hadith.muftyatExcerpts.count(bundle.itemCount)}{" "}
        · {bundle.sourceOrg}
      </Text>
      <Text style={styles.disclaimer}>{kk.hadith.muftyatExcerpts.disclaimer}</Text>
      <TextInput
        style={styles.search}
        placeholder={kk.hadith.muftyatExcerpts.searchPlaceholder}
        placeholderTextColor={colors.muted}
        value={query}
        onChangeText={setQuery}
        accessibilityLabel={kk.hadith.muftyatExcerpts.searchPlaceholder}
      />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>{kk.hadith.muftyatExcerpts.empty}</Text>
        }
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    crossLinkWrap: { paddingHorizontal: 16 },
    lead: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.muted,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    meta: {
      fontSize: 12,
      color: colors.muted,
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 8,
    },
    disclaimer: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.muted,
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    search: {
      marginHorizontal: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.card,
    },
    list: { paddingHorizontal: 16, paddingBottom: 24 },
    row: {
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 10,
      paddingRight: 36,
    },
    rowTitle: { fontSize: 15, fontWeight: "800", color: colors.text, marginBottom: 6 },
    rowBadge: {
      alignSelf: "flex-start",
      fontSize: 10,
      fontWeight: "800",
      color: colors.muted,
      textTransform: "uppercase",
      letterSpacing: 0.3,
      marginBottom: 4,
    },
    rowSite: { fontSize: 11, fontWeight: "700", color: colors.muted, marginBottom: 4 },
    rowPreview: { fontSize: 13, lineHeight: 19, color: colors.muted },
    chevron: { position: "absolute", right: 10, top: 18 },
    empty: { textAlign: "center", color: colors.muted, marginTop: 24, fontSize: 14 },
  });
}
