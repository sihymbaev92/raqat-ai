import React, { type ComponentProps } from "react";
import { View, Text, StyleSheet, Platform, ScrollView } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import { parseMinutes, nextSalatHighlightKey } from "../utils/prayerSchedule";

export type PrayerTimeCell = { key: string; time: string };

const KEYS = ["fajr", "sun", "dhuhr", "asr", "maghrib", "isha"] as const;

/** Бір қатардағы кесте үшін қысқа атаулар (басты экран = уақыт табы) */
export function shortPrayerName(key: string): string {
  const m: Record<string, string> = {
    fajr: kk.prayer.fajrShort,
    sun: kk.prayer.sunriseShort,
    dhuhr: kk.prayer.dhuhrShort,
    asr: kk.prayer.asrShort,
    maghrib: kk.prayer.maghribShort,
    isha: kk.prayer.ishaShort,
  };
  return m[key] ?? key;
}

type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type PrayerVisual = { icon: MciName; fg: string; soft: string };

/** Әр намазға тән түс пен иконка — UI бөліктерінде қайта қолдану үшін export */
export function prayerVisual(key: string, isDark: boolean): PrayerVisual {
  /** Жұмсақ пастель: ашық темада тұнық, қараңғыда күйдірілмеген рең */
  const v: Record<string, { light: Omit<PrayerVisual, "icon"> & { icon: MciName }; dark: Omit<PrayerVisual, "icon"> & { icon: MciName } }> = {
    fajr: {
      light: { icon: "moon-waxing-crescent", fg: "#5b8fc9", soft: "rgba(186, 230, 253, 0.72)" },
      dark: { icon: "moon-waxing-crescent", fg: "#93c5fd", soft: "rgba(59, 130, 246, 0.18)" },
    },
    sun: {
      light: { icon: "weather-sunset-up", fg: "#c9a227", soft: "rgba(254, 243, 199, 0.85)" },
      dark: { icon: "weather-sunset-up", fg: "#fcd34d", soft: "rgba(251, 191, 36, 0.16)" },
    },
    dhuhr: {
      light: { icon: "white-balance-sunny", fg: "#b8860b", soft: "rgba(253, 230, 138, 0.55)" },
      dark: { icon: "white-balance-sunny", fg: "#fde68a", soft: "rgba(245, 158, 11, 0.14)" },
    },
    asr: {
      light: { icon: "timer-sand", fg: "#c0846d", soft: "rgba(255, 228, 210, 0.85)" },
      dark: { icon: "timer-sand", fg: "#fdba9c", soft: "rgba(251, 146, 60, 0.14)" },
    },
    maghrib: {
      light: { icon: "weather-sunset-down", fg: "#b87070", soft: "rgba(254, 215, 215, 0.65)" },
      dark: { icon: "weather-sunset-down", fg: "#fca5a5", soft: "rgba(248, 113, 113, 0.14)" },
    },
    isha: {
      light: { icon: "weather-night", fg: "#8b7fc7", soft: "rgba(221, 214, 254, 0.75)" },
      dark: { icon: "weather-night", fg: "#c4b5fd", soft: "rgba(139, 92, 246, 0.18)" },
    },
  };
  const p = v[key];
  if (!p) {
    return {
      icon: "clock-outline",
      fg: isDark ? "#94a3b8" : "#64748b",
      soft: isDark ? "rgba(148, 163, 184, 0.12)" : "rgba(100, 116, 139, 0.1)",
    };
  }
  const x = isDark ? p.dark : p.light;
  return { icon: x.icon, fg: x.fg, soft: x.soft };
}

const EMPTY: PrayerTimeCell[] = KEYS.map((key) => ({ key, time: "" }));

type Props = {
  colors: ThemeColors;
  rows: PrayerTimeCell[];
  /** Дерек жоқ, желі күтілуде */
  pending?: boolean;
  /** Толық намаз уақыты экранына өту */
  onPressOpen?: () => void;
  /** Басқа карта ішінде: шекарасыз, фонсыз */
  embedded?: boolean;
  /** 6 жол: әр намаз жеке қатар, кішірек (басты экран кестесі) */
  sixRows?: boolean;
  /** Басты бет: алты жол (тормен сәйкес ірі қаріп) */
  sixRowsCompact?: boolean;
  /** Келесі намаз жолын ерекшелеу (мысалы next.key) */
  highlightKey?: string;
  /** Қараңғы тема — жол фондарының контрасты */
  isDark?: boolean;
  /** Басты бетті бір экранға сыйғызу: бір қатардағы әріптер мен сағат кішірек */
  compact?: boolean;
  /** Толық экран: алты намаз тік тізім (скроллсыз кесте) — `sixRows` орнына */
  scheduleList?: boolean;
};

