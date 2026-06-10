import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Platform, type TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { kk } from "../i18n/kk";
import type { OpenMeteoCurrent } from "../services/openMeteoCurrent";
import { wmoCodeToWeatherEmoji } from "../services/openMeteoCurrent";
import { weatherThemeForHero, weatherThemeForWmo } from "../theme/weatherTheme";
import { BRAND_FONT_FACE } from "../fonts/brandFont";

type Props = {
  weatherSnap: OpenMeteoCurrent | null;
  loading?: boolean;
  unavailable?: boolean;
  /** header: шапка; hero: намаз карточкасы */
  variant?: "header" | "hero";
  /** hero: chip өлшемі (mockup hero қатар) */
  size?: "default" | "sm";
  /** header: градиентті chip (Dashboard шапкасы) */
  colorful?: boolean;
  isDark?: boolean;
  compact?: boolean;
  /** Температура мәтіні — шапка күн/жыл стилі (theme.tempColor емес). */
  labelStyle?: TextStyle;
};

function formatTempSignedDeg(c: number): string {
  const r = Math.round(c);
  if (r > 0) return `+${r}°`;
  return `${r}°`;
}

type WeatherIconMotion = "sun" | "dawn" | "night" | "cloud" | "rain" | "snow" | "storm";

function observedHour(observedAt?: string): number {
  const m = String(observedAt || "").match(/T(\d{1,2}):/);
  if (m) return Number(m[1]);
  return new Date().getHours();
}

function isMorningLight(observedAt?: string): boolean {
  const h = observedHour(observedAt);
  return h >= 4 && h <= 8;
}

function weatherIconMotionFor(code: number, isDay?: boolean, observedAt?: string): WeatherIconMotion {
  if (code >= 95 && code <= 99) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code === 0 || (code >= 1 && code <= 3)) {
    if (isDay === false) return "night";
    if (isMorningLight(observedAt)) return "dawn";
    return code === 0 ? "sun" : "cloud";
  }
  return "cloud";
}

