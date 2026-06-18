import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  type ListRenderItem,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { kk, FATUA_KZ_LABEL_KK, MUFTYAT_KZ_LABEL_KK } from "../i18n/kk";
import { HalalFilterChipRow, type HalalFilterChip } from "./HalalFilterChipRow";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { getValidAccessToken } from "../storage/authTokens";
import {
  fetchPlatformIslamicKbBrowse,
  fetchPlatformIslamicKbSearch,
  type PlatformIslamicKbArticle,
} from "../services/platformApiClient";

const SEARCH_DEBOUNCE_MS = 420;
const BROWSE_LIMIT = 8;

export type KbSiteFilter = "" | "fatua" | "muftyat";

type Props = {
  colors: ThemeColors;
  apiBase: string | null;
  onAskAboutArticle: (article: PlatformIslamicKbArticle) => void;
};

function siteLabel(site: string): string {
  if (site === "fatua") return FATUA_KZ_LABEL_KK;
  if (site === "muftyat") return MUFTYAT_KZ_LABEL_KK;
  return site;
}

export function RaqatKbShelf({ colors, apiBase, onAskAboutArticle }: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const chips: HalalFilterChip[] = useMemo(
    () => [
      { value: "", label: kk.aiChat.kbChipAll },
      { value: "fatua", label: kk.aiChat.kbChipFatua },
      { value: "muftyat", label: kk.aiChat.kbChipMuftyat },
    ],
    []
  );
  const [expanded, setExpanded] = useState(false);
  const [site, setSite] = useState<KbSiteFilter>("fatua");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PlatformIslamicKbArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (q: string, siteFilter: KbSiteFilter) => {
      if (!apiBase) {
        setError(kk.aiChat.kbDisabledNoApi);
        setItems([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const bearer = ((await getValidAccessToken()) ?? "").trim();
        const common = {
          authorizationBearer: bearer || undefined,
          aiSecret: getRaqatContentReadSecret(),
          timeoutMs: 12_000,
        };
        const term = q.trim();
        const siteParam = siteFilter || undefined;
        const res =
          term.length >= 2
            ? await fetchPlatformIslamicKbSearch(apiBase, term, {
                ...common,
                limit: BROWSE_LIMIT,
                site: siteParam,
              })
            : await fetchPlatformIslamicKbBrowse(apiBase, {
                ...common,
                limit: BROWSE_LIMIT,
                site: siteParam,
              });
        if (!res.ok) {
          setError(kk.aiChat.kbSearchError);
          setItems([]);
          return;
        }
        setItems(res.results ?? []);
      } catch {
        setError(kk.aiChat.kbSearchError);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [apiBase]
  );

  useEffect(() => {
    if (!expanded) return;
    void load("", site);
  }, [apiBase, site, load, expanded]);

  useEffect(() => {
    if (!expanded) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void load(query, site);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, site, load, expanded]);

  const renderItem: ListRenderItem<PlatformIslamicKbArticle> = useCallback(
    ({ item }) => (
      <Pressable
        style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
        onPress={() => onAskAboutArticle(item)}
        accessibilityRole="button"
        accessibilityLabel={kk.aiChat.kbShelfAskA11y(item.title || siteLabel(item.site))}
      >
        <View style={styles.rowMain}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {(item.title || "").trim() || kk.aiChat.kbShelfUntitled}
          </Text>
          <Text style={styles.rowSite} numberOfLines={1}>
            {item.source_label?.trim() || siteLabel(item.site)}
          </Text>
        </View>
        <MaterialIcons name="chat-bubble-outline" size={18} color={colors.accent} />
      </Pressable>
    ),
    [colors.accent, onAskAboutArticle, styles]
  );

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.9 }]}
        onPress={() => setExpanded((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={kk.aiChat.kbShelfToggleA11y(expanded)}
      >
        <MaterialIcons name="menu-book" size={18} color={colors.accent} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {kk.aiChat.kbShelfTitle}
        </Text>
        <MaterialIcons
          name={expanded ? "expand-less" : "expand-more"}
          size={22}
          color={colors.muted}
        />
      </Pressable>

      {expanded ? (
        <>
          <Text style={styles.hint}>{kk.aiChat.kbShelfHint}</Text>
          <HalalFilterChipRow
            chips={chips}
            value={site}
            onChange={(v) => setSite(v as KbSiteFilter)}
            colors={colors}
            accessibilityGroupLabel={kk.aiChat.kbShelfChipsA11y}
          />
          <View style={styles.searchRow}>
            <TextInput
              style={styles.input}
              placeholder={kk.aiChat.kbSearchPlaceholder}
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              accessibilityLabel={kk.aiChat.kbSearchPlaceholder}
            />
            <Pressable
              style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.88 }]}
              onPress={() => void load(query, site)}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={kk.aiChat.kbSearchSubmitA11y}
            >
              {loading ? (
                <RaqatOrnamentSpinner size={18} />
              ) : (
                <MaterialIcons name="search" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FlatList
            data={items}
            keyExtractor={(item) => `kb-${item.document_id}-${item.url}`}
            renderItem={renderItem}
            scrollEnabled={false}
            nestedScrollEnabled
            ListEmptyComponent={
              !loading ? <Text style={styles.empty}>{kk.aiChat.kbSearchEmpty}</Text> : null
            }
          />
        </>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: 2,
      marginBottom: 6,
    },
    headerBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    headerTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: "800",
      color: colors.text,
    },
    hint: {
      fontSize: 11,
      lineHeight: 15,
      color: colors.muted,
      marginTop: 6,
      marginBottom: 6,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 6,
      marginBottom: 4,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
      fontSize: 13,
      color: colors.text,
      backgroundColor: colors.card,
    },
    searchBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    error: { color: colors.error, fontSize: 11, marginBottom: 4 },
    empty: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 12,
      paddingVertical: 8,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 8,
      marginBottom: 4,
      borderRadius: 10,
      backgroundColor: colors.bg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    rowMain: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      lineHeight: 17,
    },
    rowSite: {
      marginTop: 2,
      fontSize: 10,
      fontWeight: "700",
      color: colors.muted,
    },
  });
}
