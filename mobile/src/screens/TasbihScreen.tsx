import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { getTasbihPrefs, setTasbihPrefs, type TasbihGoalMode } from "../storage/prefs";
import { kk } from "../i18n/kk";
import type { MainTabParamList, RootStackParamList } from "../navigation/types";

type TasbihNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Tasbih">,
  NativeStackNavigationProp<RootStackParamList>
>;

type DhikrItem = {
  id: number;
  slug: string;
  textAr: string;
  /** Қысқа атау (чиптерде) */
  textKk: string;
  /** Кирилл транскрипциясы (оқылуы) */
  translitKk?: string;
  /** Қазақша мағына / түсініктеме */
  meaningKk?: string;
  defaultTarget: number;
  phaseRule: "triple_salah" | null;
};

type DhikrBundle = { version: number; items: DhikrItem[] };

function loadDhikrItems(): DhikrItem[] {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    const raw = require("../../assets/bundled/dhikr-list.json") as DhikrBundle;
    /* eslint-enable @typescript-eslint/no-require-imports */
    if (!raw?.items?.length) return [];
    return raw.items;
  } catch {
    return [];
  }
}

function phaseLabel(count: number, goal: number, rule: DhikrItem["phaseRule"]): string {
  if (rule !== "triple_salah" || goal !== 99) return "";
  if (count === 0) return kk.tasbih.phaseSubhan;
  const idx = Math.floor((count - 1) / 33) % 3;
  if (idx === 0) return kk.tasbih.phaseSubhan;
  if (idx === 1) return kk.tasbih.phaseHamd;
  return kk.tasbih.phaseTakbir;
}

function manualToMode(manual: number | null): TasbihGoalMode {
  if (manual === 33) return "33";
  if (manual === 99) return "99";
  return "default";
}

function effectiveGoalForItem(item: DhikrItem | undefined, manual: number | null): number {
  if (!item) return 33;
  if (item.phaseRule === "triple_salah") return 99;
  if (manual === 33 || manual === 99) return manual;
  const d = item.defaultTarget || 33;
  return Math.max(1, Math.min(d, 999));
}

