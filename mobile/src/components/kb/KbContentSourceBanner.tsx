import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import type { KbArticlesFeedSource } from "../../services/kbArticlesFeed";
import { kbFeedSourceLabel } from "../../services/kbArticlesFeed";

type Props = {
  colors: ThemeColors;
  source: KbArticlesFeedSource;
  cacheAgeMs?: number | null;
};

export function KbContentSourceBanner({ colors, source, cacheAgeMs }: Props) {
  const styles = makeStyles(colors);
  const isOffline = source === "seed" || source === "cache";
  const icon = isOffline ? "offline-pin" : "cloud-download";
  const badge = isOffline ? kk.knowledgePortal.offlineFeedBadge : kk.knowledgePortal.onlineFeedBadge;
  let hint = kk.knowledgePortal.excerptOnlyHint;
  if (source === "cache" && cacheAgeMs != null) {
    const hours = Math.max(1, Math.round(cacheAgeMs / (60 * 60 * 1000)));
    hint = kk.knowledgePortal.cacheAgeHint(hours, kbFeedSourceLabel(source));
  } else if (source === "seed") {
    hint = kk.knowledgePortal.seedHint;
  } else {
    hint = kk.knowledgePortal.excerptOnlyHint;
  }

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <MaterialIcons name={icon} size={16} color={colors.accent} />
      <View style={styles.textCol}>
        <Text style={styles.badge}>{badge}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    textCol: { flex: 1, minWidth: 0, gap: 2 },
    badge: { color: colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase" },
    hint: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: "600" },
  });
}
