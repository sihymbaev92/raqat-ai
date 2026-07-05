import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { AppLocaleOptionRow } from "../components/AppLocaleOptionRow";
import { APP_LOCALE_OPTIONS, setCurrentLocale, useAppLocale, type AppLocale } from "../i18n/runtime";
import { kk } from "../i18n/kk";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { layout } from "../theme/layout";

type Props = {
  onPicked: (locale: AppLocale) => void;
};

/**
 * Бірінші орнату: тіл таңдау (туар флагасы + ана тіл атауы).
 */
export function LanguagePickScreen({ onPicked }: Props) {
  useAppLocale();
  const { colors } = useAppTheme();
  const { height: winH } = useWindowDimensions();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const pick = async (locale: AppLocale) => {
    await setCurrentLocale(locale);
    onPicked(locale);
  };

  return (
    <View style={styles.root} accessibilityLabel={kk.onboarding.languageTitle}>
      <ScrollView
        contentContainerStyle={[styles.content, { minHeight: Math.max(480, winH - 48) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <MaterialCommunityIcons name="translate" size={44} color={colors.accent} />
        </View>
        <Text style={styles.title}>{kk.onboarding.languageTitle}</Text>
        <Text style={styles.hint}>{kk.onboarding.languageHint}</Text>

        <View style={styles.list}>
          {APP_LOCALE_OPTIONS.map((opt) => (
            <AppLocaleOptionRow
              key={opt.id}
              option={opt}
              colors={colors}
              onPress={() => void pick(opt.id)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: 36,
      paddingBottom: 32,
      justifyContent: "center",
    },
    hero: {
      alignItems: "center",
      marginBottom: layout.gapMd,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "900",
      textAlign: "center",
      marginBottom: layout.gapSm,
    },
    hint: {
      color: colors.muted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
      marginBottom: layout.gapLg + 4,
      paddingHorizontal: 8,
    },
    list: {
      gap: 10,
      maxWidth: 440,
      width: "100%",
      alignSelf: "center",
    },
  });
}
