import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { RasterImage } from "@/ui/RasterImage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import { getTraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { MoreStackParamList } from "../navigation/types";
import {
  getRelatedTraditionArticles,
  getRelatedTraditionAudios,
  getTraditionTopicById,
} from "../content/traditionTopicsCatalog";
import { getTraditionTopicDepth } from "../content/traditionTopicDepth";
import { TraditionReligiousEvidenceSection } from "../components/tradition/TraditionReligiousEvidenceSection";
import { isTraditionFavorite, toggleTraditionFavorite } from "../storage/traditionFavorites";
import { useAutoTranslatedFields } from "../quran/useAutoTranslatedFields";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { useI18n } from "../i18n/useI18n";

type Props = NativeStackScreenProps<MoreStackParamList, "KazakhTraditionTopicDetail">;
type Nav = NativeStackNavigationProp<MoreStackParamList>;

function splitReligionLink(text: string) {
  const normalized = text.trim();
  const match = normalized.match(/Ұштасуы:\s*(.*?)\s*Шегі:\s*(.*)/s);
  if (!match) {
    return { harmony: normalized, limit: "" };
  }
  return {
    harmony: match[1]?.trim() ?? normalized,
    limit: match[2]?.trim() ?? "",
  };
}

export function KazakhTraditionTopicDetailScreen({ route }: Props) {
  const { isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const nav = useNavigation<Nav>();
  const topic = getTraditionTopicById(route.params.topicId);
  const [favorite, setFavorite] = useState(false);
  const [bataQuery, setBataQuery] = useState("");
  const [bataExpanded, setBataExpanded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!topic) return undefined;
      void isTraditionFavorite("topic", topic.id).then(setFavorite);
      return undefined;
    }, [topic])
  );

  const religionSource = useMemo(
    () => (topic ? splitReligionLink(topic.religionLink) : { harmony: "", limit: "" }),
    [topic]
  );
  const howToSource = useMemo(() => topic?.howTo ?? [], [topic]);
  const sourceFields = useMemo(
    () =>
      topic
        ? [
            topic.title,
            topic.subtitle,
            topic.summary,
            topic.origin,
            religionSource.harmony,
            religionSource.limit,
            topic.blessing,
            topic.quote,
            ...howToSource,
          ]
        : [],
    [howToSource, religionSource.harmony, religionSource.limit, topic]
  );
  const { values: tFields, translated } = useAutoTranslatedFields(sourceFields);
  const { tr } = useKkAutoTranslator();
  const t = useI18n();
  const relatedBlessings = useMemo(
    () => (topic ? getRelatedTraditionAudios(topic.id, bataQuery) : []),
    [topic, bataQuery]
  );
  const relatedArticles = useMemo(
    () => (topic ? getRelatedTraditionArticles(topic.id) : []),
    [topic]
  );
  const topicDepth = useMemo(
    () => (topic ? getTraditionTopicDepth(topic.id) : undefined),
    [topic]
  );

  if (!topic) {
    return (
      <View style={styles.center}>
        <Text style={styles.missingTitle}>{t.features.traditionGuide.topicNotFound}</Text>
      </View>
    );
  }

  const tTitle = tFields[0] ?? tr(topic.title);
  const tSubtitle = tFields[1] ?? tr(topic.subtitle);
  const tSummary = tFields[2] ?? tr(topic.summary);
  const tOrigin = tFields[3] ?? tr(topic.origin);
  const religion = {
    harmony: tFields[4] ?? tr(religionSource.harmony),
    limit: tFields[5] ?? tr(religionSource.limit),
  };
  const tBlessing = tFields[6] ?? tr(topic.blessing);
  const tQuote = tFields[7] ?? tr(topic.quote);
  const tHowTo = tFields.slice(8);
  const steps = tHowTo.length ? tHowTo : topic.howTo.map((s) => tr(s));

  const toggleFavorite = async () => {
    const next = await toggleTraditionFavorite("topic", topic.id);
    setFavorite(next.active);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator>
      <View style={styles.hero}>
        <RasterImage source={topic.image} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroShade} />
        <View style={styles.heroTop}>
          <View />
          <Pressable oyuBackdrop={false} onPress={toggleFavorite} hitSlop={8} accessibilityRole="button">
            <MaterialIcons
              name={favorite ? "bookmark" : "bookmark-border"}
              size={22}
              color={palette.headerText}
            />
          </Pressable>
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{tTitle}</Text>
          <Text style={styles.heroSub}>
            {topic.categories
              .map((c) => {
                const g = t.features.traditionGuide;
                switch (c) {
                  case "faith":
                    return g.filterFaith;
                  case "family":
                    return g.filterFamily;
                  case "ceremony":
                    return g.filterCeremony;
                  case "social":
                    return g.filterSocial;
                  default:
                    return c;
                }
              })
              .join(" · ")}
          </Text>
        </View>
      </View>

      <Text style={styles.lead}>{tSubtitle}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.features.traditionGuide.aboutTraditionTitle}</Text>
        <Text style={styles.body}>{tSummary}</Text>
        <Text style={[styles.cardTitle, styles.cardTitleGap]}>{t.features.traditionGuide.originTitle}</Text>
        <Text style={styles.body}>{tOrigin}</Text>
      </View>

      <Text style={styles.sectionLead}>{t.features.traditionGuide.religionLinkLead}</Text>

      <View style={[styles.card, styles.faithCard]}>
        <View style={styles.cardHead}>
          <MaterialIcons name="mosque" size={18} color={palette.buttonGoldText} />
          <Text style={styles.cardTitleInline}>{t.features.traditionGuide.religionLinkTitle}</Text>
        </View>
        <Text style={styles.body}>{religion.harmony}</Text>
      </View>

      {religion.limit ? (
        <View style={[styles.card, styles.limitCard]}>
          <View style={styles.cardHead}>
            <MaterialIcons name="shield" size={18} color={palette.goldMuted} />
            <Text style={styles.cardTitleInline}>{t.features.traditionGuide.superstitionLimitTitle}</Text>
          </View>
          <Text style={styles.body}>{religion.limit}</Text>
        </View>
      ) : null}

      <TraditionReligiousEvidenceSection topicId={topic.id} palette={palette} nav={nav} tr={tr} />

      {topicDepth?.vignettes?.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.features.traditionGuide.situationExamplesTitle}</Text>
          {topicDepth.vignettes.map((v, index) => (
            <View key={`v-${index}`} style={styles.vignetteRow}>
              <Text style={styles.vignetteNo}>{index + 1}.</Text>
              <Text style={styles.bodyFlex}>{tr(v)}</Text>
            </View>
          ))}
          {topicDepth.closing ? (
            <Text style={[styles.body, styles.vignetteClosing]}>{tr(topicDepth.closing)}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.features.traditionGuide.howToHoldTitle}</Text>
        {steps.map((line, index) => (
          <View key={`${index}-${line.slice(0, 16)}`} style={styles.stepRow}>
            <View style={styles.stepNo}>
              <Text style={styles.stepNoText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.features.traditionGuide.bataTextsTitle}</Text>
        <Text style={styles.body}>{tBlessing}</Text>
        {topic.id === "bata-beru" ? (
          <View style={styles.bataSearch}>
            <MaterialIcons name="search" size={18} color={palette.goldMuted} />
            <TextInput
              value={bataQuery}
              onChangeText={(text) => {
                setBataQuery(text);
                setBataExpanded(false);
              }}
              placeholder={t.features.traditionGuide.searchPlaceholderShort}
              placeholderTextColor={palette.muted}
              style={styles.bataSearchInput}
              returnKeyType="search"
            />
            {bataQuery ? (
              <Pressable oyuBackdrop={false} onPress={() => setBataQuery("")} hitSlop={8}>
                <MaterialIcons name="close" size={18} color={palette.muted} />
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {relatedBlessings.length ? (
          <Text style={styles.bataCountLabel}>
            {t.features.traditionGuide.bataCountLabel(relatedBlessings.length)}
          </Text>
        ) : null}
        {relatedBlessings.length ? (
          <View style={styles.blessingList}>
            {(bataExpanded || relatedBlessings.length <= 5
              ? relatedBlessings
              : relatedBlessings.slice(0, 5)
            ).map((item) => (
              <View key={item.id} style={styles.blessingItem}>
                <Text style={styles.blessingItemTitle}>{tr(item.title)}</Text>
                <Text style={styles.blessingItemText}>{tr(item.text)}</Text>
                {item.sourceLabel ? (
                  <Text style={styles.blessingItemSource}>{tr(item.sourceLabel)}</Text>
                ) : null}
              </View>
            ))}
            {relatedBlessings.length > 5 ? (
              <Pressable
                oyuBackdrop={false}
                onPress={() => setBataExpanded((open) => !open)}
                style={({ pressed }) => [styles.bataToggle, pressed && { opacity: 0.9 }]}
                accessibilityRole="button"
              >
                <Text style={styles.bataToggleText}>
                  {bataExpanded
                    ? t.features.traditionGuide.bataShowLess
                    : t.features.traditionGuide.bataShowMore(relatedBlessings.length - 5)}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      {relatedArticles.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.features.traditionGuide.relatedArticlesTitle}</Text>
          {relatedArticles.map((article) => (
            <Pressable
              key={article.id}
              oyuBackdrop={false}
              onPress={() => nav.navigate("KazakhTraditionArticles", { articleId: article.id })}
              style={({ pressed }) => [styles.articleRow, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel={tr(article.title)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.blessingItemTitle}>{tr(article.title)}</Text>
                <Text style={styles.blessingItemText} numberOfLines={3}>
                  {tr(article.excerpt)}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={palette.goldMuted} />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.quoteCard}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quoteText}>{tQuote}</Text>
      </View>

      {translated ? (
        <View style={styles.autoTranslateBanner}>
          <MaterialIcons name="translate" size={15} color={palette.goldMuted} />
          <Text style={styles.autoTranslateBannerText}>{t.common.autoTranslateNotice}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.screenBg },
    content: { padding: 14, paddingBottom: 32 },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.screenBg,
      padding: 24,
    },
    missingTitle: { color: p.text, fontSize: 20, fontWeight: "900" },
    hero: {
      height: 210,
      borderRadius: 22,
      overflow: "hidden",
      marginBottom: 12,
      backgroundColor: p.brown,
    },
    heroImage: { width: "100%", height: "100%" },
    heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(42,28,14,0.4)" },
    heroTop: {
      position: "absolute",
      top: 14,
      left: 14,
      right: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroText: { position: "absolute", left: 16, right: 16, bottom: 16 },
    heroTitle: { color: p.headerText, fontSize: 26, fontWeight: "900" },
    heroSub: { color: p.headerSubtext, fontSize: 13, marginTop: 4, fontWeight: "700" },
    lead: {
      color: p.text,
      fontSize: 15,
      fontWeight: "700",
      lineHeight: 22,
      marginBottom: 12,
      paddingHorizontal: 2,
    },
    sectionLead: {
      color: p.muted,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700",
      marginBottom: 8,
      paddingHorizontal: 2,
    },
    card: {
      backgroundColor: p.cardBg,
      borderRadius: 16,
      padding: 14,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    faithCard: {
      backgroundColor: p.goldSurface,
      borderColor: p.goldMuted,
    },
    limitCard: {
      borderColor: p.goldMuted,
    },
    cardHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    cardTitle: { color: p.text, fontSize: 15, fontWeight: "900", marginBottom: 8 },
    cardTitleInline: { color: p.text, fontSize: 15, fontWeight: "900", flex: 1 },
    cardTitleGap: { marginTop: 14 },
    body: { color: p.muted, fontSize: 14, lineHeight: 21, fontWeight: "600" },
    bodyFlex: { flex: 1, color: p.muted, fontSize: 14, lineHeight: 21, fontWeight: "600" },
    vignetteRow: { flexDirection: "row", gap: 8, marginBottom: 10, alignItems: "flex-start" },
    vignetteNo: { color: p.bannerBg, fontSize: 13, fontWeight: "900", marginTop: 2 },
    vignetteClosing: {
      marginTop: 4,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: p.border,
      color: p.text,
      fontWeight: "700",
    },
    stepRow: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "flex-start" },
    stepNo: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.chipActiveBg,
    },
    stepNoText: { color: p.chipActiveText, fontSize: 12, fontWeight: "900" },
    stepText: { flex: 1, color: p.text, fontSize: 14, lineHeight: 20, fontWeight: "600" },
    blessing: {
      color: p.text,
      fontSize: 15,
      lineHeight: 23,
      fontWeight: "700",
      fontStyle: "italic",
    },
    blessingList: { marginTop: 14, gap: 12 },
    blessingItem: {
      padding: 12,
      borderRadius: 14,
      backgroundColor: p.cardElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    blessingItemTitle: {
      color: p.text,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 8,
    },
    blessingItemText: {
      color: p.text,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: "600",
    },
    blessingItemSource: {
      color: p.muted,
      fontSize: 12,
      fontWeight: "600",
      marginTop: 8,
    },
    bataSearch: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      backgroundColor: p.cardElevated,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    bataSearchInput: { flex: 1, color: p.text, fontSize: 14, fontWeight: "600", paddingVertical: 6 },
    bataCountLabel: {
      color: p.goldMuted,
      fontSize: 12,
      fontWeight: "800",
      marginTop: 10,
      marginBottom: 4,
    },
    bataToggle: {
      marginTop: 4,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 12,
      backgroundColor: p.goldSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },
    bataToggleText: { color: p.text, fontSize: 14, fontWeight: "800" },
    articleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: p.border,
    },
    quoteCard: {
      marginTop: 4,
      padding: 14,
      borderRadius: 16,
      backgroundColor: p.cardElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.border,
    },
    quoteMark: { color: p.goldMuted, fontSize: 28, fontWeight: "900", lineHeight: 28 },
    quoteText: { color: p.text, fontSize: 15, lineHeight: 22, fontWeight: "700", marginTop: 2 },
    autoTranslateBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 10,
      marginTop: 12,
      backgroundColor: p.cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },
    autoTranslateBannerText: { flex: 1, color: p.muted, fontSize: 11, fontWeight: "600" },
  });
}
