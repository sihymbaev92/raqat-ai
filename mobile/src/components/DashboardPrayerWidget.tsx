import React, { useEffect, useMemo, useState, type ComponentProps } from "react";
import { View, Text, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { BlurView } from "expo-blur";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { cityLabelKkForApiName } from "../constants/kzCities";
import { fetchOpenMeteoCurrent, wmoCodeToWeatherIconName, type OpenMeteoCurrent } from "../services/openMeteoCurrent";
import {
  secondsUntilNextSalat,
  formatSecondsAsHms,
  nextSalatRow,
} from "../utils/prayerSchedule";
import { shortPrayerName } from "./CompactPrayerTimesRow";
import { formatKkHijriUmmAlQura } from "../utils/formatKkDate";

type PrayerRow = { key: string; label: string; time: string };

/** Төменгі жол — реф. скриндегі қанық жасыл. */
const NEXT_COUNTDOWN_STRIP = "#24A17B";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  rows: PrayerRow[];
  /** Келесі күннің кестесі — бүгінгі парыздар өткен соң таң уақытын дұрыс көрсету */
  tomorrowRows?: PrayerRow[] | null;
  next: PrayerRow | null;
  pending?: boolean;
  momentBanner?: string | null;
  /** Қала (API атауы) — сол жақта қазақша көрсетіледі */
  cityLabel?: string;
  /** Қазақстан тізіміндегі қала үшін координат — орталықта ауа райы (Open-Meteo) */
  weatherCoords?: { lat: number; lon: number } | null;
  /** Намаз хабарламалары қосулы — динамик иконкасы */
  prayerNotifEnabled?: boolean;
  /** Басты бет: таймлайн мен карточка аралықтарын қысқарту */
  compact?: boolean;
  /** Толық намаз уақыты + хижра экранына өту */
  onPress?: () => void;
};

function parseMinutes(t: string): number {
  const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return -1;
  return Number(m[1]) * 60 + Number(m[2]);
}

function timelineStateForRow(
  row: PrayerRow,
  next: PrayerRow | null,
  now: Date
): "past" | "current" | "next" | "upcoming" {
  const nowM = now.getHours() * 60 + now.getMinutes();
  const rowM = parseMinutes(row.time);
  if (next && row.key === next.key) return "next";
  if (rowM >= 0 && Math.abs(rowM - nowM) <= 2) return "current";
  if (rowM >= 0 && rowM < nowM) return "past";
  return "upcoming";
}

function formatTempSignedDeg(c: number): string {
  const r = Math.round(c);
  if (r > 0) return `+${r}°`;
  return `${r}°`;
}

