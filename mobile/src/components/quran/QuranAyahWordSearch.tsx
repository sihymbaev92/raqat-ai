import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { getCurrentLocale, useAppLocale } from "../../i18n/runtime";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { getQuranTopics } from "../../content/quranTopicCatalog";
import { surahTitleForLocale } from "../../constants/surahTitleKk";
import {
  prefetchQuranAyahSearch,
  searchQuranAyahs,
  type QuranAyahSearchHit,
} from "../../quran/searchQuranAyahs";
import { searchQuranTopicById } from "../../quran/quranTopicAyahs";
import { beginLatestRequest } from "../../utils/latestRequestGuard";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  surahEnglishNames: Map<number, string>;
  onOpenAyah: (surah: number, ayah: number) => void;
  autoFocus?: boolean;
  listMaxHeight?: number;
};

const SEARCH_DEBOUNCE_MS = 280;
const SEARCH_RESULT_LIMIT = 80;

export function QuranAyahWordSearch({
  colors,
  isDark,
  surahEnglishNames,
  onOpenAyah,
  autoFocus = false,
  listMaxHeight,
}: Props) {
  const locale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const topics = useMemo(() => getQuranTopics(), []);
  const [query, setQuery] = useState("");
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [hits, setHits] = useState<QuranAyahSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const requestSeqRef = useRef(0);
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const activeTopic = useMemo(
    () => topics.find((row) => row.id === activeTopicId) ?? null,
    [activeTopicId, topics]
  );

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      setActiveTopicId(null);
    }
  }, [query]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      const timer = setTimeout(() => {
        const { isCurrentRequest } = beginLatestRequest(requestSeqRef);
        setLoading(true);
        const currentLocale = getCurrentLocale();
        void prefetchQuranAyahSearch(currentLocale)
          .then(() => searchQuranAyahs(trimmed, { limit: SEARCH_RESULT_LIMIT, locale: currentLocale }))
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
    }

    if (activeTopicId) {
      const { isCurrentRequest } = beginLatestRequest(requestSeqRef);
      setLoading(true);
      const currentLocale = getCurrentLocale();
      void prefetchQuranAyahSearch(currentLocale)
        .then(() =>
          searchQuranTopicById(activeTopicId, { limit: SEARCH_RESULT_LIMIT, locale: currentLocale })
        )
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
      return;
    }

    requestSeqRef.current += 1;
    setHits([]);
    setLoading(false);
    setSearched(false);
  }, [activeTopicId, query]);

  const onPickTopic = useCallback((topicId: string) => {
    setQuery("");
    setActiveTopicId(topicId);
  }, []);

  const onPick = useCallback(
    (row: QuranAyahSearchHit) => {
      onOpenAyah(row.surah, row.ayah);
    },
    [onOpenAyah]
  );

  const renderHit = useCallback(
    ({ item }: { item: QuranAyahSearchHit }) => {
      const english = surahEnglishNames.get(item.surah) ?? "";
      const surahTitle = surahTitleForLocale(item.surah, locale, { englishName: english, tr });
      const refLine = kk.quran.ayahWordSearchHitLine(surahTitle, item.ayah);
      return (
        <Pressable
          style={({ pressed }) => [styles.hitRow, pressed && { opacity: 0.92 }]}
          onPress={() => onPick(item)}
          accessibilityRole="button"
          accessibilityLabel={`${refLine}. ${item.meaning}`}
        >
          <Text style={styles.hitRef} numberOfLines={1}>
            {refLine}
          </Text>
          <Text style={styles.hitMeaning} numberOfLines={3}>
            {item.meaning}
          </Text>
        </Pressable>
      );
    },
    [locale, onPick, styles.hitMeaning, styles.hitRef, styles.hitRow, surahEnglishNames, tr]
  );

  const keyExtractor = useCallback((item: QuranAyahSearchHit) => `${item.surah}:${item.ayah}`, []);

  const showTopics = query.trim().length < 2;

  return (
    <View style={styles.wrap}>
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={tr(kk.quran.ayahWordSearchPlaceholder)}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus={autoFocus}
          accessibilityLabel={tr(kk.quran.ayahWordSearchPlaceholder)}
          returnKeyType="search"
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => {
              setQuery("");
              setActiveTopicId(null);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={tr(kk.quran.ayahWordSearchClearA11y)}
          >
            <MaterialIcons name="close" size={18} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {showTopics ? (
        <View style={styles.topicsBlock}>
          <Text style={styles.topicsTitle}>{tr(kk.quran.ayahWordSearchTopicsTitle)}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicsRow}
            keyboardShouldPersistTaps="handled"
          >
            {topics.map((topic) => {
              const active = activeTopicId === topic.id;
              return (
                <Pressable
                  key={topic.id}
                  onPress={() => onPickTopic(topic.id)}
                  style={({ pressed }) => [
                    styles.topicChip,
                    active && styles.topicChipActive,
                    pressed && styles.topicChipPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={tr(kk.quran.ayahWordSearchTopicChipA11y(topic.titleKk))}
                >
                  <Text style={[styles.topicChipText, active && styles.topicChipTextActive]}>
                    {topic.titleKk}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {activeTopic && query.trim().length < 2 ? (
        <Text style={styles.topicActiveLabel}>
          {tr(kk.quran.ayahWordSearchTopicActive(activeTopic.titleKk))}
        </Text>
      ) : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.loadingTxt}>{tr(kk.quran.ayahWordSearchLoading)}</Text>
        </View>
      ) : null}
      {!loading && searched && hits.length === 0 ? (
        <Text style={styles.emptyTxt}>{tr(kk.quran.ayahWordSearchEmpty)}</Text>
      ) : null}
      {hits.length > 0 ? (
        <FlatList
          data={hits}
          keyExtractor={keyExtractor}
          renderItem={renderHit}
          style={[styles.results, listMaxHeight != null ? { maxHeight: listMaxHeight } : null]}
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          initialNumToRender={12}
          maxToRenderPerBatch={16}
          windowSize={7}
          removeClippedSubviews={Platform.OS === "android"}
        />
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    wrap: {
      flexGrow: 1,
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
    topicsBlock: {
      marginTop: 10,
    },
    topicsTitle: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    topicsRow: {
      gap: 8,
      paddingBottom: 2,
    },
    topicChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
    },
    topicChipActive: {
      borderColor: colors.accent,
      backgroundColor: isDark ? "rgba(201, 162, 39, 0.18)" : "rgba(201, 162, 39, 0.12)",
    },
    topicChipPressed: {
      opacity: 0.9,
    },
    topicChipText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "700",
    },
    topicChipTextActive: {
      color: colors.accent,
    },
    topicActiveLabel: {
      marginTop: 8,
      paddingHorizontal: 4,
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
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
    },
    resultsContent: {
      gap: 6,
      paddingBottom: 4,
    },
    hitRow: {
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.card,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 6,
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
