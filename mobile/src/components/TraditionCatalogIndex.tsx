import React from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";

export type TraditionCatalogSectionKey = "greatWords" | "books";

type CatalogItem = {
  key: TraditionCatalogSectionKey;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  badge?: string;
};

type Props = {
  colors: ThemeColors;
  title: string;
  hint: string;
  openCta: string;
  items: CatalogItem[];
  onSelect: (key: TraditionCatalogSectionKey) => void;
};

export function TraditionCatalogIndex({ colors, title, hint, openCta, items, onSelect }: Props) {
  const styles = React.useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.hint} selectable>
        {hint}
      </Text>
      <View style={styles.grid}>
        {items.map((item, index) => (
          <Pressable
            key={item.key}
            oyuBackdrop={false}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => onSelect(item.key)}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}. ${item.subtitle}`}
          >
            <View style={styles.cardTop}>
              <View style={styles.numBadge}>
                <Text style={styles.numTxt}>{index + 1}</Text>
              </View>
              <MaterialIcons name={item.icon} size={26} color={colors.accent} />
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeTxt}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSub} numberOfLines={3}>
              {item.subtitle}
            </Text>
            <View style={styles.cardFoot}>
              <Text style={styles.cardCta}>{openCta}</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.accent} />
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: 14,
    },
    title: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.text,
      marginBottom: 4,
    },
    hint: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
      marginBottom: 12,
    },
    grid: {
      gap: 10,
    },
    card: {
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      padding: 14,
    },
    cardPressed: { opacity: 0.92 },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    numBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    numTxt: { fontSize: 12, fontWeight: "900", color: colors.accent },
    badge: {
      marginLeft: "auto",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: colors.accentSurface,
    },
    badgeTxt: { fontSize: 10, fontWeight: "800", color: colors.accent },
    cardTitle: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.text,
    },
    cardSub: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
      marginTop: 6,
    },
    cardFoot: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 10,
      gap: 2,
    },
    cardCta: { fontSize: 13, fontWeight: "800", color: colors.accent },
  });
}
