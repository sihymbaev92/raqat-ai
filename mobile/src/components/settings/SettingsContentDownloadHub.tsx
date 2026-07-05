import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { ThemeColors } from "../../theme/colors";
import { CONTENT_PACKS, type ContentPackId } from "../../config/contentPackManifest";
import { kk } from "../../i18n/kk";
import { useLocalizedText } from "../../i18n/useLocalizedText";
import {
  clearContentPackCache,
  contentPackStatusLabel,
  downloadAllRemoteContentPacks,
  downloadContentPack,
  loadContentPackSnapshot,
  patchContentPackPrefs,
  type ContentPackSnapshot,
} from "../../services/contentPackManager";
import { SettingsCard, SettingsRow, SettingsSection, makeSettingsStyles } from "./settingsUi";
import { SettingsBoolRow } from "./settingsFormUi";

type Props = { colors: ThemeColors };

function mb(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1);
}

function packStatusText(packId: ContentPackId, snap: ContentPackSnapshot, tr: (s: string) => string): string {
  const label = contentPackStatusLabel(packId, snap);
  const st = snap.packs[packId];
  if (label === "ready") return tr(kk.settings.contentPackStatusReady);
  if (st?.status === "running") return tr(kk.settings.contentPackStatusRunning);
  if (st?.status === "blocked") return tr(kk.settings.contentPackStatusBlocked);
  if (st?.status === "error") return tr(kk.settings.contentPackStatusError);
  if (label === "partial") {
    return tr(kk.settings.contentPackStatusPartial(st?.downloadedFiles ?? 0, st?.totalFiles ?? 1));
  }
  return tr(kk.settings.contentPackStatusMissing);
}

export function SettingsContentDownloadHub({ colors }: Props) {
  const styles = makeSettingsStyles(colors);
  const btnStyles = useMemo(() => makeBtnStyles(colors), [colors]);
  const tr = useLocalizedText();
  const [snap, setSnap] = useState<ContentPackSnapshot | null>(null);
  const [busy, setBusy] = useState<ContentPackId | "all" | null>(null);

  const reload = useCallback(async () => {
    setSnap(await loadContentPackSnapshot());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
      const timer = setInterval(() => void reload(), 2500);
      return () => clearInterval(timer);
    }, [reload])
  );

  const onDownloadPack = async (packId: ContentPackId) => {
    setBusy(packId);
    try {
      setSnap(await downloadContentPack(packId));
    } finally {
      setBusy(null);
    }
  };

  const onDownloadAll = async () => {
    setBusy("all");
    try {
      setSnap(await downloadAllRemoteContentPacks());
    } finally {
      setBusy(null);
    }
  };

  const onClearPack = async (packId: ContentPackId) => {
    setBusy(packId);
    try {
      setSnap(await clearContentPackCache(packId));
    } finally {
      setBusy(null);
    }
  };

  if (!snap) return null;

  return (
    <SettingsSection
      colors={colors}
      title={tr(kk.settings.contentDownloadSection)}
      subtitle={tr(kk.settings.contentDownloadSectionSub)}
    >
      <SettingsCard colors={colors}>
        <SettingsBoolRow
          colors={colors}
          label={tr(kk.settings.contentDownloadAutoWifi)}
          hint={tr(kk.settings.contentDownloadAutoWifiHint)}
          value={snap.prefs.autoDownloadOnWifi}
          onValueChange={(autoDownloadOnWifi) => {
            void patchContentPackPrefs({ autoDownloadOnWifi }).then(setSnap);
          }}
        />
        <SettingsBoolRow
          colors={colors}
          label={tr(kk.settings.contentDownloadAllowMobile)}
          hint={tr(kk.settings.contentDownloadAllowMobileHint)}
          value={snap.prefs.allowMobileData}
          onValueChange={(allowMobileData) => {
            void patchContentPackPrefs({ allowMobileData }).then(setSnap);
          }}
        />
        <Pressable
          style={({ pressed }) => [btnStyles.primary, pressed && { opacity: 0.9 }]}
          onPress={() => void onDownloadAll()}
          disabled={busy != null}
          accessibilityRole="button"
        >
          <Text style={btnStyles.primaryTxt}>
            {busy === "all" ? tr(kk.settings.contentDownloadAllRunning) : tr(kk.settings.contentDownloadAll)}
          </Text>
        </Pressable>
      </SettingsCard>

      {CONTENT_PACKS.map((pack) => {
        const st = snap.packs[pack.id];
        const ready = contentPackStatusLabel(pack.id, snap) === "ready";
        const isBundled = pack.bundledInApk;
        return (
          <SettingsCard colors={colors} key={pack.id}>
            <Text style={[styles.sectionTitle, { fontSize: 15, marginBottom: 2 }]}>{tr(pack.labelKk)}</Text>
            <Text style={styles.sectionSub}>{tr(pack.hintKk)}</Text>
            <SettingsRow
              colors={colors}
              label={tr(kk.settings.contentPackStatusLabel)}
              value={packStatusText(pack.id, snap, tr)}
            />
            {!isBundled && st?.bytes ? (
              <Text style={styles.hint}>{tr(kk.settings.contentPackCachedMb(mb(st.bytes)))}</Text>
            ) : null}
            {!isBundled ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <Pressable
                  style={({ pressed }) => [btnStyles.primary, { flex: 1, minWidth: 120 }, pressed && { opacity: 0.9 }]}
                  onPress={() => void onDownloadPack(pack.id)}
                  disabled={busy != null || ready}
                  accessibilityRole="button"
                >
                  <Text style={btnStyles.primaryTxt}>
                    {busy === pack.id
                      ? tr(kk.settings.contentPackDownloading)
                      : ready
                        ? tr(kk.settings.contentPackDownloaded)
                        : tr(kk.settings.contentPackDownload)}
                  </Text>
                </Pressable>
                {ready ? (
                  <Pressable
                    style={({ pressed }) => [btnStyles.secondary, { flex: 1, minWidth: 120 }, pressed && { opacity: 0.9 }]}
                    onPress={() => void onClearPack(pack.id)}
                    disabled={busy != null}
                    accessibilityRole="button"
                  >
                    <Text style={btnStyles.secondaryTxt}>{tr(kk.settings.contentPackClear)}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <Text style={styles.hint}>
                {tr(kk.settings.contentPackBundledInApk)} · ~{pack.approxMb} MB
              </Text>
            )}
            {st?.lastError ? <Text style={[styles.hint, { color: colors.danger ?? "#c0392b" }]}>{st.lastError}</Text> : null}
          </SettingsCard>
        );
      })}
    </SettingsSection>
  );
}

function makeBtnStyles(colors: ThemeColors) {
  return StyleSheet.create({
    primary: {
      marginTop: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: "center",
    },
    primaryTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
    secondary: {
      marginTop: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
    },
    secondaryTxt: { color: colors.text, fontWeight: "700", fontSize: 15 },
  });
}
