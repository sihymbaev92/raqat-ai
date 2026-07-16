import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  ImageBackground,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { BlurView } from "expo-blur";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { locationIcons } from "../theme/appIcons";
import { PrayerQiblaChip } from "./PrayerQiblaChip";
import { useQiblaMotion, useQiblaStable } from "../context/QiblaSensorContext";
import { qiblaAlignHint } from "../lib/qiblaHints";
import { prayerVisual, shortPrayerName } from "./CompactPrayerTimesRow";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { cityLabelKkForApiName } from "../constants/kzCities";
import { resolvePrayerHeroBackground } from "../config/dashboardPrayerHero";
import { PrayerHeroDaylightOverlay } from "./PrayerHeroDaylightOverlay";
import {
  prayerDaylightPhaseFor,
  prayerDaylightTimesFromRows,
} from "../theme/prayerHeroDaylight";
import {
  secondsUntilNextSalat,
  formatSecondsAsHms,
  nextSalatRow,
  progressBetweenScheduledPrayers,
  minutesUntilNextSalat,
  displayPrayerRowsFromNext,
} from "../utils/prayerSchedule";
import {
  nextPrayerBarTrackGradient,
  nextPrayerProgressFillHex,
  NEXT_PRAYER_STRIP_TEXT_PRIMARY,
} from "../theme/nextPrayerTheme";
import { formatGregorianTechYmd, formatKkHijriUmmAlQura } from "../utils/formatKkDate";
import { LiveWeatherChip } from "./LiveWeatherChip";
import type { OpenMeteoCurrent } from "../services/openMeteoCurrent";
import { useAppLocale } from "../i18n/runtime";

const KAABA_ICON_IMAGE = require("../../assets/menu-icons/header-qibla-kaaba-gemini-transparent.png");

type PrayerRow = { key: string; label: string; time: string };

/** Төменгі жол — реф. скриндегі қанық жасыл. */
const NEXT_COUNTDOWN_STRIP = "#24A17B";

/** Mockup hero: таң + күн шығу + 5 парыз намаз бағаны. */
const HOME_MOCKUP_STRIP_KEYS = ["fajr", "sun", "dhuhr", "asr", "maghrib", "isha"] as const;

type HeroWeatherMotion = "sun" | "night" | "cloud" | "rain" | "snow" | "storm";

const WEATHER_PARTICLES = Array.from({ length: 20 }, (_, index) => ({
  key: `weather-p-${index}`,
  left: (index * 17 + 9) % 100,
  delay: (index % 7) / 7,
  sway: index % 2 === 0 ? 9 + (index % 5) : -8 - (index % 4),
  scale: 0.72 + (index % 5) * 0.08,
}));

function heroWeatherMotionFor(weatherSnap: OpenMeteoCurrent | null): HeroWeatherMotion {
  if (!weatherSnap) return "cloud";
  const code = weatherSnap.wmoCode;
  if (code >= 95 && code <= 99) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code === 0 && weatherSnap.isDay === false) return "night";
  if (code === 0) return "sun";
  if (code >= 1 && code <= 3 && weatherSnap.isDay === false) return "night";
  if (code >= 1 && code <= 3) return "cloud";
  return "cloud";
}

function heroWeatherGradientFor(weatherSnap: OpenMeteoCurrent | null): [string, string, string] {
  const motion = heroWeatherMotionFor(weatherSnap);
  switch (motion) {
    case "sun":
      return ["rgba(255, 183, 77, 0.08)", "rgba(18, 132, 142, 0.04)", "rgba(12, 74, 92, 0.08)"];
    case "night":
      return ["rgba(25, 34, 80, 0.10)", "rgba(8, 23, 51, 0.06)", "rgba(4, 12, 30, 0.10)"];
    case "rain":
      return ["rgba(9, 35, 61, 0.12)", "rgba(19, 86, 108, 0.06)", "rgba(4, 28, 45, 0.10)"];
    case "snow":
      return ["rgba(178, 226, 255, 0.08)", "rgba(56, 139, 169, 0.04)", "rgba(15, 67, 90, 0.08)"];
    case "storm":
      return ["rgba(47, 31, 82, 0.12)", "rgba(15, 40, 73, 0.08)", "rgba(5, 16, 36, 0.12)"];
    default:
      return ["rgba(28, 81, 96, 0.08)", "rgba(22, 101, 119, 0.04)", "rgba(11, 62, 78, 0.08)"];
  }
}

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  rows: PrayerRow[];
  /** Келесі күннің кестесі — бүгінгі парыздар өткен соң таң уақытын дұрыс көрсету */
  tomorrowRows?: PrayerRow[] | null;
  next: PrayerRow | null;
  pending?: boolean;
  momentBanner?: string | null;
  /** Қала (API атауы) — ортада қазақша көрсетіледі */
  cityLabel?: string;
  /** Басты бет hero: қала атауының оң жағында */
  weatherSnap?: OpenMeteoCurrent | null;
  weatherLoading?: boolean;
  weatherUnavailable?: boolean;
  /** Ортада құбыла көрсеткісі */
  onPressQibla?: () => void;
  /** Қала/мекенжай жазуын басқанда орын/намаз баптауын ашу */
  onPressLocationSettings?: () => void;
  /** Намаз хабарламалары қосулы — динамик иконкасы */
  prayerNotifEnabled?: boolean;
  /** Басты бет: таймлайн мен карточка аралықтарын қысқарту */
  compact?: boolean;
  /** Launcher ашық: тек келесі намаз жолағы (толық кесте жоқ) */
  scheduleCompact?: boolean;
  /** Launcher FAB ашық: ең үстіңгі «келесі намаз» жолағы + прогресс. */
  launcherHeader?: boolean;
  /** Басты бет mockup: үлкен countdown + 5 намаз қатар */
  homeMockup?: boolean;
  /** Басты бет: тек «келесі намаз» қысқаша көрінісі; толық кесте — PrayerTimes экраны */
  summaryMode?: boolean;
  /** Толық намаз уақыты + хижра экранына өту */
  onPress?: () => void;
};

