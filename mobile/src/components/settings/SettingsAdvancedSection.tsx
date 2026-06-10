import React, { useState } from "react";
import { Text } from "react-native";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SettingsSection, SettingsCard, makeSettingsStyles } from "./settingsUi";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import type { ContentStatsPayload, ReadinessPayload } from "../../services/platformApiClient";

type OfflineQualitySnapshot = {
  quranSurahRows: number;
  quranSavedAt: string | null;
  syncEtag: string | null;
  syncSince: string | null;
  checkedAt: string;
};

type Props = {
  colors: ThemeColors;
  apiBase: string;
  stats: ContentStatsPayload | null;
  readiness: ReadinessPayload | null;
  syncLoading: boolean;
  syncHint: string | null;
  onSync: () => void;
  offlineQuality: OfflineQualitySnapshot | null;
  offlineQualityLoading: boolean;
  onRefreshOffline: () => void;
};

export function SettingsAdvancedSection({
  colors,
  apiBase,
  stats,
  readiness,
  syncLoading,
  syncHint,
  onSync,
  offlineQuality,
  offlineQualityLoading,
  onRefreshOffline,
}: Props) {
  const styles = makeSettingsStyles(colors);
  const [open, setOpen] = useState(false);

  if (!apiBase && !__DEV__) return null;

  return (
    <SettingsSection
      colors={colors}
      title={kk.settings.sectionAdvanced}
      subtitle={kk.settings.sectionAdvancedSub}
    >
      <Pressable
        style={({ pressed }) => [
          styles.rowBetween,
          {
            backgroundColor: colors.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 10,
          },
          pressed && { opacity: 0.9 },
        ]}
        onPress={() => setOpen((p) => !p)}
      >
        <Text style={styles.label}>{open ? kk.settings.advancedHide : kk.settings.advancedShow}</Text>
        <MaterialIcons name={open ? "expand-less" : "expand-more"} size={24} color={colors.muted} />
      </Pressable>
      {open ? (
        <>
          {readiness?.ok && readiness.backend ? (
            <Text style={styles.hint}>{kk.settings.platformReadyHint(readiness.backend)}</Text>
          ) : null}
          {apiBase ? (
            <>
              <Pressable
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.accent,
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: "center",
                    marginTop: 8,
                  },
                  pressed && { opacity: 0.9 },
                  syncLoading && { opacity: 0.85 },
                ]}
                onPress={onSync}
                disabled={syncLoading}
              >
                {syncLoading ? (
                  <RaqatOrnamentSpinner size={22} />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "800" }}>{kk.settings.contentSync}</Text>
                )}
              </Pressable>
              {syncHint ? <Text style={styles.hint}>{syncHint}</Text> : null}
            </>
          ) : null}
          <SettingsCard colors={colors} panel style={{ marginTop: 4 }}>
            <Text style={styles.label}>{kk.settings.offlineQualityTitle}</Text>
            <Text style={[styles.hint, { marginTop: 0 }]}>
              {kk.settings.offlineQualityQuranRows}: {offlineQuality?.quranSurahRows ?? "—"}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.chip, pressed && { opacity: 0.9 }]}
              onPress={onRefreshOffline}
              disabled={offlineQualityLoading}
            >
              {offlineQualityLoading ? (
                <RaqatOrnamentSpinner size={22} />
              ) : (
                <Text style={styles.chipTxt}>{kk.settings.offlineQualityRefresh}</Text>
              )}
            </Pressable>
          </SettingsCard>
        </>
      ) : null}
    </SettingsSection>
  );
}
