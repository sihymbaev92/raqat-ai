import React, { type ComponentProps } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Platform } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";

export type PrayerTimeCell = { key: string; time: string };

const KEYS = ["fajr", "sun", "dhuhr", "asr", "maghrib", "isha"] as const;

/** Бір қатардағы кесте үшін қысқа атаулар (басты экран = уақыт табы) */
export function shortPrayerName(key: string): string {
  const m: Record<string, string> = {
    fajr: "Таң",
    sun: "Күн",
    dhuhr: "Бесін",
    asr: "Екінті",
    maghrib: "Ақшам",
    isha: "Құптан",
  };
  return m[key] ?? key;
}

function longPrayerName(key: string): string {
  const m: Record<string, string> = {
    fajr: kk.prayer.fajr,
    sun: kk.prayer.sunrise,
    dhuhr: kk.prayer.dhuhr,
    asr: kk.prayer.asr,
    maghrib: kk.prayer.maghrib,
    isha: kk.prayer.isha,
  };
  return m[key] ?? shortPrayerName(key);
}

type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type PrayerVisual = { icon: MciName; fg: string; soft: string };

/** Әр намазға тән түс пен иконка — «сурет» орнына түсті белгіше */
function prayerVisual(key: string, isDark: boolean): PrayerVisual {
  const v: Record<string, { light: Omit<PrayerVisual, "icon"> & { icon: MciName }; dark: Omit<PrayerVisual, "icon"> & { icon: MciName } }> = {
    fajr: {
      light: { icon: "weather-sunset-up", fg: "#0369a1", soft: "rgba(14, 165, 233, 0.16)" },
      dark: { icon: "weather-sunset-up", fg: "#7dd3fc", soft: "rgba(56, 189, 248, 0.22)" },
    },
    sun: {
      light: { icon: "white-balance-sunny", fg: "#ca8a04", soft: "rgba(234, 179, 8, 0.18)" },
      dark: { icon: "white-balance-sunny", fg: "#fde047", soft: "rgba(250, 204, 21, 0.2)" },
    },
    dhuhr: {
      light: { icon: "weather-sunny", fg: "#a16207", soft: "rgba(250, 204, 21, 0.2)" },
      dark: { icon: "weather-sunny", fg: "#facc15", soft: "rgba(234, 179, 8, 0.18)" },
    },
    asr: {
      light: { icon: "clock-time-four-outline", fg: "#c2410c", soft: "rgba(251, 146, 60, 0.16)" },
      dark: { icon: "clock-time-four-outline", fg: "#fdba74", soft: "rgba(249, 115, 22, 0.2)" },
    },
    maghrib: {
      light: { icon: "weather-sunset-down", fg: "#c2410c", soft: "rgba(249, 115, 22, 0.18)" },
      dark: { icon: "weather-sunset-down", fg: "#fb923c", soft: "rgba(234, 88, 12, 0.22)" },
    },
    isha: {
      light: { icon: "moon-waning-crescent", fg: "#5b21b6", soft: "rgba(139, 92, 246, 0.14)" },
      dark: { icon: "moon-waning-crescent", fg: "#c4b5fd", soft: "rgba(167, 139, 250, 0.2)" },
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
}: Props) {
  const styles = makeStyles(colors, isDark, Boolean(sixRows && sixRowsCompact), compact);
  const data = rows.length > 0 ? rows : EMPTY;
  const wrapStyle = embedded
    ? [styles.cardEmbedded, compact && styles.cardEmbeddedDense]
    : styles.card;
  const dark = Boolean(isDark);

  const inner = (
    <>
      {pending ? (
        <View style={styles.pendingBadge}>
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      ) : null}
      {sixRows ? (
        <View style={styles.sixStack}>
          {data.map((r, i) => {
            const highlighted = Boolean(highlightKey && r.key === highlightKey);
            const iconSz = sixRowsCompact ? 19 : 24;
            const pv = prayerVisual(r.key, dark);
            return (
              <View
                key={r.key}
                style={[
                  styles.stackChip,
                  embedded && styles.stackChipEmbedded,
                  i === data.length - 1 && styles.stackChipLast,
                  highlighted && styles.stackChipHighlight,
                  highlighted && { borderLeftColor: pv.fg, backgroundColor: pv.soft },
                ]}
              >
                <View style={[styles.stackIconBadge, { backgroundColor: pv.soft }]}>
                  <MaterialCommunityIcons name={pv.icon} size={iconSz} color={pv.fg} />
                </View>
                <Text style={[styles.stackLabel, r.key === "isha" && styles.stackLabelIsha]} numberOfLines={1}>
                  {longPrayerName(r.key)}
                </Text>
                <Text
                  style={[styles.stackTime, highlighted && styles.stackTimeHighlight, { color: pv.fg }]}
                  numberOfLines={1}
                >
                  {r.time?.trim() ? r.time : "—"}
                </Text>
              </View>
            );
          })}
        </View>
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

function makeStyles(colors: ThemeColors, isDark?: boolean, sixCompact?: boolean, rowCompact?: boolean) {
  const rc = Boolean(rowCompact);
  const chipBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(15, 23, 42, 0.04)";
  const gap = sixCompact ? 5 : 9;
  const chipPy = sixCompact ? 6 : 12;
  const chipPx = sixCompact ? 8 : 13;
  const chipPl = sixCompact ? 8 : 11;
  const iconBox = sixCompact ? 30 : 40;
  const labelFs = sixCompact ? 13 : 16;
  const timeFs = sixCompact ? 16 : 19;
  const timeHiFs = sixCompact ? 18 : 21;
  const hiPadL = sixCompact ? 6 : 9;

  return StyleSheet.create({
    card: {
      position: "relative",
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 4,
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
    sixStack: {
      gap,
    },
    stackChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: chipPy,
      paddingHorizontal: chipPx,
      paddingLeft: chipPl,
      borderRadius: sixCompact ? 12 : 14,
      backgroundColor: chipBg,
      borderLeftWidth: 0,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 3,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    stackChipEmbedded: {
      marginHorizontal: 0,
    },
    stackChipLast: {},
    stackChipHighlight: {
      borderLeftWidth: 4,
      paddingLeft: hiPadL,
    },
    stackIconBadge: {
      width: iconBox,
      height: iconBox,
      borderRadius: sixCompact ? 12 : 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: sixCompact ? 8 : 12,
    },
    stackLabel: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: labelFs,
      fontWeight: "800",
      letterSpacing: 0.15,
      paddingRight: sixCompact ? 6 : 8,
    },
    /** "Құптан" визуалды салмағын басқа атаулармен теңестіру */
    stackLabelIsha: {
      fontSize: Math.max(11, labelFs - 2),
      fontWeight: "700",
    },
    stackTime: {
      fontSize: timeFs,
      fontWeight: "900",
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.35,
    },
    stackTimeHighlight: {
      fontSize: timeHiFs,
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
