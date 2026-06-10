import React from "react";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { makeSettingsStyles } from "../components/settings/settingsUi";
import { SettingsHatimHub } from "../components/settings/SettingsHatimHub";
import { makeSettingsScreenShell } from "./settings/settingsScreenShell";

export function HatimSettingsScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const shell = makeSettingsScreenShell(colors);
  const ui = makeSettingsStyles(colors);

  return (
    <ScrollView
      style={shell.root}
      contentContainerStyle={[shell.content, { paddingBottom: 24 + Math.max(insets.bottom, 8) }]}
    >
      <Text style={shell.h1}>{kk.hatim.settingsTitle}</Text>
      <Text style={ui.sectionSub}>{kk.hatim.settingsSubtitle}</Text>
      <SettingsHatimHub colors={colors} />
    </ScrollView>
  );
}