export function TasbihScreen() {
  const items = useMemo(() => loadDhikrItems(), []);
  const first = items[0];
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation<TasbihNav>();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const [activeId, setActiveId] = useState(first?.id ?? 0);
  const active = useMemo(
    () => items.find((i) => i.id === activeId) ?? first ?? null,
    [items, activeId, first]
  );
  const [manualGoal, setManualGoal] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  /** Таңдаудан кейін тізім жабылады — тек таңдалған зікір мен тәспі батырмасы қалады */
  const [zikirOpen, setZikirOpen] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);
  const flash = useRef(new Animated.Value(0)).current;

  const effectiveGoal = useMemo(() => {
    if (!active) return 33;
    if (active.phaseRule === "triple_salah") return 99;
    if (manualGoal === 33 || manualGoal === 99) return manualGoal;
    const d = active.defaultTarget || 33;
    return Math.max(1, Math.min(d, 999));
  }, [active, manualGoal]);

  const onPick = useCallback((d: DhikrItem) => {
    Haptics.selectionAsync();
    setActiveId(d.id);
    setManualGoal(null);
    setCount(0);
    setZikirOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = await getTasbihPrefs();
      if (cancelled) return;
      const match = p.dhikrId != null ? items.find((i) => i.id === p.dhikrId) : undefined;
      const useItem = match ?? first;
      if (!useItem) {
        setPrefsReady(true);
        return;
      }
      let manual: number | null = null;
      if (p.goalMode === "33") manual = 33;
      else if (p.goalMode === "99") manual = 99;
      const goal = effectiveGoalForItem(useItem, manual);
      let nextCount = Math.min(p.count, Math.max(0, goal - 1));
      if (!match) nextCount = 0;
      setActiveId(useItem.id);
      setManualGoal(manual);
      setCount(nextCount);
      setPrefsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [items, first]);

  useEffect(() => {
    if (!prefsReady || !active) return;
    const t = setTimeout(() => {
      void setTasbihPrefs(active.id, manualToMode(manualGoal), count);
    }, 250);
    return () => clearTimeout(t);
  }, [prefsReady, active?.id, manualGoal, count]);

  const pulseGreen = () => {
    Animated.sequence([
      Animated.timing(flash, {
        toValue: 1,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(flash, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const tap = () => {
    pulseGreen();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCount((c) => {
      const n = c + 1;
      if (n >= effectiveGoal) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return 0;
      }
      return n;
    });
  };

  const reset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCount(0);
  };

  const phase = active ? phaseLabel(count, effectiveGoal, active.phaseRule) : "";
  const remaining = Math.max(0, effectiveGoal - count);
  const footerPadBottom = Math.max(insets.bottom, 10) + 6;

  if (!active) {
    return (
      <View style={styles.scroll}>
        <Text style={styles.muted}>Зікір тізімі жүктелмеді.</Text>
      </View>
    );
  }

  const flashOpacity = flash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.28],
  });

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.zikirHeader}
          onPress={() => setZikirOpen((o) => !o)}
          accessibilityRole="button"
          accessibilityHint={kk.tasbih.zikirHeaderA11y}
        >
          <View style={styles.zikirHeaderBody}>
            {zikirOpen ? (
              <Text style={styles.zikirHeaderTxt}>
                {kk.tasbih.zikirSection}
                {" · "}
                {kk.tasbih.zikirToggleOpen}
              </Text>
            ) : (
              <>
                <Text style={styles.zikirHeaderTxt} numberOfLines={2}>
                  {active.textKk}
                </Text>
                <Text style={styles.zikirHeaderSub}>{kk.tasbih.zikirHeaderClosedHint}</Text>
              </>
            )}
          </View>
          <Text style={styles.zikirChev}>{zikirOpen ? "▲" : "▼"}</Text>
        </Pressable>

        {zikirOpen ? (
          <>
            <Text style={styles.section}>{kk.tasbih.pickDhikr}</Text>
            <View style={styles.chipGrid}>
              {items.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() => onPick(d)}
                  style={[styles.chip, d.id === activeId && styles.chipOn]}
                >
                  <Text
                    style={[styles.chipTxt, d.id === activeId && styles.chipTxtOn]}
                    numberOfLines={2}
                  >
                    {d.textKk}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.section}>{kk.tasbih.goalLabel}</Text>
            <View style={styles.goals}>
              <Pressable
                onPress={() => {
                  setManualGoal(33);
                  setCount(0);
                }}
                style={[styles.goalBtn, manualGoal === 33 && styles.goalBtnOn]}
              >
                <Text style={[styles.goalTxt, manualGoal === 33 && styles.goalTxtOn]}>33</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setManualGoal(99);
                  setCount(0);
                }}
                style={[styles.goalBtn, manualGoal === 99 && styles.goalBtnOn]}
              >
                <Text style={[styles.goalTxt, manualGoal === 99 && styles.goalTxtOn]}>99</Text>
              </Pressable>
              {active.phaseRule !== "triple_salah" ? (
                <Pressable
                  onPress={() => {
                    setManualGoal(null);
                    setCount(0);
                  }}
                  style={[styles.goalBtn, manualGoal === null && styles.goalBtnOn]}
                >
                  <Text style={[styles.goalTxt, manualGoal === null && styles.goalTxtOn]}>
                    {active.defaultTarget}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}

        <View style={styles.aboveCircle}>
          <Text style={styles.aboveCircleKk} numberOfLines={1}>
            {active.textKk}
          </Text>
          <Text style={styles.arCompact}>{active.textAr}</Text>
          <Text style={styles.progressLine}>
            {count} / {effectiveGoal}
          </Text>
          {phase ? <Text style={styles.phaseAbove}>{phase}</Text> : null}
        </View>

        {active.translitKk ? (
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>{kk.tasbih.translitLabel}</Text>
            <Text style={styles.translit}>{active.translitKk}</Text>
          </View>
        ) : null}
        {active.meaningKk ? (
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>{kk.tasbih.meaningLabel}</Text>
            <Text style={styles.meaning}>{active.meaningKk}</Text>
          </View>
        ) : null}

        <Text style={styles.hintScroll}>
          {active.phaseRule === "triple_salah" ? kk.tasbih.tripleHint : kk.tasbih.tapHint}
        </Text>
      </ScrollView>

      <View style={[styles.tapFooter, { paddingBottom: footerPadBottom }]}>
        <Text style={styles.footerProgress}>
          {count} / {effectiveGoal} · {remaining} {kk.tasbih.left}
        </Text>
        <Pressable
          style={styles.circle}
          onPress={tap}
          accessibilityRole="button"
          accessibilityLabel={kk.tasbih.tapA11y}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFillObject,
              styles.circleFlash,
              { opacity: flashOpacity, backgroundColor: colors.success },
            ]}
          />
          <Text style={styles.count}>{count}</Text>
          <Text style={styles.sub}>
            {remaining} {kk.tasbih.left}
          </Text>
        </Pressable>
        <Pressable onPress={reset} style={styles.reset} accessibilityRole="button">
          <Text style={styles.resetTxt}>{kk.tasbih.reset}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const chipFill = isDark ? "rgba(229, 193, 88, 0.08)" : "rgba(184, 134, 11, 0.06)";
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1, backgroundColor: colors.bg },
    scrollContent: {
      padding: 20,
      paddingBottom: 16,
    },
    tapFooter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
      paddingTop: 12,
      paddingHorizontal: 20,
      alignItems: "center",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        android: { elevation: 12 },
        default: {},
      }),
    },
    footerProgress: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 10,
      fontVariant: ["tabular-nums"],
    },
    muted: { color: colors.muted, textAlign: "center", marginTop: 24 },
    zikirHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: 8,
    },
    zikirHeaderBody: { flex: 1, minWidth: 0 },
    zikirHeaderTxt: { color: colors.accent, fontWeight: "800", fontSize: 14 },
    zikirHeaderSub: { color: colors.muted, fontSize: 11, fontWeight: "600", marginTop: 3 },
    zikirChev: { color: colors.muted, fontSize: 12, flexShrink: 0 },
    aboveCircle: {
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 8,
    },
    aboveCircleKk: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 4,
    },
    arCompact: {
      fontSize: 22,
      lineHeight: 36,
      color: colors.text,
      textAlign: "center",
      writingDirection: "rtl",
      marginBottom: 6,
    },
    progressLine: {
      fontSize: 17,
      fontWeight: "800",
      color: colors.accent,
      fontVariant: ["tabular-nums"],
    },
    phaseAbove: { color: colors.accent, marginTop: 6, fontSize: 13, fontWeight: "700" },
    section: { color: colors.muted, marginBottom: 8, fontSize: 12, fontWeight: "700" },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 8,
      paddingBottom: 12,
    },
    chip: {
      width: "48%",
      minWidth: 0,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipOn: {
      borderColor: colors.accentDark,
      backgroundColor: chipFill,
    },
    chipTxt: { color: colors.text, fontSize: 12, fontWeight: "600" },
    chipTxtOn: { color: colors.accentDark },
    ar: {
      fontSize: 20,
      lineHeight: 34,
      color: colors.text,
      textAlign: "right",
      writingDirection: "rtl",
      marginBottom: 10,
    },
    metaBlock: { marginBottom: 12 },
    metaLabel: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 4,
    },
    translit: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
    },
    meaning: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
    },
    goals: { flexDirection: "row", marginBottom: 20, flexWrap: "wrap", gap: 8 },
    goalBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    goalBtnOn: {
      borderColor: colors.accentDark,
      backgroundColor: chipFill,
    },
    goalTxt: { color: colors.muted, fontWeight: "600" },
    goalTxtOn: { color: colors.accentDark },
    circle: {
      width: 200,
      height: 200,
      borderRadius: 100,
      borderWidth: 3,
      borderColor: colors.accentDark,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.bg,
      overflow: "hidden",
    },
    circleFlash: {
      borderRadius: 100,
    },
    count: { fontSize: 56, fontWeight: "800", color: colors.text },
    sub: { color: colors.muted, marginTop: 4, fontSize: 15 },
    reset: { marginTop: 12, paddingVertical: 14, paddingHorizontal: 28, alignSelf: "center" },
    resetTxt: { color: colors.accent, fontSize: 16, fontWeight: "600" },
    hintScroll: {
      marginTop: 12,
      color: colors.muted,
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
      paddingHorizontal: 12,
      paddingBottom: 8,
    },
  });
}