export function DashboardPrayerWidget({
  colors,
  isDark,
  rows,
  tomorrowRows = null,
  next,
  pending,
  momentBanner,
  cityLabel = "",
  weatherCoords = null,
  prayerNotifEnabled = true,
  compact = false,
  onPress,
}: Props) {
  const styles = useMemo(() => makeStyles(compact), [compact]);
  const [now, setNow] = useState(() => new Date());
  const [weatherSnap, setWeatherSnap] = useState<OpenMeteoCurrent | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const secLeft = secondsUntilNextSalat(rows, now, tomorrowRows);
  const hms = formatSecondsAsHms(secLeft);
  const nextResolved = next ?? nextSalatRow(rows, tomorrowRows, now);
  const leftName = nextResolved ? shortPrayerName(nextResolved.key) : "—";

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!weatherCoords) {
      setWeatherSnap(null);
      setWeatherLoading(false);
      return;
    }
    const { lat, lon } = weatherCoords;
    let cancelled = false;
    const tick = async () => {
      setWeatherLoading(true);
      const w = await fetchOpenMeteoCurrent(lat, lon);
      if (!cancelled) {
        setWeatherSnap(w);
        setWeatherLoading(false);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 20 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [weatherCoords?.lat, weatherCoords?.lon]);

  const cityKk = cityLabel.trim() ? cityLabelKkForApiName(cityLabel.trim()) : "";
  type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];
  const weatherIconName = weatherSnap
    ? (wmoCodeToWeatherIconName(weatherSnap.wmoCode) as MciName)
    : ("weather-cloudy" as MciName);

  /** Басты бет hero: blur аз — артқы сурет анық көрінеді; мәтін әлі ақ+жолдарда контраст бар. */
  const blurTint: "dark" | "light" = "dark";
  const blurIntensity = compact
    ? Platform.OS === "ios"
      ? 32
      : 22
    : Platform.OS === "ios"
      ? 52
      : 36;

  const body = (
    <View style={styles.glassShell}>
      <BlurView
        pointerEvents="none"
        tint={blurTint}
        intensity={blurIntensity}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          styles.glassTint,
          compact && styles.glassTintHero,
          isDark && styles.glassTintDark,
          compact && isDark && styles.glassTintDarkHero,
        ]}
        pointerEvents="none"
      />
      <View style={styles.glassInner}>
        <View style={styles.metaRow} accessibilityRole="summary">
          <View style={styles.metaLeft}>
            {cityKk ? (
              <View style={styles.cityRow}>
                <MaterialIcons name="near-me" size={compact ? 15 : 16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.cityText} numberOfLines={1}>
                  {cityKk}
                </Text>
              </View>
            ) : null}
          </View>
          <View
            style={styles.metaCenter}
            accessibilityRole="text"
            accessibilityLabel={
              weatherLoading
                ? kk.common.loading
                : weatherSnap
                  ? kk.dashboard.prayerWeatherA11y(formatTempSignedDeg(weatherSnap.tempC))
                  : kk.dashboard.prayerWeatherUnavailableA11y
            }
          >
            {weatherCoords ? (
              weatherLoading ? (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.88)" />
              ) : weatherSnap ? (
                <>
                  <MaterialCommunityIcons
                    name={weatherIconName}
                    size={compact ? 19 : 21}
                    color="rgba(255,255,255,0.92)"
                  />
                  <Text style={styles.weatherTempText}>{formatTempSignedDeg(weatherSnap.tempC)}</Text>
                </>
              ) : (
                <Text style={styles.weatherUnavailable} numberOfLines={1}>
                  —
                </Text>
              )
            ) : (
              <Text style={styles.weatherUnavailable} numberOfLines={1}>
                —
              </Text>
            )}
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.hijriText} numberOfLines={1}>
              {formatKkHijriUmmAlQura(now)}
            </Text>
          </View>
        </View>

        {momentBanner ? (
          <View style={styles.banner}>
            <MaterialIcons name="notifications-active" size={compact ? 15 : 17} color="#B9F6CA" />
            <Text style={styles.bannerTxt} numberOfLines={2}>
              {momentBanner}
            </Text>
          </View>
        ) : null}

        <View style={styles.rowsBlock}>
          {rows.map((r) => {
            const state = timelineStateForRow(r, nextResolved, now);
            const isHi = state === "next" || state === "current";
            const isPast = state === "past";
            const t = r.time?.trim() ? r.time.trim().split(/\s+/)[0] : "—";
            const name = r.label?.trim() ? r.label.trim() : shortPrayerName(r.key);
            return (
              <View
                key={r.key}
                style={[styles.prayerRow, isHi && styles.prayerRowHi, isPast && styles.prayerRowPast]}
              >
                <Text style={[styles.prayerName, isPast && styles.prayerNamePast]} numberOfLines={1}>
                  {name}
                </Text>
                <View style={styles.iconCol}>
                  <MaterialIcons
                    name={prayerNotifEnabled ? "volume-up" : "volume-off"}
                    size={compact ? 17 : 18}
                    color={
                      prayerNotifEnabled
                        ? isPast
                          ? "rgba(255,255,255,0.35)"
                          : "rgba(255,255,255,0.55)"
                        : "rgba(255,255,255,0.28)"
                    }
                  />
                </View>
                <Text style={[styles.prayerTime, isPast && styles.prayerTimePast]} numberOfLines={1}>
                  {t}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.greenStrip} accessibilityRole="summary">
        <Text style={styles.greenStripLeft} numberOfLines={1}>
          {leftName}
        </Text>
        <Text style={styles.greenStripRight} numberOfLines={1}>
          {!rows.length && pending ? "—" : hms}
        </Text>
      </View>

      {!rows.length && pending ? (
        <View style={styles.pendingOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={colors.accent} />
          <Text style={styles.pendingOverlayTxt}>{kk.common.loading}</Text>
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={kk.dashboard.openPrayerDetailA11y}
        style={({ pressed }) => [styles.cardWrap, pressed && { opacity: 0.97 }]}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={styles.cardWrap}>{body}</View>;
}

function makeStyles(compact: boolean) {
  const padX = compact ? 12 : 14;
  const padTop = compact ? 10 : 12;

  return StyleSheet.create({
    /** Сыртқы Pressable/ImageBackground тасымалдағанда көлеңке сыртта */
    cardWrap: {
      marginBottom: 0,
    },
    glassShell: {
      borderRadius: 0,
      overflow: "hidden",
      position: "relative",
      borderWidth: 0.5,
      borderColor: "rgba(255,255,255,0.22)",
    },
    /** Сурет + blur үстінен оқылу */
    glassTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10, 12, 16, 0.28)",
    },
    /** Dashboard ImageBackground: суретті анықтау */
    glassTintHero: {
      backgroundColor: "rgba(10, 12, 16, 0.12)",
    },
    glassTintDark: {
      backgroundColor: "rgba(4, 6, 8, 0.38)",
    },
    glassTintDarkHero: {
      backgroundColor: "rgba(4, 6, 8, 0.2)",
    },
    glassInner: {
      paddingHorizontal: padX,
      paddingTop: padTop,
      paddingBottom: compact ? 4 : 6,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: compact ? 8 : 10,
      gap: 6,
    },
    metaLeft: {
      flex: 1,
      minWidth: 0,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    metaCenter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      minWidth: compact ? 76 : 84,
      maxWidth: 118,
    },
    metaRight: {
      flex: 1,
      minWidth: 0,
      alignItems: "flex-end",
      justifyContent: "center",
    },
    cityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 4,
      maxWidth: "100%",
    },
    cityText: {
      color: "rgba(255,255,255,0.96)",
      fontSize: compact ? 15 : 16,
      fontWeight: "800",
      textAlign: "left",
      flexShrink: 1,
    },
    hijriText: {
      marginTop: 0,
      color: "rgba(255,255,255,0.78)",
      fontSize: compact ? 12 : 13,
      fontWeight: "600",
      textAlign: "right",
      maxWidth: "100%",
    },
    weatherTempText: {
      color: "rgba(255,255,255,0.95)",
      fontSize: compact ? 14 : 15,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    weatherUnavailable: {
      color: "rgba(255,255,255,0.45)",
      fontSize: compact ? 15 : 16,
      fontWeight: "700",
    },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: compact ? 6 : 8,
      borderRadius: 12,
      paddingHorizontal: compact ? 8 : 10,
      paddingVertical: compact ? 6 : 8,
      marginBottom: compact ? 8 : 10,
      backgroundColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.16)",
    },
    bannerTxt: {
      color: "rgba(255,255,255,0.95)",
      fontSize: compact ? 11 : 12,
      fontWeight: "600",
      flex: 1,
      lineHeight: compact ? 15 : 17,
    },
    rowsBlock: {
      paddingBottom: compact ? 2 : 4,
    },
    prayerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: compact ? 9 : 11,
      paddingHorizontal: 4,
      borderRadius: 12,
    },
    prayerRowHi: {
      backgroundColor: compact ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.12)",
    },
    prayerRowPast: {
      opacity: 0.62,
    },
    prayerName: {
      flex: 1,
      minWidth: 0,
      color: "rgba(255,255,255,0.96)",
      fontSize: compact ? 14 : 15,
      fontWeight: "700",
    },
    prayerNamePast: {
      color: "rgba(255,255,255,0.72)",
    },
    iconCol: {
      width: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    prayerTime: {
      width: 56,
      textAlign: "right",
      color: "rgba(255,255,255,0.95)",
      fontSize: compact ? 14 : 15,
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
    prayerTimePast: {
      color: "rgba(255,255,255,0.65)",
    },
    greenStrip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: compact ? 11 : 13,
      paddingHorizontal: padX,
      backgroundColor: NEXT_COUNTDOWN_STRIP,
      gap: 12,
    },
    greenStripLeft: {
      flex: 1,
      minWidth: 0,
      color: "#FFFFFF",
      fontSize: compact ? 15 : 16,
      fontWeight: "800",
    },
    greenStripRight: {
      color: "#FFFFFF",
      fontSize: compact ? 17 : 19,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.5,
    },
    pendingOverlay: {
      ...StyleSheet.absoluteFillObject,
      top: 0,
      bottom: 56,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(8,10,12,0.35)",
      gap: 8,
    },
    pendingOverlayTxt: {
      color: "rgba(255,255,255,0.88)",
      fontSize: 12,
      fontWeight: "600",
    },
  });
}
