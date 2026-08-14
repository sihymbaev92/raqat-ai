import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { FlatList, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RasterImage } from "@/ui/RasterImage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import { getTraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { MoreStackParamList } from "../navigation/types";
import type { TraditionTopicCategory } from "../content/kazakhTraditionTopicStats";
import { isTraditionFoundationTopicId } from "../content/kazakhTraditionTopicStats";
import {
  getTraditionTopicByTitle,
  getTraditionTopics,
  traditionHeroImage,
  type TraditionTopic,
} from "../content/traditionTopicsCatalog";
import { DinDasturConnectionCard } from "../components/tradition/DinDasturConnectionCard";
import { DinMenDasturQuickGuideStrip } from "../components/tradition/DinMenDasturQuickGuideStrip";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { useI18n } from "../i18n/useI18n";
import { warmGreatWordsHub } from "../services/greatWordsWarmup";

type Nav = NativeStackNavigationProp<MoreStackParamList>;
type Route = RouteProp<MoreStackParamList, "KazakhTradition">;
type FilterKey = TraditionTopicCategory | "all";

const FILTER_IDS: FilterKey[] = ["all", "faith", "family", "ceremony", "social"];

function sortTopics(topics: TraditionTopic[]): TraditionTopic[] {
  return [...topics].sort((a, b) => {
    const af = isTraditionFoundationTopicId(a.id) ? 0 : 1;
    const bf = isTraditionFoundationTopicId(b.id) ? 0 : 1;
    if (af !== bf) return af - bf;
    if (a.id === "dastur-men-din-negiz") return -1;
    if (b.id === "dastur-men-din-negiz") return 1;
    if (a.id === "yrymdar-men-din") return -1;
    if (b.id === "yrymdar-men-din") return 1;
    return a.title.localeCompare(b.title, "kk");
  });
}

