import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { CONTENT_PACKS, type ContentPackId } from "../../config/contentPackManifest";
import {
  downloadAllRemoteContentPacks,
  downloadContentPack,
  loadContentPackSnapshot,
  patchContentPackPrefs,
  type ContentPackSnapshot,
} from "../../services/contentPackManager";
import { useI18n } from "../../i18n/useI18n";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { SettingsCard, SettingsSection, makeSettingsStyles } from "./settingsUi";
import { SettingsBoolRow } from "./settingsFormUi";

type Props = { colors: ThemeColors };

function cachedMb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1);
}

export function SettingsContentPackSection({ colors }: Props) {
  const t = useI18n();
  const { tr } = useKkAutoTranslator();
  const styles = makeSettingsStyles(colors);
  const [snapshot, setSnapshot] = useState<ContentPackSnapshot | null>(null);
  const [downloading, setDownloading] = useState<ContentPackId | "all" | null>(null);

  const reload = useCallback(async () => {
    setSnapshot(await loadContentPackSnapshot());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const downloadPack = async (id: ContentPackId) => {
    setDownloading(id);
    try {
      setSnapshot(await downloadContentPack(id));
    } finally {
      setDownloading(null);
    }
  };

  const downloadAll = async () => {
    setDownloading("all");
    try {
      setSnapshot(await downloadAllRemoteContentPacks());
    } finally {
      setDownloading(null);
    }
  };

  const statusLabel = (id: ContentPackId) => {
    const state = snapshot?.packs[id];
    if (!state) return t.settings.contentPackStatusMissing;
    if (state.status === "ready") return t.settings.contentPackStatusReady;
    if (state.status === "running" || downloading === id) return t.settings.contentPackStatusRunning;
    if (state.status === "blocked") return t.settings.contentPackStatusBlocked;
    if (state.status === "error") return t.settings.contentPackStatusError;
    if (state.downloadedFiles > 0) {
      return t.settings.contentPackStatusPartial(state.downloadedFiles, state.totalFiles);
    }
    return t.settings.contentPackStatusMissing;
  };

  const prefs = snapshot?.prefs;
  return (
    <SettingsSection
      colors={colors}
      title={t.settings.contentDownloadSection}
      subtitle={t.settings.contentDownloadSectionSub}
    >
      <SettingsCard colors={colors} panel>
        <SettingsBoolRow
          colors={colors}
          label={t.settings.contentDownloadAutoWifi}
          hint={t.settings.contentDownloadAutoWifiHint}
          value={prefs?.autoDownloadOnWifi ?? false}
          onChange={(autoDownloadOnWifi) => {
            void patchContentPackPrefs({ autoDownloadOnWifi }).then(reload);
            setSnapshot((current) =>
              current ? { ...current, prefs: { ...current.prefs, autoDownloadOnWifi } } : current
            );
          }}
        />
        <SettingsBoolRow
          colors={colors}
          label={t.settings.contentDownloadAllowMobile}
          hint={t.settings.contentDownloadAllowMobileHint}
          value={prefs?.allowMobileData ?? false}
          onChange={(allowMobileData) => {
            void patchContentPackPrefs({ allowMobileData }).then(reload);
            setSnapshot((current) =>
              current ? { ...current, prefs: { ...current.prefs, allowMobileData } } : current
            );
          }}
        />
      </SettingsCard>

      <Pressable
        style={({ pressed }) => [
          styles.chip,
          { alignSelf: "flex-start", marginTop: 10 },
          pressed && { opacity: 0.9 },
          downloading === "all" && { opacity: 0.65 },
        ]}
        onPress={() => void downloadAll()}
        disabled={downloading !== null}
        accessibilityRole="button"
        accessibilityLabel={t.settings.contentDownloadAll}
      >
        <Text style={styles.chipTxt}>
          {downloading === "all" ? t.settings.contentDownloadAllRunning : t.settings.contentDownloadAll}
        </Text>
      </Pressable>

      <View style={{ gap: 8, marginTop: 10 }}>
        {CONTENT_PACKS.map((pack) => {
          const state = snapshot?.packs[pack.id];
          const ready = state?.status === "ready";
          const actionLabel = ready || pack.bundledInApk
            ? t.settings.contentPackDownloaded
            : downloading === pack.id
              ? t.settings.contentPackDownloading
              : t.settings.contentPackDownload;
          return (
            <SettingsCard key={pack.id} colors={colors} panel>
              <Text style={styles.label}>{tr(pack.labelKk)}</Text>
              <Text style={[styles.hint, { marginTop: -4 }]}>{tr(pack.hintKk)}</Text>
              <Text style={[styles.hint, { marginTop: 0 }]}>
                {t.settings.contentPackStatusLabel}: {statusLabel(pack.id)}
              </Text>
              {state?.bytes ? (
                <Text style={[styles.hint, { marginTop: 0 }]}>
                  {t.settings.contentPackCachedMb(cachedMb(state.bytes))}
                </Text>
              ) : null}
              {pack.bundledInApk ? (
                <Text style={[styles.hint, { marginTop: 0 }]}>{t.settings.contentPackBundledInApk}</Text>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.chip,
                    { alignSelf: "flex-start", marginTop: 2 },
                    pressed && { opacity: 0.9 },
                    (ready || downloading !== null) && { opacity: 0.6 },
                  ]}
                  onPress={() => void downloadPack(pack.id)}
                  disabled={ready || downloading !== null}
                  accessibilityRole="button"
                  accessibilityLabel={`${tr(pack.labelKk)}: ${actionLabel}`}
                >
                  <Text style={styles.chipTxt}>{actionLabel}</Text>
                </Pressable>
              )}
            </SettingsCard>
          );
        })}
      </View>
    </SettingsSection>
  );
}
