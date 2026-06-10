import React from "react";
import { View, Text, Switch, Platform, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { SettingsSection, makeSettingsStyles } from "./settingsUi";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import {
  canPreviewPrayerNotifSound,
  previewPrayerNotifSound,
  stopPreviewPrayerNotifSound,
} from "../../utils/previewPrayerNotifSound";
import { prayerNotifSoundLabelKk } from "../../utils/prayerNotifSoundUi";
import { PRAYER_NOTIF_SOUND_UI_ORDER, type PrayerNotifSoundId } from "../../storage/prefs";
import {
  openAndroidExactAlarmSettings,
  type PrayerNotificationDiagnostics,
} from "../../services/prayerNotifications";

export type PrayerNotifWarn = "permission" | "schedule" | null;

type Props = {
  colors: ThemeColors;
  notif: boolean;
  iftar: boolean;
  prayerSoundId: PrayerNotifSoundId;
  notifWarn: PrayerNotifWarn;
  diagnostics: PrayerNotificationDiagnostics | null;
  diagnosticsLoading: boolean;
  onRefreshDiagnostics: () => void;
  onNotifToggle: (v: boolean) => void;
  onIftarChange: (v: boolean) => void;
  onPrayerSoundIdChange: (id: PrayerNotifSoundId) => void;
};

export function SettingsPrayerNotificationsSection({
  colors,
  notif,
  iftar,
  prayerSoundId,
  notifWarn,
  diagnostics,
  diagnosticsLoading,
  onRefreshDiagnostics,
  onNotifToggle,
  onIftarChange,
  onPrayerSoundIdChange,
}: Props) {
  const ui = makeSettingsStyles(colors);
  const styles = makeNotifStyles(colors);

  return (
    <SettingsSection
      colors={colors}
      title={kk.settings.sectionNotifications}
      subtitle={kk.settings.sectionNotificationsSub}
    >
      <View style={styles.rowBetween}>
        <Text style={styles.rowTxt}>{kk.prayer.enableNotif}</Text>
        <Switch value={notif} onValueChange={onNotifToggle} />
      </View>
      {notifWarn === "permission" ? <Text style={styles.warn}>{kk.settings.notifPermission}</Text> : null}
      {notifWarn === "schedule" ? (
        <View style={styles.warnBlock}>
          <Text style={styles.warn}>{kk.settings.notifScheduleEmpty}</Text>
          {Platform.OS === "android" ? (
            <Pressable
              onPress={() => void openAndroidExactAlarmSettings()}
              style={({ pressed }) => [styles.warnLinkBtn, pressed && { opacity: 0.88 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.settings.notifOpenSystemSettings}
            >
              <Text style={styles.warnLinkTxt}>{kk.settings.notifOpenSystemSettings}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <Text style={styles.hint}>{kk.prayer.notifHint}</Text>

      <View style={styles.diagnosticCard}>
        <View style={styles.diagnosticHead}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.diagnosticTitle}>{kk.settings.prayerNotifDiagnosticsTitle}</Text>
            <Text style={styles.diagnosticHint}>{kk.settings.prayerNotifDiagnosticsHint}</Text>
          </View>
          <Pressable
            onPress={onRefreshDiagnostics}
            disabled={diagnosticsLoading}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={kk.settings.prayerNotifDiagnosticsRefresh}
            style={({ pressed }) => [styles.refreshBtn, (pressed || diagnosticsLoading) && { opacity: 0.72 }]}
          >
            {diagnosticsLoading ? (
              <RaqatOrnamentSpinner size={18} />
            ) : (
              <MaterialIcons name="refresh" size={20} color={colors.accent} />
            )}
          </Pressable>
        </View>
        {diagnostics ? (
          <View style={styles.diagnosticRows}>
            <Text style={styles.diagnosticLine}>
              {kk.settings.prayerNotifDiagnosticPermission}: {diagnostics.permissionStatus}
            </Text>
            <Text style={styles.diagnosticLine}>
              {kk.settings.prayerNotifDiagnosticScheduled}: {diagnostics.scheduledPrayerCount}
            </Text>
            {diagnostics.platform === "android" ? (
              <Text style={styles.diagnosticLine}>
                Native azan alarms: {diagnostics.nativeAzanAlarmCount}
                {diagnostics.nativeAzanAlarmLastError ? ` (${diagnostics.nativeAzanAlarmLastError})` : ""}
              </Text>
            ) : null}
            <Text style={styles.diagnosticLine}>
              {kk.settings.prayerNotifDiagnosticSound}: {prayerNotifSoundLabelKk(diagnostics.soundId)}
            </Text>
            {diagnostics.androidChannelId ? (
              <Text style={styles.diagnosticLine}>
                {kk.settings.prayerNotifDiagnosticChannel}: {diagnostics.androidChannelId}
              </Text>
            ) : null}
            <Text style={styles.diagnosticLine}>
              {kk.settings.prayerNotifDiagnosticMuted}:{" "}
              {diagnostics.mutedSalatKeys.length ? diagnostics.mutedSalatKeys.join(", ") : "жоқ"}
            </Text>
          </View>
        ) : (
          <Text style={styles.diagnosticLine}>{kk.settings.prayerNotifDiagnosticsNoData}</Text>
        )}
        {Platform.OS === "android" ? (
          <View style={styles.acceptanceBox}>
            <Text style={styles.acceptanceTitle}>{kk.settings.prayerNotifAcceptanceTitle}</Text>
            {kk.settings.prayerNotifAcceptanceItems.map((item) => (
              <Text key={item} style={styles.acceptanceItem}>
                {item}
              </Text>
            ))}
            {diagnostics?.exactAlarmSettingsAvailable ? (
              <Pressable
                onPress={() => void openAndroidExactAlarmSettings()}
                style={({ pressed }) => [styles.warnLinkBtn, pressed && { opacity: 0.88 }]}
                accessibilityRole="button"
                accessibilityLabel={kk.settings.notifOpenSystemSettings}
              >
                <Text style={styles.warnLinkTxt}>{kk.settings.notifOpenSystemSettings}</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>

      <Text style={styles.label}>{kk.prayer.notifSoundSection}</Text>
      <Text style={styles.hint}>{kk.prayer.notifSoundHint}</Text>
      <View style={styles.soundPick}>
        {PRAYER_NOTIF_SOUND_UI_ORDER.map((id) => {
          const selected = prayerSoundId === id;
          const label = prayerNotifSoundLabelKk(id);
          const showPreview = canPreviewPrayerNotifSound(id);
          return (
            <View key={id} style={[styles.soundRow, selected && styles.soundRowSelected]}>
              <Pressable
                disabled={!notif}
                onPress={() => {
                  void stopPreviewPrayerNotifSound();
                  onPrayerSoundIdChange(id);
                }}
                style={({ pressed }) => [
                  styles.soundRowMain,
                  (!notif || pressed) && { opacity: !notif ? 0.45 : 0.88 },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
              >
                <Text style={[styles.rowTxt, selected && { color: colors.accentDark, fontWeight: "800" }]}>
                  {label}
                </Text>
                <Text style={[styles.soundMark, selected && { color: colors.accent }]}>{selected ? "✓" : ""}</Text>
              </Pressable>
              {showPreview ? (
                <Pressable
                  onPress={() => void previewPrayerNotifSound(id)}
                  style={({ pressed }) => [styles.soundPreviewHit, pressed && { opacity: 0.75 }]}
                  accessibilityRole="button"
                  accessibilityLabel={kk.prayer.notifSoundPreviewA11y(label)}
                >
                  <MaterialIcons name="play-arrow" size={28} color={colors.accent} />
                </Pressable>
              ) : (
                <View style={styles.soundPreviewSpacer} />
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.rowBetween}>
        <Text style={styles.rowTxt}>{kk.prayer.iftarExtra}</Text>
        <Switch value={iftar} onValueChange={onIftarChange} />
      </View>
      <Text style={styles.hint}>{kk.prayer.iftarHint}</Text>
      {Platform.OS === "android" ? <Text style={ui.hint}>{kk.settings.androidPrayerWidgetHint}</Text> : null}
    </SettingsSection>
  );
}

function makeNotifStyles(colors: ThemeColors) {
  return StyleSheet.create({
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 8,
    },
    rowTxt: { color: colors.text, fontSize: 16, flex: 1, fontWeight: "700" },
    label: { color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 8, marginTop: 4 },
    hint: { color: colors.muted, fontSize: 13, marginTop: 8, lineHeight: 18 },
    warn: { color: colors.error, fontSize: 13, marginTop: 8, lineHeight: 19 },
    warnBlock: { marginTop: 8, gap: 8 },
    warnLinkBtn: {
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    warnLinkTxt: { color: colors.accent, fontSize: 13, fontWeight: "800" },
    diagnosticCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      marginTop: 10,
      marginBottom: 12,
      gap: 10,
    },
    diagnosticHead: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    diagnosticTitle: { color: colors.text, fontSize: 13, fontWeight: "900" },
    diagnosticHint: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 2, fontWeight: "600" },
    refreshBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSurface,
    },
    diagnosticRows: { gap: 3 },
    diagnosticLine: { color: colors.muted, fontSize: 11, lineHeight: 16, fontWeight: "700" },
    acceptanceBox: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 10,
      gap: 5,
    },
    acceptanceTitle: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: "900" },
    acceptanceItem: { color: colors.muted, fontSize: 11, lineHeight: 16, fontWeight: "700" },
    soundPick: { gap: 6, marginBottom: 10 },
    soundRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      paddingVertical: 4,
      paddingLeft: 6,
      paddingRight: 4,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    soundRowMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      paddingHorizontal: 8,
      minHeight: 44,
    },
    soundRowSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSurface,
    },
    soundPreviewHit: {
      padding: 6,
      marginVertical: 2,
      borderRadius: 10,
    },
    soundPreviewSpacer: { width: 40 },
    soundMark: { width: 22, textAlign: "right", fontSize: 16, color: colors.muted },
  });
}
