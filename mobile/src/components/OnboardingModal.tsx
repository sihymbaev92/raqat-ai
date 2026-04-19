import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ThemeColors } from "../theme/colors";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { setOnboardingDone } from "../storage/prefs";

type Props = {
  visible: boolean;
  onClose: () => void;
};

const STEPS = [
  kk.onboarding.step1,
  kk.onboarding.step2,
  kk.onboarding.step3,
] as const;

export function OnboardingModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const [step, setStep] = useState(0);

  const finish = async () => {
    await setOnboardingDone();
    setStep(0);
    onClose();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };

  const styles = makeStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.heroIcons}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={36} color={colors.accent} style={styles.heroIconPad} />
            <MaterialCommunityIcons name="book-open-variant" size={34} color={colors.accent} style={styles.heroIconPad} />
            <MaterialCommunityIcons name="hands-pray" size={34} color={colors.accent} />
          </View>
          <Text style={styles.title}>{kk.onboarding.title}</Text>
          <Text style={styles.stepInd}>
            {step + 1} / {STEPS.length}
          </Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.body}>{STEPS[step]}</Text>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
            onPress={next}
          >
            <Text style={styles.btnTxt}>
              {step < STEPS.length - 1 ? kk.common.next : kk.onboarding.start}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.65)",
      justifyContent: "center",
      padding: 24,
    },
    heroIcons: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },
    heroIconPad: { marginHorizontal: 10 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: "80%",
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 8,
    },
    stepInd: { color: colors.muted, fontSize: 12, marginBottom: 12 },
    scroll: { maxHeight: 220 },
    body: { color: colors.text, fontSize: 15, lineHeight: 22 },
    btn: {
      marginTop: 16,
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    btnTxt: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
  });
}
