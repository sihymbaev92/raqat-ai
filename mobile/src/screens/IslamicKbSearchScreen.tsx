import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Linking,
  type ListRenderItem,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { getRaqatApiBase, hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { getValidAccessToken } from "../storage/authTokens";
import {
  fetchPlatformIslamicKbSearch,
  type PlatformIslamicKbArticle,
} from "../services/platformApiClient";

export function IslamicKbSearchScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlatformIslamicKbArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (q: string) => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      setError(null);
      return;
    }
    await hydrateRaqatApiBaseOverride();
    const base = getRaqatApiBase();
    if (!base) {
      setError(kk.aiChat.kbDisabledNoApi);
      setResults([]);
      setSearched(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const bearer = ((await getValidAccessToken()) ?? "").trim();
      const res = await fetchPlatformIslamicKbSearch(base, term, {
        authorizationBearer: bearer || undefined,
        aiSecret: getRaqatContentReadSecret(),
        limit: 12,
      });
      setSearched(true);
      if (!res.ok) {
        setError(res.error || kk.aiChat.kbSearchError);
        setResults([]);
        return;
      }
      setResults(res.results ?? []);
    } catch {
      setError(kk.aiChat.kbSearchError);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderItem: ListRenderItem<PlatformIslamicKbArticle> = useCallback(
    ({ item }) => (
      <View style={styles.card}>
        <Text style={styles.sourceChip}>{item.source_label || item.site}</Text>
        <Text style={styles.cardTitle} accessibilityRole="header">
          {item.title}
        </Text>
        {item.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={5}>
            {item.excerpt}
          </Text>
        ) : null}
        <Text style={styles.attribution}>{kk.aiChat.kbSearchAttribution}</Text>
        {item.url ? (
          <Pressable
            style={({ pressed }) => [styles.readBtn, pressed && { opacity: 0.9 }]}
            onPress={() => void Linking.openURL(item.url)}
            accessibilityRole="link"
            accessibilityLabel={kk.aiChat.kbSearchReadFullA11y(item.title)}
          >
            <MaterialIcons name="open-in-new" size={16} color={colors.accent} />
            <Text style={styles.readBtnTxt}>{kk.aiChat.kbSearchReadFull}</Text>
          </Pressable>
        ) : null}
      </View>
    ),
    [colors.accent, styles]
  );

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>{kk.aiChat.kbSearchHint}</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder={kk.aiChat.kbSearchPlaceholder}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => void runSearch(query)}
          accessibilityLabel={kk.aiChat.kbSearchPlaceholder}
        />
        <Pressable
          style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.88 }]}
          onPress={() => void runSearch(query)}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={kk.aiChat.kbSearchSubmitA11y}
        >
          {loading ? (
            <RaqatOrnamentSpinner size={20} />
          ) : (
            <MaterialIcons name="search" size={22} color="#fff" />
          )}
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={results}
        keyExtractor={(item) => `${item.document_id}-${item.url}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          searched && !loading ? (
            <Text style={styles.empty}>{kk.aiChat.kbSearchEmpty}</Text>
          ) : null
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
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 12,
      marginBottom: 10,
    },
    sourceChip: {
      alignSelf: "flex-start",
      fontSize: 11,
      fontWeight: "800",
      color: colors.accent,
      marginBottom: 6,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.text,
      lineHeight: 21,
      marginBottom: 6,
    },
    excerpt: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
      marginBottom: 8,
    },
    attribution: {
      fontSize: 11,
      color: colors.muted,
      marginBottom: 8,
    },
    readBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
    },
    readBtnTxt: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.accent,
    },
    empty: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 14,
      marginTop: 24,
      paddingHorizontal: 12,
    },
  });
}
