import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  ImageBackground,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { fetchPrayerTimesForLocation } from "../api/prayerTimes";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import {
  getSelectedCity,
  setSelectedCity,
  addSavedCity,
  getNotifEnabled,
  getIftarEnabled,
  getPrayerNotifSoundId,
  getPrayerSourceMode,
  getPrayerMosqueShiftMin,
  type PrayerNotifSoundId,
  type PrayerSourceMode,
} from "../storage/prefs";
import type { RootStackParamList } from "../navigation/types";
import { savePrayerCache } from "../storage/prayerCache";
import { reschedulePrayerNotifications } from "../services/prayerNotifications";
import type { ThemeColors } from "../theme/colors";
import { PrayerTimesHCarousel } from "../components/PrayerTimesHCarousel";
import { nextSalatHighlightKey } from "../utils/prayerSchedule";
import { formatKkGregorianDate, formatKkHijriUmmAlQura } from "../utils/formatKkDate";
import { PRAYER_TIMES_SCREEN_BG } from "../config/dashboardPrayerHero";

/** Дүйсенбі=0 … жексенбі=6 (JavaScript getDay(): жексенбі=0) */
function mondayFirstWeekdayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

function resultToCells(
  r: NonNullable<Awaited<ReturnType<typeof fetchPrayerTimesForLocation>>>
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

function prayerNotifSoundLabelKk(id: PrayerNotifSoundId): string {
  switch (id) {
    case "system":
      return kk.prayer.notifSoundSystem;
    case "bell":
      return kk.prayer.notifSoundBell;
    case "chime":
      return kk.prayer.notifSoundChime;
    case "azan_soft":
      return kk.prayer.notifSoundAzanSoft;
    case "off":
      return kk.prayer.notifSoundOff;
    default:
      return id;
  }
}

const PLACEHOLDER_CELLS: { key: string; time: string }[] = [
  { key: "fajr", time: "" },
  { key: "sun", time: "" },
  { key: "dhuhr", time: "" },
  { key: "asr", time: "" },
  { key: "maghrib", time: "" },
  { key: "isha", time: "" },
];

export function PrayerTimesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "PrayerTimes">>();
  const { colors, isDark } = useAppTheme();
  const [city, setCity] = useState("Shymkent");
  const [country, setCountry] = useState("Kazakhstan");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof fetchPrayerTimesForLocation>
  > | null>(null);
  const [sourceMode, setSourceMode] = useState<PrayerSourceMode>("calc");
  const [mosqueShiftMin, setMosqueShiftMin] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [prayerSoundId, setPrayerSoundId] = useState<PrayerNotifSoundId>("azan_soft");

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
    (data: NonNullable<Awaited<ReturnType<typeof fetchPrayerTimesForLocation>>>) => {
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
      const data = await fetchPrayerTimesForLocation(c, co, 3);
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
        const mode = await getPrayerSourceMode();
        const shift = await getPrayerMosqueShiftMin();
        const [ne, sid] = await Promise.all([getNotifEnabled(), getPrayerNotifSoundId()]);
        if (cancelled) return;
        setCity(prefs.city);
        setCountry(prefs.country);
        setSourceMode(mode);
        setMosqueShiftMin(shift);
        setNotifEnabled(ne);
        setPrayerSoundId(sid);
        await fetchAndSave(prefs.city, prefs.country);
      })();
      return () => {
        cancelled = true;
      };
    }, [fetchAndSave])
  );

  const styles = makeStyles(colors, isDark);
  const historyIdx = mondayFirstWeekdayIndex();
  const historyBundle = kk.prayer.prayerHistoryRotation[historyIdx];

  const hasData = Boolean(result && !result.error);
  const pendingCarousel = Boolean(loading && !result);
  const carouselCells = hasData && result ? resultToCells(result) : pendingCarousel ? [] : PLACEHOLDER_CELLS;
  const highlightKey = carouselCells.length ? nextSalatHighlightKey(carouselCells) ?? undefined : undefined;

  const summaryTable = (
    <View style={styles.table}>
      {hasData && result ? (
        <Text style={styles.cityLine}>
          {result.city}, {result.country} · {result.date}
        </Text>
      ) : null}
      <PrayerTimesHCarousel
        colors={colors}
        isDark={isDark}
        cells={carouselCells}
        highlightKey={highlightKey}
        pending={pendingCarousel}
        lightGlass
      />
      {Platform.OS !== "web" ? (
        <Pressable
          onPress={() => navigation.navigate("MoreStack", { screen: "Settings" })}
          style={({ pressed }) => [
            styles.notifSoundHint,
            pressed && { opacity: 0.85 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${kk.prayer.timesOpenSoundSettings}. ${
            notifEnabled
              ? kk.prayer.timesNotifSoundLineEnabled(prayerNotifSoundLabelKk(prayerSoundId))
              : kk.prayer.timesNotifSoundLineDisabled
          }`}
        >
          <MaterialIcons name="notifications-active" size={22} color="#B9F6CA" />
          <View style={styles.notifSoundHintTextWrap}>
            <Text style={styles.notifSoundHintMain}>
              {notifEnabled
                ? kk.prayer.timesNotifSoundLineEnabled(prayerNotifSoundLabelKk(prayerSoundId))
                : kk.prayer.timesNotifSoundLineDisabled}
            </Text>
            <Text style={styles.notifSoundHintLink}>{kk.prayer.timesOpenSoundSettings}</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.55)" />
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <ImageBackground
      source={PRAYER_TIMES_SCREEN_BG}
      style={styles.bgRoot}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    >
      <View style={styles.bgScrim} pointerEvents="none" />
      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={styles.content}
        nestedScrollEnabled
      >
        <View style={styles.summaryCard}>
          <Text style={styles.hijriHero}>{formatKkHijriUmmAlQura(new Date())}</Text>
          <Text style={styles.gregHero}>{formatKkGregorianDate(new Date())}</Text>
          <Text style={styles.hijriNote}>{kk.prayer.hijriCalendarNote}</Text>
          {summaryTable}
        </View>

        <View
          style={styles.historyCard}
          accessible
          accessibilityLabel={`${kk.prayer.prayerHistoryTitle}. ${kk.prayer.prayerHistorySubtitle} ${historyBundle.weekday}. ${historyBundle.paragraphs.join(" ")}`}
        >
          <Text style={styles.historyTitle}>{kk.prayer.prayerHistoryTitle}</Text>
          <Text style={styles.historySubtitle}>{kk.prayer.prayerHistorySubtitle}</Text>
          <Text style={styles.historyDay}>{historyBundle.weekday}</Text>
          {historyBundle.paragraphs.map((para, idx) => (
            <Text key={`ph-${historyIdx}-${idx}`} style={styles.historyPara}>
              {para}
            </Text>
          ))}
        </View>

        {result?.error ? (
          <View style={styles.errBanner}>
            <Text style={styles.err}>
              {kk.common.error}: {result.error}
            </Text>
            <Text style={styles.errHint}>{kk.dashboard.prayerTimesLoadFailedHint}</Text>
            <Pressable
              onPress={() => void fetchAndSave(city, country)}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={kk.dashboard.prayerTimesRetryA11y}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && !loading && styles.retryButtonPressed,
                loading && styles.retryButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.retryButtonLabel}>{kk.common.retry}</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </ImageBackground>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  /** Фото фон үстінде оқылу үшін ақ жазу */
  const ink = "rgba(255,255,255,0.97)";
  const inkMuted = "rgba(255,255,255,0.78)";
  const inkSoft = "rgba(255,255,255,0.62)";
  const inkGold = "rgba(255, 244, 214, 0.98)";
  const uiBorder = "rgba(255,255,255,0.22)";
  const cardShadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.35 : 0.06,
      shadowRadius: isDark ? 20 : 16,
    },
    android: { elevation: isDark ? 2 : 1 },
    default: {},
  });
  const glassCard = isDark ? "rgba(6, 8, 12, 0.88)" : "rgba(6, 10, 14, 0.82)";
  const glassBorder = "rgba(255,255,255,0.16)";

  return StyleSheet.create({
    bgRoot: { flex: 1 },
    bgScrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: isDark ? "rgba(0,0,0,0.48)" : "rgba(0,0,0,0.38)",
    },
    scrollRoot: { flex: 1, backgroundColor: "transparent" },
    content: { padding: 16, paddingTop: 12, paddingBottom: 40 },
    err: { color: "#fecaca", marginBottom: 6, fontSize: 14, lineHeight: 20, fontWeight: "700" },
    errBanner: {
      marginBottom: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: glassCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(239, 68, 68, 0.45)" : "rgba(239, 68, 68, 0.32)",
      ...cardShadow,
    },
    errHint: { color: inkMuted, fontSize: 12, lineHeight: 17, marginBottom: 10 },
    retryButton: {
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.55)",
      backgroundColor: "rgba(255,255,255,0.12)",
    },
    retryButtonPressed: { opacity: 0.88 },
    retryButtonDisabled: { opacity: 0.65 },
    retryButtonLabel: {
      color: ink,
      fontSize: 15,
      fontWeight: "800",
    },
    table: {
      marginTop: 4,
    },
    cityLine: {
      color: inkMuted,
      marginBottom: 12,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    notifSoundHint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 14,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: uiBorder,
      backgroundColor: "rgba(0,0,0,0.32)",
    },
    notifSoundHintTextWrap: { flex: 1 },
    notifSoundHintMain: {
      color: ink,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600",
      marginBottom: 4,
    },
    notifSoundHintLink: {
      color: "#B9F6CA",
      fontSize: 12,
      fontWeight: "800",
    },
    summaryCard: {
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: glassCard,
      borderRadius: 26,
      padding: 18,
      marginBottom: 18,
      ...cardShadow,
    },
    hijriHero: {
      color: inkGold,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 6,
      letterSpacing: -0.3,
      textShadowColor: "rgba(0,0,0,0.45)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    gregHero: {
      color: ink,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    hijriNote: { color: inkSoft, fontSize: 11, lineHeight: 16, marginBottom: 4 },
    historyCard: {
      borderWidth: 1,
      borderColor: glassBorder,
      backgroundColor: glassCard,
      borderRadius: 20,
      padding: 16,
      marginBottom: 16,
      ...cardShadow,
    },
    historyTitle: {
      color: inkGold,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    historySubtitle: {
      color: inkMuted,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 12,
    },
    historyDay: {
      color: inkSoft,
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 10,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    historyPara: {
      color: ink,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 12,
    },
  });
}
