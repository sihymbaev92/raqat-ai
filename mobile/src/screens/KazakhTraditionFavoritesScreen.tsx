import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import { useAppTheme } from "../theme/ThemeContext";
import { getTraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import type { MoreStackParamList } from "../navigation/types";
import {
  getTraditionArticleById,
  getTraditionTopicById,
} from "../content/traditionTopicsCatalog";
import { listTraditionFavorites, type TraditionFavorite } from "../storage/traditionFavorites";
import { TraditionOrnamentDivider } from "../components/tradition/TraditionRedesignCards";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { useI18n } from "../i18n/useI18n";

type Nav = NativeStackNavigationProp<MoreStackParamList>;

function favoriteLabel(item: TraditionFavorite): string {
  if (item.type === "topic") return getTraditionTopicById(item.id)?.title ?? item.id;
  return getTraditionArticleById(item.id)?.title ?? item.id;
}

function favoriteSub(item: TraditionFavorite, t: ReturnType<typeof useI18n>): string {
  if (item.type === "topic") return t.features.traditionGuide.favoriteTypeTopic;
  return t.features.traditionGuide.favoriteTypeArticle;
}

function favoriteIcon(item: TraditionFavorite): React.ComponentProps<typeof MaterialIcons>["name"] {
  if (item.type === "topic") return "auto-stories";
  return "article";
}

export function KazakhTraditionFavoritesScreen() {
  const { isDark } = useAppTheme();
  const palette = useMemo(() => getTraditionKazakhPalette(isDark), [isDark]);
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const nav = useNavigation<Nav>();
  const { tr, translated } = useKkAutoTranslator();
  const t = useI18n();
  useLayoutEffect(() => {
    nav.setOptions({ title: t.features.traditionGuide.favoritesTitle });
  }, [nav, t.features.traditionGuide.favoritesTitle]);
  const [items, setItems] = useState<TraditionFavorite[]>([]);

  useFocusEffect(
    useCallback(() => {
      void listTraditionFavorites().then(setItems);
      return undefined;
    }, [])
  );

  const openFavorite = (item: TraditionFavorite) => {
    if (item.type === "topic") nav.navigate("KazakhTraditionTopicDetail", { topicId: item.id });
    else nav.navigate("KazakhTraditionArticles", { articleId: item.id });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t.features.traditionGuide.favoritesTitle}</Text>
        <Text style={styles.heroSub}>{t.features.traditionGuide.favoritesLead}</Text>
      </View>

      {items.length ? (
        items.map((item) => (
          <Pressable
            key={`${item.type}-${item.id}`}
            oyuBackdrop={false}
            onPress={() => openFavorite(item)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name={favoriteIcon(item)} size={22} color={palette.goldMuted} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.title} numberOfLines={2}>
                {tr(favoriteLabel(item))}
              </Text>
              <Text style={styles.sub}>{favoriteSub(item, t)}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={palette.muted} />
          </Pressable>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <MaterialIcons name="bookmark-border" size={34} color={palette.goldMuted} />
          <Text style={styles.emptyTitle}>{t.features.traditionGuide.favoritesEmpty}</Text>
          <Text style={styles.emptyText}>{t.features.traditionGuide.favoritesEmptyHint}</Text>
        </View>
      )}
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
    heroTitle: { color: p.text, fontSize: 26, fontWeight: "900" },
    heroSub: { color: p.muted, fontSize: 13, lineHeight: 19, marginTop: 6 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      marginBottom: 9,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: p.goldSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    textCol: { flex: 1, minWidth: 0 },
    title: { color: p.text, fontSize: 15, fontWeight: "900" },
    sub: { color: p.muted, fontSize: 12, marginTop: 3 },
    emptyCard: {
      alignItems: "center",
      borderRadius: 20,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      padding: 24,
    },
    emptyTitle: { color: p.text, fontSize: 17, fontWeight: "900", marginTop: 10 },
    emptyText: { color: p.muted, fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: "center" },
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
