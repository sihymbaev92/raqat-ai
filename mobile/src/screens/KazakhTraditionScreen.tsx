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
  getTraditionTopicById,
  traditionCategoryLabel,
  traditionHeroImage,
  type TraditionTopic,
} from "../content/traditionTopicsCatalog";
import { TraditionOrnamentDivider } from "../components/tradition/TraditionRedesignCards";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { kk } from "../i18n/kk";
import { traditionTopOrnament } from "../theme/ornamentAssets";

type Nav = NativeStackNavigationProp<MoreStackParamList>;
type Route = RouteProp<MoreStackParamList, "KazakhTradition">;

const FEATURED_TOPIC_IDS = ["bata-beru", "qonaq-kutu", "asar", "tusaukeser", "besikke-salu"];

export function KazakhTraditionScreen() {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const { tr, translated } = useKkAutoTranslator();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const topics = useMemo(() => getTraditionTopics(), []);
  const [activeCategory, setActiveCategory] = useState<TraditionTopicCategory | "all">("all");
  const [showTopicList, setShowTopicList] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const category = route.params?.scrollToCategory;
    if (category) {
      setActiveCategory(category);
      setShowTopicList(false);
      nav.setParams({ scrollToCategory: undefined });
    }
  }, [nav, route.params?.scrollToCategory]);

  useEffect(() => {
    if (!route.params?.showTopics) return;
    setActiveCategory("all");
    setShowTopicList(true);
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

  const featuredTopics = useMemo(
    () => FEATURED_TOPIC_IDS.map((topicId) => getTraditionTopicById(topicId)).filter(Boolean).slice(0, 4),
    []
  );
  const queryNorm = deferredQuery.trim().toLocaleLowerCase("kk-KZ");
  const filteredTopics = useMemo(() => {
    const base =
      activeCategory === "all" || showTopicList
        ? topics
        : topics.filter((topic) => topic.categories.includes(activeCategory));
    if (!queryNorm) return showTopicList || activeCategory !== "all" ? base : [];
    return base.filter((topic) => {
      const haystack = [
        topic.title,
        topic.subtitle,
        topic.summary,
        topic.categories.map((c) => traditionCategoryLabel(c)).join(" "),
      ]
        .join(" ")
        .toLocaleLowerCase("kk-KZ");
      return haystack.includes(queryNorm);
    });
  }, [activeCategory, queryNorm, showTopicList, topics]);

  const openTopic = useCallback((topicId: string) => nav.navigate("KazakhTraditionTopicDetail", { topicId }), [nav]);
  const visibleTopics = filteredTopics;
  const queryActive = showTopicList || activeCategory !== "all" || Boolean(queryNorm);
  const topicListTitle = queryNorm ? "Іздеу нәтижелері" : showTopicList ? "Салт-дәстүрлер" : "Іздеу нәтижелері";
  const activeCategoryLabel =
    showTopicList || activeCategory === "all"
      ? "Барлық салт-дәстүрлер"
      : traditionCategoryLabel(activeCategory);

  const renderAutoTranslateBanner = () =>
    translated ? (
      <View style={styles.autoTranslateBanner}>
        <MaterialIcons name="translate" size={15} color={palette.goldMuted} />
        <Text style={styles.autoTranslateBannerText}>{tr(kk.common.autoTranslateNotice)}</Text>
      </View>
    ) : null;

  const renderTopicResult = useCallback(
    ({ item: topic }: { item: TraditionTopic }) => (
      <Pressable
        oyuBackdrop={false}
        onPress={() => openTopic(topic.id)}
        style={({ pressed }) => [styles.resultRow, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={tr(topic.title)}
      >
        <View style={styles.resultText}>
          <Text style={styles.resultTitle}>{tr(topic.title)}</Text>
          <Text style={styles.resultSub} numberOfLines={2}>{tr(topic.subtitle)}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={palette.muted} />
      </Pressable>
    ),
    [openTopic, palette.muted, styles, tr]
  );

  return (
    <FlatList
      style={styles.root}
      data={queryActive ? visibleTopics : []}
      keyExtractor={(topic) => topic.id}
      renderItem={renderTopicResult}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: 32 + Math.max(insets.bottom, 8),
        },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews={Platform.OS === "android"}
      ListHeaderComponent={
        <View>
          <View style={styles.heroSection}>
            <View style={styles.heroOrnamentTop} pointerEvents="none">
              <RasterImage
                source={traditionTopOrnament}
                style={styles.heroOrnament}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
                accessibilityLabel={tr(kk.features.traditionTitle)}
              />
            </View>
            <View style={styles.heroCard}>
              <View style={styles.heroMedia}>
                <RasterImage source={traditionHeroImage} style={styles.heroImage} resizeMode="cover" />
                <View style={styles.heroOverlay} />
              </View>
            </View>
          </View>

          <View style={styles.elderStartCard}>
            <View style={styles.elderStartHead}>
              <View style={styles.elderStartIcon}>
                <MaterialIcons name="touch-app" size={22} color={palette.goldMuted} />
              </View>
              <View style={styles.elderStartHeadText}>
                <Text style={styles.elderStartEyebrow}>{tr("Үлкендерге ыңғайлы")}</Text>
                <Text style={styles.elderStartTitle}>{tr("Қайдан бастаймын?")}</Text>
              </View>
            </View>
            <Text style={styles.elderStartBody}>
              {tr("Бір негізгі батырма арқылы барлық салт-дәстүр тақырыбын ашыңыз. Қысқа, түсінікті, артық жолсыз.")}
            </Text>
            <Pressable
              oyuBackdrop={false}
              onPress={() => {
                setActiveCategory("all");
                setShowTopicList(true);
              }}
              style={({ pressed }) => [styles.elderPrimaryBtn, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel={tr("Салт-дәстүрді оқу")}
            >
              <View style={styles.elderBtnIcon}>
                <MaterialIcons name="groups" size={22} color={palette.buttonGoldText} />
              </View>
              <View style={styles.elderBtnText}>
                <Text style={styles.elderBtnTitle}>{tr("Салт-дәстүрді оқу")}</Text>
                <Text style={styles.elderBtnSub}>{tr("Бата, қонақ күту, жеті ата, асар")}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={palette.buttonGoldText} />
            </Pressable>
          </View>

          <View style={styles.searchCard}>
            <View style={styles.searchIcon}>
              <MaterialIcons name="search" size={18} color={palette.goldMuted} />
            </View>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={tr("Атын жазып іздеу: бата, жеті ата...")}
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

          {queryActive ? (
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>{tr(activeCategoryLabel)}</Text>
              <Pressable
                oyuBackdrop={false}
                onPress={() => {
                  setActiveCategory("all");
                  setShowTopicList(false);
                  setQuery("");
                }}
                hitSlop={8}
              >
                <MaterialIcons name="close" size={16} color={palette.goldMuted} />
              </Pressable>
            </View>
          ) : null}

          {!queryActive ? (
            <View style={styles.featuredBlock}>
              <Text style={styles.resultsTitle}>{tr("Ең керек тақырыптар")}</Text>
              <View style={styles.featuredGrid}>
                {featuredTopics.map((topic) =>
                  topic ? (
                    <Pressable
                      key={topic.id}
                      oyuBackdrop={false}
                      onPress={() => openTopic(topic.id)}
                      style={({ pressed }) => [styles.featuredTopicCard, pressed && { opacity: 0.92 }]}
                      accessibilityRole="button"
                      accessibilityLabel={tr(topic.title)}
                    >
                      <Text style={styles.featuredTopicTitle} numberOfLines={1}>{tr(topic.title)}</Text>
                      <Text style={styles.featuredTopicSub} numberOfLines={1}>{tr(topic.subtitle)}</Text>
                      <MaterialIcons name="chevron-right" size={18} color={palette.goldMuted} />
                    </Pressable>
                  ) : null
                )}
              </View>
            </View>
          ) : (
            <Text style={styles.resultsTitle}>{tr(topicListTitle)}</Text>
          )}
        </View>
      }
      ListEmptyComponent={queryActive ? <Text style={styles.empty}>{tr("Ештеңе табылмады")}</Text> : null}
      ListFooterComponent={
        <View>
          <TraditionOrnamentDivider palette={palette} />
          <View style={styles.thoughtCard}>
            <View style={styles.thoughtHead}>
              <View style={styles.thoughtLine} />
              <Text style={styles.thoughtTitle}>{tr("Бүгінгі Ой")}</Text>
              <View style={styles.thoughtLine} />
            </View>
            <Text style={styles.thoughtText}>
              {tr("“Мейірімділік - дінің де, дәстүрің де өзегі”")}
            </Text>
            <Text style={styles.thoughtAuthor}>Шәкәрім Құдайбердіұлы</Text>
          </View>
          {renderAutoTranslateBanner()}
        </View>
      }
    />
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.screenBg },
    content: { paddingHorizontal: 18, paddingBottom: 32 },
    heroSection: {
      marginBottom: 14,
      alignItems: "center",
    },
    /** Ою — hero суретінің үстінде емес, карточка үстінде (сурет жабылмайды). */
    heroOrnamentTop: {
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingHorizontal: 12,
      marginBottom: 4,
      zIndex: 2,
      backgroundColor: "transparent",
    },
    heroOrnament: {
      width: "100%",
      maxWidth: 240,
      height: 44,
    },
    heroCard: {
      alignSelf: "stretch",
      borderRadius: 22,
      overflow: "hidden",
      backgroundColor: p.cardBg,
      borderWidth: 1,
      borderColor: p.border,
    },
    heroMedia: {
      height: 200,
      position: "relative",
      overflow: "hidden",
    },
    /** Cover — кадр жоғарыдан; суреттің төбі кесілмейді. */
    heroImage: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      width: "100%",
      height: "108%",
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(245,237,224,0.06)",
    },
    elderStartCard: {
      borderRadius: 20,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      padding: 14,
      marginBottom: 12,
      gap: 11,
      shadowColor: "#4B3218",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    elderStartHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    elderStartIcon: {
      width: 42,
      height: 42,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.goldSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },
    elderStartHeadText: { flex: 1, minWidth: 0 },
    elderStartEyebrow: {
      color: p.goldMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.35,
      textTransform: "uppercase",
    },
    elderStartTitle: {
      color: p.text,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: "900",
      marginTop: 1,
    },
    elderStartBody: {
      color: p.text,
      fontSize: 14.5,
      lineHeight: 22,
      fontWeight: "700",
    },
    elderPrimaryBtn: {
      minHeight: 72,
      borderRadius: 18,
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: p.buttonGoldBg,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    elderBtnIcon: {
      width: 42,
      height: 42,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    elderBtnText: { flex: 1, minWidth: 0 },
    elderBtnTitle: {
      color: p.buttonGoldText,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "900",
    },
    elderBtnSub: {
      color: p.buttonGoldText,
      opacity: 0.86,
      fontSize: 12.5,
      lineHeight: 17,
      fontWeight: "700",
      marginTop: 1,
    },
    elderSecondaryGrid: {
      flexDirection: "row",
      gap: 8,
    },
    elderSecondaryBtn: {
      flex: 1,
      minHeight: 64,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardElevated,
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      gap: 5,
    },
    elderSecondaryTitle: {
      color: p.text,
      fontSize: 12.5,
      lineHeight: 16,
      fontWeight: "900",
      textAlign: "center",
    },
    searchCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
    },
    searchIcon: {
      width: 30,
      height: 30,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.goldSurface,
    },
    searchInput: {
      flex: 1,
      minWidth: 0,
      color: p.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: "700",
      paddingVertical: 4,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 8,
      marginBottom: 12,
    },
    statPill: {
      minWidth: 72,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    statNo: { color: p.text, fontSize: 17, lineHeight: 20, fontWeight: "900" },
    statLabel: { color: p.muted, fontSize: 10.5, lineHeight: 14, fontWeight: "800" },
    allTopicsPill: {
      flex: 1,
      minWidth: 0,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: p.buttonGoldBg,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    allTopicsText: { color: p.buttonGoldText, fontSize: 12, lineHeight: 16, fontWeight: "900" },
    favoritesCta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      padding: 11,
      marginTop: -4,
      marginBottom: 12,
    },
    favoritesIcon: {
      width: 34,
      height: 34,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.goldSurface,
    },
    favoritesTextCol: { flex: 1, minWidth: 0 },
    favoritesTitle: { color: p.text, fontSize: 13, lineHeight: 17, fontWeight: "900" },
    favoritesSub: { color: p.muted, fontSize: 11.5, lineHeight: 16, marginTop: 2, fontWeight: "700" },
    filterPill: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: p.goldSurface,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginBottom: 10,
    },
    filterPillText: { color: p.goldMuted, fontSize: 12, fontWeight: "900" },
    autoTranslateBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginTop: 14,
      backgroundColor: p.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },
    autoTranslateBannerText: { flex: 1, color: p.muted, fontSize: 11, fontWeight: "600" },
    systemCard: {
      borderRadius: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      padding: 13,
      marginBottom: 14,
      gap: 11,
    },
    systemHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    systemIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.goldSurface,
    },
    systemHeadText: { flex: 1, minWidth: 0 },
    systemEyebrow: {
      color: p.goldMuted,
      fontSize: 10.5,
      lineHeight: 14,
      fontWeight: "900",
      letterSpacing: 0.35,
      textTransform: "uppercase",
      marginBottom: 1,
    },
    systemTitle: { color: p.text, fontSize: 16, lineHeight: 21, fontWeight: "900" },
    systemSub: { color: p.muted, fontSize: 12, lineHeight: 17, marginTop: 1 },
    systemFormula: {
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
      backgroundColor: p.goldSurface,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    systemFormulaText: {
      color: p.text,
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: "800",
      textAlign: "center",
    },
    systemFormulaArrow: {
      color: p.goldMuted,
      fontWeight: "900",
    },
    systemBlock: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: p.border,
      paddingTop: 10,
      gap: 8,
    },
    systemBlockTitle: {
      color: p.goldMuted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.35,
      textTransform: "uppercase",
    },
    systemBlockSub: {
      color: p.muted,
      fontSize: 11.5,
      lineHeight: 16,
      fontWeight: "700",
    },
    stepGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    stepCard: {
      width: "47.5%",
      minWidth: 136,
      flexGrow: 1,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardElevated,
      padding: 10,
      gap: 6,
    },
    stepHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    checkNo: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.goldSurface,
      marginTop: 1,
    },
    checkNoText: { color: p.goldMuted, fontSize: 11, fontWeight: "900" },
    checkText: { flex: 1, color: p.text, fontSize: 12, lineHeight: 17, fontWeight: "700" },
    stepTitle: { color: p.text, fontSize: 12.5, lineHeight: 16, fontWeight: "900", flex: 1 },
    stepBody: { color: p.text, fontSize: 11.5, lineHeight: 16, fontWeight: "700" },
    stepAction: {
      alignSelf: "flex-start",
      color: p.goldMuted,
      fontSize: 10.5,
      lineHeight: 14,
      fontWeight: "900",
      backgroundColor: p.goldSurface,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    unifiedLaneList: {
      gap: 7,
    },
    laneGrid: {
      gap: 10,
      marginBottom: 14,
    },
    laneCard: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      padding: 12,
      gap: 8,
    },
    laneRowCard: {
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardElevated,
      padding: 10,
      gap: 7,
    },
    lanePressHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    laneIcon: {
      width: 34,
      height: 34,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.goldSurface,
    },
    laneHeadText: { flex: 1, minWidth: 0 },
    laneTitle: { color: p.text, fontSize: 15, lineHeight: 20, fontWeight: "900" },
    laneMeta: { color: p.goldMuted, fontSize: 11, lineHeight: 15, fontWeight: "800", marginTop: 1 },
    laneSub: { color: p.muted, fontSize: 12, lineHeight: 17 },
    laneMergedBody: {
      gap: 4,
      paddingLeft: 44,
      marginTop: -2,
    },
    laneMethod: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 6,
      padding: 8,
      borderRadius: 12,
      backgroundColor: p.goldSurface,
    },
    laneMethodText: { color: p.text, fontSize: 12, lineHeight: 17, fontWeight: "800" },
    laneTopicChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      paddingLeft: 44,
    },
    laneTopicChip: {
      maxWidth: "100%",
      paddingVertical: 6,
      paddingHorizontal: 9,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardElevated,
    },
    laneTopicText: { color: p.text, fontSize: 11, lineHeight: 15, fontWeight: "800" },
    pathShortcutGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
      alignItems: "stretch",
    },
    featuredBlock: {
      marginTop: 2,
      marginBottom: 12,
    },
    featuredHint: {
      color: p.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      marginTop: -5,
      marginBottom: 8,
    },
    featuredGrid: {
      gap: 8,
    },
    featuredTopicCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    featuredTopicTitle: { flex: 0.9, color: p.text, fontSize: 14, lineHeight: 18, fontWeight: "900" },
    featuredTopicSub: { flex: 1.1, color: p.muted, fontSize: 12, lineHeight: 17, fontWeight: "700" },
    featuredTopicFoot: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    featuredTopicMeta: { flex: 1, color: p.goldMuted, fontSize: 10.5, lineHeight: 14, fontWeight: "900" },
    featureCard: {
      width: "47.5%",
      minWidth: 132,
      flexGrow: 1,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      backgroundColor: p.cardElevated,
      overflow: "hidden",
      shadowColor: "#4B3218",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 5,
      elevation: 1,
    },
    featureIconWrap: {
      alignSelf: "center",
      width: 34,
      height: 34,
      borderRadius: 13,
      backgroundColor: "rgba(255,255,255,0.58)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
      overflow: "hidden",
    },
    featureIconDot: {
      position: "absolute",
      right: 6,
      bottom: 6,
      width: 5,
      height: 5,
      borderRadius: 3,
      opacity: 0.72,
    },
    featureBody: { padding: 7, paddingTop: 5, alignItems: "center" },
    featureTitle: { color: p.text, fontSize: 12.5, lineHeight: 16, fontWeight: "900", textAlign: "center" },
    featureSub: { color: p.muted, fontSize: 9.5, lineHeight: 13, marginTop: 2, minHeight: 22, textAlign: "center" },
    featureArrow: {
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 5,
    },
    resultsTitle: { color: p.text, fontSize: 16, fontWeight: "900", marginBottom: 10 },
    resultRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      padding: 10,
      marginBottom: 9,
    },
    resultText: { flex: 1, minWidth: 0 },
    resultTitle: { color: p.text, fontSize: 14, fontWeight: "900" },
    resultSub: { color: p.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
    empty: { color: p.muted, textAlign: "center", marginVertical: 16 },
    thoughtCard: {
      alignItems: "center",
      paddingHorizontal: 14,
      paddingBottom: 12,
    },
    thoughtHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    thoughtLine: {
      width: 44,
      height: 1,
      backgroundColor: p.goldMuted,
      opacity: 0.55,
    },
    thoughtTitle: { color: p.text, fontSize: 15, fontWeight: "900" },
    thoughtText: { color: p.text, fontSize: 14, lineHeight: 21, textAlign: "center", fontWeight: "700" },
    thoughtAuthor: { color: p.muted, fontSize: 12, marginTop: 4, fontWeight: "700" },
  });
}
