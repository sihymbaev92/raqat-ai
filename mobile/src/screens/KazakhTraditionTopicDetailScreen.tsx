import React, { useCallback, useMemo, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
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
  traditionCategoryLabel,
} from "../content/traditionTopicsCatalog";
import {
  TraditionArticleCard,
  TraditionOrnamentDivider,
  TraditionSectionHeader,
} from "../components/tradition/TraditionRedesignCards";
import { TraditionReligiousEvidenceSection } from "../components/tradition/TraditionReligiousEvidenceSection";
import { traditionEvidenceRefCount } from "../content/traditionReligiousEvidence";
import { isTraditionFavorite, toggleTraditionFavorite } from "../storage/traditionFavorites";
import { kk } from "../i18n/kk";
import { useAutoTranslatedFields } from "../quran/useAutoTranslatedFields";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";

type Props = NativeStackScreenProps<MoreStackParamList, "KazakhTraditionTopicDetail">;
type Nav = NativeStackNavigationProp<MoreStackParamList>;
type TabKey = "about" | "faith" | "steps" | "blessing";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "about", label: "Дәстүр туралы" },
  { key: "faith", label: "Дінмен ұштасуы" },
  { key: "steps", label: "Қалай өтеді?" },
  { key: "blessing", label: "Бата" },
];

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
  const [tab, setTab] = useState<TabKey>("about");
  const [favorite, setFavorite] = useState(false);

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
  /** Тұрақты рет: 0 title, 1 subtitle, 2 summary, 3 origin, 4 harmony, 5 limit, 6 blessing, 7 quote, 8.. howTo */
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
  const articles = useMemo(() => (topic ? getRelatedTraditionArticles(topic.id) : []), [topic]);
  const audios = useMemo(() => (topic ? getRelatedTraditionAudios(topic.id) : []), [topic]);
  const evidenceCount = useMemo(() => (topic ? traditionEvidenceRefCount(topic.id) : 0), [topic]);

  if (!topic) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{tr("Дәстүр табылмады")}</Text>
      </View>
    );
  }

  const tTitle = tFields[0] ?? topic.title;
  const tSubtitle = tFields[1] ?? topic.subtitle;
  const tSummary = tFields[2] ?? topic.summary;
  const tOrigin = tFields[3] ?? topic.origin;
  const religion = { harmony: tFields[4] ?? religionSource.harmony, limit: tFields[5] ?? religionSource.limit };
  const tBlessing = tFields[6] ?? topic.blessing;
  const tQuote = tFields[7] ?? topic.quote;
  const tHowTo = tFields.slice(8);

  const toggleFavorite = async () => {
    const next = await toggleTraditionFavorite("topic", topic.id);
    setFavorite(next.active);
  };

  const renderTabBody = () => {
    if (tab === "faith") {
      return (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{tr("Дінмен ұштасуы")}</Text>
          <View style={styles.faithPoint}>
            <MaterialIcons name="check-circle" size={18} color={palette.bannerBg} />
            <View style={styles.faithPointText}>
              <Text style={styles.faithPointTitle}>{tr("Ұштасуы")}</Text>
              <Text style={styles.bodyText}>{religion.harmony}</Text>
            </View>
          </View>
          {religion.limit ? (
            <View style={styles.faithPoint}>
              <MaterialIcons name="verified-user" size={18} color={palette.goldMuted} />
              <View style={styles.faithPointText}>
                <Text style={styles.faithPointTitle}>{tr("Шариғи шегі")}</Text>
                <Text style={styles.bodyText}>{religion.limit}</Text>
              </View>
            </View>
          ) : null}
          <TraditionReligiousEvidenceSection topicId={topic.id} palette={palette} nav={nav} tr={tr} />
        </View>
      );
    }
    if (tab === "steps") {
      return (
        <View style={styles.timeline}>
          {(tHowTo.length ? tHowTo : topic.howTo).map((line, index) => (
            <View key={`${index}-${line.slice(0, 12)}`} style={styles.stepRow}>
              <View style={styles.stepNo}>
                <Text style={styles.stepNoText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{line}</Text>
            </View>
          ))}
        </View>
      );
    }
    if (tab === "blessing") {
      return (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{tr("Бата мәтіні")}</Text>
          <Text style={styles.blessingText}>{tBlessing}</Text>
        </View>
      );
    }
    return (
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>{tr("Дәстүр туралы")}</Text>
        <Text style={styles.bodyText}>{tSummary}</Text>
        <Text style={[styles.infoTitle, { marginTop: 14 }]}>{tr("Шығу төркіні")}</Text>
        <Text style={styles.bodyText}>{tOrigin}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator>
      <View style={styles.hero}>
        <Image source={topic.image} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroShade} />
        <View style={styles.heroTop}>
          <Pressable oyuBackdrop={false} onPress={() => nav.goBack()} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={22} color={palette.headerText} />
          </Pressable>
          <View style={styles.heroActions}>
            <Pressable oyuBackdrop={false} onPress={toggleFavorite} hitSlop={8}>
              <MaterialIcons
                name={favorite ? "bookmark" : "bookmark-border"}
                size={22}
                color={palette.headerText}
              />
            </Pressable>
          </View>
        </View>
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{tTitle}</Text>
          <Text style={styles.heroSub}>{topic.categories.map((c) => tr(traditionCategoryLabel(c))).join(" · ")}</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>{tSubtitle}</Text>
      </View>

      <Pressable
        oyuBackdrop={false}
        onPress={() => setTab("faith")}
        style={({ pressed }) => [styles.faithSummaryCard, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={tr("Дінмен ұштасуын ашу")}
      >
        <View style={styles.faithSummaryIcon}>
          <MaterialIcons name="mosque" size={20} color={palette.buttonGoldText} />
        </View>
        <View style={styles.faithSummaryText}>
          <Text style={styles.faithSummaryTitle}>{tr("Дінмен ұштасуы")}</Text>
          <Text style={styles.faithSummaryBody} numberOfLines={3}>
            {religion.harmony}
          </Text>
          {religion.limit ? (
            <Text style={styles.faithSummaryLimit} numberOfLines={2}>
              {tr("Шегі")}: {religion.limit}
            </Text>
          ) : null}
          {evidenceCount > 0 ? (
            <Text style={styles.faithSummaryEvidence}>
              {tr(kk.features.traditionGuide.traditionEvidenceCount(evidenceCount))}
            </Text>
          ) : null}
        </View>
        <MaterialIcons name="chevron-right" size={20} color={palette.goldMuted} />
      </Pressable>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {TABS.map((item) => (
          <Pressable
            key={item.key}
            oyuBackdrop={false}
            onPress={() => setTab(item.key)}
            style={({ pressed }) => [
              styles.tab,
              tab === item.key && styles.tabActive,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{tr(item.label)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {renderTabBody()}

      {audios.length ? (
        <>
          <TraditionSectionHeader title={tr("Бата аудиолары")} palette={palette} />
          {audios.map((audio) => (
            <View key={audio.id} style={styles.audioCard}>
              <View style={styles.audioIcon}>
                <MaterialIcons name="volume-up" size={18} color={palette.buttonGoldText} />
              </View>
              <View style={styles.audioTextCol}>
                <Text style={styles.audioTitle}>{tr(audio.title)}</Text>
                <Text style={styles.audioMeta}>
                  {audio.duration} · {tr(audio.sourceLabel)}
                </Text>
                <Text style={styles.audioBody}>{tr(audio.text)}</Text>
              </View>
            </View>
          ))}
        </>
      ) : null}

      {articles.length ? (
        <>
          <TraditionSectionHeader
            title={tr("Мақалалар")}
            action={tr("барлығы")}
            palette={palette}
            onPress={() => nav.navigate("KazakhTraditionArticles")}
          />
          {articles.slice(0, 2).map((article) => (
            <TraditionArticleCard
              key={article.id}
              title={tr(article.title)}
              excerpt={tr(article.excerpt)}
              tag={tr(article.tag)}
              palette={palette}
              onPress={() => nav.navigate("KazakhTraditionArticles", { articleId: article.id })}
            />
          ))}
        </>
      ) : null}

      <View style={styles.quoteCard}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quoteText}>{tQuote}</Text>
      </View>
      <TraditionOrnamentDivider palette={palette} />
      {translated ? (
        <View style={styles.autoTranslateBanner}>
          <MaterialIcons name="translate" size={15} color={palette.goldMuted} />
          <Text style={styles.autoTranslateBannerText}>{kk.common.autoTranslateNotice}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.screenBg },
    content: { padding: 14, paddingBottom: 32 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: p.screenBg, padding: 24 },
    title: { color: p.text, fontSize: 20, fontWeight: "900" },
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
    hero: { height: 230, borderRadius: 24, overflow: "hidden", marginBottom: 12, backgroundColor: p.brown },
    heroImage: { width: "100%", height: "100%" },
    heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(42,28,14,0.38)" },
    heroTop: {
      position: "absolute",
      top: 14,
      left: 14,
      right: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroActions: { flexDirection: "row", alignItems: "center", gap: 12 },
    heroText: { position: "absolute", left: 18, right: 18, bottom: 18 },
    heroTitle: { color: p.headerText, fontSize: 28, fontWeight: "900" },
    heroSub: { color: p.headerSubtext, fontSize: 13, marginTop: 5, fontWeight: "700" },
    summaryCard: {
      backgroundColor: p.cardBg,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: p.border,
      marginBottom: 12,
    },
    summaryText: { color: p.text, fontSize: 14, lineHeight: 21, fontWeight: "700" },
    faithSummaryCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: p.goldSurface,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: p.gold,
      marginBottom: 12,
    },
    faithSummaryIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: p.buttonGoldBg,
      alignItems: "center",
      justifyContent: "center",
    },
    faithSummaryText: {
      flex: 1,
      minWidth: 0,
    },
    faithSummaryTitle: {
      color: p.text,
      fontSize: 15,
      fontWeight: "900",
      marginBottom: 4,
    },
    faithSummaryBody: {
      color: p.text,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "700",
    },
    faithSummaryLimit: {
      color: p.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
      marginTop: 6,
    },
    faithSummaryEvidence: {
      color: p.bannerBg,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
      marginTop: 6,
    },
    tabs: { flexDirection: "row", gap: 8, paddingBottom: 10 },
    tab: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    tabActive: { borderColor: p.gold, backgroundColor: p.goldSurface },
    tabText: { color: p.muted, fontSize: 12, fontWeight: "800" },
    tabTextActive: { color: p.goldMuted },
    infoCard: {
      backgroundColor: p.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: p.border,
      padding: 14,
      marginBottom: 12,
    },
    infoTitle: { color: p.text, fontSize: 15, fontWeight: "900", marginBottom: 8 },
    bodyText: { color: p.muted, fontSize: 14, lineHeight: 22 },
    faithPoint: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 8,
    },
    faithPointText: {
      flex: 1,
      minWidth: 0,
    },
    faithPointTitle: {
      color: p.text,
      fontSize: 13,
      fontWeight: "900",
      marginBottom: 3,
    },
    blessingText: { color: p.text, fontSize: 18, lineHeight: 28, fontWeight: "800" },
    primaryBtn: {
      marginTop: 14,
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 999,
      backgroundColor: p.buttonGoldBg,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    primaryBtnText: { color: p.buttonGoldText, fontSize: 13, fontWeight: "900" },
    timeline: {
      backgroundColor: p.cardBg,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: p.border,
      padding: 14,
      marginBottom: 12,
      gap: 12,
    },
    stepRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    stepNo: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: p.buttonGoldBg,
      alignItems: "center",
      justifyContent: "center",
    },
    stepNoText: { color: p.buttonGoldText, fontSize: 13, fontWeight: "900" },
    stepText: { flex: 1, color: p.text, fontSize: 14, lineHeight: 21, fontWeight: "600" },
    audioCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      backgroundColor: p.cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.border,
      padding: 12,
      marginBottom: 10,
    },
    audioIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: p.buttonGoldBg,
      alignItems: "center",
      justifyContent: "center",
    },
    audioTextCol: { flex: 1, minWidth: 0 },
    audioTitle: { color: p.text, fontSize: 14, lineHeight: 19, fontWeight: "900" },
    audioMeta: { color: p.goldMuted, fontSize: 11, lineHeight: 15, fontWeight: "800", marginTop: 2 },
    audioBody: { color: p.muted, fontSize: 12, lineHeight: 18, fontWeight: "700", marginTop: 5 },
    quoteCard: {
      marginTop: 8,
      backgroundColor: p.cardBg,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: p.border,
      padding: 18,
      alignItems: "center",
    },
    quoteMark: { color: p.goldMuted, fontSize: 42, lineHeight: 42, fontWeight: "900" },
    quoteText: { color: p.text, fontSize: 18, lineHeight: 27, fontWeight: "900", textAlign: "center" },
  });
}
