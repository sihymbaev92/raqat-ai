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
import { HubScreenHero } from "../components/HubScreenHero";
import { useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { HalalFilterChipRow, type HalalFilterChip } from "../components/HalalFilterChipRow";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { FATUA_KZ_LABEL_KK, kk, MUFTYAT_KZ_LABEL_KK } from "../i18n/kk";
import { menuIconAssets } from "../theme/menuIconAssets";
import type { PlatformIslamicKbArticle } from "../services/platformApiClient";
import type { MoreStackParamList } from "../navigation/types";
import type { KbSiteFilter } from "../types/islamicKb";
import { screenFitScrollContentStyle, useScreenFitMetrics } from "../theme/screenFit";
import { beginLatestRequest } from "../utils/latestRequestGuard";
import { loadKbArticlesFeed, type KbArticlesFeedSource } from "../services/kbArticlesFeed";
import { KbArticleCard } from "../components/kb/KbArticleCard";
import { KbContentSourceBanner } from "../components/kb/KbContentSourceBanner";
import { openOfficialSiteInApp } from "../config/officialSiteProxy";
import { warmOfficialSiteUrl } from "../services/hubScreenWarmup";
import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../config/officialIslamicSources";

const SEARCH_DEBOUNCE_MS = 420;

export function OfficialKnowledgePortalScreen() {
  useAppLocale();
  const { colors, isDark } = useAppTheme();
  const screenFit = useScreenFitMetrics();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const listContentStyle = useMemo(
    () => [styles.listContent, screenFitScrollContentStyle(screenFit, { bottom: 28, includeHorizontalPadding: true })],
    [screenFit, styles.listContent]
  );
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  useTabHomeBackHeader(navigation, colors);
  const chips: HalalFilterChip[] = useMemo(
    () => [
      { value: "", label: kk.knowledgePortal.chipAll },
      { value: "fatua", label: kk.knowledgePortal.chipFatua },
      { value: "muftyat", label: kk.knowledgePortal.chipMuftyat },
    ],
    []
  );
  const [site, setSite] = useState<KbSiteFilter>("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PlatformIslamicKbArticle[]>([]);
  const [feedSource, setFeedSource] = useState<KbArticlesFeedSource>("seed");
  const [cacheAgeMs, setCacheAgeMs] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);

  const load = useCallback(async (q: string, siteFilter: KbSiteFilter) => {
    const { isCurrentRequest } = beginLatestRequest(requestSeqRef);
    setLoading(true);
    setError(null);
    try {
      const res = await loadKbArticlesFeed({ query: q, site: siteFilter });
      if (!isCurrentRequest()) return;
      setItems(res.items);
      setFeedSource(res.source);
      setCacheAgeMs(res.cacheSnapshot?.ageMs ?? null);
      if (res.error === "no_api" && res.items.length === 0) {
        setError(kk.knowledgePortal.errorNoApi);
      } else if (res.error === "network" && res.items.length === 0) {
        setError(kk.knowledgePortal.errorNetwork);
      } else if (res.error === "api" && res.items.length === 0) {
        setError(kk.knowledgePortal.errorSearch);
      } else {
        setError(null);
      }
    } catch {
      if (!isCurrentRequest()) return;
      setError(kk.knowledgePortal.errorNetwork);
      setItems([]);
    } finally {
      if (isCurrentRequest()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void load(query, site);
    }, query.trim().length >= 2 ? SEARCH_DEBOUNCE_MS : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      requestSeqRef.current += 1;
    };
  }, [query, site, load]);

  const openDetail = useCallback(
    (article: PlatformIslamicKbArticle) => {
      navigation.navigate("KbArticleDetail", { article });
    },
    [navigation]
  );

  const renderItem: ListRenderItem<PlatformIslamicKbArticle> = useCallback(
    ({ item }) => (
      <KbArticleCard
        item={item}
        colors={colors}
        onPress={() => openDetail(item)}
        onOpenSite={item.url ? () => openOfficialSiteInApp(item.url, navigation) : undefined}
      />
    ),
    [colors, openDetail]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <HubScreenHero
          variant="ai"
          title={kk.knowledgePortal.bilimTitle}
          lead={kk.knowledgePortal.bilimLead}
          image={menuIconAssets.promoAi}
          colors={colors}
          isDark={isDark}
          eyebrow={kk.knowledgePortal.eyebrow}
          eyebrowUppercase={false}
          tags={[FATUA_KZ_LABEL_KK, MUFTYAT_KZ_LABEL_KK, kk.knowledgePortal.qmdbTag]}
        />
        <KbContentSourceBanner colors={colors} source={feedSource} cacheAgeMs={cacheAgeMs} />
        <View style={styles.partnerRow}>
          <Pressable
            style={({ pressed }) => [styles.partnerBtn, pressed && { opacity: 0.9 }]}
            onPressIn={() => warmOfficialSiteUrl(FATUA_KK_HOME_URL)}
            onPress={() => openOfficialSiteInApp(FATUA_KK_HOME_URL, navigation)}
            accessibilityRole="link"
            accessibilityLabel={kk.knowledgePortal.openFatuaA11y}
          >
            <Text style={styles.partnerBtnTxt}>{FATUA_KZ_LABEL_KK}</Text>
            <MaterialIcons name="open-in-new" size={14} color={colors.accent} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.partnerBtn, pressed && { opacity: 0.9 }]}
            onPressIn={() => warmOfficialSiteUrl(MUFTYAT_KK_HOME_URL)}
            onPress={() => openOfficialSiteInApp(MUFTYAT_KK_HOME_URL, navigation)}
            accessibilityRole="link"
            accessibilityLabel={kk.knowledgePortal.openMuftyatA11y}
          >
            <Text style={styles.partnerBtnTxt}>{MUFTYAT_KZ_LABEL_KK}</Text>
            <MaterialIcons name="open-in-new" size={14} color={colors.accent} />
          </Pressable>
        </View>
        <Text style={styles.sectionLabel}>{kk.knowledgePortal.feedTitle}</Text>
        <HalalFilterChipRow
          chips={chips}
          value={site}
          onChange={(v) => setSite(v as KbSiteFilter)}
          colors={colors}
          accessibilityGroupLabel={kk.knowledgePortal.chipsA11y}
        />
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder={kk.knowledgePortal.searchPlaceholder}
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            accessibilityLabel={kk.knowledgePortal.searchPlaceholder}
          />
          {loading ? <RaqatOrnamentSpinner size={22} /> : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    ),
    [cacheAgeMs, chips, colors, error, feedSource, isDark, loading, query, site, styles]
  );

  return (
    <FlatList
      testID="screen-main-articles"
      data={items}
      keyExtractor={(item) => `${item.document_id}-${item.url}`}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      contentContainerStyle={listContentStyle}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={!loading ? <Text style={styles.empty}>{kk.knowledgePortal.feedEmpty}</Text> : null}
    />
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    listContent: { paddingBottom: 0 },
    headerBlock: { paddingTop: 8, paddingBottom: 6 },
    partnerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4, marginBottom: 10 },
    partnerBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    partnerBtnTxt: { fontSize: 13, fontWeight: "800", color: colors.accent },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.muted,
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 10,
      marginBottom: 6,
    },
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
    error: { color: colors.error, fontSize: 13, marginBottom: 8 },
    empty: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 14,
      marginTop: 16,
      paddingHorizontal: 12,
    },
  });
}
