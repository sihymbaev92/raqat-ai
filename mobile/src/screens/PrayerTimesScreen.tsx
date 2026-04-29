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
  getPrayerSourceMode,
  setPrayerSourceMode,
  getPrayerMosqueShiftMin,
  setPrayerMosqueShiftMin,
  type PrayerSourceMode,
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
  const [sourceMode, setSourceMode] = useState<PrayerSourceMode>("calc");
  const [mosqueShiftMin, setMosqueShiftMin] = useState(0);

  const shiftTime = useCallback((hhmm: string, shiftMin: number): string => {
    const m = /^(\d{1,2}):(\d{2})$/.exec((hhmm || "").trim());
    if (!m) return hhmm;
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return hhmm;
    let total = hh * 60 + mm + shiftMin;
    while (total < 0) total += 24 * 60;
    total %= 24 * 60;
    const nh = String(Math.floor(total / 60)).padStart(2, "0");
    const nm = String(total % 60).padStart(2, "0");
    return `${nh}:${nm}`;
  }, []);

  const applyMosqueShift = useCallback(
    (data: NonNullable<Awaited<ReturnType<typeof fetchPrayerTimesByCity>>>) => {
      if (sourceMode !== "mosque" || data.error || mosqueShiftMin === 0) return data;
      return {
        ...data,
        fajr: shiftTime(data.fajr, mosqueShiftMin),
        sunrise: shiftTime(data.sunrise, mosqueShiftMin),
        dhuhr: shiftTime(data.dhuhr, mosqueShiftMin),
        asr: shiftTime(data.asr, mosqueShiftMin),
        maghrib: shiftTime(data.maghrib, mosqueShiftMin),
        isha: shiftTime(data.isha, mosqueShiftMin),
      };
    },
    [mosqueShiftMin, shiftTime, sourceMode]
  );

  const fetchAndSave = useCallback(
    async (c: string, co: string) => {
      setLoading(true);
      const data = await fetchPrayerTimesByCity(c, co, 3);
      const out = applyMosqueShift(data);
      setResult(out);
      setCity(c);
      setCountry(co);
      if (!out.error) {
        await setSelectedCity(c, co);
        await addSavedCity(c, co);
        await savePrayerCache(out);
        const [en, ift] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
        await reschedulePrayerNotifications(out, {
          enabled: en,
          iftarExtra: ift,
        });
      }
      setLoading(false);
    },
    [applyMosqueShift]
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const prefs = await getSelectedCity();
        const n = await getNotifEnabled();
        const i = await getIftarEnabled();
        const mode = await getPrayerSourceMode();
        const shift = await getPrayerMosqueShiftMin();
        if (cancelled) return;
        setCity(prefs.city);
        setCountry(prefs.country);
        setNotif(n);
        setIftar(i);
        setSourceMode(mode);
        setMosqueShiftMin(shift);
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

  const onSourceMode = async (mode: PrayerSourceMode) => {
    setSourceMode(mode);
    await setPrayerSourceMode(mode);
    await fetchAndSave(city, country);
  };

  const onMosqueShift = async (delta: number) => {
    const next = Math.max(-30, Math.min(30, mosqueShiftMin + delta));
    if (next === mosqueShiftMin) return;
    setMosqueShiftMin(next);
    await setPrayerMosqueShiftMin(next);
    await fetchAndSave(city, country);
  };

  const styles = makeStyles(colors);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.hint}>{kk.prayer.hint}</Text>

      <Text style={styles.label}>{kk.prayer.sourceMode}</Text>
      <View style={styles.chips}>
        <Pressable
          style={({ pressed }) => [
            styles.chip,
            sourceMode === "calc" && styles.chipActive,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => void onSourceMode("calc")}
        >
          <Text style={[styles.chipTxt, sourceMode === "calc" && styles.chipTxtActive]}>
            {kk.prayer.sourceCalc}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.chip,
            sourceMode === "mosque" && styles.chipActive,
            pressed && { opacity: 0.85 },
          ]}
          onPress={() => void onSourceMode("mosque")}
        >
          <Text style={[styles.chipTxt, sourceMode === "mosque" && styles.chipTxtActive]}>
            {kk.prayer.sourceMosque}
          </Text>
        </Pressable>
      </View>
      {sourceMode === "mosque" ? (
        <View style={styles.shiftCard}>
          <Text style={styles.rowTxt}>{kk.prayer.mosqueShiftLabel(mosqueShiftMin)}</Text>
          <View style={styles.shiftBtns}>
            <Pressable style={styles.shiftBtn} onPress={() => void onMosqueShift(-1)}>
              <Text style={styles.shiftBtnTxt}>-1</Text>
            </Pressable>
            <Pressable style={styles.shiftBtn} onPress={() => void onMosqueShift(1)}>
              <Text style={styles.shiftBtnTxt}>+1</Text>
            </Pressable>
            <Pressable style={styles.shiftBtn} onPress={() => void onMosqueShift(5)}>
              <Text style={styles.shiftBtnTxt}>+5</Text>
            </Pressable>
          </View>
          <Text style={styles.subHint}>{kk.prayer.mosqueShiftHint}</Text>
        </View>
      ) : null}

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
    chipActive: { borderColor: colors.accent, backgroundColor: `${colors.accent}1a` },
    chipTxtActive: { color: colors.accent, fontWeight: "700" },
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
    shiftCard: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 14,
    },
    shiftBtns: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 8 },
    shiftBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bg,
    },
    shiftBtnTxt: { color: colors.text, fontWeight: "700" },
    err: { color: colors.error, marginBottom: 12 },
    table: {
      marginBottom: 8,
    },
    date: { color: colors.muted, marginBottom: 12, fontSize: 14, fontWeight: "700" },
  });
}
