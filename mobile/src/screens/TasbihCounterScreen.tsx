import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import {
  getTasbihPrefs,
  setTasbihPrefs,
  migrateLegacyTasbihCountIntoMap,
  getAllDhikrCounts,
  setDhikrCountForId,
} from "../storage/prefs";
import { kk } from "../i18n/kk";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TasbihStackParamList } from "../navigation/types";
import {
  loadDhikrItems,
  phaseLabel,
  manualToMode,
  effectiveGoalForItem,
} from "./tasbihShared";

type Props = NativeStackScreenProps<TasbihStackParamList, "TasbihCounter">;

function flushTasbih(
  dhikrId: number,
  manualGoal: number | null,
  count: number
): void {
  void setTasbihPrefs(dhikrId, manualToMode(manualGoal), count);
  void setDhikrCountForId(dhikrId, count);
}

export function TasbihCounterScreen({ navigation, route }: Props) {
  const { dhikrId, titleKk } = route.params;
  const items = useMemo(() => loadDhikrItems(), []);
  const active = useMemo(() => items.find((i) => i.id === dhikrId) ?? null, [items, dhikrId]);

  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [manualGoal, setManualGoal] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [prefsReady, setPrefsReady] = useState(false);
  const flash = useRef(new Animated.Value(0)).current;

  const manualGoalRef = useRef(manualGoal);
  const countRef = useRef(count);
  manualGoalRef.current = manualGoal;
  countRef.current = count;

  useLayoutEffect(() => {
    const t = titleKk?.trim() || active?.textKk;
    if (t) {
      navigation.setOptions({
        title: t.length > 42 ? `${t.slice(0, 40)}…` : t,
      });
    }
  }, [navigation, titleKk, active?.textKk]);

  useEffect(() => {
    if (!active) {
      navigation.goBack();
    }
  }, [active, navigation]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await migrateLegacyTasbihCountIntoMap();
      const map = await getAllDhikrCounts();
      const p = await getTasbihPrefs();
      if (cancelled || !active) return;

      let manual: number | null = null;
      if (p.dhikrId === dhikrId) {
        if (p.goalMode === "33") manual = 33;
        else if (p.goalMode === "99") manual = 99;
      }
      const goal = effectiveGoalForItem(active, manual);
      const fromMap = map[dhikrId];
      const baseCount =
        fromMap !== undefined ? fromMap : p.dhikrId === dhikrId ? p.count : 0;
      let nextCount = Math.min(baseCount, Math.max(0, goal - 1));
      setManualGoal(manual);
      setCount(nextCount);
      setPrefsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [active, dhikrId]);

  const effectiveGoal = useMemo(() => {
    if (!active) return 33;
    return effectiveGoalForItem(active, manualGoal);
  }, [active, manualGoal]);

  useEffect(() => {
    if (!prefsReady || !active) return;
    const t = setTimeout(() => {
      flushTasbih(active.id, manualGoal, count);
    }, 250);
    return () => clearTimeout(t);
  }, [prefsReady, active?.id, manualGoal, count]);

  useEffect(() => {
    const sub = navigation.addListener("beforeRemove", () => {
      flushTasbih(dhikrId, manualGoalRef.current, countRef.current);
    });
    return sub;
  }, [navigation, dhikrId]);

  const onPickGoal = useCallback((next: number | null) => {
    setManualGoal(next);
    setCount(0);
  }, []);

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
    if (!active) return;
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

  /** Төменгі табтың үстінде саусаққа ыңғайлы бос орын (inset кейде 0) */
  const tapDockPadBottom = Math.max(insets.bottom, Platform.OS === "ios" ? 10 : 8) + 6;

  if (!active) {
    return null;
  }

  const phase = phaseLabel(count, effectiveGoal, active.phaseRule);
  const remaining = Math.max(0, effectiveGoal - count);

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
        <Text style={styles.section}>{kk.tasbih.goalLabel}</Text>
        <View style={styles.goals}>
          <Pressable
            onPress={() => onPickGoal(33)}
            style={[styles.goalBtn, manualGoal === 33 && styles.goalBtnOn]}
          >
            <Text style={[styles.goalTxt, manualGoal === 33 && styles.goalTxtOn]}>33</Text>
          </Pressable>
          <Pressable
            onPress={() => onPickGoal(99)}
            style={[styles.goalBtn, manualGoal === 99 && styles.goalBtnOn]}
          >
            <Text style={[styles.goalTxt, manualGoal === 99 && styles.goalTxtOn]}>99</Text>
          </Pressable>
          {active.phaseRule !== "triple_salah" ? (
            <Pressable
              onPress={() => onPickGoal(null)}
              style={[styles.goalBtn, manualGoal === null && styles.goalBtnOn]}
            >
              <Text style={[styles.goalTxt, manualGoal === null && styles.goalTxtOn]}>
                {active.defaultTarget}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.aboveCircle}>
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

        <Text style={styles.footerProgressInline}>
          {count} / {effectiveGoal} · {remaining} {kk.tasbih.left}
        </Text>
      </ScrollView>

      <View
        style={[
          styles.tapDock,
          {
            paddingBottom: tapDockPadBottom,
            borderTopColor: colors.border,
            backgroundColor: colors.bg,
          },
        ]}
      >
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
        <Text style={styles.hintScroll}>
          {active.phaseRule === "triple_salah" ? kk.tasbih.tripleHint : kk.tasbih.tapHint}
        </Text>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  const chipFill = colors.accentSurface;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    scrollContent: {
      padding: 20,
      paddingBottom: 24,
      flexGrow: 1,
    },
    tapDock: {
      paddingTop: 22,
      paddingHorizontal: 16,
      borderTopWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
    },
    footerProgressInline: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 10,
      textAlign: "center",
      fontVariant: ["tabular-nums"],
    },
    aboveCircle: {
      alignItems: "center",
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    arCompact: {
      fontSize: 20,
      lineHeight: 34,
      color: colors.scriptureArabic,
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
    metaBlock: { marginBottom: 10 },
    metaLabel: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 4,
    },
    translit: {
      color: colors.scriptureTranslit,
      fontSize: 14,
      lineHeight: 21,
    },
    meaning: {
      color: colors.scriptureMeaningKk,
      fontSize: 14,
      lineHeight: 22,
    },
    goals: { flexDirection: "row", marginBottom: 14, flexWrap: "wrap", gap: 8 },
    goalBtn: {
      paddingHorizontal: 16,
      paddingVertical: 9,
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
      width: 176,
      height: 176,
      borderRadius: 88,
      borderWidth: 3,
      borderColor: colors.accentDark,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "center",
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    circleFlash: {
      borderRadius: 88,
    },
    count: { fontSize: 48, fontWeight: "800", color: colors.text },
    sub: { color: colors.muted, marginTop: 4, fontSize: 14 },
    reset: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24, alignSelf: "center" },
    resetTxt: { color: colors.accent, fontSize: 15, fontWeight: "600" },
    hintScroll: {
      marginTop: 4,
      marginBottom: 2,
      color: colors.muted,
      fontSize: 11,
      textAlign: "center",
      lineHeight: 17,
      paddingHorizontal: 8,
    },
  });
}