function LiveLocationPin({ size, color }: { size: number; color: string }) {
  const pulse = React.useRef(new Animated.Value(1)).current;
  const floatY = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -1.8,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    floatLoop.start();
    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [floatY, pulse]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{ transform: [{ translateY: floatY }, { scale: pulse }] }}
    >
      <MaterialCommunityIcons name={locationIcons.cityPin} size={size} color={color} />
    </Animated.View>
  );
}

function LivePrayerIcon({
  name,
  size,
  color,
  prayerKey,
  active,
}: {
  name: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  size: number;
  color: string;
  prayerKey: string;
  active?: boolean;
}) {
  const pulse = React.useRef(new Animated.Value(1)).current;
  const floatY = React.useRef(new Animated.Value(0)).current;
  const sway = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const isSunLike = prayerKey === "sun" || prayerKey === "dhuhr" || prayerKey === "maghrib";
    const pulseTo = prayerKey === "sun" ? 1.16 : isSunLike ? 1.1 : 1.07;
    const floatTo = prayerKey === "asr" ? -1.2 : prayerKey === "isha" || prayerKey === "fajr" ? -1.6 : -1;
    const swayTo = prayerKey === "asr" ? 6 : prayerKey === "maghrib" ? 4 : prayerKey === "isha" ? -4 : 3;
    const duration = prayerKey === "asr" ? 820 : prayerKey === "isha" ? 1800 : 1400;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: pulseTo,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: floatTo,
          duration: duration + 220,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: duration + 220,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: swayTo,
          duration: duration + 360,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -swayTo,
          duration: duration + 360,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    floatLoop.start();
    swayLoop.start();
    return () => {
      pulseLoop.stop();
      floatLoop.stop();
      swayLoop.stop();
    };
  }, [floatY, prayerKey, pulse, sway]);

  const rotate = sway.interpolate({
    inputRange: [-10, 10],
    outputRange: ["-10deg", "10deg"],
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        minWidth: size + 8,
        minHeight: size + 8,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ translateY: floatY }, { rotate }, { scale: pulse }],
      }}
    >
      <View style={{ zIndex: 2 }}>
        <MaterialCommunityIcons name={name} size={size} color={color} />
      </View>
    </Animated.View>
  );
}

