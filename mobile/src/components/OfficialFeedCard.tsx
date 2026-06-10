import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RasterImage } from "@/ui/RasterImage";
import type { ThemeColors } from "../theme/colors";
import type { OfficialFeedItem } from "../types/officialFeedItem";
import { useAppTheme } from "../theme/ThemeContext";
import { HalalCertBadge } from "./HalalCertBadge";

type Props = {
  item: OfficialFeedItem;
  colors: ThemeColors;
  onPress?: () => void;
  onSecondaryPress?: () => void;
  secondaryLabel?: string;
  /** link — «Толық оқу»; ask — сұрақ қою */
  secondaryIcon?: "link" | "ask";
  accessibilityLabel?: string;
};

function sourceIcon(source: OfficialFeedItem["source"]): keyof typeof MaterialIcons.glyphMap {
  if (source === "halaldamu") return "storefront";
  return "menu-book";
}

export function OfficialFeedCard({
  item,
  colors,
  onPress,
  onSecondaryPress,
  secondaryLabel,
  secondaryIcon = "ask",
  accessibilityLabel,
}: Props) {
  const { isDark } = useAppTheme();
  const isHalal = item.source === "halaldamu";
  const styles = useMemo(() => makeStyles(colors, isHalal), [colors, isHalal]);

  return (
    <View style={styles.card}>
      {item.imageUrl ? (
        <RasterImage
          source={{ uri: item.imageUrl }}
          style={styles.thumb}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <MaterialIcons name={sourceIcon(item.source)} size={isHalal ? 28 : 26} color={colors.muted} />
        </View>
      )}
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.body, onPress && pressed && styles.pressed]}
        accessibilityRole={onPress ? "button" : "text"}
        accessibilityLabel={accessibilityLabel ?? item.title}
      >
        <Text style={styles.sourceLabel} numberOfLines={1}>
          {item.sourceLabel}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text style={styles.sub} numberOfLines={2}>
            {item.subtitle}
          </Text>
        ) : null}
        {item.excerpt ? (
          <Text style={styles.sub} numberOfLines={3}>
            {item.excerpt}
          </Text>
        ) : null}
        {item.badge ? (
          item.source === "halaldamu" ? (
            <HalalCertBadge status={item.badge} colors={colors} isDark={isDark} compact />
          ) : (
            <View style={[styles.kbBadge, { borderColor: colors.border, backgroundColor: colors.accentSurface }]}>
              <Text style={[styles.kbBadgeTxt, { color: colors.accent }]} numberOfLines={1}>
                {item.badge}
              </Text>
            </View>
          )
        ) : null}
      </Pressable>
      <View style={styles.trailingCol}>
        {onSecondaryPress && secondaryLabel ? (
          <Pressable
            onPress={onSecondaryPress}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={secondaryLabel}
          >
            <MaterialIcons
              name={secondaryIcon === "link" ? "open-in-new" : "chat-bubble-outline"}
              size={14}
              color="#fff"
            />
            <Text style={styles.secondaryBtnTxt}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
        {onPress ? (
          <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={item.title}>
            <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isHalal: boolean) {
  const thumbSize = isHalal ? 56 : 52;
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 10,
    },
    pressed: { opacity: 0.92 },
    thumb: {
      width: thumbSize,
      height: thumbSize,
      borderRadius: isHalal ? 12 : 10,
      borderWidth: isHalal ? StyleSheet.hairlineWidth : 0,
      borderColor: isHalal ? colors.border : "transparent",
      backgroundColor: isHalal ? colors.bg : "transparent",
    },
    thumbPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.bg,
    },
    body: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 2,
    },
    sourceLabel: {
      fontSize: 10,
      fontWeight: "800",
      color: colors.accent,
      marginBottom: 2,
      textTransform: "uppercase",
    },
    title: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
    },
    sub: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
      lineHeight: 17,
    },
    kbBadge: {
      alignSelf: "flex-start",
      marginTop: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
    },
    kbBadgeTxt: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    secondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
      marginTop: 8,
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },
    secondaryBtnTxt: {
      fontSize: 12,
      fontWeight: "800",
      color: "#fff",
    },
    trailingCol: {
      alignItems: "flex-end",
      justifyContent: "center",
      gap: 6,
    },
  });
}
