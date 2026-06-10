import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Switch } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { navigateToRootStackScreen } from "../../navigation/navigateToMoreStack";
import {
  SettingsSection,
  SettingsCard,
  SettingsRow,
  makeSettingsStyles,
} from "./settingsUi";
import { CityPickerModal } from "./CityPickerModal";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import {
  addSavedCity,
  getPrayerMosqueShiftMin,
  getPrayerSourceMode,
  setPrayerMosqueShiftMin,
  setPrayerSourceMode,
  setSelectedCity,
  type PrayerSourceMode,
} from "../../storage/prefs";
import { KZ_CITY_PRESETS_LIST } from "../../constants/kzCityPresetsList";

type Props = {
  colors: ThemeColors;
  city: string;
  country: string;
  cityLabel: string;
  onCityChange: (city: string, country: string, label: string) => void;
  onPrayerScheduleChange: () => void | Promise<void>;
};

export function SettingsPrayerLocationSection({
  colors,
  city,
  country,
  cityLabel,
  onCityChange,
  onPrayerScheduleChange,
}: Props) {
  const styles = makeSettingsStyles(colors);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sourceMode, setSourceMode] = useState<PrayerSourceMode>("calc");
  const [mosqueShift, setMosqueShift] = useState(0);

  const load = useCallback(async () => {
    setSourceMode(await getPrayerSourceMode());
    setMosqueShift(await getPrayerMosqueShiftMin());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyCity = async (c: string, co: string, label: string) => {
    await setSelectedCity(c, co);
    await addSavedCity(c, co);
    onCityChange(c, co, label);
    await onPrayerScheduleChange();
  };

  const setMode = async (mode: PrayerSourceMode) => {
    setSourceMode(mode);
    await setPrayerSourceMode(mode);
    await onPrayerScheduleChange();
  };

  const bumpShift = async (delta: number) => {
    const next = Math.max(-30, Math.min(30, mosqueShift + delta));
    setMosqueShift(next);
    await setPrayerMosqueShiftMin(next);
    if (sourceMode === "mosque") await onPrayerScheduleChange();
  };

  return (
    <SettingsSection
      colors={colors}
      title={kk.settings.sectionLocationPrayer}
      subtitle={kk.settings.sectionLocationPrayerSub}
    >
      <SettingsCard colors={colors}>
        <SettingsRow
          colors={colors}
          label={kk.settings.cityTitle}
          value={cityLabel || city}
          onPress={() => setPickerOpen(true)}
        />
        <View style={styles.chipRow}>
          <Pressable
            style={({ pressed }) => [
              styles.chip,
              sourceMode === "calc" && styles.chipActive,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => void setMode("calc")}
          >
            <Text style={[styles.chipTxt, sourceMode === "calc" && styles.chipTxtActive]}>
              {kk.prayer.sourceCalc}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.chip,
              sourceMode === "mosque" && styles.chipActive,
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => void setMode("mosque")}
          >
            <Text style={[styles.chipTxt, sourceMode === "mosque" && styles.chipTxtActive]}>
              {kk.prayer.sourceMosque}
            </Text>
          </Pressable>
        </View>
        {sourceMode === "mosque" ? (
          <View style={[styles.rowBetween, styles.chipRow]}>
            <Text style={styles.label}>{kk.prayer.mosqueShiftLabel(mosqueShift)}</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.9 }]}
                onPress={() => void bumpShift(-5)}
              >
                <Text style={styles.chipTxt}>−5</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.9 }]}
                onPress={() => void bumpShift(-1)}
              >
                <Text style={styles.chipTxt}>−1</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.9 }]}
                onPress={() => void bumpShift(1)}
              >
                <Text style={styles.chipTxt}>+1</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.9 }]}
                onPress={() => void bumpShift(5)}
              >
                <Text style={styles.chipTxt}>+5</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        <SettingsRow
          colors={colors}
          label={kk.settings.openPrayerTimes}
          onPress={() => navigateToRootStackScreen("PrayerTimes")}
        />
      </SettingsCard>
      <Text style={styles.hint}>{kk.prayer.mosqueShiftHint}</Text>
      <CityPickerModal
        visible={pickerOpen}
        colors={colors}
        selectedCity={city}
        selectedCountry={country}
        onClose={() => setPickerOpen(false)}
        onSelect={(c, co, label) => void applyCity(c, co, label)}
      />
    </SettingsSection>
  );
}

export function cityLabelFor(city: string, country: string): string {
  const p = KZ_CITY_PRESETS_LIST.find((x) => x.city === city && x.country === country);
  return p?.label ?? city;
}
