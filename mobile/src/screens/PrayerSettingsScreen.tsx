import React, { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { getSelectedCity } from "../storage/prefs";
import { stopPreviewPrayerNotifSound } from "../utils/previewPrayerNotifSound";
import { makeSettingsStyles } from "../components/settings/settingsUi";
import {
  SettingsPrayerLocationSection,
  cityLabelFor,
} from "../components/settings/SettingsPrayerLocationSection";
import { SettingsPrayerNotificationsSection } from "../components/settings/SettingsPrayerNotificationsSection";
import { SettingsPrayerWidgetSection } from "../components/settings/SettingsPrayerWidgetSection";
import { usePrayerSettingsSchedule } from "../hooks/usePrayerSettingsSchedule";
import { makeSettingsScreenShell } from "./settings/settingsScreenShell";
import { useScreenFitMetrics } from "../theme/screenFit";
import { ScreenFitScrollView } from "../components/ScreenFit";
import { useAppLocale } from "../i18n/runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";

export function PrayerSettingsScreen() {
  const locale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const screenFit = useScreenFitMetrics();
  const shell = makeSettingsScreenShell(colors);
  const ui = makeSettingsStyles(colors);

  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [cityLabel, setCityLabel] = useState("");

  const {
    notif,
    iftar,
    prayerSoundId,
    notifWarn,
    diagnostics,
    diagnosticsLoading,
    refreshDiagnostics,
    loadNotifPrefs,
    rescheduleFromCache,
    onNotifToggle,
    onIftarChange,
    onPrayerSoundIdChange,
  } = usePrayerSettingsSchedule();

  const loadCity = useCallback(async () => {
    const c = await getSelectedCity();
    setCity(c.city);
    setCountry(c.country);
    setCityLabel(cityLabelFor(c.city, c.country, locale, tr));
  }, [locale, tr]);

  useEffect(() => {
    void loadCity();
    void loadNotifPrefs();
  }, [loadCity, loadNotifPrefs]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void stopPreviewPrayerNotifSound();
      };
    }, [])
  );

  return (
    <ScreenFitScrollView
      style={shell.root}
      contentContainerStyle={shell.content}
      top={screenFit.isCompactPhone ? 12 : 16}
      bottom={24 + Math.max(insets.bottom, 8)}
    >
      <Text style={shell.h1}>{kk.settings.prayerSettingsTitle}</Text>
      <Text style={ui.sectionSub}>{kk.settings.prayerSettingsSubtitle}</Text>

      <SettingsPrayerLocationSection
        colors={colors}
        city={city}
        country={country}
        cityLabel={cityLabel}
        onCityChange={(c, co, label) => {
          setCity(c);
          setCountry(co);
          setCityLabel(label);
        }}
        onPrayerScheduleChange={rescheduleFromCache}
      />

      <SettingsPrayerNotificationsSection
        colors={colors}
        notif={notif}
        iftar={iftar}
        prayerSoundId={prayerSoundId}
        notifWarn={notifWarn}
        diagnostics={diagnostics}
        diagnosticsLoading={diagnosticsLoading}
        onRefreshDiagnostics={() => void refreshDiagnostics()}
        onNotifToggle={(v) => void onNotifToggle(v)}
        onIftarChange={(v) => void onIftarChange(v)}
        onPrayerSoundIdChange={(id) => void onPrayerSoundIdChange(id)}
      />

      <SettingsPrayerWidgetSection colors={colors} />
    </ScreenFitScrollView>
  );
}