/**
 * Бір қатардағы 6 намаз — скролл жоқ, экран ені бойынша әрқашан компакт.
 */
function RowCells({
  slice,
  styles,
  compact,
  colors,
  isDark,
}: {
  slice: PrayerTimeCell[];
  styles: ReturnType<typeof makeStyles>;
  compact?: boolean;
  colors: ThemeColors;
  isDark?: boolean;
}) {
  const ab = compact ? styles.abbrCompact : styles.abbr;
  const ck = compact ? styles.clockCompact : styles.clock;
  const dark = Boolean(isDark);
  return (
    <View style={styles.row}>
      {slice.map((r, idx) => {
        const pv = prayerVisual(r.key, dark);
        const iconSz = compact ? 16 : 19;
        return (
          <View
            key={r.key}
            style={[
              styles.cell,
              idx < slice.length - 1 && styles.cellWithDivider,
              { borderRightColor: colors.border },
            ]}
          >
            <View style={[styles.cellIconBadge, { backgroundColor: pv.soft }]}>
              <MaterialCommunityIcons name={pv.icon} size={iconSz} color={pv.fg} />
            </View>
            <Text style={[ab, r.key === "isha" && styles.abbrIsha]} numberOfLines={1}>
              {shortPrayerName(r.key)}
            </Text>
            <Text style={[ck, { color: pv.fg }]} numberOfLines={1}>
              {r.time?.trim() ? r.time : "—"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function CompactPrayerTimesRow({
  colors,
  rows,
  pending,
  onPressOpen,
  embedded,
  sixRows,
  sixRowsCompact,
  highlightKey,
  isDark,
  compact,
  scheduleList,
}: Props) {
  useAppLocale();
  const styles = makeStyles(
    colors,
    isDark,
    Boolean(sixRows && sixRowsCompact),
    compact,
    Boolean(scheduleList)
  );
  const data = rows.length > 0 ? rows : EMPTY;
  const wrapStyle = embedded
    ? [styles.cardEmbedded, compact && styles.cardEmbeddedDense]
    : styles.card;
  const dark = Boolean(isDark);

  const inner = (
    <>
      {pending ? (
        <View style={styles.pendingBadge}>
          <RaqatOrnamentSpinner size={28} />
        </View>
      ) : null}
      {scheduleList ? (
        <View style={styles.scheduleWrap}>
          {data.map((r, idx) => {
            const hk = highlightKey ?? nextSalatHighlightKey(data);
            const highlighted = Boolean(hk && r.key === hk);
            const iconSz = 21;
            const pv = prayerVisual(r.key, dark);
            return (
              <View
                key={r.key}
                style={[
                  styles.scheduleRow,
                  idx === data.length - 1 && styles.scheduleRowLast,
                  highlighted && styles.scheduleRowHot,
                  highlighted && { borderLeftColor: pv.fg, backgroundColor: pv.soft },
                ]}
              >
                <View style={styles.scheduleLeft}>
                  <View style={[styles.scheduleIcon, { backgroundColor: pv.soft }]}>
                    <MaterialCommunityIcons name={pv.icon} size={iconSz} color={pv.fg} />
                  </View>
                  <Text style={styles.scheduleName} numberOfLines={1}>
                    {shortPrayerName(r.key)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.scheduleTime,
                    { color: pv.fg },
                    highlighted && styles.scheduleTimeHot,
                  ]}
                  numberOfLines={1}
                >
                  {r.time?.trim() ? r.time : "—"}
                </Text>
              </View>
            );
          })}
        </View>
      ) : sixRows ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScrollContent}
          nestedScrollEnabled
        >
          {data.map((r) => {
            const hk = highlightKey ?? nextSalatHighlightKey(data);
            const highlighted = Boolean(hk && r.key === hk);
            const iconSz = sixRowsCompact ? 17 : 20;
            const pv = prayerVisual(r.key, dark);
            return (
              <View
                key={r.key}
                style={[
                  styles.hChip,
                  embedded && styles.hChipEmbedded,
                  highlighted && styles.hChipHot,
                  highlighted && { borderColor: pv.fg, backgroundColor: pv.soft },
                ]}
              >
                <View style={[styles.hChipIcon, { backgroundColor: pv.soft }]}>
                  <MaterialCommunityIcons name={pv.icon} size={iconSz} color={pv.fg} />
                </View>
                <Text style={styles.hChipAbbr} numberOfLines={1}>
                  {shortPrayerName(r.key)}
                </Text>
                <Text
                  style={[styles.hChipTime, highlighted && styles.hChipTimeHot, { color: pv.fg }]}
                  numberOfLines={1}
                >
                  {r.time?.trim() ? r.time : "—"}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <RowCells slice={data} styles={styles} compact={compact} colors={colors} isDark={isDark} />
      )}
    </>
  );

  if (onPressOpen) {
    return (
      <Pressable
        style={({ pressed }) => [wrapStyle, pressed && styles.cardPressed]}
        onPress={onPressOpen}
        accessibilityRole="button"
      >
        {inner}
      </Pressable>
    );
  }

  return <View style={wrapStyle}>{inner}</View>;
}

function makeStyles(
  colors: ThemeColors,
  isDark?: boolean,
  sixCompact?: boolean,
  rowCompact?: boolean,
  scheduleList?: boolean
) {
  const rc = Boolean(rowCompact);
  const chipBg = isDark ? "rgba(38, 166, 154, 0.12)" : colors.bg;
  const hChipW = sixCompact ? 76 : 88;
  const cardShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: isDark ? 12 : 10,
    },
    android: { elevation: isDark ? 1 : 0 },
    default: {},
  });

  return StyleSheet.create({
    card: {
      position: "relative",
      backgroundColor: colors.card,
      borderRadius: scheduleList ? 18 : 22,
      paddingVertical: scheduleList ? 4 : 12,
      paddingHorizontal: scheduleList ? 0 : 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 6,
      ...cardShadow,
    },
    /** Тік кесте: бір намаз — бір жол */
    scheduleWrap: {
      borderRadius: 14,
      overflow: "hidden",
    },
    scheduleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: "transparent",
      backgroundColor: colors.card,
    },
    scheduleRowLast: {
      borderBottomWidth: 0,
    },
    scheduleRowHot: {
      borderLeftWidth: 3,
    },
    scheduleLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },
    scheduleIcon: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    scheduleName: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "700",
      flex: 1,
    },
    scheduleTime: {
      fontSize: 19,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
      marginLeft: 8,
    },
    scheduleTimeHot: {
      fontSize: 20,
      fontWeight: "800",
    },
    cardEmbedded: {
      position: "relative",
      backgroundColor: "transparent",
      borderRadius: 0,
      paddingVertical: 4,
      paddingHorizontal: 0,
      borderWidth: 0,
      marginBottom: 0,
    },
    cardEmbeddedDense: {
      paddingVertical: 0,
    },
    cardPressed: {
      opacity: 0.92,
    },
    pendingBadge: {
      position: "absolute",
      right: 8,
      top: 6,
      zIndex: 1,
    },
    /** Алты намаз — горизонтал карусель түймелер */
    hScrollContent: {
      flexDirection: "row",
      gap: sixCompact ? 8 : 10,
      paddingVertical: 2,
      paddingRight: 4,
    },
    hChip: {
      width: hChipW,
      alignItems: "center",
      paddingVertical: sixCompact ? 10 : 12,
      paddingHorizontal: 6,
      borderRadius: sixCompact ? 17 : 19,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: chipBg,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.12 : 0.04,
          shadowRadius: 5,
        },
        android: { elevation: isDark ? 0 : 1 },
        default: {},
      }),
    },
    hChipEmbedded: {
      borderColor: isDark ? colors.border : `${colors.border}99`,
      backgroundColor: isDark ? "transparent" : `${colors.card}cc`,
    },
    hChipHot: {
      borderWidth: 2,
    },
    hChipIcon: {
      width: sixCompact ? 34 : 38,
      height: sixCompact ? 34 : 38,
      borderRadius: sixCompact ? 11 : 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: sixCompact ? 5 : 6,
    },
    hChipAbbr: {
      color: colors.muted,
      fontSize: sixCompact ? 10 : 11,
      fontWeight: "700",
      marginBottom: 2,
    },
    hChipTime: {
      fontSize: sixCompact ? 14 : 16,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    hChipTimeHot: {
      fontSize: sixCompact ? 15 : 17,
      fontWeight: "800",
    },
    row: {
      flexDirection: "row",
      alignItems: "stretch",
      paddingVertical: 4,
    },
    cell: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
      paddingVertical: 6,
    },
    cellWithDivider: {
      borderRightWidth: StyleSheet.hairlineWidth,
    },
    cellIconBadge: {
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: rc ? 5 : 6,
      paddingVertical: rc ? 4 : 5,
      borderRadius: 10,
      marginBottom: 5,
      minWidth: rc ? 30 : 34,
      minHeight: rc ? 26 : 30,
    },
    abbr: {
      color: colors.muted,
      fontSize: 11,
      marginBottom: 3,
      textAlign: "center",
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    clock: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: "900",
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
    abbrCompact: {
      color: colors.muted,
      fontSize: 9,
      marginBottom: 1,
      textAlign: "center",
      fontWeight: "800",
    },
    abbrIsha: {
      fontSize: rc ? 8 : 10,
      fontWeight: "700",
    },
    clockCompact: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "900",
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
  });
}
