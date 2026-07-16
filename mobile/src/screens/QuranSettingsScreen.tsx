import React from "react";
import { ScrollView, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { makeSettingsStyles } from "../components/settings/settingsUi";
import { SettingsQuranHub } from "../components/settings/SettingsQuranHub";
import { SettingsContentDataSection } from "../components/settings/SettingsContentDataSection";
import { useContentDataSettings } from "../hooks/useContentDataSettings";
import { makeSettingsScreenShell } from "./settings/settingsScreenShell";
import { useAppLocale } from "../i18n/runtime";

export function QuranSettingsScreen() {
  useAppLocale();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const shell = makeSettingsScreenShell(colors);
  const ui = makeSettingsStyles(colors);
  const content = useContentDataSettings();

  return (
    <ScrollView
      style={shell.root}
      contentContainerStyle={[shell.content, { paddingBottom: 24 + Math.max(insets.bottom, 8) }]}
    >
      <Text style={shell.h1}>{kk.settings.quranSettingsTitle}</Text>
      <Text style={ui.sectionSub}>{kk.settings.quranSettingsSubtitle}</Text>

      <SettingsQuranHub colors={colors} />

      <SettingsContentDataSection
        colors={colors}
        scope="quran"
        apiBase={content.apiBase}
        stats={content.stats}
        readiness={content.readiness}
        syncLoading={content.syncLoading}
        syncHint={content.syncHint}
        onSync={() => void content.runManualContentSync()}
        offlineQuality={content.offlineQuality}
        offlineQualityLoading={content.offlineQualityLoading}
        onRefreshOffline={() => void content.refreshOfflineQuality()}
      />
    </ScrollView>
  );
}
