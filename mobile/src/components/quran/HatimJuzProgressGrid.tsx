import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { computeHatimJuzStats } from "../../hatim/hatimJuzProgress";

type Props = {
  read: Set<number>;
  colors: ThemeColors;
  isDark: boolean;
  activeJuz?: number | null;
  onOpenJuz: (juz: number) => void;
};

const COLS = 6;
const ROWS = 5;

export function HatimJuzProgressGrid({ read, colors, isDark, activeJuz, onOpenJuz }: Props) {
  const stats = useMemo(() => computeHatimJuzStats(read), [read]);
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const tg = kk.hatim;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{tg.juzProgressTitle}</Text>
      <Text style={styles.hint}>{tg.juzProgressHint}</Text>
      <View style={styles.grid} accessibilityRole="none">
        {Array.from({ length: ROWS }, (_, rowIdx) => (
          <View key={`row-${rowIdx}`} style={styles.gridRow}>
            {stats.slice(rowIdx * COLS, rowIdx * COLS + COLS).map((row) => {
              const pct = Math.round(row.fraction * 100);
              const done = row.fraction >= 1;
              const selected = activeJuz === row.juz;
              return (
                <Pressable
                  key={row.juz}
                  style={({ pressed }) => [
                    styles.cell,
                    done && styles.cellDone,
                    selected && styles.cellSelected,
                    pressed && { opacity: 0.88 },
                  ]}
                  onPress={() => onOpenJuz(row.juz)}
                  accessibilityRole="button"
                  accessibilityLabel={tg.juzOpenA11y(row.juz)}
                  accessibilityHint={`${row.readInJuz}/${row.totalInJuz}`}
                >
                  <View style={styles.fillTrack}>
                    <View style={[styles.fillBar, { height: `${Math.max(8, pct)}%` }]} />
                  </View>
                  <Text style={styles.cellNum}>{row.juz}</Text>
                  {pct > 0 && pct < 100 ? (
                    <Text style={styles.cellPct} numberOfLines={1}>
                      {pct}%
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const surface = colors.card;
  const border = colors.border;
  const fill = colors.accent;
  return StyleSheet.create({
    wrap: {
      alignSelf: "stretch",
      backgroundColor: surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: border,
      padding: 12,
      marginBottom: 10,
    },
    title: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 6,
    },
    hint: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.muted,
      marginBottom: 10,
    },
    grid: {
      gap: 8,
    },
    gridRow: {
      flexDirection: "row",
      gap: 8,
    },
    cell: {
      flex: 1,
      minHeight: 48,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.bg,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      ...Platform.select({
        web: { cursor: "pointer" as const },
        default: {},
      }),
    },
    cellDone: {
      borderColor: fill,
      backgroundColor: isDark ? "rgba(77,182,172,0.12)" : "rgba(21,128,61,0.08)",
    },
    cellSelected: {
      borderColor: fill,
      borderWidth: 2,
      backgroundColor: isDark ? "rgba(77,182,172,0.2)" : "rgba(21,128,61,0.14)",
    },
    fillTrack: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "flex-end",
      opacity: 0.22,
    },
    fillBar: {
      width: "100%",
      backgroundColor: fill,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
    },
    cellNum: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.text,
      zIndex: 1,
    },
    cellPct: {
      position: "absolute",
      bottom: 3,
      fontSize: 9,
      fontWeight: "700",
      color: colors.muted,
      zIndex: 1,
    },
  });
}
