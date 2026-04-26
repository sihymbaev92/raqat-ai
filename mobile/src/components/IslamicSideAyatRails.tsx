import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";

const RAIL_W = 24;

/** Сол: бисмилля */
const AYAH_LEFT = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
/** Оң: Фатиханың екінші аяты (алтын бүйірлік жазба) */
const AYAH_RIGHT = "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ";

type Props = { children: React.ReactNode };

/**
 * Басты таб экранында екі жақ бүйірде тігінен арабша аят (алтын түс).
 */
export function IslamicSideAyatRails({ children }: Props) {
  const { colors } = useAppTheme();
  const gold = colors.scriptureArabic;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]} pointerEvents="box-none">
      <View
        style={[styles.rail, { width: RAIL_W }]}
        pointerEvents="none"
      >
        <View style={styles.railCenter}>
          <View style={styles.railClip} collapsable={false} pointerEvents="none">
            <Text
              style={[styles.verticalLtr, { color: gold }]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {AYAH_LEFT}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.main} collapsable={false}>
        {children}
      </View>
      <View
        style={[styles.rail, { width: RAIL_W }]}
        pointerEvents="none"
      >
        <View style={styles.railCenter}>
          <View style={styles.railClip} collapsable={false} pointerEvents="none">
            <Text
              style={[styles.verticalRtl, { color: gold }]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {AYAH_RIGHT}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  main: { flex: 1, minWidth: 0 },
  rail: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  railClip: {
    width: RAIL_W,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  railCenter: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  verticalLtr: {
    fontSize: 10.5,
    fontWeight: "600",
    textAlign: "center",
    width: 520,
    writingDirection: "rtl",
    transform: [{ rotate: "-90deg" }],
    ...Platform.select({
      android: { textAlignVertical: "center" as const, includeFontPadding: false },
      default: {},
    }),
  },
  verticalRtl: {
    fontSize: 10.5,
    fontWeight: "600",
    textAlign: "center",
    width: 520,
    writingDirection: "rtl",
    transform: [{ rotate: "90deg" }],
    ...Platform.select({
      android: { textAlignVertical: "center" as const, includeFontPadding: false },
      default: {},
    }),
  },
});