export function LiveWeatherChip({
  weatherSnap,
  loading = false,
  unavailable = false,
  variant = "header",
  colorful = false,
  isDark = false,
  compact = false,
  size = "default",
  labelStyle,
}: Props) {
  const pulse = useSharedValue(1);
  const sway = useSharedValue(0);
  const floatY = useSharedValue(0);
  const flash = useSharedValue(1);
  const isHeader = variant === "header";
  const headerColorful = isHeader && colorful;
  const weatherMotion = useMemo(
    () =>
      weatherSnap
        ? weatherIconMotionFor(weatherSnap.wmoCode, weatherSnap.isDay, weatherSnap.observedAt)
        : "cloud",
    [weatherSnap?.wmoCode, weatherSnap?.isDay, weatherSnap?.observedAt]
  );

  useEffect(() => {
    cancelAnimation(pulse);
    cancelAnimation(sway);
    cancelAnimation(floatY);
    cancelAnimation(flash);
    pulse.value = 1;
    sway.value = 0;
    floatY.value = 0;
    flash.value = 1;

    const cleanup = () => {
      cancelAnimation(pulse);
      cancelAnimation(sway);
      cancelAnimation(floatY);
      cancelAnimation(flash);
    };

    if (!weatherSnap) return cleanup;

    if (weatherMotion === "storm") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 120, easing: Easing.out(Easing.quad) }),
          withTiming(0.94, { duration: 90, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 560, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      flash.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 90, easing: Easing.linear }),
          withTiming(1, { duration: 90, easing: Easing.linear }),
          withTiming(1, { duration: 650, easing: Easing.linear })
        ),
        -1,
        false
      );
      return cleanup;
    }

    if (weatherMotion === "rain") {
      floatY.value = -2;
      floatY.value = withRepeat(
        withTiming(3, { duration: 620, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      pulse.value = withRepeat(
        withTiming(1.04, { duration: 620, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      return cleanup;
    }

    if (weatherMotion === "snow") {
      floatY.value = -1.5;
      sway.value = -4;
      floatY.value = withRepeat(
        withTiming(2, { duration: 1450, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      sway.value = withRepeat(
        withTiming(4, { duration: 1650, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      return cleanup;
    }

    if (weatherMotion === "sun" || weatherMotion === "dawn") {
      sway.value = weatherMotion === "dawn" ? -5 : -7;
      sway.value = withRepeat(
        withTiming(weatherMotion === "dawn" ? 5 : 7, {
          duration: weatherMotion === "dawn" ? 1800 : 2200,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      );
      pulse.value = withRepeat(
        withTiming(weatherMotion === "dawn" ? 1.08 : 1.1, {
          duration: weatherMotion === "dawn" ? 1500 : 1300,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      );
      return cleanup;
    }

    if (weatherMotion === "night") {
      floatY.value = -1.5;
      floatY.value = withRepeat(
        withTiming(1.5, { duration: 2100, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      pulse.value = withRepeat(
        withTiming(1.06, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
      return cleanup;
    }

    sway.value = -3;
    sway.value = withRepeat(
      withTiming(3, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    floatY.value = withRepeat(
      withTiming(1.5, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    return cleanup;
  }, [weatherSnap, weatherMotion, pulse, sway, floatY, flash]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: flash.value,
    transform: [{ translateY: floatY.value }, { rotate: `${sway.value}deg` }, { scale: pulse.value }],
  }));

  const theme = useMemo(() => {
    if (!weatherSnap) return null;
    if (isHeader && !colorful) return null;
    if (headerColorful) {
      return weatherThemeForWmo(weatherSnap.wmoCode, weatherSnap.tempC, isDark, {
        isDay: weatherSnap.isDay,
        observedAt: weatherSnap.observedAt,
      });
    }
    return variant === "hero"
      ? weatherThemeForHero(weatherSnap.wmoCode, weatherSnap.tempC, {
          isDay: weatherSnap.isDay,
          observedAt: weatherSnap.observedAt,
        })
      : weatherThemeForWmo(weatherSnap.wmoCode, weatherSnap.tempC, isDark, {
          isDay: weatherSnap.isDay,
          observedAt: weatherSnap.observedAt,
        });
  }, [weatherSnap, variant, isDark, isHeader, colorful, headerColorful]);

  const weatherEmoji = weatherSnap
    ? wmoCodeToWeatherEmoji(weatherSnap.wmoCode, {
        isDay: weatherSnap.isDay,
        observedAt: weatherSnap.observedAt,
      })
    : "☁️";

  const iconSize = headerColorful
    ? compact
      ? 14
      : 16
    : variant === "hero"
      ? size === "sm"
        ? 16
        : compact
          ? 20
          : 22
      : compact
        ? 10
        : 14;
  const tempSize = headerColorful
    ? compact
      ? 11
      : 12
    : variant === "hero"
      ? size === "sm"
        ? 11
        : compact
          ? 14
          : 15
      : compact
        ? 10
        : 11;
  const heroChipSm = variant === "hero" && size === "sm";

  if (loading) {
    if (headerColorful) {
      return (
        <View style={styles.headerColorWrap} accessibilityLabel={kk.common.loading}>
          <View style={[styles.chip, styles.chipHeaderColorful, styles.chipLoading]}>
            <RaqatOrnamentSpinner size={14} />
          </View>
        </View>
      );
    }
    if (isHeader) {
      return (
        <View style={styles.headerPlain} accessibilityLabel={kk.common.loading}>
          <RaqatOrnamentSpinner size={10} />
        </View>
      );
    }
    return (
      <View style={[styles.chip, styles.chipLoading, variant === "hero" && styles.chipHero]}>
        <RaqatOrnamentSpinner size={variant === "hero" ? 20 : 16} />
      </View>
    );
  }

  if (!weatherSnap || unavailable) {
    if (headerColorful) {
      return (
        <View
          style={styles.headerColorWrap}
          accessibilityLabel={kk.dashboard.prayerWeatherUnavailableA11y}
        >
          <View style={[styles.chip, styles.chipHeaderColorful, styles.chipMuted]}>
            <Text style={[styles.emoji, { fontSize: iconSize }]}>☁️</Text>
            <Text style={[styles.tempMuted, { fontSize: tempSize }]}>—</Text>
          </View>
        </View>
      );
    }
    if (isHeader) {
      return (
        <View
          style={styles.headerPlain}
          accessibilityLabel={kk.dashboard.prayerWeatherUnavailableA11y}
        >
          <Text style={[styles.headerEmoji, { fontSize: iconSize }]}>☁️</Text>
          <Text style={[styles.headerTemp, labelStyle, !labelStyle?.fontSize ? { fontSize: tempSize } : null]}>
            —
          </Text>
        </View>
      );
    }
    return (
      <View
        style={[styles.chip, styles.chipMuted, variant === "hero" && styles.chipHero]}
        accessibilityLabel={kk.dashboard.prayerWeatherUnavailableA11y}
      >
        <MaterialCommunityIcons name="weather-cloudy" size={iconSize} color="rgba(255,255,255,0.45)" />
        <Text style={[styles.tempMuted, labelStyle, !labelStyle?.fontSize ? { fontSize: tempSize } : null]}>—</Text>
      </View>
    );
  }

  const tempLine = formatTempSignedDeg(weatherSnap.tempC);

  if (headerColorful && theme) {
    return (
      <View
        style={styles.headerColorWrap}
        accessibilityRole="text"
        accessibilityLabel={kk.dashboard.prayerWeatherA11y(tempLine)}
      >
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.chip, styles.chipHeaderColorful, { borderColor: theme.borderColor }]}
        >
          <Animated.Text style={[styles.emoji, iconStyle, { fontSize: iconSize }]}>
            {weatherEmoji}
          </Animated.Text>
          <Text
            style={[styles.temp, { color: theme.tempColor, fontSize: tempSize }]}
            maxFontSizeMultiplier={1.1}
          >
            {tempLine}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (isHeader) {
    return (
      <View
        style={styles.headerPlain}
        accessibilityRole="text"
        accessibilityLabel={kk.dashboard.prayerWeatherA11y(tempLine)}
      >
        <Animated.Text style={[styles.headerEmoji, iconStyle, { fontSize: iconSize }]}>
          {weatherEmoji}
        </Animated.Text>
        <Text
          style={[
            styles.headerTemp,
            labelStyle,
            !labelStyle?.fontSize ? { fontSize: tempSize } : null,
          ]}
          maxFontSizeMultiplier={1.1}
        >
          {tempLine}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.wrap, variant === "hero" && styles.wrapHero]}
      accessibilityRole="text"
      accessibilityLabel={kk.dashboard.prayerWeatherA11y(tempLine)}
    >
      <LinearGradient
        colors={theme!.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.chip,
          variant === "hero" && styles.chipHero,
          heroChipSm && styles.chipHeroSm,
          { borderColor: theme!.borderColor },
        ]}
      >
        <Animated.Text style={[styles.emoji, iconStyle, { fontSize: iconSize + 1 }]}>
          {weatherEmoji}
        </Animated.Text>
        <Text
          style={[
            styles.temp,
            labelStyle,
            !labelStyle?.color && theme ? { color: theme.tempColor } : null,
            !labelStyle?.fontSize ? { fontSize: tempSize } : null,
          ]}
          maxFontSizeMultiplier={1.1}
        >
          {tempLine}
        </Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  headerColorWrap: {
    alignSelf: "center",
    marginRight: 2,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  chipHeaderColorful: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    minWidth: 52,
  },
  headerPlain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
  },
  headerEmoji: {
    lineHeight: undefined,
    ...Platform.select({
      android: { includeFontPadding: false, textAlignVertical: "center" as const },
      default: {},
    }),
  },
  headerTemp: {
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.06,
    ...Platform.select({
      android: { fontFamily: BRAND_FONT_FACE.semibold },
      default: {},
    }),
  },
  wrap: {
    alignSelf: "flex-start",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  wrapHero: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    overflow: "hidden",
  },
  chipHero: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  chipHeroSm: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    gap: 4,
  },
  chipLoading: {
    backgroundColor: "rgba(148, 163, 184, 0.25)",
    borderColor: "rgba(148, 163, 184, 0.35)",
    minWidth: 52,
    justifyContent: "center",
  },
  chipMuted: {
    backgroundColor: "rgba(148, 163, 184, 0.2)",
    borderColor: "rgba(148, 163, 184, 0.3)",
  },
  temp: {
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.06,
    ...Platform.select({
      android: { fontFamily: BRAND_FONT_FACE.semibold },
      default: {},
    }),
  },
  tempMuted: {
    color: "rgba(255,255,255,0.5)",
    fontWeight: "800",
  },
  emoji: Platform.select({
    android: { includeFontPadding: false, textAlignVertical: "center" as const },
    default: {},
  }),
});
