import React, { useMemo } from "react";
import { useAppLocale } from "../i18n/runtime";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { openOfficialSiteInApp } from "../config/officialSiteProxy";
import type { MoreStackParamList } from "../navigation/types";
import { InformationalToolBanner } from "../components/InformationalToolBanner";

type Props = NativeStackScreenProps<MoreStackParamList, "KbArticleDetail">;

export function KbArticleDetailScreen({ route, navigation }: Props) {
  useAppLocale();
  const { article } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const imageUrl = (article.image_url ?? "").trim();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <InformationalToolBanner colors={colors} hint={kk.knowledgePortal.detailBoundaryHint} />

      {imageUrl ? (
        <RasterImage source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
      ) : null}

      <Text style={styles.source}>{article.source_label || article.site}</Text>
      <Text style={styles.badge}>{kk.knowledgePortal.excerptBadge}</Text>
      <Text style={styles.title}>{article.title || kk.knowledgePortal.untitled}</Text>

      <View style={styles.excerptBox}>
        <Text style={styles.excerptLabel}>{kk.knowledgePortal.excerptLabel}</Text>
        <Text style={styles.excerpt}>{article.excerpt?.trim() || kk.knowledgePortal.noExcerpt}</Text>
      </View>

      <Text style={styles.notice}>{kk.knowledgePortal.fullTextOnSiteNotice}</Text>

      {article.url ? (
        <Pressable
          onPress={() => openOfficialSiteInApp(article.url, navigation)}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
          accessibilityRole="link"
          accessibilityLabel={kk.knowledgePortal.openFullOnSiteA11y(article.title)}
        >
          <MaterialIcons name="open-in-new" size={18} color="#fff" />
          <Text style={styles.primaryBtnTxt}>{kk.knowledgePortal.openFullOnSite}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 36 },
    heroImage: {
      width: "100%",
      height: 180,
      borderRadius: 16,
      marginBottom: 14,
      backgroundColor: colors.border,
    },
    source: { color: colors.accent, fontSize: 12, fontWeight: "900", marginBottom: 6 },
    badge: {
      alignSelf: "flex-start",
      color: colors.muted,
      fontSize: 10,
      fontWeight: "800",
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      marginBottom: 10,
      overflow: "hidden",
    },
    title: { color: colors.text, fontSize: 22, fontWeight: "900", lineHeight: 28, marginBottom: 14 },
    excerptBox: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 12,
    },
    excerptLabel: { color: colors.muted, fontSize: 11, fontWeight: "800", marginBottom: 6, textTransform: "uppercase" },
    excerpt: { color: colors.text, fontSize: 15, lineHeight: 24 },
    notice: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 16 },
    primaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 999,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    primaryBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "900" },
  });
}
