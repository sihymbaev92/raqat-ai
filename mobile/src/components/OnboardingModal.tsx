import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ThemeColors } from "../theme/colors";
import { useAppTheme } from "../theme/ThemeContext";
import { layout } from "../theme/layout";
import { kk } from "../i18n/kk";
import { setOnboardingDone } from "../storage/prefs";
import { APP_LOCALE_OPTIONS, setCurrentLocale, type AppLocale } from "../i18n/runtime";

type Props = {
  visible: boolean;
  onClose: () => void;
};

type Step = "language" | "intro";

export function OnboardingModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const { height: winH } = useWindowDimensions();
  const scrollMaxH = Math.min(320, Math.round(winH * 0.38));
  const [step, setStep] = useState<Step>("language");

  const pickLanguage = async (locale: AppLocale) => {
    await setCurrentLocale(locale);
    if (Platform.OS === "web") {
      await setOnboardingDone();
      onClose();
      return;
    }
    setStep("intro");
  };

  const finish = async () => {
    await setOnboardingDone();
    onClose();
  };

  const styles = makeStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      accessibilityViewIsModal
      onRequestClose={finish}
    >
      <View style={styles.backdrop} accessibilityLabel={kk.onboarding.title}>
        <View style={styles.card}>
          {step === "language" ? (
            <>
              <View style={styles.heroIcons}>
                <MaterialCommunityIcons name="translate" size={36} color={colors.accent} />
              </View>
              <Text style={styles.title}>{kk.onboarding.languageTitle}</Text>
              <Text style={[styles.body, styles.langHint]}>{kk.onboarding.languageHint}</Text>
              <View style={styles.actions}>
                {APP_LOCALE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    style={({ pressed }) => [styles.langBtn, pressed && { opacity: 0.9 }]}
                    onPress={() => void pickLanguage(opt.id)}
                    accessibilityRole="button"
                    accessibilityLabel={opt.nativeLabel}
                  >
                    <Text style={styles.langBtnTxt}>{opt.nativeLabel}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.heroIcons}>
                <MaterialCommunityIcons name="moon-waning-crescent" size={36} color={colors.accent} style={styles.heroIconPad} />
                <MaterialCommunityIcons name="book-open-variant" size={34} color={colors.accent} style={styles.heroIconPad} />
                <MaterialCommunityIcons name="hands-pray" size={34} color={colors.accent} />
              </View>
              <Text style={styles.title}>{kk.onboarding.title}</Text>
              <ScrollView style={[styles.scroll, { maxHeight: scrollMaxH }]} showsVerticalScrollIndicator>
                <Text style={styles.body}>{kk.onboarding.step1}</Text>
              </ScrollView>
              <View style={styles.actions}>
                <Pressable
                  style={({ pressed }) => [styles.btn, pressed && { opacity: 0.9 }]}
                  onPress={finish}
                  accessibilityRole="button"
                >
                  <Text style={styles.btnTxt}>{kk.onboarding.start}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      padding: layout.screenPadding,
    },
    heroIcons: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: layout.gapMd,
    },
    heroIconPad: { marginHorizontal: 10 },
    card: {
      backgroundColor: colors.card,
      borderRadius: layout.radiusLg,
      padding: layout.gapLg + 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      maxHeight: "88%",
    },
    title: {
      color: colors.text,
      fontSize: 21,
      fontWeight: "800",
      marginBottom: layout.gapSm,
      textAlign: "center",
    },
    scroll: {},
    body: {
      color: colors.text,
      fontSize: 16,
      lineHeight: layout.bodyLineHeight,
    },
    actions: {
      marginTop: layout.gapLg,
      gap: layout.gapSm,
    },
    btn: {
      backgroundColor: colors.accent,
      paddingVertical: layout.gapMd + 2,
      borderRadius: layout.radiusMd,
      alignItems: "center",
    },
    btnTxt: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
    langHint: {
      textAlign: "center",
      color: colors.muted,
      fontSize: 14,
      marginBottom: layout.gapSm,
    },
    langBtn: {
      backgroundColor: colors.accentSurface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: layout.gapMd + 2,
      borderRadius: layout.radiusMd,
      alignItems: "center",
    },
    langBtnTxt: { color: colors.text, fontWeight: "800", fontSize: 17 },
  });
}
