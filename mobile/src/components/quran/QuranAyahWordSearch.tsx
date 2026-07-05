import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { surahDisplayTitle } from "../../constants/surahTitleKk";
import { searchQuranAyahs, type QuranAyahSearchHit } from "../../quran/searchQuranAyahs";
import { beginLatestRequest } from "../../utils/latestRequestGuard";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  surahEnglishNames: Map<number, string>;
  onOpenAyah: (surah: number, ayah: number) => void;
};

const SEARCH_DEBOUNCE_MS = 320;

export function QuranAyahWordSearch({ colors, isDark, surahEnglishNames, onOpenAyah }: Props) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<QuranAyahSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestSeqRef = useRef(0);
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      requestSeqRef.current += 1;
      setHits([]);
      setLoading(false);
      setSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      const { isCurrentRequest } = beginLatestRequest(requestSeqRef);
      setLoading(true);
      void searchQuranAyahs(trimmed, { limit: 40 })
        .then((rows) => {
          if (!isCurrentRequest()) return;
          setHits(rows);
          setSearched(true);
        })
        .catch(() => {
          if (!isCurrentRequest()) return;
          setHits([]);
          setSearched(true);
        })
        .finally(() => {
          if (isCurrentRequest()) setLoading(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  const onPick = useCallback(
    (row: QuranAyahSearchHit) => {
      onOpenAyah(row.surah, row.ayah);
    },
    [onOpenAyah]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={kk.quran.ayahWordSearchPlaceholder}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel={kk.quran.ayahWordSearchPlaceholder}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery("")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={kk.quran.ayahWordSearchClearA11y}
          >
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingTxt}>{kk.quran.ayahWordSearchLoading}</Text>
        </View>
      ) : null}
      {!loading && searched && hits.length === 0 ? (
        <Text style={styles.emptyTxt}>{kk.quran.ayahWordSearchEmpty}</Text>
      ) : null}
      {hits.length > 0 ? (
        <View style={styles.results}>
          {hits.map((row) => {
            const english = surahEnglishNames.get(row.surah) ?? "";
            const surahTitle = surahDisplayTitle(row.surah, english);
            const refLine = kk.quran.ayahWordSearchHitLine(surahTitle, row.ayah);
            return (
              <Pressable
                key={`${row.surah}:${row.ayah}`}
                style={({ pressed }) => [styles.hitRow, pressed && { opacity: 0.92 }]}
                onPress={() => onPick(row)}
                accessibilityRole="button"
                accessibilityLabel={`${refLine}. ${row.meaning}`}
              >
                <Text style={styles.hitRef} numberOfLines={1}>
                  {refLine}
                </Text>
                <Text style={styles.hitMeaning} numberOfLines={3}>
                  {row.meaning}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 10,
    },
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 10 : 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : colors.card,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      fontSize: 15,
      color: colors.text,
      paddingVertical: 0,
    },
    loadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
      paddingHorizontal: 4,
    },
    loadingTxt: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    emptyTxt: {
      marginTop: 8,
      paddingHorizontal: 4,
      color: colors.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    results: {
      marginTop: 8,
      gap: 6,
    },
    hitRow: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    hitRef: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 4,
    },
    hitMeaning: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}
