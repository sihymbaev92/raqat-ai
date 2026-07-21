import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { APP_BRAND_KK } from "../i18n/kk";
import {
  APP_LOCALE_OPTIONS,
  appLocaleDisplayLabel,
  setCurrentLocale,
  type AppLocale,
} from "../i18n/runtime";
import { useI18n } from "../i18n/useI18n";
import { formatAppLocaleLabel } from "../i18n/localeFlags";
import { setOnboardingDone } from "../storage/prefs";
import type { ThemeColors } from "../theme/colors";
import { useAppTheme } from "../theme/ThemeContext";
import { ScreenFitScrollView } from "../components/ScreenFit";

type Props = {
  onComplete: () => void;
};

/**
 * Бірінші орнату: тілді басқанда бірден жалғасады (төменгі CTA жоқ).
 */
export function OnboardingLanguageScreen({ onComplete }: Props) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const t = useI18n();
  const [selected, setSelected] = useState<AppLocale | null>(null);
  const [busy, setBusy] = useState(false);

  const styles = useMemo(() => makeStyles(colors), [colors]);

  const onSelect = (id: AppLocale) => {
    if (busy) return;
    setBusy(true);
    setSelected(id);
    void (async () => {
      try {
        await setCurrentLocale(id);
        await setOnboardingDone();
        onComplete();
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <View style={[styles.root, { paddingTop: 12 }]} testID="screen-onboarding-language">
      <ScreenFitScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
      >
        <Text style={styles.brand} accessibilityRole="header">
          {APP_BRAND_KK}
        </Text>
        <Text style={styles.title}>{t.onboarding.languageTitle}</Text>
        <Text style={styles.hint}>{t.onboarding.languageHint}</Text>

        <View style={styles.list}>
          {APP_LOCALE_OPTIONS.map((opt, i) => {
            const sel = selected === opt.id;
            const last = i === APP_LOCALE_OPTIONS.length - 1;
            const label = formatAppLocaleLabel(opt.id, appLocaleDisplayLabel(opt.id));
            return (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [
                  styles.row,
                  !last && styles.rowDivider,
                  sel && styles.rowSelected,
                  pressed && { opacity: 0.9 },
                ]}
                onPress={() => onSelect(opt.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: sel, busy }}
                accessibilityLabel={label}
                disabled={busy}
                testID={`onboarding-language-${opt.id}`}
              >
                <Text style={[styles.rowLabel, sel && styles.rowLabelSelected]}>{label}</Text>
                {busy && selected === opt.id ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : sel ? (
                  <MaterialIcons name="check-circle" size={22} color={colors.accent} />
                ) : (
                  <View style={{ width: 22 }} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScreenFitScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    content: {
      paddingHorizontal: 22,
      paddingTop: 28,
      flexGrow: 1,
      justifyContent: "center",
      gap: 14,
    },
    brand: {
      color: colors.accent,
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: 0.6,
      marginBottom: 18,
      textAlign: "center",
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "800",
      textAlign: "center",
      marginBottom: 8,
    },
    hint: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
      marginBottom: 22,
    },
    list: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 52,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowSelected: {
      backgroundColor: colors.accentSurface,
    },
    rowLabel: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "600",
      flex: 1,
      marginRight: 10,
    },
    rowLabelSelected: {
      fontWeight: "800",
    },
  });
}
