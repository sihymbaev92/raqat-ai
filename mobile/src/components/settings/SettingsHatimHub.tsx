import React, { useCallback, useState } from "react";
import { View, Text, Platform, Alert } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../../navigation/types";
import type { ThemeColors } from "../../theme/colors";
import { useAppTheme } from "../../theme/ThemeContext";
import { isThemeSchemeDark, type ThemeSchemeId } from "../../theme/themeSchemes";
import { useI18n } from "../../i18n/useI18n";
import {
  getHatimAudioPlayUntil,
  setHatimAudioPlayUntil,
  type HatimAudioPlayUntil,
} from "../../storage/hatimPrefs";
import { clearHatimProgress, syncHatimWithServerBidirectional } from "../../storage/hatimProgress";
import { requestNotificationPermissions } from "../../services/prayerNotifications";
import {
  getHatimReminderClock,
  getHatimReminderEnabled,
  setHatimReminderClock,
  setHatimReminderEnabled,
  syncHatimReminderSchedule,
} from "../../services/hatimReminderNotifications";
import {
  SettingsIconCard,
  SettingsIconRow,
  SettingsRadioList,
  makeSettingsStyles,
} from "./settingsUi";
import { SettingsBoolRow, SettingsChoiceRow } from "./settingsFormUi";

type Props = { colors: ThemeColors };

type ThemeQuickId = "light" | "dark";

function themeQuickFromScheme(scheme: ThemeSchemeId): ThemeQuickId {
  return isThemeSchemeDark(scheme) ? "dark" : "light";
}

function playUntilLabel(scope: HatimAudioPlayUntil, t: ReturnType<typeof useI18n>): string {
  if (scope === "juz") return t.hatim.settingsPlayUntilJuz;
  if (scope === "surah") return t.hatim.settingsPlayUntilSurah;
  return t.hatim.settingsPlayUntilAyah;
}

export function SettingsHatimHub({ colors }: Props) {
  const t = useI18n();
  const styles = makeSettingsStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { themeScheme, setThemeScheme } = useAppTheme();

  const [playUntil, setPlayUntil] = useState<HatimAudioPlayUntil>("juz");
  const [playUntilOpen, setPlayUntilOpen] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [reminderErr, setReminderErr] = useState<string | null>(null);
  const reload = useCallback(async () => {
    const [scope, en, clock] = await Promise.all([
      getHatimAudioPlayUntil(),
      getHatimReminderEnabled(),
      getHatimReminderClock(),
    ]);
    setPlayUntil(scope);
    setReminderEnabled(en);
    setReminderHour(clock.hour);
    setReminderMinute(clock.minute);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  const themeQuick = themeQuickFromScheme(themeScheme);

  const onThemeQuick = (id: ThemeQuickId) => {
    setThemeScheme(id === "dark" ? "noir" : "light");
  };

  const onPlayUntilPick = (scope: HatimAudioPlayUntil) => {
    setPlayUntil(scope);
    void setHatimAudioPlayUntil(scope);
    setPlayUntilOpen(false);
  };

  const pad2 = (n: number) => String(n).padStart(2, "0");

  const bumpReminderClock = async (deltaMin: number) => {
    let t = reminderHour * 60 + reminderMinute + deltaMin;
    t = Math.max(6 * 60, Math.min(23 * 60 + 59, t));
    const h = Math.floor(t / 60);
    const m = t % 60;
    await setHatimReminderClock(h, m);
    setReminderHour(h);
    setReminderMinute(m);
    if (reminderEnabled && Platform.OS !== "web") {
      await syncHatimReminderSchedule();
    }
  };

  const onReminderToggle = async (v: boolean) => {
    setReminderErr(null);
    if (Platform.OS === "web") return;
    if (v) {
      const ok = await requestNotificationPermissions();
      if (!ok) {
        setReminderErr(t.hatim.reminderPermNeeded);
        return;
      }
    }
    await setHatimReminderEnabled(v);
    setReminderEnabled(v);
    await syncHatimReminderSchedule();
  };

  const onClearProgress = () => {
    Alert.alert(t.hatim.settingsClearTitle, t.hatim.settingsClearBody, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.hatim.settingsClearConfirm,
        style: "destructive",
        onPress: () => {
          void (async () => {
            await clearHatimProgress();
            try {
              await syncHatimWithServerBidirectional();
            } catch {
              /* */
            }
          })();
        },
      },
    ]);
  };

  return (
    <>
      <SettingsRadioList
        colors={colors}
        value={themeQuick}
        onChange={onThemeQuick}
        options={[
          { id: "light" as const, label: t.settings.themeLight },
          { id: "dark" as const, label: t.settings.themeDark },
        ]}
      />

      <SettingsIconCard colors={colors}>
        <SettingsIconRow
          colors={colors}
          icon="menu-book"
          label={t.hatim.settingsMushaf}
          onPress={() => navigation.navigate("QuranSettings")}
        />
        <SettingsIconRow
          colors={colors}
          icon="headphones"
          label={t.hatim.settingsPlayUntil}
          value={playUntilLabel(playUntil, t)}
          onPress={() => setPlayUntilOpen((o) => !o)}
          last={!playUntilOpen}
        />
        {playUntilOpen ? (
          <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
            {(["juz", "surah", "ayah"] as const).map((scope) => (
              <SettingsChoiceRow
                key={scope}
                colors={colors}
                label={playUntilLabel(scope, t)}
                selected={playUntil === scope}
                onPress={() => onPlayUntilPick(scope)}
              />
            ))}
          </View>
        ) : null}
      </SettingsIconCard>

      {Platform.OS !== "web" ? (
        <SettingsIconCard colors={colors}>
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 }}>
            <SettingsBoolRow
              colors={colors}
              label={t.hatim.reminderTitle}
              hint={t.hatim.reminderHint}
              value={reminderEnabled}
              onChange={(v) => void onReminderToggle(v)}
            />
            {reminderErr ? (
              <Text style={[styles.hint, { marginTop: 6 }]}>{reminderErr}</Text>
            ) : null}
            {reminderEnabled ? (
              <View style={{ marginTop: 12, alignItems: "center", gap: 8 }}>
                <Text style={styles.label}>{t.hatim.reminderTimeLabel}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.chip,
                      { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
                      pressed && { opacity: 0.88 },
                    ]}
                    onPress={() => void bumpReminderClock(-30)}
                    accessibilityRole="button"
                    accessibilityLabel={t.hatim.reminderTimeMinusA11y}
                  >
                    <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>−</Text>
                  </Pressable>
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800", minWidth: 72, textAlign: "center" }}>
                    {pad2(reminderHour)}:{pad2(reminderMinute)}
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.chip,
                      { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
                      pressed && { opacity: 0.88 },
                    ]}
                    onPress={() => void bumpReminderClock(30)}
                    accessibilityRole="button"
                    accessibilityLabel={t.hatim.reminderTimePlusA11y}
                  >
                    <Text style={{ color: colors.text, fontSize: 22, fontWeight: "700" }}>+</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        </SettingsIconCard>
      ) : null}

      <SettingsIconCard colors={colors}>
        <SettingsIconRow
          colors={colors}
          icon="sync"
          label={t.hatim.settingsSyncProgress}
          onPress={() => void syncHatimWithServerBidirectional()}
        />
        <SettingsIconRow
          colors={colors}
          icon="delete-outline"
          label={t.hatim.settingsClearProgress}
          onPress={onClearProgress}
          last
        />
      </SettingsIconCard>

      <Text style={styles.hint}>{t.hatim.settingsFootnote}</Text>
    </>
  );
}
