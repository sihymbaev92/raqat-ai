import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable } from "@/ui/Pressable";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { layout } from "../theme/layout";
import { setOnboardingDone } from "../storage/prefs";

type Props = {
  onDone: () => void;
};

/** Тіл таңдалғаннан кейін — 3 қадамды кіріспе. */
export function OnboardingIntroScreen({ onDone }: Props) {
  useAppLocale();
  const { tr } = useKkAutoTranslator();
  const { colors } = useAppTheme();
  const { height: winH } = useWindowDimensions();
  const scrollMaxH = Math.min(320, Math.round(winH * 0.38));
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [step, setStep] = useState(0);

  const bodies = useMemo(
    () => [kk.onboarding.step1, kk.onboarding.step2, kk.onboarding.step3],
    []
  );

  const finish = async () => {
    await setOnboardingDone();
    onDone();
  };

  const onPrimary = () => {
    if (step < bodies.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    void finish();
  };

  return (
    <View style={styles.root} accessibilityLabel={tr(kk.onboarding.title)}>
      <View style={styles.card}>
        <View style={styles.heroIcons}>
          <MaterialCommunityIcons name="moon-waning-crescent" size={36} color={colors.accent} style={styles.heroIconPad} />
          <MaterialCommunityIcons name="book-open-variant" size={34} color={colors.accent} style={styles.heroIconPad} />
          <MaterialCommunityIcons name="hands-pray" size={34} color={colors.accent} />
        </View>
        <Text style={styles.title}>{tr(kk.onboarding.title)}</Text>
        <View style={styles.stepDots} accessibilityRole="text" accessibilityLabel={`${step + 1} / ${bodies.length}`}>
          {bodies.map((_, i) => (
            <View
              key={`onb-dot-${i}`}
              style={[styles.dot, i === step ? styles.dotActive : null, { backgroundColor: i === step ? colors.accent : colors.border }]}
            />
          ))}
        </View>
        <ScrollView style={{ maxHeight: scrollMaxH }} showsVerticalScrollIndicator>
          <Text style={styles.body}>{tr(bodies[step])}</Text>
        </ScrollView>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
          onPress={onPrimary}
          accessibilityRole="button"
        >
          <Text style={styles.btnTxt}>
            {step < bodies.length - 1 ? tr(kk.common.next) : tr(kk.onboarding.start)}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: "center",
      padding: layout.screenPadding,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: layout.radiusLg,
      padding: layout.gapLg + 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      maxWidth: 480,
      width: "100%",
      alignSelf: "center",
    },
    heroIcons: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: layout.gapMd,
    },
    heroIconPad: { marginHorizontal: 10 },
    title: {
      color: colors.text,
      fontSize: 21,
      fontWeight: "800",
      marginBottom: layout.gapSm,
      textAlign: "center",
    },
    stepDots: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginBottom: layout.gapMd,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      opacity: 0.45,
    },
    dotActive: {
      opacity: 1,
      width: 22,
    },
    body: {
      color: colors.text,
      fontSize: 16,
      lineHeight: layout.bodyLineHeight,
    },
    btn: {
      backgroundColor: colors.accent,
      paddingVertical: layout.gapMd + 2,
      borderRadius: layout.radiusMd,
      alignItems: "center",
      marginTop: layout.gapLg,
    },
    btnTxt: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  });
}
