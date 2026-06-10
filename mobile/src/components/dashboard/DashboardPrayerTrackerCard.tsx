import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../../i18n/kk";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { shortPrayerName } from "../CompactPrayerTimesRow";
import type { ThemeColors } from "../../theme/colors";
import {
  FARD_PRAYER_KEYS,
  type FardPrayerKey,
  loadPrayerDailyTracker,
  prayerTrackerProgress,
  toggleFardPrayer,
} from "../../storage/prayerDailyTracker";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
};

export function DashboardPrayerTrackerCard({ colors, isDark }: Props) {
  const { tr } = useKkAutoTranslator();
  const d = kk.dashboard;
  const [state, setState] = useState(() => ({
    streak: 0,
    longest: 0,
    prayed: {} as Partial<Record<FardPrayerKey, boolean>>,
  }));

  const refresh = useCallback(async () => {
    const s = await loadPrayerDailyTracker();
    setState({ streak: s.streak, longest: s.longest, prayed: s.prayed });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const { done, total } = prayerTrackerProgress(state.prayed);
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text style={styles.title}>{tr(d.prayerTrackerTitle)}</Text>
        {state.streak > 0 ? (
          <Text style={styles.streak}>{tr(d.prayerTrackerStreak(state.streak))}</Text>
        ) : null}
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.round((done / total) * 100)}%` }]} />
      </View>
      <Text style={styles.sub}>{tr(d.prayerTrackerProgress(done, total))}</Text>
      <View style={styles.chips}>
        {FARD_PRAYER_KEYS.map((key) => {
          const on = state.prayed[key] === true;
          return (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.chip,
                on && styles.chipOn,
                pressed && { opacity: 0.88 },
              ]}
              onPress={() => {
                void toggleFardPrayer(key).then((s) =>
                  setState({ streak: s.streak, longest: s.longest, prayed: s.prayed })
                );
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={shortPrayerName(key)}
            >
              <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{shortPrayerName(key)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const track = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  return StyleSheet.create({
    wrap: {
      marginHorizontal: 20,
      marginBottom: 12,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    headRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    title: { fontSize: 15, fontWeight: "800", color: colors.text },
    streak: { fontSize: 12, fontWeight: "700", color: colors.accent },
    barBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: track,
      overflow: "hidden",
      marginBottom: 6,
    },
    barFill: {
      height: "100%",
      backgroundColor: colors.accent,
      borderRadius: 3,
    },
    sub: { fontSize: 12, color: colors.muted, marginBottom: 10 },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.bg,
    },
    chipOn: {
      borderColor: colors.accent,
      backgroundColor: isDark ? "rgba(77,182,172,0.18)" : "rgba(21,128,61,0.1)",
    },
    chipTxt: { fontSize: 13, fontWeight: "700", color: colors.muted },
    chipTxtOn: { color: colors.text },
  });
}