function HeroWeatherEffects({
  motion,
  styles,
}: {
  motion: HeroWeatherMotion;
  styles: ReturnType<typeof makeStyles>;
}) {
  const fall = React.useRef(new Animated.Value(0)).current;
  const pulse = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fall.setValue(0);
    pulse.setValue(0);
    const fallDuration = motion === "rain" || motion === "storm" ? 1250 : motion === "snow" ? 3200 : 5200;
    const fallLoop = Animated.loop(
      Animated.timing(fall, {
        toValue: 1,
        duration: fallDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: motion === "storm" ? 780 : 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: motion === "storm" ? 520 : 2100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    fallLoop.start();
    pulseLoop.start();
    return () => {
      fallLoop.stop();
      pulseLoop.stop();
    };
  }, [fall, motion, pulse]);

  const flashOpacity = pulse.interpolate({
    inputRange: [0, 0.08, 0.18, 1],
    outputRange: [0, 0.58, 0, 0],
  });

  if (motion === "sun" || motion === "night" || motion === "cloud") {
    return null;
  }

  const isSnow = motion === "snow";
  const translateY = fall.interpolate({
    inputRange: [0, 1],
    outputRange: [isSnow ? -22 : -34, isSnow ? 138 : 154],
  });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {motion === "storm" ? <Animated.View style={[styles.weatherLightning, { opacity: flashOpacity }]} /> : null}
      {WEATHER_PARTICLES.map((p) => {
        const translateX = fall.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, p.sway, 0],
        });
        const opacity = fall.interpolate({
          inputRange: [0, p.delay, Math.min(p.delay + 0.18, 1), 1],
          outputRange: [0.05, 0.05, isSnow ? 0.88 : 0.68, 0.08],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={p.key}
            style={[
              isSnow ? styles.weatherSnowflake : styles.weatherRainDrop,
              {
                left: `${p.left}%`,
                opacity,
                transform: [
                  { translateY },
                  { translateX: isSnow ? translateX : 0 },
                  { rotate: isSnow ? "0deg" : "14deg" },
                  { scale: p.scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

function MockupKaabaQiblaIcon({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  const { bearing } = useQiblaStable();
  const { rotateDeg, headingHasSample } = useQiblaMotion();
  const qiblaAligned =
    bearing != null && headingHasSample && qiblaAlignHint(rotateDeg, bearing, { headingReady: true }) === "aligned";
  const pulse = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!qiblaAligned) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return undefined;
    }

    pulse.setValue(1);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.38,
          duration: 760,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 760,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, qiblaAligned]);

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1.18],
  });

  return (
    <View style={styles.mockupKaabaWrap} pointerEvents="none">
      {qiblaAligned ? (
        <Animated.View
          style={[
            styles.mockupKaabaGlow,
            {
              opacity: pulse,
              transform: [{ scale: glowScale }],
            },
          ]}
        />
      ) : null}
      <View style={[styles.mockupKaabaBadge, qiblaAligned && styles.mockupKaabaBadgeAligned]}>
        <Image
          source={KAABA_ICON_IMAGE}
          resizeMode="contain"
          style={[styles.mockupKaabaIcon, qiblaAligned && styles.mockupKaabaIconAligned]}
          accessibilityIgnoresInvertColors
        />
      </View>
    </View>
  );
}

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

function PrayerCountdownHms({
  rows,
  tomorrowRows = null,
  pending = false,
  style,
  maxFontSizeMultiplier = 1.12,
}: {
  rows: PrayerRow[];
  tomorrowRows?: PrayerRow[] | null;
  pending?: boolean;
  style?: object;
  maxFontSizeMultiplier?: number;
}) {
  const [tick, setTick] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTick(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const text =
    !rows.length && pending
      ? "—"
      : formatSecondsAsHms(secondsUntilNextSalat(rows, tick, tomorrowRows));
  return (
    <Text style={style} numberOfLines={1} maxFontSizeMultiplier={maxFontSizeMultiplier}>
      {text}
    </Text>
  );
}

function DashboardPrayerWidget({
  colors,
  isDark,
  rows,
  tomorrowRows = null,
  next,
  pending,
  momentBanner,
  cityLabel = "",
  weatherSnap = null,
  weatherLoading = false,
  weatherUnavailable = false,
  onPressQibla,
  onPressLocationSettings,
  prayerNotifEnabled = true,
  compact = false,
  scheduleCompact = false,
  launcherHeader = false,
  homeMockup = false,
  summaryMode = false,
  onPress,
}: Props) {
  const locale = useAppLocale();
  const styles = useMemo(() => makeStyles(compact, colors), [compact, colors]);
  /** Кесте/прогресс — сирек; HMS — жеке 1s child. */
  const [now, setNow] = useState(() => new Date());
  const nextResolved = next ?? nextSalatRow(rows, tomorrowRows, now);
  const leftName = nextResolved ? shortPrayerName(nextResolved.key) : "—";
  const salatTimes = useMemo(
    () => rows.filter((r) => r.key !== "sun" && r.time?.trim()).map((r) => r.time),
    [rows]
  );
  const dayProgress = salatTimes.length >= 2 ? progressBetweenScheduledPrayers(salatTimes, now) : 0;
  const approxLeft = kk.dashboard.formatApproxTimeLeft(
    minutesUntilNextSalat(rows, now, tomorrowRows)
  );
  const nextSalatLabelForA11y = nextResolved
    ? (nextResolved.label?.trim() ? nextResolved.label.trim() : shortPrayerName(nextResolved.key))
    : null;
  const displayRows = useMemo(
    () => displayPrayerRowsFromNext(rows, tomorrowRows, now),
    [rows, tomorrowRows, now]
  );

  const nextTimeLine = nextResolved?.time?.trim()
    ? (nextResolved.time.trim().split(/\s+/)[0] ?? "—")
    : "—";
  const showFullSchedule = !summaryMode && !scheduleCompact && !launcherHeader;

  const nextPrayerStrip = !summaryMode && !launcherHeader ? (
    <View style={styles.greenStrip} accessibilityRole="summary">
      <Text style={styles.greenStripLeft} numberOfLines={1}>
        {leftName} · {nextTimeLine}
      </Text>
      <PrayerCountdownHms
        rows={rows}
        tomorrowRows={tomorrowRows}
        pending={pending}
        style={styles.greenStripRight}
      />
    </View>
  ) : null;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, []);

  const heroPhase = useMemo(
    () => prayerDaylightPhaseFor(prayerDaylightTimesFromRows(rows), now),
    [rows, now]
  );
  const heroBg = useMemo(
    () => resolvePrayerHeroBackground(heroPhase, "dashboardNext"),
    [heroPhase]
  );

  if (homeMockup) {
    const stripRows = HOME_MOCKUP_STRIP_KEYS.map((k) => rows.find((r) => r.key === k)).filter(
      (r): r is PrayerRow => Boolean(r?.time?.trim())
    );
    const mockupCityKk = cityLabel.trim() ? cityLabelKkForApiName(cityLabel.trim()) : "";
    const mockupBody = (
      <ImageBackground
        source={heroBg}
        style={styles.mockupShell}
        imageStyle={styles.mockupShellImage}
        resizeMode="cover"
        resizeMethod={Platform.OS === "android" ? "resize" : undefined}
        accessibilityIgnoresInvertColors
      >
        <PrayerHeroDaylightOverlay rows={rows} />
        <View style={styles.mockupInner}>
          <View style={styles.mockupMetaRow} pointerEvents="box-none">
            <View style={styles.mockupMetaLeft}>
              <LiveWeatherChip
                weatherSnap={weatherSnap}
                loading={weatherLoading}
                unavailable={weatherUnavailable}
                variant="hero"
                compact
                size="sm"
                isDark={isDark}
                labelStyle={styles.mockupWeatherText}
              />
            </View>
            {onPressQibla ? (
              <View style={styles.mockupMetaCenter} pointerEvents="box-none">
                <MockupKaabaQiblaIcon styles={styles} />
              </View>
            ) : null}
            {mockupCityKk ? (
              <View style={styles.mockupMetaRight} pointerEvents={onPressLocationSettings ? "auto" : "none"}>
                <Pressable
                  oyuBackdrop={false}
                  disabled={!onPressLocationSettings}
                  onPress={onPressLocationSettings}
                  accessibilityRole={onPressLocationSettings ? "button" : undefined}
                  accessibilityLabel={kk.settings.cityChange}
                  style={({ pressed }) => [styles.mockupCityRow, pressed && { opacity: 0.86 }]}
                >
                  <LiveLocationPin size={15} color="rgba(255,255,255,0.92)" />
                  <Text style={styles.mockupCityText} numberOfLines={1}>
                    {mockupCityKk}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          <View
            style={styles.mockupNextRow}
            accessibilityRole="timer"
            accessibilityLabel={kk.dashboard.nextPrayerCountdownA11y(
              nextSalatLabelForA11y,
              approxLeft
            )}
          >
            <View style={styles.mockupNextLeft}>
              <Text style={styles.mockupKicker} numberOfLines={1}>
                {kk.dashboard.nextPrayer}
              </Text>
              <Text style={styles.mockupNextName} numberOfLines={1}>
                {leftName} · {nextTimeLine}
              </Text>
            </View>
            {onPressQibla ? (
              <View style={styles.mockupNextCenter}>
                <PrayerQiblaChip colors={colors} onPress={onPressQibla} variant="hero" size="sm" />
              </View>
            ) : null}
            <View style={styles.mockupNextRight}>
              {pending && !rows.length ? (
                <RaqatOrnamentSpinner size={22} />
              ) : (
                <PrayerCountdownHms
                  rows={rows}
                  tomorrowRows={tomorrowRows}
                  pending={pending}
                  style={styles.mockupNextHms}
                />
              )}
            </View>
          </View>
          {stripRows.length ? (
            <View style={styles.mockupStrip}>
              {stripRows.map((r) => {
                const isNext = nextResolved?.key === r.key;
                const t = r.time.trim().split(/\s+/)[0] ?? "—";
                const vis = prayerVisual(r.key, isDark);
                const name = shortPrayerName(r.key);
                const denseStrip = stripRows.length >= 6;
                return (
                  <View
                    key={r.key}
                    style={[styles.mockupStripCell, isNext && styles.mockupStripCellActive]}
                  >
                    <LivePrayerIcon
                      name={vis.icon}
                      size={denseStrip ? 13 : 14}
                      color={vis.fg}
                      prayerKey={r.key}
                      active={isNext}
                    />
                    <Text
                      style={[
                        styles.mockupStripName,
                        denseStrip && styles.mockupStripNameDense,
                        isNext && styles.mockupStripNameActive,
                      ]}
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text
                      style={[
                        styles.mockupStripTime,
                        denseStrip && styles.mockupStripTimeDense,
                        isNext && styles.mockupStripTimeActive,
                      ]}
                      numberOfLines={1}
                    >
                      {t}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>
        {pending && !rows.length ? (
          <View style={styles.pendingOverlay} pointerEvents="none">
            <RaqatOrnamentSpinner size={28} />
          </View>
        ) : null}
      </ImageBackground>
    );

    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={kk.dashboard.openPrayerDetailA11y}
          style={({ pressed }) => [
            styles.cardWrap,
            styles.cardWrapHeroFill,
            pressed && { opacity: 0.97 },
          ]}
        >
          {mockupBody}
        </Pressable>
      );
    }
    return <View style={[styles.cardWrap, styles.cardWrapHeroFill]}>{mockupBody}</View>;
  }

  if (launcherHeader) {
    const launcherCityKk = cityLabel.trim() ? cityLabelKkForApiName(cityLabel.trim()) : "";
    const launcherHijri = formatKkHijriUmmAlQura(now, locale);
    const launcherBody = (
      <View style={styles.launcherHeaderShell}>
        <BlurView
          pointerEvents="none"
          tint="dark"
          intensity={Platform.OS === "ios" ? 22 : 16}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.launcherHeaderTint} pointerEvents="none" />
        <View style={styles.launcherHeaderInner}>
          {launcherCityKk || launcherHijri ? (
            <View style={styles.launcherMetaRow}>
              {launcherCityKk ? (
                <Pressable
                  oyuBackdrop={false}
                  disabled={!onPressLocationSettings}
                  onPress={onPressLocationSettings}
                  accessibilityRole={onPressLocationSettings ? "button" : undefined}
                  accessibilityLabel={kk.settings.cityChange}
                  style={({ pressed }) => [styles.launcherCityRow, pressed && { opacity: 0.86 }]}
                >
                  <MaterialCommunityIcons
                    name={locationIcons.cityPin}
                    size={13}
                    color="rgba(255,255,255,0.88)"
                  />
                  <Text style={styles.launcherMetaText} numberOfLines={1}>
                    {launcherCityKk}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.launcherMetaSpacer} />
              )}
              <Text style={styles.launcherMetaTextHijri} numberOfLines={1}>
                {launcherHijri}
              </Text>
            </View>
          ) : null}
          <View
            style={styles.greenStripLauncher}
            accessibilityRole="timer"
            accessibilityLabel={kk.dashboard.nextPrayerCountdownA11y(
              nextSalatLabelForA11y,
              approxLeft
            )}
          >
            <View style={styles.launcherStripLeftCol}>
              <Text style={styles.launcherStripKicker} numberOfLines={1}>
                {kk.dashboard.nextPrayer}
              </Text>
              <Text style={styles.greenStripLeft} numberOfLines={1}>
                {leftName} · {nextTimeLine}
              </Text>
            </View>
            <View style={styles.launcherStripRightCol}>
              <PrayerCountdownHms
                rows={rows}
                tomorrowRows={tomorrowRows}
                pending={pending}
                style={styles.greenStripRight}
              />
              {!pending && rows.length ? (
                <Text style={styles.launcherStripApprox} numberOfLines={1}>
                  {approxLeft}
                </Text>
              ) : null}
            </View>
          </View>
          {pending && !rows.length ? (
            <View style={styles.launcherHeaderPending}>
              <RaqatOrnamentSpinner size={18} />
            </View>
          ) : (
            <View style={styles.barTrackLauncher}>
              <LinearGradient
                colors={nextPrayerBarTrackGradient(isDark)}
                locations={[0, 0.52, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.round(dayProgress * 1000) / 10}%`,
                    backgroundColor: nextPrayerProgressFillHex(isDark),
                  },
                ]}
              />
            </View>
          )}
        </View>
        {!rows.length && pending ? (
          <View style={styles.launcherHeaderOverlay} pointerEvents="none">
            <RaqatOrnamentSpinner size={22} />
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
          style={({ pressed }) => [styles.launcherHeaderWrap, pressed && { opacity: 0.97 }]}
        >
          {launcherBody}
        </Pressable>
      );
    }
    return <View style={styles.launcherHeaderWrap}>{launcherBody}</View>;
  }

  const cityKk = cityLabel.trim() ? cityLabelKkForApiName(cityLabel.trim()) : "";

  /** Басты бет hero: blur аз — артқы сурет анық көрінеді; мәтін әлі ақ+жолдарда контраст бар. */
  const blurTint: "dark" | "light" = "dark";
  const blurIntensity = compact
    ? Platform.OS === "ios"
      ? 18
      : 12
    : Platform.OS === "ios"
      ? 28
      : 18;

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
            {!summaryMode && onPressQibla ? (
              <PrayerQiblaChip colors={colors} onPress={onPressQibla} variant="hero" />
            ) : null}
          </View>
          {cityKk ? (
            <View style={styles.metaCenter} pointerEvents={onPressLocationSettings ? "auto" : "none"}>
              <Pressable
                oyuBackdrop={false}
                disabled={!onPressLocationSettings}
                onPress={onPressLocationSettings}
                accessibilityRole={onPressLocationSettings ? "button" : undefined}
                accessibilityLabel={kk.settings.cityChange}
                style={({ pressed }) => [styles.cityRow, pressed && { opacity: 0.86 }]}
              >
                <MaterialCommunityIcons
                  name={locationIcons.cityPin}
                  size={compact ? 15 : 16}
                  color="rgba(255,255,255,0.9)"
                />
                <Text style={styles.cityText} numberOfLines={1}>
                  {cityKk}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {summaryMode ? (
          <View
            style={styles.topCountdownWrap}
            accessibilityRole="timer"
            accessibilityLabel={kk.dashboard.nextPrayerCountdownA11y(
              nextSalatLabelForA11y,
              approxLeft
            )}
          >
            {pending && !rows.length ? (
              <RaqatOrnamentSpinner size={20} />
            ) : (
              <>
                <View style={styles.topCountdownRow}>
                  <Text style={styles.topCountdownLabel} numberOfLines={2}>
                    {nextResolved
                      ? nextResolved.label?.trim()
                        ? nextResolved.label.trim()
                        : shortPrayerName(nextResolved.key)
                      : kk.dashboard.nextPrayer}
                  </Text>
                  <PrayerCountdownHms
                    rows={rows}
                    tomorrowRows={tomorrowRows}
                    pending={pending}
                    style={styles.topCountdownHms}
                    maxFontSizeMultiplier={1.08}
                  />
                </View>
                <Text style={styles.topCountdownApprox} numberOfLines={1} maxFontSizeMultiplier={1.1}>
                  {approxLeft}
                </Text>
              </>
            )}
          </View>
        ) : null}

        {momentBanner ? (
          <View style={styles.banner}>
            <MaterialIcons name="notifications-active" size={compact ? 15 : 17} color="#B9F6CA" />
            <Text style={styles.bannerTxt} numberOfLines={2}>
              {momentBanner}
            </Text>
          </View>
        ) : null}

        {summaryMode ? (
          <View style={styles.summaryBlock}>
            {pending && !rows.length ? null : (
              <View style={styles.barTrack}>
                <LinearGradient
                  colors={nextPrayerBarTrackGradient(isDark)}
                  locations={[0, 0.52, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${Math.round(dayProgress * 1000) / 10}%`,
                      backgroundColor: nextPrayerProgressFillHex(isDark),
                    },
                  ]}
                />
              </View>
            )}
          </View>
        ) : showFullSchedule ? (
          <View style={styles.rowsBlock}>
            {displayRows.map((r) => {
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
        ) : null}
        {showFullSchedule ? (
          <View style={styles.dateFooter}>
            <Text style={[styles.hijriText, styles.dateFooterText]} numberOfLines={1}>
              {formatKkHijriUmmAlQura(now, locale)}
            </Text>
            <Text style={[styles.gregTechText, styles.dateFooterText]} numberOfLines={1}>
              {formatGregorianTechYmd(now)}
            </Text>
          </View>
        ) : null}
        {nextPrayerStrip}
      </View>

      {!rows.length && pending ? (
        <View style={styles.pendingOverlay} pointerEvents="none">
          <RaqatOrnamentSpinner size={28} />
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

const MemoDashboardPrayerWidget = React.memo(DashboardPrayerWidget);
export { MemoDashboardPrayerWidget as DashboardPrayerWidget };

function makeStyles(compact: boolean, colors: ThemeColors) {
  const padX = compact ? 12 : 14;
  const padTop = compact ? 6 : 12;
  /** Мешіт hero фонында контраст — accent teal фонмен араласып кетпейді */
  const heroTextShadow = Platform.select({
    ios: {
      textShadowColor: "rgba(0,0,0,0.55)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    android: {
      textShadowColor: "rgba(0,0,0,0.55)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    default: {},
  });

  return StyleSheet.create({
    /** Сыртқы Pressable/ImageBackground тасымалдағанда көлеңке сыртта */
    cardWrap: {
      marginBottom: 0,
    },
    /** Басты бет: ImageBackground aspectRatio биіктігін толық толтыру */
    cardWrapHeroFill: {
      flex: 1,
      alignSelf: "stretch",
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
      marginBottom: compact ? 4 : 8,
      minHeight: compact ? 40 : 44,
      position: "relative",
    },
    metaLeft: {
      flex: 1,
      minWidth: 0,
      maxWidth: "48%",
      alignItems: "flex-start",
      justifyContent: "center",
      zIndex: 1,
    },
    metaCenter: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "box-none",
    },
    cityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      maxWidth: "100%",
    },
    cityText: {
      color: "rgba(255,255,255,0.96)",
      fontSize: compact ? 15 : 16,
      fontWeight: "800",
      textAlign: "center",
      flexShrink: 1,
    },
    hijriText: {
      marginTop: 0,
      color: "rgba(255,255,255,0.78)",
      fontSize: compact ? 12 : 13,
      fontWeight: "600",
      textAlign: "left",
      maxWidth: "100%",
    },
    gregTechText: {
      marginTop: 2,
      color: "rgba(255,255,255,0.58)",
      fontSize: compact ? 10 : 11,
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
      textAlign: "left",
      maxWidth: "100%",
    },
    dateFooter: {
      marginTop: compact ? 6 : 8,
      paddingTop: compact ? 6 : 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.18)",
    },
    dateFooterText: {
      textAlign: "left",
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
    summaryBlock: {
      paddingBottom: compact ? 4 : 6,
      paddingTop: compact ? 0 : 2,
    },
    topCountdownWrap: {
      alignSelf: "stretch",
      paddingBottom: compact ? 4 : 8,
      marginBottom: compact ? 4 : 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: "rgba(255,255,255,0.18)",
    },
    topCountdownRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    topCountdownLabel: {
      flexShrink: 0,
      maxWidth: "46%",
      color: "rgba(255,255,255,0.95)",
      fontSize: compact ? 12 : 13,
      fontWeight: "800",
      letterSpacing: 0.2,
      lineHeight: compact ? 16 : 17,
      textAlign: "left",
      ...heroTextShadow,
    },
    topCountdownHms: {
      flex: 1,
      minWidth: 0,
      color: NEXT_PRAYER_STRIP_TEXT_PRIMARY,
      fontSize: compact ? 18 : 20,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.6,
      textAlign: "right",
      lineHeight: compact ? 22 : 24,
      ...heroTextShadow,
    },
    topCountdownPrayerAt: {
      color: "#FFE082",
      fontSize: compact ? 13 : 14,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      marginTop: 4,
      ...heroTextShadow,
    },
    topCountdownApprox: {
      alignSelf: "flex-start",
      color: "rgba(255,255,255,0.78)",
      fontSize: compact ? 10 : 11,
      fontWeight: "600",
      marginTop: 3,
      ...heroTextShadow,
    },
    heroNextRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: compact ? 6 : 12,
      paddingVertical: compact ? 6 : 10,
      paddingHorizontal: compact ? 10 : 12,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor: "rgba(232, 200, 106, 0.35)",
    },
    heroNextIconWrap: {
      width: compact ? 38 : 44,
      height: compact ? 38 : 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    heroNextTextCol: {
      flex: 1,
      minWidth: 0,
    },
    heroNextName: {
      color: "rgba(255,255,255,0.98)",
      fontSize: compact ? 15 : 17,
      fontWeight: "800",
    },
    heroNextAt: {
      marginTop: 2,
      color: "#FFE082",
      fontSize: compact ? 15 : 16,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      ...heroTextShadow,
    },
    barTrackLauncher: {
      height: 5,
      borderRadius: 3,
      overflow: "hidden",
      marginBottom: 0,
      position: "relative",
    },
    barTrack: {
      height: 6,
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: compact ? 6 : 12,
      position: "relative",
    },
    barFill: {
      height: "100%",
      borderRadius: 4,
      zIndex: 1,
    },
    summaryHintRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 4,
      marginTop: compact ? 5 : 10,
      paddingTop: compact ? 4 : 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.2)",
    },
    summaryHint: {
      flex: 1,
      color: "rgba(255,255,255,0.62)",
      fontSize: compact ? 11 : 12,
      fontWeight: "600",
      lineHeight: compact ? 15 : 16,
    },
    prayerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: compact ? 5 : 11,
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
      marginTop: compact ? 6 : 8,
      borderRadius: compact ? 10 : 12,
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
      fontSize: compact ? 15 : 17,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.35,
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
    launcherHeaderWrap: {
      width: "100%",
    },
    launcherHeaderShell: {
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      position: "relative",
    },
    launcherHeaderTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(8, 10, 12, 0.28)",
    },
    launcherMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    launcherMetaSpacer: {
      flex: 1,
      minWidth: 0,
    },
    launcherCityRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    launcherMetaText: {
      flexShrink: 1,
      color: "rgba(255,255,255,0.92)",
      fontSize: 11,
      fontWeight: "700",
    },
    launcherMetaTextHijri: {
      flexShrink: 0,
      maxWidth: "52%",
      color: "rgba(255,255,255,0.72)",
      fontSize: 10,
      fontWeight: "600",
      textAlign: "right",
    },
    launcherHeaderInner: {
      paddingHorizontal: 8,
      paddingVertical: 6,
      gap: 4,
    },
    greenStripLauncher: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 7,
      paddingHorizontal: 10,
      backgroundColor: NEXT_COUNTDOWN_STRIP,
      borderRadius: 10,
      gap: 8,
    },
    launcherStripLeftCol: {
      flex: 1,
      minWidth: 0,
      gap: 1,
    },
    launcherStripRightCol: {
      flexShrink: 0,
      alignItems: "flex-end",
      gap: 1,
    },
    launcherStripKicker: {
      color: "rgba(255,255,255,0.82)",
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.15,
    },
    launcherStripApprox: {
      color: "rgba(255,255,255,0.88)",
      fontSize: 10,
      fontWeight: "600",
      textAlign: "right",
    },
    launcherHeaderPending: {
      alignItems: "center",
      paddingVertical: 4,
    },
    launcherHeaderOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(8,10,12,0.35)",
    },
    mockupShell: {
      borderRadius: 16,
      overflow: "hidden",
      position: "relative",
      flex: 1,
      minHeight: 104,
      backgroundColor: "#0a1520",
    },
    mockupShellImage: {
      borderRadius: 16,
    },
    mockupTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(8, 32, 38, 0.04)",
    },
    mockupTintSun: {
      backgroundColor: "rgba(70, 91, 30, 0.03)",
    },
    mockupTintSnow: {
      backgroundColor: "rgba(9, 57, 74, 0.05)",
    },
    mockupTintRain: {
      backgroundColor: "rgba(4, 23, 38, 0.08)",
    },
    mockupTintStorm: {
      backgroundColor: "rgba(4, 12, 31, 0.10)",
    },
    mockupInner: {
      position: "relative",
      flex: 1,
      justifyContent: "space-between",
      paddingHorizontal: 10,
      paddingTop: 4,
      paddingBottom: 4,
      gap: 2,
    },
    mockupMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      position: "relative",
      minHeight: 28,
      marginTop: -1,
      marginBottom: -1,
      zIndex: 2,
    },
    mockupMetaLeft: {
      flexShrink: 0,
      alignItems: "flex-start",
      justifyContent: "center",
      zIndex: 2,
      minWidth: 44,
    },
    mockupMetaCenter: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 0,
    },
    mockupKaabaWrap: {
      width: 42,
      height: 42,
      alignItems: "center",
      justifyContent: "center",
      overflow: "visible",
    },
    mockupKaabaGlow: {
      position: "absolute",
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "transparent",
    },
    mockupKaabaBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      borderWidth: 0,
      borderColor: "transparent",
      overflow: "hidden",
    },
    mockupKaabaBadgeAligned: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      borderWidth: 0,
    },
    mockupKaabaIcon: {
      width: 24,
      height: 22,
      opacity: 0.92,
    },
    mockupKaabaIconAligned: {
      opacity: 1,
    },
    mockupMetaRight: {
      flexShrink: 0,
      alignItems: "flex-end",
      justifyContent: "center",
      zIndex: 2,
      marginRight: 8,
      minWidth: 44,
    },
    mockupCityRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 3,
      maxWidth: "100%",
    },
    mockupCityText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
      flexShrink: 1,
      textAlign: "center",
    },
    mockupKicker: {
      color: "rgba(255,255,255,0.88)",
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 0.2,
      textAlign: "left",
      ...heroTextShadow,
    },
    mockupNextRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      paddingTop: 0,
      marginTop: -1,
      marginBottom: 0,
      minHeight: 33,
      position: "relative",
      zIndex: 2,
    },
    mockupNextLeft: {
      flex: 1,
      minWidth: 0,
      maxWidth: "39%",
      gap: 2,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    mockupNextName: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.15,
      textAlign: "left",
      ...heroTextShadow,
    },
    mockupNextCenter: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3,
    },
    mockupNextRight: {
      flexShrink: 0,
      maxWidth: "39%",
      alignItems: "flex-end",
      justifyContent: "center",
    },
    mockupNextHms: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "900",
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.5,
      textAlign: "right",
    },
    mockupStrip: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: 1,
      marginTop: 1,
    },
    mockupStripCell: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 2,
      paddingHorizontal: 0,
      borderRadius: 9,
      gap: 1,
    },
    mockupStripCellActive: {
      backgroundColor: "#FFFFFF",
    },
    mockupStripName: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "900",
      lineHeight: 12,
      textAlign: "center",
      ...heroTextShadow,
    },
    mockupStripNameActive: {
      color: "#1B4332",
      fontWeight: "800",
    },
    mockupStripNameDense: {
      fontSize: 9,
      lineHeight: 11,
    },
    mockupStripTime: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "900",
      lineHeight: 13,
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.45,
      ...heroTextShadow,
    },
    mockupStripTimeActive: {
      color: "#1B4332",
      fontWeight: "900",
    },
    mockupStripTimeDense: {
      fontSize: 10,
      lineHeight: 12,
      letterSpacing: 0.2,
    },
    mockupWeatherText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "900",
      ...heroTextShadow,
    },
    weatherSunGlow: {
      position: "absolute",
      width: 116,
      height: 116,
      borderRadius: 58,
      right: -18,
      top: -34,
      backgroundColor: "rgba(255, 210, 90, 0.42)",
      ...Platform.select({
        ios: {
          shadowColor: "#FFD35A",
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.7,
          shadowRadius: 18,
        },
        android: { elevation: 1 },
        default: {},
      }),
    },
    weatherSunRayA: {
      position: "absolute",
      width: 190,
      height: 26,
      right: -28,
      top: 42,
      borderRadius: 999,
      backgroundColor: "rgba(255, 232, 157, 0.16)",
      transform: [{ rotate: "-14deg" }],
    },
    weatherSunRayB: {
      position: "absolute",
      width: 160,
      height: 18,
      right: 18,
      bottom: 28,
      borderRadius: 999,
      backgroundColor: "rgba(255, 206, 92, 0.14)",
      transform: [{ rotate: "10deg" }],
    },
    weatherMoonGlow: {
      position: "absolute",
      width: 92,
      height: 92,
      borderRadius: 46,
      right: 10,
      top: -28,
      backgroundColor: "rgba(196, 181, 253, 0.2)",
    },
    weatherStarA: {
      position: "absolute",
      width: 3,
      height: 3,
      borderRadius: 2,
      right: 82,
      top: 22,
      backgroundColor: "rgba(255,255,255,0.82)",
    },
    weatherStarB: {
      position: "absolute",
      width: 2,
      height: 2,
      borderRadius: 1,
      left: "34%",
      top: 18,
      backgroundColor: "rgba(255,255,255,0.68)",
    },
    weatherCloudGlow: {
      position: "absolute",
      width: 180,
      height: 58,
      left: "22%",
      top: -14,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.13)",
      transform: [{ rotate: "-4deg" }],
    },
    weatherLightning: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(213, 226, 255, 0.58)",
    },
    weatherRainDrop: {
      position: "absolute",
      top: -34,
      width: 1.5,
      height: 24,
      borderRadius: 2,
      backgroundColor: "rgba(191, 226, 255, 0.82)",
    },
    weatherSnowflake: {
      position: "absolute",
      top: -24,
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: "rgba(255,255,255,0.88)",
    },
  });
}
