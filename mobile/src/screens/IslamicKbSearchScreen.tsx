import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppLocale } from "../i18n/runtime";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  type ListRenderItem,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { PlatformIslamicKbArticle } from "../services/platformApiClient";
import type { MoreStackParamList } from "../navigation/types";
import { beginLatestRequest } from "../utils/latestRequestGuard";
import { loadKbArticlesFeed } from "../services/kbArticlesFeed";
import { KbArticleCard } from "../components/kb/KbArticleCard";
import { KbContentSourceBanner } from "../components/kb/KbContentSourceBanner";
import { openOfficialSiteInApp } from "../config/officialSiteProxy";
import { InformationalToolBanner } from "../components/InformationalToolBanner";

export function IslamicKbSearchScreen() {
  useAppLocale();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlatformIslamicKbArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedSource, setFeedSource] = useState<"api_search" | "cache" | "seed">("seed");
  const requestSeqRef = useRef(0);

  const runSearch = useCallback(async (q: string) => {
    const { isCurrentRequest } = beginLatestRequest(requestSeqRef);
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await loadKbArticlesFeed({ query: term, site: "" });
      if (!isCurrentRequest()) return;
      setSearched(true);
      setResults(res.items);
      setFeedSource(res.source === "api_browse" || res.source === "live_scrape" ? "cache" : res.source);
      if (res.items.length === 0) {
        setError(res.error === "no_api" ? kk.knowledgePortal.errorNoApi : kk.knowledgePortal.searchEmpty);
      }
    } catch {
      if (!isCurrentRequest()) return;
      setError(kk.knowledgePortal.errorNetwork);
      setResults([]);
      setSearched(true);
    } finally {
      if (isCurrentRequest()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      requestSeqRef.current += 1;
    };
  }, []);

  const renderItem: ListRenderItem<PlatformIslamicKbArticle> = useCallback(
    ({ item }) => (
      <KbArticleCard
        item={item}
        colors={colors}
        onPress={() => navigation.navigate("KbArticleDetail", { article: item })}
        onOpenSite={item.url ? () => openOfficialSiteInApp(item.url, navigation) : undefined}
      />
    ),
    [colors, navigation]
  );

  return (
    <View style={styles.root}>
      <InformationalToolBanner colors={colors} hint={kk.knowledgePortal.searchBoundaryHint} />
      <Text style={styles.hint}>{kk.knowledgePortal.searchHint}</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder={kk.knowledgePortal.searchPlaceholder}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => void runSearch(query)}
          accessibilityLabel={kk.knowledgePortal.searchPlaceholder}
        />
        <Pressable
          style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.88 }]}
          onPress={() => void runSearch(query)}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={kk.knowledgePortal.searchSubmitA11y}
        >
          {loading ? <RaqatOrnamentSpinner size={20} /> : <MaterialIcons name="search" size={22} color="#fff" />}
        </Pressable>
      </View>
      {searched ? <KbContentSourceBanner colors={colors} source={feedSource} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={results}
        keyExtractor={(item) => `${item.document_id}-${item.url}`}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: 24 + Math.max(insets.bottom, 8) }]}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searched && !loading && !error ? <Text style={styles.empty}>{kk.knowledgePortal.searchEmpty}</Text> : null
        }
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 14, paddingTop: 10 },
    hint: { fontSize: 13, lineHeight: 19, color: colors.muted, marginBottom: 10 },
    searchRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.text,
      backgroundColor: colors.card,
    },
    searchBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    error: { color: colors.error, fontSize: 13, marginBottom: 8 },
    listContent: { paddingBottom: 24, gap: 10 },
    empty: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 14,
      marginTop: 24,
      paddingHorizontal: 12,
    },
  });
}
