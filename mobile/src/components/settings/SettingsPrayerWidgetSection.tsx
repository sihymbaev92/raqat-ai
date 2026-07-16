import React, { useCallback, useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { SettingsSection, makeSettingsStyles } from "./settingsUi";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import {
  getPrayerWidgetPinStatus,
  requestPinPrayerWidget,
  type PrayerWidgetPinStatus,
} from "../../services/prayerWidgetPin";
import { syncNativePrayerWidgetFromStorage } from "../../storage/prayerCache";
import { useAppLocale } from "../../i18n/runtime";

type Props = {
  colors: ThemeColors;
};

export function SettingsPrayerWidgetSection({ colors }: Props) {
  useAppLocale();
  const ui = makeSettingsStyles(colors);
  const styles = makeWidgetStyles(colors);
  const [pinStatus, setPinStatus] = useState<PrayerWidgetPinStatus | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);

  const refreshPinStatus = useCallback(async () => {
    setPinStatus(await getPrayerWidgetPinStatus());
  }, []);

  useEffect(() => {
    void refreshPinStatus();
  }, [refreshPinStatus]);

  if (Platform.OS === "web") return null;

  const title =
    Platform.OS === "ios" ? kk.settings.iosPrayerWidgetTitle : kk.settings.androidPrayerWidgetTitle;
  const subtitle =
    Platform.OS === "ios"
      ? kk.settings.iosPrayerWidgetSectionSub
      : kk.settings.androidPrayerWidgetSectionSub;
  const steps =
    Platform.OS === "ios" ? kk.settings.iosPrayerWidgetSteps : kk.settings.androidPrayerWidgetSteps;
  const hint =
    Platform.OS === "ios" ? kk.settings.iosPrayerWidgetHint : kk.settings.androidPrayerWidgetHint;

  const onPin = async () => {
    if (Platform.OS !== "android" || pinBusy) return;
    setPinBusy(true);
    try {
      await requestPinPrayerWidget();
      await refreshPinStatus();
    } finally {
      setPinBusy(false);
    }
  };

  const onSync = async () => {
    if (syncBusy) return;
    setSyncBusy(true);
    try {
      await syncNativePrayerWidgetFromStorage();
      if (Platform.OS === "android") {
        await refreshPinStatus();
      }
    } finally {
      setSyncBusy(false);
    }
  };

  return (
    <SettingsSection colors={colors} title={title} subtitle={subtitle}>
      {Platform.OS === "android" && pinStatus ? (
        <Text style={ui.hint}>
          {pinStatus.pinnedCount > 0
            ? kk.settings.androidPrayerWidgetStatusPinned(pinStatus.pinnedCount)
            : kk.settings.androidPrayerWidgetStatusNotPinned}
        </Text>
      ) : null}

      {Platform.OS === "android" && pinStatus?.pinSupported ? (
        <Pressable
          onPress={() => void onPin()}
          disabled={pinBusy}
          style={({ pressed }) => [styles.actionBtn, (pressed || pinBusy) && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.settings.androidPrayerWidgetPinCta}
        >
          {pinBusy ? (
            <RaqatOrnamentSpinner size={22} />
          ) : (
            <Text style={styles.actionBtnTxt}>{kk.settings.androidPrayerWidgetPinCta}</Text>
          )}
        </Pressable>
      ) : null}

      {Platform.OS === "android" && pinStatus && !pinStatus.pinSupported ? (
        <Text style={ui.hint}>{kk.settings.androidPrayerWidgetPinUnsupported}</Text>
      ) : null}

      <Text style={styles.stepsTitle}>{kk.settings.androidPrayerWidgetPinManualTitle}</Text>
      {steps.map((step, index) => (
        <Text key={`widget-step-${index}`} style={ui.hint}>
          {`${index + 1}. ${step}`}
        </Text>
      ))}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => void onSync()}
          disabled={syncBusy}
          style={({ pressed }) => [styles.secondaryBtn, (pressed || syncBusy) && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.settings.androidPrayerWidgetRefreshStatus}
        >
          {syncBusy ? (
            <RaqatOrnamentSpinner size={22} />
          ) : (
            <Text style={styles.secondaryBtnTxt}>{kk.settings.androidPrayerWidgetRefreshStatus}</Text>
          )}
        </Pressable>
      </View>

      <Text style={ui.hint}>{hint}</Text>
    </SettingsSection>
  );
}

function makeWidgetStyles(colors: ThemeColors) {
  return StyleSheet.create({
    stepsTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "800",
      marginTop: 8,
      marginBottom: 4,
    },
    actionsRow: {
      marginTop: 10,
      marginBottom: 4,
    },
    actionBtn: {
      alignSelf: "flex-start",
      marginTop: 8,
      marginBottom: 4,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.accent,
    },
    actionBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },
    secondaryBtn: {
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    secondaryBtnTxt: { color: colors.text, fontSize: 14, fontWeight: "700" },
  });
}
