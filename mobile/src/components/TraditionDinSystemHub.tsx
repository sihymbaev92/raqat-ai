import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import type { TraditionKazakhPalette } from "../theme/traditionKazakhTheme";
import { kk } from "../i18n/kk";

export type TraditionHubAnchorKey = "asylSoz" | "books" | "tradition";

export type TraditionHubStats = {
  asylSozEntries: number;
  booksCount: number;
  topicsCount: number;
};

type Props = {
  colors: ThemeColors;
  palette: TraditionKazakhPalette;
  stats: TraditionHubStats;
  onAnchor: (key: TraditionHubAnchorKey) => void;
};

/**
 * «Дін мен дәстүр» — үш тірек карточкалары (mockup категория стилі).
 */
export function TraditionDinSystemHub({ colors, palette, stats, onAnchor }: Props) {
  const styles = useMemo(() => makeStyles(palette), [palette]);
  const tg = kk.features.traditionGuide;

  const anchors = useMemo(
    () =>
      [
        {
          key: "asylSoz" as const,
          label: tg.anchorAsylSoz,
          icon: "auto-stories" as const,
          badge: `${stats.asylSozEntries}`,
          hint: tg.kazakhHubAsylSozHint,
        },
        {
          key: "books" as const,
          label: tg.anchorBooks,
          icon: "menu-book" as const,
          badge: tg.booksCount(stats.booksCount),
          hint: tg.kazakhHubBooksHint,
        },
        {
          key: "tradition" as const,
          label: tg.anchorTradition,
          icon: "groups" as const,
          badge: tg.topicsCount(stats.topicsCount),
          hint: tg.kazakhHubTraditionHint,
        },
      ],
    [stats.asylSozEntries, stats.booksCount, stats.topicsCount, tg]
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {tg.systemHubTitle}
      </Text>

      <View style={styles.grid}>
        {anchors.map(({ key, label, icon, badge, hint }) => (
          <Pressable
            key={key}
            oyuBackdrop={false}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            onPress={() => onAnchor(key)}
            accessibilityRole="button"
            accessibilityLabel={`${label}. ${badge}`}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name={icon} size={21} color={palette.brown} />
              <View style={styles.iconDot} />
            </View>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {label}
            </Text>
            <Text style={styles.cardHint} numberOfLines={2}>
              {hint}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{badge}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.pillars}>
        <Text style={styles.pillarsHead}>{tg.pillarsTitle}</Text>
        <Text style={styles.pillarLine} selectable>
          {tg.pillarAqida}
        </Text>
        <Text style={styles.pillarLine} selectable>
          {tg.pillarIbada}
        </Text>
        <Text style={styles.pillarLine} selectable>
          {tg.pillarAdab}
        </Text>
        <Text style={[styles.pillarNote, { color: colors.muted }]} selectable>
          {tg.pillarRefsNote}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(p: TraditionKazakhPalette) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 14,
    },
    title: {
      fontSize: 17,
      fontWeight: "900",
      color: p.text,
      marginBottom: 6,
    },
    lead: {
      fontSize: 14,
      lineHeight: 21,
      color: p.muted,
      marginBottom: 12,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 12,
    },
    card: {
      width: "31%",
      flexGrow: 1,
      minWidth: 100,
      aspectRatio: 0.92,
      padding: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.border,
      backgroundColor: p.cardBg,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: p.cardElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: p.goldMuted,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    iconDot: {
      position: "absolute",
      right: 7,
      bottom: 7,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: p.goldMuted,
      opacity: 0.7,
    },
    cardTitle: {
      fontSize: 12,
      fontWeight: "900",
      color: p.text,
      textAlign: "center",
      lineHeight: 16,
    },
    cardHint: {
      fontSize: 10,
      lineHeight: 14,
      color: p.muted,
      textAlign: "center",
      marginTop: 4,
      flex: 1,
    },
    badge: {
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: p.goldSurface,
      borderWidth: 1,
      borderColor: p.border,
    },
    badgeTxt: {
      fontSize: 10,
      fontWeight: "800",
      color: p.goldMuted,
    },
    pillars: {
      padding: 12,
      borderRadius: 14,
      backgroundColor: p.cardElevated,
      borderWidth: 1,
      borderColor: p.border,
    },
    pillarsHead: {
      fontSize: 13,
      fontWeight: "900",
      color: p.goldMuted,
      marginBottom: 8,
    },
    pillarLine: {
      fontSize: 13,
      lineHeight: 20,
      color: p.text,
      marginBottom: 6,
    },
    pillarNote: {
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
    },
  });
}
