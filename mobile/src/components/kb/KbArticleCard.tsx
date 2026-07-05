import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import type { PlatformIslamicKbArticle } from "../../services/platformApiClient";

type Props = {
  item: PlatformIslamicKbArticle;
  colors: ThemeColors;
  onPress: () => void;
  onOpenSite?: () => void;
};

export function KbArticleCard({ item, colors, onPress, onOpenSite }: Props) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const imageUrl = (item.image_url ?? "").trim();

  return (
    <View style={styles.card}>
      {imageUrl ? (
        <RasterImage source={{ uri: imageUrl }} style={styles.cardImage} resizeMode="cover" />
      ) : null}
      <Pressable onPress={onPress} style={({ pressed }) => [styles.cardBody, pressed && { opacity: 0.94 }]}>
        <View style={styles.badgeRow}>
          <Text style={styles.sourceChip}>{item.source_label || item.site}</Text>
          <Text style={styles.excerptBadge}>{kk.knowledgePortal.excerptBadge}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={3}>
          {item.title || kk.knowledgePortal.untitled}
        </Text>
        {item.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={4}>
            {item.excerpt}
          </Text>
        ) : null}
        <Text style={styles.readNative}>{kk.knowledgePortal.readInApp}</Text>
      </Pressable>
      {item.url && onOpenSite ? (
        <Pressable
          onPress={onOpenSite}
          style={({ pressed }) => [styles.siteRow, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.knowledgePortal.openFullOnSiteA11y(item.title)}
        >
          <MaterialIcons name="open-in-new" size={14} color={colors.accent} />
          <Text style={styles.siteLinkTxt}>{kk.knowledgePortal.openFullOnSite}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginBottom: 12,
      overflow: "hidden",
    },
    cardImage: { width: "100%", height: 132, backgroundColor: colors.border },
    cardBody: { padding: 12 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8, alignItems: "center" },
    sourceChip: { fontSize: 11, fontWeight: "800", color: colors.accent },
    excerptBadge: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.muted,
      backgroundColor: colors.bg,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      overflow: "hidden",
    },
    cardTitle: { fontSize: 16, fontWeight: "800", color: colors.text, lineHeight: 21, marginBottom: 6 },
    excerpt: { fontSize: 14, lineHeight: 20, color: colors.text, marginBottom: 8 },
    readNative: { fontSize: 13, fontWeight: "800", color: colors.accent },
    siteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: 4,
    },
    siteLinkTxt: { fontSize: 12, fontWeight: "700", color: colors.accent },
  });
}
