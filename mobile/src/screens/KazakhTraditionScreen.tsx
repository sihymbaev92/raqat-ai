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
import {
  getTraditionTopicByTitle,
  getTraditionTopics,
  traditionHeroImage,
  type TraditionTopic,
} from "../content/traditionTopicsCatalog";
import { getAllTraditionBatas } from "../content/traditionBataCatalog";
import { DinDasturConnectionCard } from "../components/tradition/DinDasturConnectionCard";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { useI18n } from "../i18n/useI18n";

type Nav = NativeStackNavigationProp<MoreStackParamList>;
type Route = RouteProp<MoreStackParamList, "KazakhTradition">;
type FilterKey = TraditionTopicCategory | "all";

/** Негізгі тақырыптар — тізімнің басында. */
const FOUNDATION_IDS = new Set(["dastur-men-din-negiz", "yrymdar-men-din"]);

const FILTER_IDS: FilterKey[] = ["all", "faith", "family", "ceremony", "social"];

function sortTopics(topics: TraditionTopic[]): TraditionTopic[] {
  return [...topics].sort((a, b) => {
    const af = FOUNDATION_IDS.has(a.id) ? 0 : 1;
    const bf = FOUNDATION_IDS.has(b.id) ? 0 : 1;
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
  const bataCount = useMemo(() => getAllTraditionBatas().length, []);
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
    const byCat =
      filter === "all" ? topics : topics.filter((topic) => topic.categories.includes(filter));
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
      const isFoundation = FOUNDATION_IDS.has(topic.id);
      return (
        <Pressable
          oyuBackdrop={false}
          onPress={() => openTopic(topic.id)}
          style={({ pressed }) => [
            styles.topicRow,
            isFoundation && styles.topicRowFoundation,
            pressed && { opacity: 0.92 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={tr(topic.title)}
        >
          <View style={[styles.topicIcon, isFoundation && styles.topicIconFoundation]}>
            <MaterialIcons
              name={topic.id === "yrymdar-men-din" ? "shield" : isFoundation ? "mosque" : "menu-book"}
              size={20}
              color={isFoundation ? palette.buttonGoldText : palette.goldMuted}
            />
          </View>
          <View style={styles.topicText}>
            <Text style={styles.topicTitle}>{tr(topic.title)}</Text>
            <Text style={styles.topicSub} numberOfLines={2}>
              {tr(topic.subtitle)}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={palette.muted} />
        </Pressable>
      );
    },
    [openTopic, palette.buttonGoldText, palette.goldMuted, palette.muted, styles, tr]
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
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: 28 + Math.max(insets.bottom, 8),
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
              <Text style={styles.heroSub}>
                {t.features.traditionGuide.topicsLeadShort}
              </Text>
            </View>
          </View>

          <View style={styles.introCard}>
            <Text style={styles.introTitle}>{t.features.traditionGuide.aboutSectionTitle}</Text>
            <Text style={styles.introBody}>
              {t.features.traditionGuide.aboutSectionBody}
            </Text>
          </View>

          <DinDasturConnectionCard
            palette={palette}
            tr={tr}
            bataCount={bataCount}
            onOpenFoundation={() => openTopic("dastur-men-din-negiz")}
            onOpenBata={() => openTopic("bata-beru")}
          />

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
      height: 168,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 12,
      backgroundColor: p.brown,
    },
    heroImage: { width: "100%", height: "100%" },
    heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(28,18,10,0.46)" },
    heroCopy: { position: "absolute", left: 16, right: 16, bottom: 16 },
    heroTitle: { color: p.headerText, fontSize: 24, fontWeight: "900", letterSpacing: -0.3 },
    heroSub: { color: p.headerSubtext, fontSize: 13, fontWeight: "600", marginTop: 4, lineHeight: 18 },
    introCard: {
      backgroundColor: p.cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    introTitle: { color: p.text, fontSize: 15, fontWeight: "900", marginBottom: 6 },
    introBody: { color: p.muted, fontSize: 13, lineHeight: 19, fontWeight: "600" },
    searchCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: p.cardBg,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 11 : 4,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    searchInput: { flex: 1, color: p.text, fontSize: 15, fontWeight: "600", paddingVertical: 8 },
    filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: p.chipBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    filterChipActive: { backgroundColor: p.chipActiveBg, borderColor: p.goldMuted },
    filterChipText: { color: p.chipText, fontSize: 13, fontWeight: "700" },
    filterChipTextActive: { color: p.chipActiveText },
    listTitle: {
      color: p.text,
      fontSize: 14,
      fontWeight: "900",
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    topicRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: p.cardBg,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    topicRowFoundation: {
      backgroundColor: p.goldSurface,
      borderColor: p.goldMuted,
    },
    topicIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.chipBg,
    },
    topicIconFoundation: { backgroundColor: p.buttonGoldBg },
    topicText: { flex: 1, minWidth: 0, gap: 2 },
    topicTitle: { color: p.text, fontSize: 15, fontWeight: "900" },
    topicSub: { color: p.muted, fontSize: 12, lineHeight: 16, fontWeight: "600" },
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
