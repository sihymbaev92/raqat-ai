import React from "react";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import { useI18n } from "../i18n/useI18n";
import { makeSettingsStyles } from "../components/settings/settingsUi";
import { SettingsHatimHub } from "../components/settings/SettingsHatimHub";
import { quranKkTextProvenanceForLocale } from "../config/quranKkTranslation";
import { useAppLocale } from "../i18n/runtime";
import { makeSettingsScreenShell } from "./settings/settingsScreenShell";

export function HatimSettingsScreen() {
  const t = useI18n();
  const locale = useAppLocale();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const shell = makeSettingsScreenShell(colors);
  const ui = makeSettingsStyles(colors);

  return (
    <ScrollView
      style={shell.root}
      contentContainerStyle={[shell.content, { paddingBottom: 24 + Math.max(insets.bottom, 8) }]}
    >
      <Text style={shell.h1}>{t.hatim.settingsTitle}</Text>
      <Text style={ui.sectionSub}>{t.hatim.settingsSubtitle}</Text>
      <Text style={ui.sectionSub}>{quranKkTextProvenanceForLocale(locale)}</Text>
      <SettingsHatimHub colors={colors} />
    </ScrollView>
  );
}
