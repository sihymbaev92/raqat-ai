import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import { getTraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { MoreStackParamList } from "../navigation/types";
import {
  TRADITION_ARTICLES,
  getTraditionArticleById,
  getTraditionTopicById,
} from "../content/traditionTopicsCatalog";
import { TraditionArticleCard, TraditionOrnamentDivider } from "../components/tradition/TraditionRedesignCards";
import { isTraditionFavorite, toggleTraditionFavorite } from "../storage/traditionFavorites";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { useI18n } from "../i18n/useI18n";

type Props = NativeStackScreenProps<MoreStackParamList, "KazakhTraditionArticles">;
type Nav = NativeStackNavigationProp<MoreStackParamList>;

export function KazakhTraditionArticlesScreen({ route }: Props) {
  const { isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const nav = useNavigation<Nav>();
  const { tr, translated } = useKkAutoTranslator();
  const t = useI18n();
  useLayoutEffect(() => {
    nav.setOptions({ title: t.features.traditionGuide.articlesTitle });
  }, [nav, t.features.traditionGuide.articlesTitle]);
  const [selectedId, setSelectedId] = useState(route.params?.articleId ?? TRADITION_ARTICLES[0]?.id);
  const selected = getTraditionArticleById(selectedId);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    const nextId = route.params?.articleId;
    if (nextId) setSelectedId(nextId);
  }, [route.params?.articleId]);

  useFocusEffect(
    useCallback(() => {
      if (!selected) return undefined;
      void isTraditionFavorite("article", selected.id).then(setFavorite);
      return undefined;
    }, [selected])
  );

  const toggleFavorite = async () => {
    if (!selected) return;
    const next = await toggleTraditionFavorite("article", selected.id);
    setFavorite(next.active);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator>
      <View style={styles.hero}>
        <Text style={styles.kicker}>{t.features.traditionGuide.articlesTitle}</Text>
        <Text style={styles.heroTitle}>{t.features.traditionGuide.articlesLead}</Text>
        <Text style={styles.heroSub}>{t.features.traditionGuide.articlesSub}</Text>
      </View>

      {selected ? (
        <View style={styles.detailCard}>
          <View style={styles.detailTop}>
            <Text style={styles.tag}>{tr(selected.tag)}</Text>
            <Pressable oyuBackdrop={false} onPress={toggleFavorite} hitSlop={8}>
              <MaterialIcons name={favorite ? "bookmark" : "bookmark-border"} size={22} color={palette.goldMuted} />
            </Pressable>
          </View>
          <Text style={styles.title}>{tr(selected.title)}</Text>
          <Text style={styles.source}>{selected.source}</Text>
          <Text style={styles.excerpt}>{tr(selected.excerpt)}</Text>
          <View style={styles.actions}>
            {selected.topicId ? (
              <Pressable
                oyuBackdrop={false}
                onPress={() => nav.navigate("KazakhTraditionTopicDetail", { topicId: selected.topicId! })}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.actionBtnText}>
                  {tr(
                    getTraditionTopicById(selected.topicId)?.title ??
                      t.features.traditionGuide.favoriteTypeTopic
                  )}
                </Text>
              </Pressable>
            ) : null}
            {selected.url ? (
              <Pressable
                oyuBackdrop={false}
                onPress={() => void Linking.openURL(selected.url!)}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.actionBtnText}>{t.features.traditionGuide.openOnSite}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>{t.features.traditionGuide.allArticles}</Text>
      {TRADITION_ARTICLES.map((article) => (
        <TraditionArticleCard
          key={article.id}
          title={tr(article.title)}
          excerpt={tr(article.excerpt)}
          tag={tr(article.tag)}
          palette={palette}
          onPress={() => setSelectedId(article.id)}
        />
      ))}
      <TraditionOrnamentDivider palette={palette} />
      {translated ? (
        <View style={styles.autoBanner}>
          <MaterialIcons name="translate" size={15} color={palette.goldMuted} />
          <Text style={styles.autoBannerText}>{t.common.autoTranslateNotice}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: p.screenBg },
    content: { padding: 14, paddingBottom: 32 },
    hero: {
      borderRadius: 24,
      backgroundColor: p.cardBg,
      borderWidth: 1,
      borderColor: p.border,
      padding: 18,
      marginBottom: 14,
    },
    kicker: { color: p.goldMuted, fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
    heroTitle: { color: p.text, fontSize: 25, lineHeight: 31, fontWeight: "900", marginTop: 8 },
    heroSub: { color: p.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    detailCard: {
      backgroundColor: p.cardBg,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 20,
      padding: 14,
      marginBottom: 16,
    },
    detailTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
    tag: {
      color: p.buttonGoldText,
      backgroundColor: p.buttonGoldBg,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 3,
      overflow: "hidden",
      fontSize: 11,
      fontWeight: "900",
    },
    title: { color: p.text, fontSize: 20, lineHeight: 27, fontWeight: "900" },
    source: { color: p.goldMuted, fontSize: 12, fontWeight: "900", marginTop: 4 },
    excerpt: { color: p.muted, fontSize: 14, lineHeight: 22, marginTop: 10 },
    actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
    actionBtn: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: p.buttonOutlineBorder,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: p.goldSurface,
    },
    actionBtnText: { color: p.goldMuted, fontSize: 12, fontWeight: "900" },
    sectionTitle: { color: p.text, fontSize: 18, fontWeight: "900", marginBottom: 10 },
    autoBanner: {
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
    autoBannerText: { flex: 1, color: p.muted, fontSize: 11, fontWeight: "600" },
  });
}
