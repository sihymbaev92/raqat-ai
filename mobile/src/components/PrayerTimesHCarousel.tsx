import React from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";
import type { ThemeColors } from "../theme/colors";
import { shortPrayerName } from "./CompactPrayerTimesRow";

type Mci = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Cell = { key: string; time: string };

const ICON: Record<string, Mci> = {
  fajr: "moon-waxing-crescent",
  sun: "weather-sunset-up",
  dhuhr: "white-balance-sunny",
  asr: "timer-sand",
  maghrib: "weather-sunset-down",
  isha: "weather-night",
};

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  cells: Cell[];
  highlightKey?: string;
  /** Жүктелуде */
  pending?: boolean;
  /** Фото фондағы намаз экраны: қою шыны + ақ жазу */
  lightGlass?: boolean;
};

const GLASS_CARD = "rgba(8, 10, 14, 0.82)";
const GLASS_BORDER = "rgba(255,255,255,0.14)";
const INK = "rgba(255,255,255,0.95)";
const INK_DIM = "rgba(255,255,255,0.82)";

export function PrayerTimesHCarousel({
  colors,
  isDark,
  cells,
  highlightKey,
  pending,
  lightGlass = false,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroller}
    >
      {pending
        ? [0, 1, 2, 3, 4, 5].map((i) => (
            <View
              key={`ph-${i}`}
              style={[
                styles.card,
                lightGlass
                  ? { borderColor: GLASS_BORDER, backgroundColor: GLASS_CARD }
                  : { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              {i === 0 ? (
                <ActivityIndicator
                  size="small"
                  color={lightGlass ? "#FFFFFF" : colors.accent}
                  style={styles.pendingSpinner}
                />
              ) : (
                <View
                  style={[
                    styles.iconChip,
                    {
                      backgroundColor: lightGlass
                        ? "rgba(255,255,255,0.08)"
                        : isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(20, 45, 32, 0.06)",
                      opacity: 0.55,
                    },
                  ]}
                />
              )}
            </View>
          ))
        : cells.map((c) => {
            const name = shortPrayerName(c.key);
            const active = c.key === highlightKey;
            const ico = ICON[c.key] ?? "clock-outline";
            const cardBorder = lightGlass
              ? active
                ? "rgba(255, 220, 170, 0.85)"
                : GLASS_BORDER
              : active
                ? isDark
                  ? "rgba(212, 175, 55, 0.75)"
                  : colors.accentDark
                : colors.border;
            const cardBg = lightGlass ? GLASS_CARD : colors.card;
            const chipBg = lightGlass
              ? active
                ? "rgba(255, 220, 170, 0.22)"
                : "rgba(255,255,255,0.08)"
              : active
                ? isDark
                  ? "rgba(212, 175, 55, 0.2)"
                  : "rgba(20, 45, 32, 0.1)"
                : isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(20, 45, 32, 0.06)";
            const iconColor = lightGlass ? (active ? "#FFF8E7" : INK) : colors.accent;
            const nameColor = lightGlass ? INK_DIM : colors.text;
            const timeColor = lightGlass
              ? active
                ? "#FFFFFF"
                : INK_DIM
              : active
                ? colors.text
                : isDark
                  ? "rgba(242, 244, 245, 0.88)"
                  : "rgba(15, 23, 42, 0.82)";
            return (
              <View
                key={c.key}
                style={[
                  styles.card,
                  {
                    borderColor: cardBorder,
                    backgroundColor: cardBg,
                  },
                ]}
              >
                <View style={[styles.iconChip, { backgroundColor: chipBg }]}>
                  <MaterialCommunityIcons name={ico} size={16} color={iconColor} />
                </View>
                <Text style={[styles.n, { color: nameColor }]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.t, { color: timeColor }]} numberOfLines={1}>
                  {c.time || "—"}
                </Text>
              </View>
            );
          })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  card: {
    width: 92,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  iconChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  n: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  t: { fontSize: 14, fontWeight: "900", marginTop: 2, textAlign: "center" },
  pendingSpinner: { marginVertical: 10 },
});
