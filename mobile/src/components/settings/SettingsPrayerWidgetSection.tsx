import React, { useCallback, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { SettingsCard, SettingsSection } from "./settingsUi";
import {
  getPrayerWidgetPinStatus,
  requestPinPrayerWidget,
  type PrayerWidgetPinStatus,
} from "../../services/prayerWidgetPin";

export function SettingsPrayerWidgetSection({ colors }: { colors: ThemeColors }) {
  const { tr } = useKkAutoTranslator();
  const [status, setStatus] = useState<PrayerWidgetPinStatus | null>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const refresh = useCallback(async () => {
    setStatus(await getPrayerWidgetPinStatus());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const isAndroid = Platform.OS === "android";
  const isIos = Platform.OS === "ios";
  if (!isAndroid && !isIos) return null;

  const title = isAndroid ? kk.settings.androidPrayerWidgetTitle : kk.settings.iosPrayerWidgetTitle;
  const steps = isAndroid ? kk.settings.androidPrayerWidgetSteps : kk.settings.iosPrayerWidgetSteps;
  const pinned = (status?.pinnedCount ?? 0) > 0;
  const pinSupported = status?.pinSupported === true;

  const onPin = async () => {
    setPinBusy(true);
    try {
      await requestPinPrayerWidget();
      await refresh();
    } finally {
      setPinBusy(false);
    }
  };

  return (
    <SettingsSection
      colors={colors}
      title={title}
      subtitle={isAndroid ? kk.settings.androidPrayerWidgetSectionSub : kk.settings.iosPrayerWidgetSectionSub}
    >
      <SettingsCard colors={colors} panel testID="settings-prayer-widget-section">
        <View style={styles.statusRow}>
          <MaterialIcons
            name={pinned ? "check-circle" : "widgets"}
            size={22}
            color={pinned ? colors.accent : colors.muted}
          />
          <Text style={[styles.statusTxt, pinned && { color: colors.accent }]}>
            {pinned
              ? tr(kk.settings.androidPrayerWidgetStatusPinned(status?.pinnedCount ?? 0))
              : tr(kk.settings.androidPrayerWidgetStatusNotPinned)}
          </Text>
        </View>

        {isAndroid && pinSupported ? (
          <Pressable
            onPress={() => void onPin()}
            disabled={pinBusy}
            style={({ pressed }) => [styles.pinBtn, (pressed || pinBusy) && { opacity: 0.88 }]}
            accessibilityRole="button"
            accessibilityLabel={tr(kk.settings.androidPrayerWidgetPinCta)}
            testID="settings-prayer-widget-pin-cta"
          >
            <MaterialIcons name="add-to-home-screen" size={20} color="#fff" />
            <Text style={styles.pinBtnTxt}>
              {pinBusy ? kk.common.loading : tr(kk.settings.androidPrayerWidgetPinCta)}
            </Text>
          </Pressable>
        ) : null}

        {isAndroid && status && !pinSupported ? (
          <Text style={styles.warn}>{tr(kk.settings.androidPrayerWidgetPinUnsupported)}</Text>
        ) : null}

        <Text style={styles.manualTitle}>{tr(kk.settings.androidPrayerWidgetPinManualTitle)}</Text>
        {steps.map((step, i) => (
          <View key={`${i}-${step}`} style={styles.stepRow}>
            <Text style={styles.stepNum}>{i + 1}.</Text>
            <Text style={styles.stepTxt}>{tr(step)}</Text>
          </View>
        ))}

        <Text style={styles.hint}>{tr(isAndroid ? kk.settings.androidPrayerWidgetHint : kk.settings.iosPrayerWidgetHint)}</Text>

        <Pressable
          onPress={() => void refresh()}
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.85 }]}
          accessibilityRole="button"
          accessibilityLabel={tr(kk.settings.androidPrayerWidgetRefreshStatus)}
          testID="settings-prayer-widget-refresh"
        >
          <MaterialIcons name="refresh" size={18} color={colors.accent} />
          <Text style={styles.refreshTxt}>{tr(kk.settings.androidPrayerWidgetRefreshStatus)}</Text>
        </Pressable>
      </SettingsCard>
    </SettingsSection>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    statusTxt: { flex: 1, color: colors.muted, fontSize: 14, fontWeight: "700", lineHeight: 20 },
    pinBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    pinBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "900" },
    warn: { color: colors.error, fontSize: 13, lineHeight: 18, marginBottom: 10 },
    manualTitle: { color: colors.text, fontSize: 13, fontWeight: "800", marginBottom: 8, marginTop: 4 },
    stepRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
    stepNum: { color: colors.accent, fontSize: 13, fontWeight: "900", width: 18 },
    stepTxt: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: "600" },
    hint: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },
    refreshBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      marginTop: 12,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    refreshTxt: { color: colors.accent, fontSize: 13, fontWeight: "800" },
  });
}
