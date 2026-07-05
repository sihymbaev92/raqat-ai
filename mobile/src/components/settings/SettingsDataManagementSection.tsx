import React, { useCallback, useMemo, useState } from "react";
import { Alert, Platform, StyleSheet, Text } from "react-native";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { SettingsCard, SettingsRow, SettingsSection } from "./settingsUi";
import {
  clearHalalNetworkCaches,
  clearSelectableAppCaches,
  clearWebViewDiskCache,
  openAndroidAppStorageSettings,
} from "../../services/appDataMaintenance";

export function SettingsDataManagementSection({ colors }: { colors: ThemeColors }) {
  const { tr } = useKkAutoTranslator();
  const [busy, setBusy] = useState(false);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const runAction = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  }, []);

  const confirmClear = (title: string, message: string, action: () => Promise<void>) => {
    Alert.alert(tr(title), tr(message), [
      { text: kk.common.cancel, style: "cancel" },
      { text: kk.common.confirm, style: "destructive", onPress: () => void runAction(action) },
    ]);
  };

  return (
    <SettingsSection
      colors={colors}
      title={kk.settings.dataManagementTitle}
      subtitle={kk.settings.dataManagementSub}
    >
      <SettingsCard colors={colors} panel>
        <Text style={styles.hint}>{tr(kk.settings.dataManagementHint)}</Text>
        <SettingsRow
          colors={colors}
          label={kk.settings.dataClearWebCache}
          onPress={() =>
            confirmClear(
              kk.settings.dataClearWebCache,
              kk.settings.dataClearWebCacheConfirm,
              clearWebViewDiskCache
            )
          }
          disabled={busy}
        />
        <SettingsRow
          colors={colors}
          label={kk.settings.dataClearHalalCache}
          onPress={() =>
            confirmClear(
              kk.settings.dataClearHalalCache,
              kk.settings.dataClearHalalCacheConfirm,
              clearHalalNetworkCaches
            )
          }
          disabled={busy}
        />
        <SettingsRow
          colors={colors}
          label={kk.settings.dataClearAppCaches}
          onPress={() =>
            confirmClear(
              kk.settings.dataClearAppCaches,
              kk.settings.dataClearAppCachesConfirm,
              clearSelectableAppCaches
            )
          }
          disabled={busy}
        />
        {Platform.OS === "android" ? (
          <SettingsRow
            colors={colors}
            label={kk.settings.dataOpenAndroidStorage}
            onPress={() => void openAndroidAppStorageSettings()}
            disabled={busy}
            testID="settings-open-android-storage"
          />
        ) : (
          <SettingsRow
            colors={colors}
            label={kk.settings.dataOpenSystemSettings}
            onPress={() => void openAndroidAppStorageSettings()}
            disabled={busy}
          />
        )}
        <Text style={styles.footnote}>{tr(kk.settings.dataFullClearFootnote)}</Text>
      </SettingsCard>
    </SettingsSection>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    hint: { color: colors.muted, fontSize: 13, lineHeight: 18, marginBottom: 8 },
    footnote: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },
  });
}
