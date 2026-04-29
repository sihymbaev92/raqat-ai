import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { minutesUntilNextSalat } from "../utils/prayerSchedule";

type PrayerRow = { key: string; label: string; time: string };

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  rows: PrayerRow[];
  next: PrayerRow | null;
  pending?: boolean;
  momentBanner?: string | null;
};

function parseMinutes(t: string): number {
  const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return -1;
  return Number(m[1]) * 60 + Number(m[2]);
}

function timelineStateForRow(
  row: PrayerRow,
  next: PrayerRow | null,
  now: Date
): "past" | "current" | "next" | "upcoming" {
  const nowM = now.getHours() * 60 + now.getMinutes();
  const rowM = parseMinutes(row.time);
  if (next && row.key === next.key) return "next";
  if (rowM >= 0 && Math.abs(rowM - nowM) <= 2) return "current";
  if (rowM >= 0 && rowM < nowM) return "past";
  return "upcoming";
}

export function DashboardPrayerWidget({
  colors,
  isDark,
  rows,
  next,
  pending,
  momentBanner,
}: Props) {
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const [now, setNow] = useState(() => new Date());
  const until = minutesUntilNextSalat(rows, now);
  const leftText = kk.dashboard.formatApproxTimeLeft(until);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <View style={styles.card}>
      {momentBanner ? (
        <View style={styles.banner}>
          <MaterialIcons name="notifications-active" size={18} color={colors.accent} />
          <Text style={styles.bannerTxt} numberOfLines={2}>
            {momentBanner}
          </Text>
        </View>
      ) : null}

      <View style={styles.nextWrap}>
        <Text style={styles.nextKicker}>{kk.dashboard.nextPrayer}</Text>
        <Text style={styles.nextName} numberOfLines={1}>
          {next?.label ?? "—"}
        </Text>
        <Text style={styles.nextSub} numberOfLines={1}>
          {leftText}
        </Text>
      </View>

      <View style={styles.timelineWrap}>
        {rows.map((r, idx) => {
          const state = timelineStateForRow(r, next, now);
          const isNext = state === "next";
          const isCurrent = state === "current";
          const isPast = state === "past";
          const markerBg = isNext || isCurrent ? colors.accent : isPast ? colors.muted : "transparent";
          const markerBorder = isNext || isCurrent ? colors.accent : colors.border;
          const timeColor = isNext || isCurrent ? colors.accent : isPast ? colors.muted : colors.text;
          const labelColor = isNext || isCurrent ? colors.text : isPast ? colors.muted : colors.text;
          return (
            <View key={r.key} style={styles.timelineRow}>
              <View style={styles.timelineAxis}>
                <View style={[styles.timelineDot, { backgroundColor: markerBg, borderColor: markerBorder }]} />
                {idx < rows.length - 1 ? (
                  <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
                ) : null}
              </View>
              <Text style={[styles.timelineLabel, { color: labelColor }]} numberOfLines={1}>
                {r.label}
              </Text>
              <Text style={[styles.timelineTime, { color: timeColor }]} numberOfLines={1}>
                {r.time?.trim() ? r.time : "—"}
              </Text>
            </View>
          );
        })}
        {!rows.length && pending ? (
          <Text style={styles.pendingText}>Жүктелуде...</Text>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const border = isDark ? "rgba(34, 197, 94, 0.16)" : colors.border;
  return StyleSheet.create({
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: colors.card,
      padding: 10,
      marginBottom: 8,
      ...Platform.select({
        android: { elevation: isDark ? 4 : 2 },
        default: {},
      }),
    },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 6,
      marginBottom: 8,
      backgroundColor: isDark ? "rgba(212, 175, 55, 0.12)" : colors.accentSurface,
    },
    bannerTxt: { color: colors.text, fontSize: 12, fontWeight: "700", flex: 1 },
    nextWrap: { marginBottom: 6 },
    nextKicker: { color: colors.muted, fontSize: 10, fontWeight: "700" },
    nextName: { color: colors.text, fontSize: 17, fontWeight: "900", marginTop: 1 },
    nextSub: { color: colors.muted, fontSize: 11, marginTop: 1 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
    timelineWrap: {
      borderWidth: 1,
      borderColor: border,
      borderRadius: 12,
      backgroundColor: colors.bg,
      paddingVertical: 6,
      paddingHorizontal: 8,
      marginBottom: 6,
    },
    timelineRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 32,
    },
    timelineAxis: {
      width: 18,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 1.5,
      zIndex: 2,
    },
    timelineLine: {
      position: "absolute",
      top: 18,
      bottom: -18,
      width: 2,
      borderRadius: 1,
    },
    timelineLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      fontWeight: "700",
    },
    timelineTime: {
      fontSize: 14,
      fontWeight: "900",
      fontVariant: ["tabular-nums"],
    },
    pendingText: { color: colors.muted, fontSize: 12, marginTop: 4 },
  });
}

