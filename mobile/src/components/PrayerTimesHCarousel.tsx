import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";
import type { ThemeColors } from "../theme/colors";
import { shortPrayerName } from "./CompactPrayerTimesRow";

type Mci = ComponentProps<typeof MaterialCommunityIcons>["name"];

type Cell = { key: string; time: string };

const ICON: Record<string, Mci> = {
  fajr: "weather-sunset-up",
  sun: "white-balance-sunny",
  dhuhr: "weather-sunny",
  asr: "clock-time-four-outline",
  maghrib: "weather-sunset-down",
  isha: "moon-waning-crescent",
};

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  cells: Cell[];
  highlightKey?: string;
  /** Жүктелуде */
  pending?: boolean;
};

export function PrayerTimesHCarousel({ colors, isDark, cells, highlightKey, pending }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroller}
    >
      {pending
        ? [0, 1, 2, 3].map((i) => (
            <View key={`ph-${i}`} style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={{ color: colors.muted, fontSize: 11 }}>…</Text>
            </View>
          ))
        : cells.map((c) => {
            const name = shortPrayerName(c.key);
            const active = c.key === highlightKey;
            const ico = ICON[c.key] ?? "clock-outline";
            return (
              <View
                key={c.key}
                style={[
                  styles.card,
                  {
                    borderColor: active
                      ? isDark
                        ? "rgba(212, 175, 55, 0.75)"
                        : colors.accentDark
                      : colors.border,
                    backgroundColor: colors.card,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconChip,
                    {
                      backgroundColor: active
                        ? isDark
                          ? "rgba(212, 175, 55, 0.2)"
                          : "rgba(20, 45, 32, 0.1)"
                        : isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(20, 45, 32, 0.06)",
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={ico} size={16} color={colors.accent} />
                </View>
                <Text style={[styles.n, { color: colors.text }]} numberOfLines={1}>
                  {name}
                </Text>
                <Text style={[styles.t, { color: active ? colors.text : colors.muted }]} numberOfLines={1}>
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
});
