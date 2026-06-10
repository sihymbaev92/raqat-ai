import React, { useState } from "react";
import { Text, View } from "react-native";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SettingsSection, SettingsCard, makeSettingsStyles } from "./settingsUi";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import type { ContentStatsPayload, ReadinessPayload } from "../../services/platformApiClient";
import type { OfflineQualitySnapshot } from "../../hooks/useContentDataSettings";

export type ContentDataScope = "quran";

type Props = {
  colors: ThemeColors;
  scope: ContentDataScope;
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

export function SettingsContentDataSection({
  colors,
  scope,
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
  const [advancedOpen, setAdvancedOpen] = useState(false);

  if (!apiBase && !__DEV__) return null;

  const title = kk.settings.quranDataSection;
  const subtitle = kk.settings.quranDataSectionSub;

  const rowCount = offlineQuality?.quranSurahRows ?? null;

  const savedAt =
    scope === "quran" && offlineQuality?.quranSavedAt
      ? new Date(offlineQuality.quranSavedAt).toLocaleString("kk-KZ", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <SettingsSection colors={colors} title={title} subtitle={subtitle}>
      <SettingsCard colors={colors} panel>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <MaterialIcons
            name={apiBase ? "cloud-done" : "cloud-off"}
            size={22}
            color={apiBase ? colors.success : colors.muted}
          />
          <Text style={styles.label}>
            {apiBase ? kk.settings.contentDataOnline : kk.settings.contentDataOfflineOnly}
          </Text>
        </View>
        <Text style={[styles.hint, { marginTop: 0 }]}>
          {`${kk.settings.offlineQualityQuranRows}: ${rowCount?.toLocaleString("kk-KZ") ?? "—"}`}
        </Text>
        {savedAt ? (
          <Text style={styles.hint}>
            {kk.settings.quranListSavedAt(savedAt)}
          </Text>
        ) : null}
        {apiBase ? (
          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: colors.accent,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 12,
              },
              pressed && { opacity: 0.9 },
              syncLoading && { opacity: 0.85 },
            ]}
            onPress={onSync}
            disabled={syncLoading || !apiBase}
          >
            {syncLoading ? (
              <RaqatOrnamentSpinner size={22} />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "800" }}>{kk.settings.contentSync}</Text>
            )}
          </Pressable>
        ) : null}
        {syncHint ? <Text style={styles.hint}>{syncHint}</Text> : null}
        <Pressable
          style={({ pressed }) => [styles.chip, { marginTop: 10, alignSelf: "flex-start" }, pressed && { opacity: 0.9 }]}
          onPress={onRefreshOffline}
          disabled={offlineQualityLoading}
          accessibilityRole="button"
          accessibilityLabel={kk.settings.offlineQualityRefresh}
        >
          {offlineQualityLoading ? (
            <RaqatOrnamentSpinner size={20} />
          ) : (
            <Text style={styles.chipTxt}>{kk.settings.offlineQualityRefresh}</Text>
          )}
        </Pressable>
      </SettingsCard>

      {apiBase ? (
        <>
          <Pressable
            style={({ pressed }) => [
              styles.rowBetween,
              {
                backgroundColor: colors.card,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: 10,
              },
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => setAdvancedOpen((p) => !p)}
          >
            <Text style={styles.label}>
              {advancedOpen ? kk.settings.advancedHide : kk.settings.contentDataAdvanced}
            </Text>
            <MaterialIcons name={advancedOpen ? "expand-less" : "expand-more"} size={24} color={colors.muted} />
          </Pressable>
          {advancedOpen ? (
            <View style={{ marginTop: 8, gap: 6 }}>
              {readiness?.ok && readiness.backend ? (
                <Text style={styles.hint}>{kk.settings.platformReadyHint(readiness.backend)}</Text>
              ) : null}
              {offlineQuality?.syncEtag ? (
                <Text style={[styles.hint, { fontFamily: "monospace", fontSize: 11 }]}>
                  ETag: {offlineQuality.syncEtag.slice(0, 24)}
                  {offlineQuality.syncEtag.length > 24 ? "…" : ""}
                </Text>
              ) : null}
              {offlineQuality?.syncSince ? (
                <Text style={styles.hint}>
                  {kk.settings.contentSyncSince}: {offlineQuality.syncSince}
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </SettingsSection>
  );
}
