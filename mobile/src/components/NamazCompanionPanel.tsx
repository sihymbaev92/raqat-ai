import React, { useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Image, ScrollView, type StyleProp, type ViewStyle } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { useI18n } from "../i18n/useI18n";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import {
  buildNamazCompanionSteps,
  namazCompanionSalatOptions,
  namazCompanionStepProgress,
  type NamazCompanionSalatKey,
} from "../content/namazCompanionSession";

type PickerProps = {
  colors: ThemeColors;
  onStart: (key: NamazCompanionSalatKey) => void;
  style?: StyleProp<ViewStyle>;
};

/** «5 уақыт намаз» басындағы намаз таңдау */
export function NamazCompanionPicker({ colors, onStart, style }: PickerProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useI18n().namazCompanion;
  const { tr } = useKkAutoTranslator();
  const options = useMemo(() => namazCompanionSalatOptions(), []);

  return (
    <View style={[styles.pickerWrap, style]}>
      <Text style={styles.sectionTitle}>{t.screenTitle}</Text>
      <Text style={styles.sectionSub}>{t.pickerSub}</Text>
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={() => onStart(opt.key)}
          style={({ pressed }) => [styles.pickCard, pressed && { opacity: 0.9 }]}
          accessibilityRole="button"
          accessibilityLabel={`${tr(opt.title)}, ${opt.rakatCount} ${t.rakatWord}`}
        >
          <Text style={styles.pickTitle}>{tr(opt.title)}</Text>
          <Text style={styles.pickSub}>
            {t.fardRakatLine(opt.rakatCount)} · {t.startCta}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

type SessionProps = {
  colors: ThemeColors;
  salatKey: NamazCompanionSalatKey;
  stepIndex: number;
  onStepIndexChange: (index: number) => void;
  onExit: () => void;
};

/** Тірі қадам-қадам сессия (modal денесін толтырады) */
export function NamazCompanionSession({
  colors,
  salatKey,
  stepIndex,
  onStepIndexChange,
  onExit,
}: SessionProps) {
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const t = useI18n().namazCompanion;
  const { tr } = useKkAutoTranslator();
  const steps = useMemo(() => buildNamazCompanionSteps(salatKey), [salatKey]);
  const step = steps[stepIndex] ?? steps[0];
  const progress = namazCompanionStepProgress(stepIndex, steps.length);
  const isLast = stepIndex >= steps.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onExit();
      return;
    }
    onStepIndexChange(stepIndex + 1);
  }, [isLast, onExit, onStepIndexChange, stepIndex]);

  const goPrev = useCallback(() => {
    onStepIndexChange(Math.max(0, stepIndex - 1));
  }, [onStepIndexChange, stepIndex]);

  if (!step) return null;

  return (
    <View style={styles.sessionRoot}>
      <View style={styles.topBar}>
        <Text style={styles.topProgress}>{t.stepOf(stepIndex + 1, steps.length)}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
      <ScrollView style={styles.sessionScroll} contentContainerStyle={styles.sessionBody} nestedScrollEnabled>
        <Text style={styles.badge}>{tr(step.progressLabel)}</Text>
        <Text style={styles.stepTitle}>{tr(step.title)}</Text>
        <Text style={styles.stepDesc}>{tr(step.desc)}</Text>
        <Image source={step.image} style={styles.poseImage} resizeMode="contain" />
        {step.actions.map((line) => (
          <Text key={line} style={styles.actionLine}>
            · {tr(line)}
          </Text>
        ))}
        {step.hints?.map((h) => (
          <Text key={h} style={styles.hintLine}>
            {tr(h)}
          </Text>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          onPress={goPrev}
          disabled={stepIndex === 0}
          style={({ pressed }) => [
            styles.secondaryBtn,
            stepIndex === 0 && styles.btnDisabled,
            pressed && stepIndex > 0 && { opacity: 0.88 },
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.secondaryBtnTxt}>{t.prev}</Text>
        </Pressable>
        <Pressable
          onPress={goNext}
          style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.92 }]}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnTxt}>{isLast ? t.finish : t.next}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pickerWrap: { gap: 10, marginBottom: 18 },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.2,
    },
    sectionSub: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.muted,
      marginBottom: 4,
    },
    pickCard: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    pickTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
    pickSub: { marginTop: 4, fontSize: 13, color: colors.accent, fontWeight: "600" },
    sessionRoot: { flex: 1, backgroundColor: colors.bg },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 6,
    },
    topProgress: { fontSize: 13, fontWeight: "600", color: colors.muted },
    progressTrack: {
      height: 4,
      marginHorizontal: 16,
      borderRadius: 2,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: colors.accent },
    sessionScroll: { flex: 1 },
    sessionBody: { padding: 20, paddingBottom: 24, gap: 8 },
    badge: {
      alignSelf: "flex-start",
      fontSize: 12,
      fontWeight: "700",
      color: colors.accent,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    stepTitle: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
    stepDesc: { fontSize: 15, lineHeight: 22, color: colors.muted },
    poseImage: {
      width: "100%",
      height: 200,
      marginVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.card,
    },
    actionLine: { fontSize: 15, lineHeight: 22, color: colors.text },
    hintLine: {
      marginTop: 4,
      fontSize: 13,
      lineHeight: 19,
      color: colors.muted,
      fontStyle: "italic",
    },
    footer: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.bg,
    },
    secondaryBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: "center",
    },
    secondaryBtnTxt: { fontSize: 16, fontWeight: "700", color: colors.text },
    primaryBtn: {
      flex: 1.4,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: "center",
    },
    primaryBtnTxt: { fontSize: 16, fontWeight: "800", color: "#fff" },
    btnDisabled: { opacity: 0.4 },
  });
}
