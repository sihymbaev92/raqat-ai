import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HubScreenHero } from "../components/HubScreenHero";
import { useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { HalalFilterChipRow, type HalalFilterChip } from "../components/HalalFilterChipRow";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { RasterImage } from "@/ui/RasterImage";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { FATUA_KZ_LABEL_KK, kk, MUFTYAT_KZ_LABEL_KK } from "../i18n/kk";
import { menuIconAssets } from "../theme/menuIconAssets";
import { getRaqatApiBase, hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { getValidAccessToken } from "../storage/authTokens";
import {
  fetchPlatformIslamicKbBrowse,
  fetchPlatformIslamicKbSearch,
  type PlatformIslamicKbArticle,
} from "../services/platformApiClient";
import {
  loadOfficialHomeNewsItems,
} from "../services/officialSitesBootstrap";
import type { DashboardNewsItem } from "../content/dashboardNewsItems";
import type { MoreStackParamList } from "../navigation/types";
import type { KbSiteFilter } from "../components/RaqatKbShelf";
import { screenFitScrollContentStyle, useScreenFitMetrics } from "../theme/screenFit";

const SEARCH_DEBOUNCE_MS = 420;
const BROWSE_LIMIT = 20;
const FATUA_KK_URL = "https://fatua.kz/kk/";
const MUFTYAT_KK_URL = "https://www.muftyat.kz/kk/";

function siteLabel(site: string): string {
  if (site === "fatua") return FATUA_KZ_LABEL_KK;
  if (site === "muftyat") return MUFTYAT_KZ_LABEL_KK;
  return site;
}

function dashboardNewsToArticle(item: DashboardNewsItem): PlatformIslamicKbArticle {
  let site = "fatua";
  if (item.id.startsWith("home-muftyat") || item.sourceLabel === MUFTYAT_KZ_LABEL_KK) {
    site = "muftyat";
  } else if (item.id.startsWith("home-fatua") || item.sourceLabel === FATUA_KZ_LABEL_KK) {
    site = "fatua";
  }
  const docMatch = item.id.match(/^kb-(\d+)$/);
  return {
    document_id: docMatch ? parseInt(docMatch[1]!, 10) : Math.abs(hashCode(item.id)),
    site,
    source_label: item.sourceLabel ?? siteLabel(site),
    title: item.title,
    excerpt: item.subtitle ?? "",
    url: item.articleUrl ?? "",
    image_url: item.imageUrl ?? null,
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function buildArticleAskPrompt(article: PlatformIslamicKbArticle): string {
  const title = (article.title || article.source_label || kk.knowledgePortal.untitled).trim();
  const excerpt = (article.excerpt || "").trim();
  const url = (article.url || "").trim();
  return [
    kk.aiChat.kbShelfAskDefault,
    "",
    `${kk.knowledgePortal.sourceLabel}: ${article.source_label || article.site}`,
    `${kk.knowledgePortal.topicLabel}: ${title}`,
    url ? `URL: ${url}` : "",
    excerpt ? `${kk.knowledgePortal.excerptLabel}: ${excerpt}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function filterBySite(items: PlatformIslamicKbArticle[], site: KbSiteFilter): PlatformIslamicKbArticle[] {
  if (!site) return items;
  return items.filter((a) => a.site === site);
}

export function OfficialKnowledgePortalScreen() {
  const { colors, isDark } = useAppTheme();
  const screenFit = useScreenFitMetrics();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const listContentStyle = useMemo(
    () => [screenFitScrollContentStyle(screenFit, { bottom: 28, includeHorizontalPadding: true }), styles.listContent],
    [screenFit, styles.listContent]
  );
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  useTabHomeBackHeader(navigation, colors);
  const chips: HalalFilterChip[] = useMemo(
    () => [
      { value: "", label: kk.aiChat.kbChipAll },
      { value: "fatua", label: kk.aiChat.kbChipFatua },
      { value: "muftyat", label: kk.aiChat.kbChipMuftyat },
    ],
    []
  );
  const [site, setSite] = useState<KbSiteFilter>("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<PlatformIslamicKbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (q: string, siteFilter: KbSiteFilter) => {
    await hydrateRaqatApiBaseOverride();
    const base = getRaqatApiBase();
    const term = q.trim();
    setLoading(true);
    setError(null);
    try {
      if (term.length >= 2) {
        if (!base) {
          setError(kk.aiChat.kbDisabledNoApi);
          setItems([]);
          return;
        }
        const bearer = ((await getValidAccessToken()) ?? "").trim();
        const res = await fetchPlatformIslamicKbSearch(base, term, {
          authorizationBearer: bearer || undefined,
          aiSecret: getRaqatContentReadSecret(),
          limit: BROWSE_LIMIT,
          site: siteFilter || undefined,
          timeoutMs: 12_000,
        });
        if (!res.ok) {
          setError(res.error || kk.aiChat.kbSearchError);
          setItems([]);
          return;
        }
        setItems(res.results ?? []);
        return;
      }

      if (siteFilter && base) {
        const bearer = ((await getValidAccessToken()) ?? "").trim();
        const res = await fetchPlatformIslamicKbBrowse(base, {
          authorizationBearer: bearer || undefined,
          aiSecret: getRaqatContentReadSecret(),
          limit: BROWSE_LIMIT,
          site: siteFilter,
          timeoutMs: 12_000,
        });
        if (res.ok && (res.results?.length ?? 0) > 0) {
          setItems(res.results ?? []);
          return;
        }
      }

      const news = await loadOfficialHomeNewsItems();
      const mapped = news.map(dashboardNewsToArticle);
      setItems(filterBySite(mapped, siteFilter));
    } catch {
      setError(kk.aiChat.kbSearchError);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void load(query, site);
    }, query.trim().length >= 2 ? SEARCH_DEBOUNCE_MS : 0);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, site, load]);

  const onAskAbout = useCallback(
    (article: PlatformIslamicKbArticle) => {
      navigation.navigate("ImamAI", {
        initialPrompt: buildArticleAskPrompt(article),
        autoSend: true,
      });
    },
    [navigation]
  );

  const renderItem: ListRenderItem<PlatformIslamicKbArticle> = useCallback(
    ({ item }) => {
      const imageUrl = (item.image_url ?? "").trim();
      return (
        <View style={styles.card}>
          {imageUrl ? (
            <RasterImage source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : null}
          <View style={styles.cardBody}>
            <Text style={styles.sourceChip}>{item.source_label || siteLabel(item.site)}</Text>
            <Text style={styles.cardTitle} accessibilityRole="header">
              {item.title || kk.knowledgePortal.untitled}
            </Text>
            {item.excerpt ? (
              <Text style={styles.excerpt} numberOfLines={4}>
                {item.excerpt}
              </Text>
            ) : null}
            <Text style={styles.attribution}>{kk.aiChat.kbSearchAttribution}</Text>
            <View style={styles.cardActions}>
              {item.url ? (
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }]}
                  onPress={() => void Linking.openURL(item.url)}
                  accessibilityRole="link"
                  accessibilityLabel={kk.aiChat.kbSearchReadFullA11y(item.title)}
                >
                  <MaterialIcons name="open-in-new" size={16} color={colors.accent} />
                  <Text style={styles.actionBtnTxt}>{kk.aiChat.kbSearchReadFull}</Text>
                </Pressable>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.actionBtnPrimary, pressed && { opacity: 0.9 }]}
                onPress={() => onAskAbout(item)}
                accessibilityRole="button"
                accessibilityLabel={kk.aiChat.kbShelfAskA11y(item.title)}
              >
                <MaterialIcons name="smart-toy" size={16} color="#fff" />
                <Text style={styles.actionBtnPrimaryTxt}>{kk.aiChat.kbShelfAsk}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      );
    },
    [colors.accent, onAskAbout, styles]
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <HubScreenHero
          variant="ai"
          title={kk.knowledgePortal.title}
          lead={kk.knowledgePortal.lead}
          image={menuIconAssets.promoAi}
          colors={colors}
          isDark={isDark}
          eyebrow={kk.knowledgePortal.eyebrow}
          eyebrowUppercase={false}
          tags={[FATUA_KZ_LABEL_KK, MUFTYAT_KZ_LABEL_KK, kk.knowledgePortal.qmdbTag]}
        />
        <View style={styles.partnerRow}>
          <Pressable
            style={({ pressed }) => [styles.partnerBtn, pressed && { opacity: 0.9 }]}
            onPress={() => void Linking.openURL(FATUA_KK_URL)}
            accessibilityRole="link"
            accessibilityLabel={kk.knowledgePortal.openFatuaA11y}
          >
            <Text style={styles.partnerBtnTxt}>{FATUA_KZ_LABEL_KK}</Text>
            <MaterialIcons name="open-in-new" size={14} color={colors.accent} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.partnerBtn, pressed && { opacity: 0.9 }]}
            onPress={() => void Linking.openURL(MUFTYAT_KK_URL)}
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
          {loading ? <RaqatOrnamentSpinner size={22} /> : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    ),
    [chips, colors, error, isDark, loading, query, site, styles]
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
      ListEmptyComponent={
        !loading ? <Text style={styles.empty}>{kk.knowledgePortal.feedEmpty}</Text> : null
      }
    />
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    listContent: { paddingBottom: 0 },
    headerBlock: { paddingTop: 8, paddingBottom: 6 },
    partnerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10, marginBottom: 10 },
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
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 12,
      overflow: "hidden",
    },
    cardImage: { width: "100%", height: 140, backgroundColor: colors.border },
    cardBody: { padding: 12 },
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
    excerpt: { fontSize: 14, lineHeight: 20, color: colors.text, marginBottom: 8 },
    attribution: { fontSize: 11, color: colors.muted, marginBottom: 10 },
    cardActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" },
    actionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
    actionBtnTxt: { fontSize: 14, fontWeight: "700", color: colors.accent },
    actionBtnPrimary: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.accent,
    },
    actionBtnPrimaryTxt: { fontSize: 13, fontWeight: "800", color: "#fff" },
    empty: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 14,
      marginTop: 16,
      paddingHorizontal: 12,
    },
  });
}