export function KazakhTraditionScreen() {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { tr, translated } = useKkAutoTranslator();
  const t = useI18n();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const topics = useMemo(() => sortTopics(getTraditionTopics()), []);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filterLabel = useCallback(
    (id: FilterKey) => {
      const g = t.features.traditionGuide;
      switch (id) {
        case "all":
          return g.filterAll;
        case "faith":
          return g.filterFaith;
        case "family":
          return g.filterFamily;
        case "ceremony":
          return g.filterCeremony;
        case "social":
          return g.filterSocial;
        default:
          return g.filterAll;
      }
    },
    [t]
  );

  const filters = useMemo(
    () => FILTER_IDS.map((id) => ({ id, label: filterLabel(id) })),
    [filterLabel]
  );

  useEffect(() => {
    const category = route.params?.scrollToCategory;
    if (!category) return;
    setFilter(category);
    nav.setParams({ scrollToCategory: undefined });
  }, [nav, route.params?.scrollToCategory]);

  useEffect(() => {
    if (!route.params?.showTopics) return;
    setFilter("all");
    nav.setParams({ showTopics: undefined });
  }, [nav, route.params?.showTopics]);

  useFocusEffect(
    useCallback(() => {
      warmGreatWordsHub();
      return undefined;
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const title = route.params?.scrollToBlockTitle;
      if (!title) return undefined;
      const topic = getTraditionTopicByTitle(title);
      nav.setParams({ scrollToBlockTitle: undefined });
      if (topic) nav.navigate("KazakhTraditionTopicDetail", { topicId: topic.id });
      return undefined;
    }, [nav, route.params?.scrollToBlockTitle])
  );

  const queryNorm = deferredQuery.trim().toLocaleLowerCase("kk-KZ");
  const visibleTopics = useMemo(() => {
    /** Негіз бен ырым — жоғарыдағы картада ашылады; тізімде қайталанбайды. */
    const base = topics.filter((topic) => !isTraditionFoundationTopicId(topic.id));
    const byCat =
      filter === "all" ? base : base.filter((topic) => topic.categories.includes(filter));
    if (!queryNorm) return byCat;
    return byCat.filter((topic) => {
      const haystack = [topic.title, topic.subtitle, topic.summary, topic.religionLink]
        .join(" ")
        .toLocaleLowerCase("kk-KZ");
      return haystack.includes(queryNorm);
    });
  }, [filter, queryNorm, topics]);

  const openTopic = useCallback(
    (topicId: string) => nav.navigate("KazakhTraditionTopicDetail", { topicId }),
    [nav]
  );

  const renderTopic = useCallback(
    ({ item: topic }: { item: TraditionTopic }) => {
      return (
        <Pressable
          oyuBackdrop={false}
          onPress={() => openTopic(topic.id)}
          style={({ pressed }) => [styles.topicRow, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
          accessibilityLabel={tr(topic.title)}
        >
          <View style={styles.topicIcon}>
            <MaterialIcons name="menu-book" size={18} color={palette.goldMuted} />
          </View>
          <View style={styles.topicText}>
            <Text style={styles.topicTitle}>{tr(topic.title)}</Text>
            <Text style={styles.topicSub} numberOfLines={1}>
              {tr(topic.subtitle)}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={palette.muted} />
        </Pressable>
      );
    },
    [openTopic, palette.goldMuted, palette.muted, styles, tr]
  );

  return (
    <FlatList
      style={styles.root}
      data={visibleTopics}
      keyExtractor={(topic) => topic.id}
      renderItem={renderTopic}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 8),
          paddingBottom: 24 + Math.max(insets.bottom, 8),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      windowSize={8}
      removeClippedSubviews={Platform.OS === "android"}
      ListHeaderComponent={
        <View>
          <View style={styles.heroCard}>
            <RasterImage source={traditionHeroImage} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroShade} />
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{t.features.traditionTitle}</Text>
              <Text style={styles.heroSub}>{t.features.traditionGuide.topicsLeadShort}</Text>
            </View>
          </View>

          <DinDasturConnectionCard
            palette={palette}
            tr={tr}
            onOpenFoundation={() => openTopic("dastur-men-din-negiz")}
            onOpenYrym={() => openTopic("yrymdar-men-din")}
          />

          <DinMenDasturQuickGuideStrip palette={palette} tr={tr} onOpenTopic={openTopic} />

          <View style={styles.ctaRow}>
            <Pressable
              oyuBackdrop={false}
              onPressIn={() => warmGreatWordsHub()}
              onPress={() => nav.navigate("KazakhGreatWords")}
              style={({ pressed }) => [styles.ctaHalf, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel={t.features.traditionGuide.asylSozCtaA11y}
            >
              <MaterialIcons name="auto-stories" size={20} color={palette.bannerBg} />
              <Text style={styles.ctaHalfTitle} numberOfLines={2}>
                {t.features.traditionGuide.asylSozCtaTitle}
              </Text>
            </Pressable>
            <Pressable
              oyuBackdrop={false}
              onPressIn={() => warmGreatWordsHub()}
              onPress={() => nav.navigate("KazakhGreatWordsAuthor", { authorId: "sana" })}
              style={({ pressed }) => [styles.ctaHalf, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel={t.features.traditionGuide.sanaSozCtaA11y}
            >
              <MaterialIcons name="psychology" size={20} color={palette.bannerBg} />
              <Text style={styles.ctaHalfTitle} numberOfLines={2}>
                {t.features.traditionGuide.sanaSozCtaTitle}
              </Text>
            </Pressable>
          </View>

          <View style={styles.searchCard}>
            <MaterialIcons name="search" size={18} color={palette.goldMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t.features.traditionGuide.searchPlaceholderShort}
              placeholderTextColor={palette.muted}
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query ? (
              <Pressable oyuBackdrop={false} onPress={() => setQuery("")} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={palette.muted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filters}>
            {filters.map((item) => {
              const active = filter === item.id;
              return (
                <Pressable
                  key={item.id}
                  oyuBackdrop={false}
                  onPress={() => setFilter(item.id)}
                  style={({ pressed }) => [
                    styles.filterChip,
                    active && styles.filterChipActive,
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={item.label}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.listTitle}>
            {filter === "all"
              ? t.features.traditionGuide.topicsCount(visibleTopics.length)
              : `${filterLabel(filter)} · ${visibleTopics.length}`}
          </Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{t.features.traditionGuide.nothingFound}</Text>}
      ListFooterComponent={
        translated ? (
          <View style={styles.autoTranslateBanner}>
            <MaterialIcons name="translate" size={15} color={palette.goldMuted} />
            <Text style={styles.autoTranslateBannerText}>{t.common.autoTranslateNotice}</Text>
          </View>
        ) : null
      }
    />
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.screenBg },
    content: { paddingHorizontal: 16 },
    heroCard: {
      height: 112,
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 10,
      backgroundColor: p.brown,
    },
    heroImage: { width: "100%", height: "100%" },
    heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(28,18,10,0.48)" },
    heroCopy: { position: "absolute", left: 14, right: 14, bottom: 12 },
    heroTitle: { color: p.headerText, fontSize: 20, fontWeight: "900", letterSpacing: -0.2 },
    heroSub: { color: p.headerSubtext, fontSize: 12, fontWeight: "600", marginTop: 3, lineHeight: 16 },
    ctaRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
    ctaHalf: {
      flex: 1,
      minHeight: 88,
      backgroundColor: p.cardBg,
      borderRadius: 14,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    ctaHalfTitle: {
      color: p.text,
      fontSize: 11,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: 15,
      minHeight: 30,
      width: "100%",
    },
    searchCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: p.cardBg,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 10 : 2,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    searchInput: { flex: 1, color: p.text, fontSize: 14, fontWeight: "600", paddingVertical: 8 },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
    filterChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: p.chipBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    filterChipActive: { backgroundColor: p.chipActiveBg, borderColor: p.goldMuted },
    filterChipText: { color: p.chipText, fontSize: 12, fontWeight: "700" },
    filterChipTextActive: { color: p.chipActiveText },
    listTitle: {
      color: p.text,
      fontSize: 13,
      fontWeight: "900",
      marginBottom: 6,
      paddingHorizontal: 2,
    },
    topicRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: p.cardBg,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginBottom: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    topicIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.chipBg,
    },
    topicText: { flex: 1, minWidth: 0, gap: 1 },
    topicTitle: { color: p.text, fontSize: 14, fontWeight: "900" },
    topicSub: { color: p.muted, fontSize: 11, lineHeight: 15, fontWeight: "600" },
    empty: { color: p.muted, textAlign: "center", marginTop: 24, fontWeight: "700" },
    autoTranslateBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 12,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: p.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },
    autoTranslateBannerText: { flex: 1, color: p.muted, fontSize: 11, fontWeight: "600" },
  });
}
