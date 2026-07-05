import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View, type ListRenderItem } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { loadKbArticlesFeed } from "../../services/kbArticlesFeed";
import type { PlatformIslamicKbArticle } from "../../services/platformApiClient";
import type { MoreStackParamList } from "../../navigation/types";
import { KbArticleCard } from "./KbArticleCard";
import { KbContentSourceBanner } from "./KbContentSourceBanner";
import { openOfficialSiteExternally } from "../../config/officialSiteProxy";

type Props = {
  colors: ThemeColors;
};

/** ҚМДБ hub ішіндегі қысқа native мақала тізімі (WebView емес). */
export function KbArticlesInlinePanel({ colors }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [items, setItems] = useState<PlatformIslamicKbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedSource, setFeedSource] = useState<"seed" | "cache" | "live_scrape" | "api_browse" | "api_search">("seed");

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const res = await loadKbArticlesFeed({ query: "", site: "" });
      if (!active) return;
      setItems(res.items.slice(0, 6));
      setFeedSource(res.source);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const renderItem: ListRenderItem<PlatformIslamicKbArticle> = useCallback(
    ({ item }) => (
      <KbArticleCard
        item={item}
        colors={colors}
        onPress={() => navigation.navigate("KbArticleDetail", { article: item })}
        onOpenSite={item.url ? () => openOfficialSiteExternally(item.url) : undefined}
      />
    ),
    [colors, navigation]
  );

  return (
    <View style={styles.root}>
      <KbContentSourceBanner colors={colors} source={feedSource} />
      {loading ? (
        <View style={styles.loading}>
          <RaqatOrnamentSpinner size={24} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.document_id}-${item.url}`}
          renderItem={renderItem}
          scrollEnabled={false}
          ListEmptyComponent={<Text style={styles.empty}>{kk.knowledgePortal.feedEmpty}</Text>}
        />
      )}
      <Pressable
        onPress={() => navigation.navigate("OfficialKnowledgePortal")}
        style={({ pressed }) => [styles.moreBtn, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
      >
        <Text style={styles.moreBtnTxt}>{kk.knowledgePortal.openPortalBanner}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
    loading: { paddingVertical: 24, alignItems: "center" },
    empty: { color: colors.muted, textAlign: "center", paddingVertical: 16 },
    moreBtn: {
      marginTop: 8,
      marginBottom: 16,
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    moreBtnTxt: { color: "#fff", fontWeight: "900", fontSize: 13 },
  });
}
