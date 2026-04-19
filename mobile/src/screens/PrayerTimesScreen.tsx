import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { fetchPrayerTimesByCity } from "../api/prayerTimes";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { KZ_CITY_PRESETS } from "../constants/kzCities";
import {
  getSelectedCity,
  setSelectedCity,
  addSavedCity,
  getNotifEnabled,
  setNotifEnabled,
  getIftarEnabled,
  setIftarEnabled,
} from "../storage/prefs";
import { savePrayerCache } from "../storage/prayerCache";
import {
  reschedulePrayerNotifications,
  requestNotificationPermissions,
} from "../services/prayerNotifications";
import type { ThemeColors } from "../theme/colors";
import { CompactPrayerTimesRow } from "../components/CompactPrayerTimesRow";

function resultToCells(
  r: NonNullable<Awaited<ReturnType<typeof fetchPrayerTimesByCity>>>
): { key: string; time: string }[] {
  if (r.error) return [];
  return [
    { key: "fajr", time: r.fajr },
    { key: "sun", time: r.sunrise },
    { key: "dhuhr", time: r.dhuhr },
    { key: "asr", time: r.asr },
    { key: "maghrib", time: r.maghrib },
    { key: "isha", time: r.isha },
  ];
}

export function PrayerTimesScreen() {
  const { colors, isDark } = useAppTheme();
  const [city, setCity] = useState("Shymkent");
  const [country, setCountry] = useState("Kazakhstan");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof fetchPrayerTimesByCity>
  > | null>(null);
  const [notif, setNotif] = useState(true);
  const [iftar, setIftar] = useState(false);

  const fetchAndSave = useCallback(
    async (c: string, co: string) => {
      setLoading(true);
      const data = await fetchPrayerTimesByCity(c, co, 3);
      setResult(data);
      setCity(c);
      setCountry(co);
      if (!data.error) {
        await setSelectedCity(c, co);
        await addSavedCity(c, co);
        await savePrayerCache(data);
        const [en, ift] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
        await reschedulePrayerNotifications(data, {
          enabled: en,
          iftarExtra: ift,
        });
      }
      setLoading(false);
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const prefs = await getSelectedCity();
        const n = await getNotifEnabled();
        const i = await getIftarEnabled();
        if (cancelled) return;
        setCity(prefs.city);
        setCountry(prefs.country);
        setNotif(n);
        setIftar(i);
        await fetchAndSave(prefs.city, prefs.country);
      })();
      return () => {
        cancelled = true;
      };
    }, [fetchAndSave])
  );

  const load = () => fetchAndSave(city, country);

  const applyPreset = (c: string, co: string) => fetchAndSave(c, co);

  const onNotif = async (v: boolean) => {
    if (v) {
      const ok = await requestNotificationPermissions();
      if (!ok) return;
    }
    setNotif(v);
    await setNotifEnabled(v);
    if (result && !result.error) {
      await reschedulePrayerNotifications(result, {
        enabled: v,
        iftarExtra: iftar,
      });
    }
  };

  const onIftar = async (v: boolean) => {
    setIftar(v);
    await setIftarEnabled(v);
    if (result && !result.error) {
      await reschedulePrayerNotifications(result, {
        enabled: notif,
        iftarExtra: v,
      });
    }
  };

  const styles = makeStyles(colors);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>{kk.prayer.hint}</Text>

      <Text style={styles.label}>{kk.prayer.city}</Text>
      <TextInput
        style={styles.input}
        value={city}
        onChangeText={setCity}
        placeholder="Shymkent"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.label}>{kk.prayer.country}</Text>
      <TextInput
        style={styles.input}
        value={country}
        onChangeText={setCountry}
        placeholder="Kazakhstan"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>{kk.prayer.presets}</Text>
      <View style={styles.chips}>
        {KZ_CITY_PRESETS.map((p) => (
          <Pressable
            key={p.label}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
            onPress={() => applyPreset(p.city, p.country)}
          >
            <Text style={styles.chipTxt}>{p.label}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={load}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>{kk.prayer.refresh}</Text>
        )}
      </Pressable>

      <Text style={styles.label}>{kk.prayer.notifications}</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.rowTxt}>{kk.prayer.enableNotif}</Text>
        <Switch value={notif} onValueChange={onNotif} />
      </View>
      <View style={styles.rowBetween}>
        <Text style={styles.rowTxt}>{kk.prayer.iftarExtra}</Text>
        <Switch value={iftar} onValueChange={onIftar} />
      </View>
      <Text style={styles.subHint}>{kk.prayer.notifHint}</Text>

      {result?.error ? (
        <Text style={styles.err}>
          {kk.common.error}: {result.error}
        </Text>
      ) : null}

      {result && !result.error ? (
        <View style={styles.table}>
          <Text style={styles.date}>
            {result.city}, {result.country} · {result.date}
          </Text>
          <CompactPrayerTimesRow colors={colors} rows={resultToCells(result)} isDark={isDark} sixRows />
        </View>
      ) : !result?.error ? (
        <CompactPrayerTimesRow colors={colors} rows={[]} pending={loading && !result} isDark={isDark} sixRows />
      ) : null}
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 20, paddingTop: 16, paddingBottom: 40 },
    hint: { color: colors.muted, marginBottom: 20, fontSize: 14 },
    subHint: { color: colors.muted, marginBottom: 16, fontSize: 12, lineHeight: 18 },
    label: { color: colors.muted, fontSize: 12, marginBottom: 6 },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      color: colors.text,
      marginBottom: 14,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 16,
    },
    chip: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
    },
    chipTxt: { color: colors.text, fontSize: 13 },
    btn: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 20,
    },
    btnPressed: { opacity: 0.9 },
    btnText: { color: "#ffffff", fontWeight: "700", fontSize: 16 },
    rowBetween: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowTxt: { color: colors.text, fontSize: 14, flex: 1, paddingRight: 12 },
    err: { color: colors.error, marginBottom: 12 },
    table: {
      marginBottom: 8,
    },
    date: { color: colors.muted, marginBottom: 12, fontSize: 14, fontWeight: "700" },
  });
}
