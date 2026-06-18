import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  type ImageSourcePropType,
} from "react-native";
import { RasterImage } from "@/ui/RasterImage";
import type { ThemeColors } from "../theme/colors";
import { BRAND_FONT_FACE } from "../fonts/brandFont";

export type HubHeroVariant = "halal" | "ai";

type Props = {
  variant: HubHeroVariant;
  title: string;
  lead?: string;
  image: ImageSourcePropType;
  colors: ThemeColors;
  isDark: boolean;
  /** Жоғарғы жол (мыс. halaldamu.kz) */
  eyebrow?: string;
  /** eyebrow үшін uppercase (AI: «Сұрақ-жауап» қалыпты регистр) */
  eyebrowUppercase?: boolean;
  /** Қысқа белгілер */
  tags?: string[];
  /** AI хабы: кіші hero */
  compact?: boolean;
};

/**
 * Халал Даму / RAHAT OMIR AI хаб экрандары — басты бет промосынан ірі және жүйелі.
 */
export function HubScreenHero({
  variant,
  title,
  lead,
  image,
  colors,
  isDark,
  eyebrow,
  eyebrowUppercase = true,
  tags = [],
  compact = false,
}: Props) {
  const palette = useMemo(() => heroPalette(variant, colors, isDark), [variant, colors, isDark]);
  const styles = useMemo(() => makeStyles(colors, palette, compact), [colors, palette, compact]);

  return (
    <View style={styles.card}>
      <View style={styles.logoPlate}>
        <View style={styles.logoInset}>
          <RasterImage
            source={image}
            style={styles.logo}
            resizeMode={variant === "ai" ? "cover" : "contain"}
            resizeMethod={Platform.OS === "android" ? "resize" : undefined}
            resizeMultiplier={Platform.OS === "android" ? 0.7 : undefined}
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>
      <View style={styles.textCol}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, !eyebrowUppercase && styles.eyebrowNormalCase]}>{eyebrow}</Text>
        ) : null}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {lead?.trim() ? <Text style={styles.lead}>{lead.trim()}</Text> : null}
        {tags.length > 0 ? (
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagTxt} numberOfLines={1}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function heroPalette(variant: HubHeroVariant, colors: ThemeColors, isDark: boolean) {
  if (variant === "halal") {
    return {
      cardBg: isDark ? "rgba(4, 120, 87, 0.12)" : "#f0fdf6",
      cardBorder: isDark ? "rgba(52, 211, 153, 0.35)" : "#86efac",
      plateBg: isDark ? "rgba(6, 95, 70, 0.35)" : "#ffffff",
      plateBorder: isDark ? "rgba(52, 211, 153, 0.65)" : "#34d399",
      eyebrow: isDark ? "#6ee7b7" : "#047857",
      title: colors.text,
      lead: colors.muted,
      tagBg: isDark ? "rgba(16, 185, 129, 0.2)" : "#dcfce7",
      tagText: isDark ? "#a7f3d0" : "#065f46",
      tagBorder: isDark ? "rgba(52, 211, 153, 0.4)" : "#bbf7d0",
    };
  }
  return {
    cardBg: isDark ? colors.accentSurface : "#f0fdfa",
    cardBorder: isDark ? colors.accentSurfaceStrong : "rgba(38, 166, 154, 0.45)",
    plateBg: isDark ? colors.card : "#ffffff",
    plateBorder: isDark ? colors.accent : "rgba(38, 166, 154, 0.75)",
    eyebrow: colors.accent,
    title: colors.text,
    lead: colors.muted,
    tagBg: isDark ? colors.accentSurfaceStrong : colors.accentSurface,
    tagText: isDark ? colors.accent : colors.accentDark,
    tagBorder: isDark ? colors.border : "rgba(38, 166, 154, 0.35)",
  };
}

function makeStyles(
  colors: ThemeColors,
  palette: ReturnType<typeof heroPalette>,
  compact: boolean
) {
  const logoPlate = compact ? 64 : 96;
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: compact ? 10 : 16,
      padding: compact ? 10 : 16,
      borderRadius: compact ? 14 : 20,
      marginBottom: compact ? 8 : 14,
      backgroundColor: palette.cardBg,
      borderWidth: 1,
      borderColor: palette.cardBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: { elevation: 3 },
        default: {},
      }),
    },
    logoPlate: {
      width: 96,
      height: 96,
      flexShrink: 0,
      borderRadius: 18,
      backgroundColor: palette.plateBg,
      borderWidth: 2,
      borderColor: palette.plateBorder,
      alignItems: "center",
      justifyContent: "center",
      padding: 3,
      overflow: "hidden",
    },
    logoInset: {
      flex: 1,
      alignSelf: "stretch",
      alignItems: "center",
      justifyContent: "center",
    },
    logo: {
      width: "92%",
      height: "92%",
    },
    textCol: {
      flex: 1,
      minWidth: 0,
    },
    eyebrow: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: palette.eyebrow,
      marginBottom: 4,
    },
    eyebrowNormalCase: {
      textTransform: "none",
      letterSpacing: 0.2,
      fontSize: 13,
    },
    title: {
      fontSize: compact ? 18 : 24,
      fontWeight: "900",
      lineHeight: compact ? 22 : 28,
      color: palette.title,
      letterSpacing: 0.2,
      ...Platform.select({
        android: { fontFamily: BRAND_FONT_FACE.extrabold },
        default: {},
      }),
    },
    lead: {
      fontSize: 14,
      lineHeight: 21,
      color: palette.lead,
      marginTop: 8,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: compact ? 4 : 6,
      marginTop: compact ? 6 : 12,
    },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: palette.tagBg,
      borderWidth: 1,
      borderColor: palette.tagBorder,
      maxWidth: "100%",
    },
    tagTxt: {
      fontSize: 11,
      fontWeight: "800",
      color: palette.tagText,
    },
  });
}
