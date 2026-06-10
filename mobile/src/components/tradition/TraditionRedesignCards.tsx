import React from "react";
import { Image, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { TraditionKazakhPalette } from "../../theme/traditionKazakhTheme";
import { kazakhOyuKoshkarBand } from "../../theme/ornamentAssets";

type IconName = React.ComponentProps<typeof MaterialIcons>["name"];

export function TraditionSectionHeader({
  title,
  action,
  onPress,
  palette,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
  palette: TraditionKazakhPalette;
}) {
  const styles = makeStyles(palette);
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && onPress ? (
        <Pressable oyuBackdrop={false} onPress={onPress} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function TraditionCategoryTile({
  label,
  icon,
  palette,
  onPress,
}: {
  label: string;
  icon: IconName;
  palette: TraditionKazakhPalette;
  onPress: () => void;
}) {
  const styles = makeStyles(palette);
  return (
    <Pressable
      oyuBackdrop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.categoryTile, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.categoryIcon}>
        <MaterialIcons name={icon} size={20} color={palette.brown} />
        <View style={styles.categoryIconDot} />
      </View>
      <Text style={styles.categoryLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

export function TraditionTopicListCard({
  title,
  subtitle,
  image,
  palette,
  onPress,
}: {
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  palette: TraditionKazakhPalette;
  onPress: () => void;
}) {
  const styles = makeStyles(palette);
  return (
    <Pressable
      oyuBackdrop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.topicCard, pressed && { opacity: 0.92 }]}
    >
      <Image source={image} style={styles.topicImage} resizeMode="cover" />
      <View style={styles.topicText}>
        <Text style={styles.topicTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.topicSub} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={palette.muted} />
    </Pressable>
  );
}

export function TraditionArticleCard({
  title,
  excerpt,
  tag,
  palette,
  onPress,
}: {
  title: string;
  excerpt: string;
  tag: string;
  palette: TraditionKazakhPalette;
  onPress: () => void;
}) {
  const styles = makeStyles(palette);
  return (
    <Pressable
      oyuBackdrop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.articleCard, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.articleAccent} />
      <Image source={kazakhOyuKoshkarBand} resizeMode="stretch" style={styles.articleOyuTop} />
      <Image source={kazakhOyuKoshkarBand} resizeMode="stretch" style={styles.articleOyuBottom} />
      <View style={styles.articleOverlay} pointerEvents="none" />
      <View style={styles.articleContent}>
        <Text style={styles.articleTag}>{tag}</Text>
        <Text style={styles.articleTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.articleExcerpt} numberOfLines={2}>
          {excerpt}
        </Text>
      </View>
      <View style={styles.articleChevron}>
        <MaterialIcons name="chevron-right" size={20} color={palette.goldMuted} />
      </View>
    </Pressable>
  );
}

export function TraditionOrnamentDivider({ palette }: { palette: TraditionKazakhPalette }) {
  const styles = makeStyles(palette);
  return <Image source={kazakhOyuKoshkarBand} resizeMode="stretch" style={styles.divider} />;
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    sectionHead: {
      marginTop: 18,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    sectionTitle: { color: p.text, fontSize: 18, fontWeight: "900" },
    sectionAction: { color: p.goldMuted, fontSize: 12, fontWeight: "800" },
    categoryTile: {
      width: "31%",
      minHeight: 86,
      flexGrow: 1,
      borderRadius: 14,
      backgroundColor: p.cardBg,
      borderWidth: 1,
      borderColor: p.border,
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      gap: 6,
    },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.cardElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
    },
    categoryIconDot: {
      position: "absolute",
      right: 6,
      bottom: 6,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: p.goldMuted,
      opacity: 0.72,
    },
    categoryLabel: { color: p.text, fontSize: 11, lineHeight: 14, fontWeight: "800", textAlign: "center" },
    topicCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: p.cardBg,
      borderWidth: 1,
      borderColor: p.border,
      borderRadius: 16,
      padding: 10,
      marginBottom: 10,
    },
    topicImage: { width: 58, height: 58, borderRadius: 12, backgroundColor: p.goldSurface },
    topicText: { flex: 1, minWidth: 0 },
    topicTitle: { color: p.text, fontSize: 15, fontWeight: "900" },
    topicSub: { color: p.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
    articleCard: {
      minHeight: 116,
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: p.cardBg,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: p.border,
      padding: 14,
      paddingRight: 48,
      justifyContent: "center",
    },
    articleAccent: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 5,
      backgroundColor: p.goldMuted,
    },
    articleOyuTop: {
      position: "absolute",
      right: 12,
      top: 8,
      width: 168,
      height: 26,
      opacity: 0.11,
      tintColor: p.goldMuted,
    },
    articleOyuBottom: {
      position: "absolute",
      left: 22,
      bottom: 8,
      width: 190,
      height: 28,
      opacity: 0.08,
      tintColor: p.goldMuted,
      transform: [{ rotate: "180deg" }],
    },
    articleOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: p.goldSurface,
      opacity: 0.45,
    },
    articleContent: { gap: 4 },
    articleTag: {
      alignSelf: "flex-start",
      color: p.buttonGoldText,
      backgroundColor: p.buttonGoldBg,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 3,
      fontSize: 11,
      fontWeight: "900",
      marginBottom: 4,
      overflow: "hidden",
    },
    articleTitle: { color: p.text, fontSize: 16, lineHeight: 21, fontWeight: "900" },
    articleExcerpt: { color: p.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
    articleChevron: {
      position: "absolute",
      right: 14,
      top: "50%",
      width: 28,
      height: 28,
      marginTop: -14,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: p.goldSurface,
      borderWidth: 1,
      borderColor: p.border,
    },
    divider: { alignSelf: "center", width: "70%", height: 24, marginVertical: 16, tintColor: p.goldMuted },
  });
}
