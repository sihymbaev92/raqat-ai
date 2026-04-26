import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { cityLabelKkForApiName } from "../constants/kzCities";
import {
  minutesUntilNextSalat,
  progressBetweenScheduledPrayers,
} from "../utils/prayerSchedule";
import { formatKkGregorianDate, formatKkHijriUmmAlQura } from "../utils/formatKkDate";

type Row = { key: string; label: string; time: string };

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  cityApiName: string;
  next: Row | null;
  /** Барлығы (күн шайқауы) — прогресс жолағы */
  allRows: Row[];
  onPress: () => void;
  /** Намаз минуты баннері */
  momentBanner: string | null;
  compact?: boolean;
};

function formatClock(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function DashboardNextPrayerHero({
  colors,
  isDark,
  cityApiName,
  next,
  allRows,
  onPress,
  momentBanner,
  compact = false,
}: Props) {
  const [now, setNow] = useState(() => new Date());
  const city = cityLabelKkForApiName(cityApiName) || "—";
  const times = allRows.map((r) => r.time);
  const progress = allRows.length >= 2 ? progressBetweenScheduledPrayers(times, now) : 0;
  const until = minutesUntilNextSalat(allRows, now);
  const sub = kk.dashboard.formatApproxTimeLeft(until);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const showNext = next && allRows.length > 0;

  const acc = colors.accent;
  const borderGlow = isDark ? colors.accentSurfaceStrong : colors.border;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        {
          backgroundColor: colors.card,
          borderColor: borderGlow,
          opacity: pressed ? 0.95 : 1,
          ...Platform.select({
            ios: {
              shadowColor: acc,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
            },
            default: {},
          }),
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={kk.dashboard.prayerCardA11y}
    >
      {momentBanner ? (
        <View
          style={[
            styles.banner,
            compact && styles.bannerCompact,
            { backgroundColor: isDark ? "rgba(212, 175, 55, 0.1)" : colors.accentSurface },
          ]}
        >
          <MaterialIcons name="notifications-active" size={18} color={acc} />
          <Text style={[styles.bannerTxt, { color: colors.text }]} numberOfLines={2}>
            {momentBanner}
          </Text>
        </View>
      ) : null}

      <View style={styles.topRow}>
        <View style={styles.locChip}>
          <MaterialIcons name="place" size={16} color={acc} />
          <Text style={[styles.locTxt, { color: colors.muted }]} numberOfLines={1}>
            {city}
          </Text>
        </View>
        <View style={styles.timeCol}>
          <Text style={[styles.clock, compact && styles.clockCompact, { color: colors.text }]}>{formatClock(now)}</Text>
          <Text style={[styles.dateLine, { color: colors.muted }]} numberOfLines={1}>
            {formatKkGregorianDate(now)}
          </Text>
          <Text style={[styles.hijriLine, { color: colors.muted }]} numberOfLines={1}>
            {formatKkHijriUmmAlQura(now)}
          </Text>
        </View>
      </View>

      {showNext ? (
        <>
          <Text style={[styles.kicker, compact && styles.kickerCompact, { color: colors.muted }]}>{kk.dashboard.nextPrayer}</Text>
          <Text style={[styles.bigName, compact && styles.bigNameCompact, { color: colors.text }]} numberOfLines={1}>
            {next.label}
          </Text>
          <Text style={[styles.subLeft, compact && styles.subLeftCompact, { color: colors.muted }]} numberOfLines={2}>
            {sub}
          </Text>
        </>
      ) : (
        <Text style={[styles.subLeft, { color: colors.muted }]}>{kk.dashboard.loadError}</Text>
      )}

      <View
        style={[
          styles.barTrack,
          {
            backgroundColor: isDark ? "rgba(212, 175, 55, 0.12)" : "rgba(20, 45, 32, 0.08)",
          },
        ]}
      >
        <View
          style={[
            styles.barFill,
            { width: `${Math.round(progress * 1000) / 10}%`, backgroundColor: acc },
          ]}
        />
      </View>

    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    ...Platform.select({
      android: { elevation: 3 },
      default: {},
    }),
  },
  cardCompact: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  bannerTxt: { flex: 1, fontSize: 13, fontWeight: "700" },
  bannerCompact: {
    marginBottom: 6,
    paddingVertical: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  locChip: { flexDirection: "row", alignItems: "center", gap: 4, maxWidth: "50%" },
  locTxt: { fontSize: 14, fontWeight: "800" },
  timeCol: { alignItems: "flex-end", maxWidth: "50%" },
  clock: { fontSize: 17, fontWeight: "800" },
  clockCompact: { fontSize: 15 },
  dateLine: { fontSize: 12, fontWeight: "700", marginTop: 2, textAlign: "right" },
  hijriLine: { fontSize: 11, fontWeight: "600", marginTop: 1, textAlign: "right", opacity: 0.92 },
  kicker: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  kickerCompact: { fontSize: 12, marginBottom: 0 },
  bigName: { fontSize: 30, fontWeight: "900", letterSpacing: 0.3, marginBottom: 4 },
  bigNameCompact: { fontSize: 24, marginBottom: 2 },
  subLeft: { fontSize: 14, lineHeight: 20, fontWeight: "600", marginBottom: 12 },
  subLeftCompact: { fontSize: 12, lineHeight: 17, marginBottom: 8 },
  barTrack: {
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  barFill: { height: "100%", borderRadius: 4 },
});
