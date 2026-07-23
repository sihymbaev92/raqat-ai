import React, { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ImageBackground,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  applyPrayerTimeShift,
  fetchPrayerTimesForLocation,
  fetchPrayerTimesForLocationForDate,
  isPrayerTimesResultForLocalToday,
  parsePrayerResultLocalDayKey,
  type PrayerTimesResult,
} from "../api/prayerTimes";
import { alignPrayerTimesToShift } from "../services/prayerMosqueShiftAlign";
import { useAppTheme } from "../theme/ThemeContext";
import { homeHeaderContrastTextBase, homeHeaderBrandTitleStyle } from "../theme/homeHeaderContrastText";
import { kk, APP_BRAND_KK } from "../i18n/kk";
import { navigateToPrayerSettings } from "../navigation/navigateToSettings";
import { TabHomeBackButton, useTabHomeBackHeader } from "../navigation/useTabHomeBackHeader";
import { DomainSettingsHeaderButton } from "../components/settings/DomainSettingsHeaderButton";
import { getKzPresetCoords } from "../constants/kzCities";
import {
  fetchOpenMeteoCurrent,
  WEATHER_REFRESH_INTERVAL_MS,
  wmoCodeToWeatherIconName,
  type OpenMeteoCurrent,
} from "../services/openMeteoCurrent";
import { disablePrayerLocationAutoFromManualPick, resolvePrayerScheduleLocation } from "../services/devicePrayerLocation";
import {
  setSelectedCity,
  addSavedCity,
  getNotifEnabled,
  getIftarEnabled,
  getPrayerNotifMutedSalatKeys,
  getPrayerNotifSoundId,
  getPrayerSourceMode,
  getPrayerMosqueShiftMin,
  setPrayerNotifMutedSalatKeys,
  type PrayerNotifSalatKey,
  type PrayerNotifSoundId,
  type PrayerSourceMode,
} from "../storage/prefs";
import type { RootStackParamList } from "../navigation/types";
import { loadPrayerCache, savePrayerCache, syncNativePrayerWidgetFromStorage } from "../storage/prayerCache";
import { reschedulePrayerNotifications } from "../services/prayerNotifications";
import type { ThemeColors } from "../theme/colors";
import { PRAYER_TIMES_SCREEN_HERO_BG } from "../config/dashboardPrayerHero";
import { PrayerHeroSteamOverlay } from "../components/PrayerHeroSteamOverlay";
import { PrayerHeroDaylightOverlay } from "../components/PrayerHeroDaylightOverlay";
import { shortPrayerName } from "../components/CompactPrayerTimesRow";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import {
  nextSalatRow,
  currentSalatRow,
  parseMinutes,
  secondsUntilNextSalat,
  formatSecondsAsHms,
} from "../utils/prayerSchedule";
import { formatGregorianTechYmd, formatKkGregorianShort, formatKkHijriUmmAlQura } from "../utils/formatKkDate";
import { useAppLocale, useLocaleRevision } from "../i18n/runtime";
import { useScreenFitMetrics } from "../theme/screenFit";
import { ScreenFitScrollView } from "../components/ScreenFit";
import { beginLatestRequest } from "../utils/latestRequestGuard";
import {
  canPreviewPrayerNotifSound,
  previewPrayerNotifSound,
} from "../utils/previewPrayerNotifSound";

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

/** Келесі намаз жолын ерекшелеу — `DashboardPrayerWidget` логикасымен үйлесімді */
function timelineStateForRow(
  row: { key: string; time: string },
  next: { key: string; time: string } | null,
  current: { key: string; time: string } | null,
  now: Date
): "past" | "current" | "next" | "upcoming" {
  const nowM = now.getHours() * 60 + now.getMinutes();
  const rowM = parseMinutes(row.time);
  if (current && row.key === current.key) return "current";
  if (next && row.key === next.key) return "next";
  if (rowM >= 0 && rowM < nowM) return "past";
  return "upcoming";
}

/** Реф. скриндегі қанық жасыл таймер жолы */
const NEXT_PRAYER_STRIP_HEX = "#24A17B";

function signedDeg(c: number): string {
  const r = Math.round(c);
  if (r > 0) return `+${r}°`;
  return `${r}°`;
}

type PrayerTimesNavHeaderProps = {
  colors: ThemeColors;
  isDark: boolean;
  dateShort: string;
  weatherCoords: { lat: number; lon: number } | null;
  weatherSnap: OpenMeteoCurrent | null;
  weatherLoading: boolean;
};

function PrayerTimesNavHeader({
  colors,
  isDark,
  dateShort,
  weatherCoords,
  weatherSnap,
  weatherLoading,
}: PrayerTimesNavHeaderProps) {
  const contrast = homeHeaderContrastTextBase(colors, isDark);
  type MciName = ComponentProps<typeof MaterialCommunityIcons>["name"];
  const weatherIconName = weatherSnap
    ? (wmoCodeToWeatherIconName(weatherSnap.wmoCode, {
        isDay: weatherSnap.isDay,
        observedAt: weatherSnap.observedAt,
      }) as MciName)
    : ("weather-cloudy" as MciName);
  const tempLine = weatherSnap ? signedDeg(weatherSnap.tempC) : "";
  const weatherA11y = weatherLoading
    ? kk.common.loading
    : weatherSnap
      ? kk.dashboard.prayerWeatherA11y(tempLine)
      : kk.dashboard.prayerWeatherUnavailableA11y;

  return (
    <View
      style={navHeaderStyles.wrap}
      accessibilityRole="header"
      accessibilityLabel={`${APP_BRAND_KK}. ${dateShort}. ${weatherA11y}`}
    >
      <Text style={[navHeaderStyles.brand, contrast]}>{APP_BRAND_KK}</Text>
      <View style={navHeaderStyles.subRow}>
        <View style={navHeaderStyles.subRowDate}>
          <Text style={[navHeaderStyles.subText, contrast]} numberOfLines={1}>
            {dateShort}
          </Text>
        </View>
        <View style={navHeaderStyles.subRowWeather}>
          {weatherCoords ? (
            weatherLoading ? (
              <RaqatOrnamentSpinner size={16} />
            ) : weatherSnap ? (
              <>
                <MaterialCommunityIcons name={weatherIconName} size={14} color={colors.text} />
                <Text style={[navHeaderStyles.temp, contrast]}>{tempLine}</Text>
              </>
            ) : (
              <Text style={[navHeaderStyles.subText, contrast]}>—</Text>
            )
          ) : (
            <Text style={[navHeaderStyles.subText, contrast]}>—</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const navHeaderStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: "100%",
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  brand: homeHeaderBrandTitleStyle("md"),
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 1,
    width: "100%",
    gap: 8,
  },
  subRowDate: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  subRowWeather: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    justifyContent: "flex-end",
  },
  subText: { fontSize: 11, fontWeight: "600" },
  temp: { fontSize: 11, fontWeight: "700", marginLeft: 3 },
});

const PLACEHOLDER_CELLS: { key: string; time: string }[] = [
  { key: "fajr", time: "" },
  { key: "sun", time: "" },
  { key: "dhuhr", time: "" },
  { key: "asr", time: "" },
  { key: "maghrib", time: "" },
  { key: "isha", time: "" },
];

function isSoundTogglePrayerKey(key: string): key is PrayerNotifSalatKey {
  return key === "fajr" || key === "dhuhr" || key === "asr" || key === "maghrib" || key === "isha";
}

function prayerTimesErrorResult(city: string, country: string, error: string): PrayerTimesResult {
  return {
    city,
    country,
    date: "",
    fajr: "",
    sunrise: "",
    dhuhr: "",
    asr: "",
    maghrib: "",
    isha: "",
    error,
  };
}

function weatherCoordsFromPrayerResult(d: Pick<PrayerTimesResult, "latitude" | "longitude"> | null): {
  lat: number;
  lon: number;
} | null {
  if (d && Number.isFinite(d.latitude) && Number.isFinite(d.longitude)) {
    return { lat: d.latitude as number, lon: d.longitude as number };
  }
  return null;
}

type PrayerTimesLiveRowsProps = {
  styles: ReturnType<typeof makeStyles>;
  carouselCells: { key: string; time: string }[];
  tomorrowCells: { key: string; time: string }[] | null;
  pendingCarousel: boolean;
  hasData: boolean;
  mutedSalatKeys: PrayerNotifSalatKey[];
  notifEnabled: boolean;
  prayerSoundId: PrayerNotifSoundId;
  onTogglePrayerSound: (key: PrayerNotifSalatKey) => void;
};

const PrayerTimesLiveRows = memo(function PrayerTimesLiveRows({
  styles,
  carouselCells,
  tomorrowCells,
  pendingCarousel,
  hasData,
  mutedSalatKeys,
  notifEnabled,
  prayerSoundId,
  onTogglePrayerSound,
}: PrayerTimesLiveRowsProps) {
  useAppLocale();
  useLocaleRevision();
  const [nowTick, setNowTick] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNowTick(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const nextSalatResolved = useMemo(
    () => nextSalatRow(carouselCells, tomorrowCells, nowTick),
    [carouselCells, tomorrowCells, nowTick]
  );
  const currentSalatResolved = useMemo(
    () => currentSalatRow(carouselCells, nowTick),
    [carouselCells, nowTick]
  );
  const stripCountdownHms = useMemo(() => {
    if (pendingCarousel || !hasData) return "—";
    return formatSecondsAsHms(secondsUntilNextSalat(carouselCells, nowTick, tomorrowCells));
  }, [pendingCarousel, hasData, carouselCells, tomorrowCells, nowTick]);

  return (
    <>
      {carouselCells.map((cell) => {
        const key = cell.key;
        const state = timelineStateForRow(cell, nextSalatResolved, currentSalatResolved, nowTick);
        const isHi = state === "current";
        const isNext = state === "next";
        const isPast = state === "past";
        const t = cell.time?.trim() ? cell.time.trim().split(/\s+/)[0] : "—";
        const soundKey: PrayerNotifSalatKey | null = isSoundTogglePrayerKey(key) ? key : null;
        const soundMuted = soundKey ? mutedSalatKeys.includes(soundKey) : true;
        const soundToggleEnabled = notifEnabled && prayerSoundId !== "off";
        const soundActive = soundKey != null && soundToggleEnabled && !soundMuted;
        return (
          <View key={cell.key} style={[styles.ptRow, isHi && styles.ptRowHi, isPast && styles.ptRowPast]}>
            <View style={styles.ptNameCol}>
              <Text style={[styles.ptName, isPast && styles.ptNamePast, isHi && styles.ptNameHi]} numberOfLines={1}>
                {shortPrayerName(cell.key)}
              </Text>
              {isNext ? (
                <Text style={styles.ptCountdown} numberOfLines={1}>
                  {stripCountdownHms}
                </Text>
              ) : null}
            </View>
            {soundKey ? (
              <Pressable
                onPress={() => {
                  if (soundToggleEnabled) onTogglePrayerSound(soundKey);
                }}
                disabled={!soundToggleEnabled}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityState={{ disabled: !soundToggleEnabled, selected: soundActive }}
                accessibilityLabel={`${shortPrayerName(cell.key)} ${!soundToggleEnabled
                  ? kk.prayer.azanToggleDisabledBySettings
                  : soundActive
                    ? kk.prayer.azanToggleOn
                    : kk.prayer.azanToggleOff}`}
                style={({ pressed }) => [
                  styles.ptIconBtn,
                  soundActive && styles.ptIconBtnActive,
                  isHi && styles.ptIconBtnOnGreen,
                  !soundToggleEnabled && styles.ptIconBtnDisabled,
                  pressed && soundToggleEnabled && { opacity: 0.78 },
                ]}
              >
                <MaterialIcons
                  name={soundActive ? "volume-up" : "volume-off"}
                  size={19}
                  color={soundActive ? (isHi ? "#FFFFFF" : "#B9F6CA") : "rgba(255,255,255,0.44)"}
                />
              </Pressable>
            ) : (
              <View style={styles.ptIconBtnSpacer} />
            )}
            <Text style={[styles.ptTime, isPast && styles.ptTimePast, isHi && styles.ptTimeHi]} numberOfLines={1}>
              {t}
            </Text>
          </View>
        );
      })}
    </>
  );
});

export function PrayerTimesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "PrayerTimes">>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const screenFit = useScreenFitMetrics();
  const locale = useAppLocale();
  useTabHomeBackHeader(navigation, colors);
  const [city, setCity] = useState("Shymkent");
  const [country, setCountry] = useState("Kazakhstan");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof fetchPrayerTimesForLocation>
  > | null>(null);
  const [sourceMode, setSourceMode] = useState<PrayerSourceMode>("calc");
  const [mosqueShiftMin, setMosqueShiftMin] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [prayerSoundId, setPrayerSoundId] = useState<PrayerNotifSoundId>("adhan_haramain");
  const [mutedSalatKeys, setMutedSalatKeys] = useState<PrayerNotifSalatKey[]>([]);
  const [headerDate, setHeaderDate] = useState(() => formatKkGregorianShort(new Date(), locale));
  const [weatherSnap, setWeatherSnap] = useState<OpenMeteoCurrent | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [nowMinuteTick, setNowMinuteTick] = useState(() => new Date());
  const [tomorrowCells, setTomorrowCells] = useState<{ key: string; time: string }[] | null>(null);
  const fetchSeqRef = useRef(0);

  const weatherCoords = useMemo(
    () => weatherCoordsFromPrayerResult(result) ?? getKzPresetCoords(city, country),
    [city, country, result?.latitude, result?.longitude]
  );

  useEffect(() => {
    const t = setInterval(() => setNowMinuteTick(new Date()), 60 * 1000);
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
        void syncNativePrayerWidgetFromStorage(w);
      }
    };
    void tick();
    const id = setInterval(() => void tick(), WEATHER_REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [weatherCoords?.lat, weatherCoords?.lon]);

  const fetchAndSave = useCallback(
    async (
      c?: string,
      co?: string,
      shiftOverride?: { sourceMode: PrayerSourceMode; mosqueShiftMin: number },
    ) => {
      const { isCurrentRequest } = beginLatestRequest(fetchSeqRef);
      setLoading(true);
      const effectiveMode = shiftOverride?.sourceMode ?? sourceMode;
      const effectiveShift = shiftOverride?.mosqueShiftMin ?? mosqueShiftMin;
      const applyShift = (
        data: NonNullable<Awaited<ReturnType<typeof fetchPrayerTimesForLocation>>>,
      ) => {
        if (effectiveMode !== "mosque" || data.error || effectiveShift === 0) return data;
        return applyPrayerTimeShift(data, effectiveShift);
      };
      let cityName: string;
      let countryName: string;
      let scheduleCoords: { lat: number; lon: number } | undefined;
      if (c?.trim() && co?.trim()) {
        await disablePrayerLocationAutoFromManualPick();
        cityName = c.trim();
        countryName = co.trim();
        const preset = getKzPresetCoords(cityName, countryName);
        scheduleCoords = preset ?? undefined;
      } else {
        const loc = await resolvePrayerScheduleLocation();
        cityName = loc.city;
        countryName = loc.country;
        scheduleCoords = { lat: loc.lat, lon: loc.lon };
      }
      setCity(cityName);
      setCountry(countryName);
      try {
        const data = await fetchPrayerTimesForLocation(
          cityName,
          countryName,
          undefined,
          scheduleCoords
        );
        const out = applyShift(data);
        if (!isCurrentRequest()) return;
        if (out.error) {
          const cached = await loadPrayerCache();
          if (
            cached &&
            !cached.error &&
            cached.city === cityName &&
            cached.country === countryName &&
            isPrayerTimesResultForLocalToday(cached)
          ) {
            const cachedOut = alignPrayerTimesToShift(cached, effectiveMode === "mosque" ? effectiveShift : 0, {
              missingAppliedMeans: cached.appliedShiftMin == null ? "alreadyDesired" : "raw",
            });
            setResult(cachedOut);
            if (!isCurrentRequest()) return;
            try {
              const [en, ift] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
              if (!isCurrentRequest()) return;
              await savePrayerCache(cachedOut, {
                appliedShiftMin: cachedOut.appliedShiftMin ?? (effectiveMode === "mosque" ? effectiveShift : 0),
              });
              await reschedulePrayerNotifications(cachedOut, {
                enabled: en,
                iftarExtra: ift,
                prayerTimesAlreadyAdjusted: true,
              });
            } catch {
              /* кесте көрсетіле береді */
            }
            return;
          }
        }
        setResult(out);
        if (!out.error) {
          if (!isCurrentRequest()) return;
          await setSelectedCity(cityName, countryName);
          if (!isCurrentRequest()) return;
          await addSavedCity(cityName, countryName);
          if (!isCurrentRequest()) return;
          await savePrayerCache(out, {
            appliedShiftMin: effectiveMode === "mosque" ? effectiveShift : 0,
          });
          if (!isCurrentRequest()) return;
          const [en, ift] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
          if (!isCurrentRequest()) return;
          try {
            await reschedulePrayerNotifications(out, {
              enabled: en,
              iftarExtra: ift,
              prayerTimesAlreadyAdjusted: true,
            });
          } catch {
            /* Кесте көрсетіле береді; хабарлама диагностикасы баптауларда бөлек тексеріледі. */
          }
        }
      } catch (e) {
        if (!isCurrentRequest()) return;
        const cached = await loadPrayerCache();
        if (
          cached &&
          !cached.error &&
          isPrayerTimesResultForLocalToday(cached)
        ) {
          setResult(
            alignPrayerTimesToShift(cached, effectiveMode === "mosque" ? effectiveShift : 0, {
              missingAppliedMeans: cached.appliedShiftMin == null ? "alreadyDesired" : "raw",
            }),
          );
          return;
        }
        const message = e instanceof Error ? e.message : "Network error";
        setResult(prayerTimesErrorResult(cityName, countryName, message));
      } finally {
        if (isCurrentRequest()) setLoading(false);
      }
    },
    [mosqueShiftMin, sourceMode]
  );

  useFocusEffect(
    useCallback(() => {
      setHeaderDate(formatKkGregorianShort(new Date(), locale));
      let cancelled = false;
      (async () => {
        const mode = await getPrayerSourceMode();
        const shift = await getPrayerMosqueShiftMin();
        const [ne, sid, mutedKeys] = await Promise.all([
          getNotifEnabled(),
          getPrayerNotifSoundId(),
          getPrayerNotifMutedSalatKeys(),
        ]);
        if (cancelled) return;
        setSourceMode(mode);
        setMosqueShiftMin(shift);
        setNotifEnabled(ne);
        setPrayerSoundId(sid);
        setMutedSalatKeys(mutedKeys);
        await fetchAndSave(undefined, undefined, { sourceMode: mode, mosqueShiftMin: shift });
      })();
      return () => {
        cancelled = true;
      };
    }, [fetchAndSave, locale])
  );

  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);
  const historyIdx = mondayFirstWeekdayIndex();
  const historyBundle = kk.prayer.prayerHistoryRotation[historyIdx];

  const hasData = Boolean(result && !result.error);
  const pendingCarousel = Boolean(loading && !result);
  const carouselCells = useMemo(
    () => (hasData && result ? resultToCells(result) : PLACEHOLDER_CELLS),
    [hasData, result]
  );
  const salatMinute = nowMinuteTick.getHours() * 60 + nowMinuteTick.getMinutes();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!hasData || !carouselCells.length) {
        if (!cancelled) setTomorrowCells(null);
        return;
      }
      const salat = carouselCells.filter((r) => r.key !== "sun" && r.time?.trim());
      if (!salat.length) {
        if (!cancelled) setTomorrowCells(null);
        return;
      }
      const nowM = new Date().getHours() * 60 + new Date().getMinutes();
      const allPast = salat.every((r) => parseMinutes(r.time) <= nowM);
      if (!allPast) {
        if (!cancelled) setTomorrowCells(null);
        return;
      }
      const tm = new Date();
      tm.setDate(tm.getDate() + 1);
      tm.setHours(12, 0, 0, 0);
      const ptRaw = await fetchPrayerTimesForLocationForDate(city, country, tm);
      const pt =
        sourceMode === "mosque" && mosqueShiftMin !== 0
          ? applyPrayerTimeShift(ptRaw, mosqueShiftMin)
          : ptRaw;
      if (cancelled) return;
      if (!pt.error) setTomorrowCells(resultToCells(pt));
      else setTomorrowCells(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [hasData, carouselCells, city, country, salatMinute, mosqueShiftMin, sourceMode]);

  const togglePrayerSound = useCallback(
    async (key: PrayerNotifSalatKey) => {
      const wasMuted = mutedSalatKeys.includes(key);
      const nextMuted = wasMuted
        ? mutedSalatKeys.filter((x) => x !== key)
        : [...mutedSalatKeys, key];
      setMutedSalatKeys(nextMuted);
      await setPrayerNotifMutedSalatKeys(nextMuted);
      if (
        wasMuted &&
        notifEnabled &&
        canPreviewPrayerNotifSound(prayerSoundId)
      ) {
        void previewPrayerNotifSound(prayerSoundId);
      }
      if (result && !result.error) {
        const iftar = await getIftarEnabled();
        await reschedulePrayerNotifications(result, {
          enabled: notifEnabled,
          iftarExtra: iftar,
          prayerTimesAlreadyAdjusted: true,
        });
      }
    },
    [mutedSalatKeys, notifEnabled, prayerSoundId, result]
  );

  /** Намаз кестесінің `date` жолымен бір локальды күн (хижра/григориан көрсетілімі). */
  const prayerCalendarDay = useMemo(() => {
    if (!result || result.error || !result.date?.trim()) return null;
    const key = parsePrayerResultLocalDayKey(result.date);
    if (!key) return null;
    return new Date(key.y, key.m0, key.d, 12, 0, 0, 0);
  }, [result]);
  const hijriGregorianAnchor = prayerCalendarDay ?? new Date();

  return (
    <View style={styles.bgRoot}>
      <View style={[styles.topChrome, { paddingTop: insets.top }]}>
        <TabHomeBackButton navigation={navigation} colors={colors} />
        <View style={styles.topChromeCenter}>
          <PrayerTimesNavHeader
            colors={colors}
            isDark={isDark}
            dateShort={headerDate}
            weatherCoords={weatherCoords}
            weatherSnap={weatherSnap}
            weatherLoading={weatherLoading}
          />
        </View>
        <DomainSettingsHeaderButton
          colors={colors}
          onPress={() => navigateToPrayerSettings(navigation)}
          accessibilityLabel={kk.settings.headerPrayerSettingsA11y}
        />
      </View>
      <ScreenFitScrollView
        testID="screen-main-prayer"
        style={styles.scrollRoot}
        contentContainerStyle={styles.content}
        top={screenFit.isCompactPhone ? 8 : 12}
        bottom={40 + insets.bottom}
        nestedScrollEnabled
      >
        <View style={styles.summaryColumn}>
          <ImageBackground
            source={PRAYER_TIMES_SCREEN_HERO_BG}
            style={styles.kaabaPrayerPanel}
            imageStyle={styles.kaabaPrayerPanelImage}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            accessibilityLabel={kk.prayer.timesHeroKaabaA11y}
          >
            <PrayerHeroDaylightOverlay rows={carouselCells} />
            <PrayerHeroSteamOverlay variant="prayerScreen" />
            <View style={styles.frostedCard}>
              {hasData && result ? (
                <Text style={styles.cityLine}>
                  {result.city}, {result.country} · {result.date}
                </Text>
              ) : null}
              {pendingCarousel ? (
                <View style={styles.ptLoadingRow}>
                  <RaqatOrnamentSpinner size={22} />
                  <Text style={styles.ptLoadingTxt}>{kk.common.loading}</Text>
                </View>
              ) : null}
              <View style={styles.verticalTimes}>
                <PrayerTimesLiveRows
                  styles={styles}
                  carouselCells={carouselCells}
                  tomorrowCells={tomorrowCells}
                  pendingCarousel={pendingCarousel}
                  hasData={hasData}
                  mutedSalatKeys={mutedSalatKeys}
                  notifEnabled={notifEnabled}
                  prayerSoundId={prayerSoundId}
                  onTogglePrayerSound={(key) => void togglePrayerSound(key)}
                />
              </View>
              {hasData ? (
                <View style={styles.ptDateFooter}>
                  <Text style={styles.hijriHero}>{formatKkHijriUmmAlQura(hijriGregorianAnchor, locale)}</Text>
                  <Text style={styles.gregHero}>{formatGregorianTechYmd(hijriGregorianAnchor)}</Text>
                  <Text style={styles.hijriNote}>{kk.prayer.hijriCalendarNote}</Text>
                </View>
              ) : null}
            </View>
          </ImageBackground>
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
                <RaqatOrnamentSpinner size={22} />
              ) : (
                <Text style={styles.retryButtonLabel}>{kk.common.retry}</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScreenFitScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  /** Қою панель үстінде барлығы ақ мәтін */
  const ink = "#FFFFFF";
  const inkMuted = "#F2F4F7";
  const inkSoft = "#E8ECF0";
  const uiBorder = "rgba(61, 70, 84, 0.72)";
  /** Фото фон көрінісі: намаз блогы мөлдір панель */
  const glassCard = "rgba(18, 21, 28, 0.52)";
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
  return StyleSheet.create({
    bgRoot: { flex: 1, backgroundColor: colors.bg },
    topChrome: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingBottom: 6,
      backgroundColor: colors.bg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    topChromeCenter: { flex: 1, minWidth: 0 },
    scrollRoot: { flex: 1, backgroundColor: colors.bg },
    content: Platform.select({
      web: {
        width: "100%",
        maxWidth: "100%",
        alignSelf: "stretch",
        paddingHorizontal: 6,
        paddingTop: 10,
        paddingBottom: 40,
      },
      default: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 40,
      },
    }),
    err: { color: "#FFFFFF", marginBottom: 6, fontSize: 14, lineHeight: 20, fontWeight: "800" },
    errBanner: {
      marginBottom: 16,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: "#1c1416",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: "#9b2c2c",
      ...cardShadow,
    },
    errHint: { color: inkSoft, fontSize: 12, lineHeight: 17, marginBottom: 10 },
    retryButton: {
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "#9aa3b2",
      backgroundColor: "#252a33",
    },
    retryButtonPressed: { opacity: 0.88 },
    retryButtonDisabled: { opacity: 0.65 },
    retryButtonLabel: {
      color: ink,
      fontSize: 15,
      fontWeight: "800",
    },
    /** Қағба панелі + оның астындағы хижра/григориан карточкасы */
    summaryColumn: {
      marginBottom: 18,
      alignSelf: "stretch",
    },
    /** Қағба фонындағы намаз панелі (тізім + жасыл жол) */
    kaabaPrayerPanel: {
      width: "100%",
      minHeight: 320,
      borderRadius: 18,
      overflow: "hidden",
      ...cardShadow,
    },
    kaabaPrayerPanelImage: {
      borderRadius: 18,
    },
    frostedCard: {
      margin: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.14)",
      backgroundColor: "rgba(14, 16, 20, 0.58)",
      padding: 12,
    },
    ptLoadingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    ptLoadingTxt: {
      color: inkMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    verticalTimes: {
      alignSelf: "stretch",
    },
    ptRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 9,
      paddingHorizontal: 10,
      borderRadius: 12,
      marginBottom: 3,
    },
    ptRowHi: {
      backgroundColor: NEXT_PRAYER_STRIP_HEX,
    },
    ptRowPast: {
      opacity: 0.9,
    },
    ptNameCol: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
    },
    ptName: {
      color: ink,
      fontSize: 15,
      fontWeight: "800",
    },
    ptNamePast: {
      color: "rgba(255, 255, 255, 0.88)",
    },
    ptNameHi: {
      color: "#FFFFFF",
    },
    ptCountdown: {
      marginTop: 2,
      color: "rgba(255,255,255,0.9)",
      fontSize: 11,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.25,
    },
    ptIconBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      marginHorizontal: 6,
      backgroundColor: "rgba(255,255,255,0.08)",
    },
    ptIconBtnActive: {
      backgroundColor: "rgba(36, 161, 123, 0.22)",
    },
    ptIconBtnOnGreen: {
      backgroundColor: "rgba(255,255,255,0.16)",
    },
    ptIconBtnDisabled: {
      opacity: 0.48,
    },
    ptIconBtnSpacer: {
      width: 46,
      height: 34,
    },
    ptTime: {
      minWidth: 52,
      textAlign: "right",
      color: ink,
      fontSize: 15,
      fontWeight: "800",
      fontVariant: ["tabular-nums"],
    },
    ptTimePast: {
      color: "rgba(255, 255, 255, 0.9)",
    },
    ptTimeHi: {
      color: "#FFFFFF",
    },
    ptGreenStrip: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
      paddingVertical: 11,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: NEXT_PRAYER_STRIP_HEX,
    },
    ptGreenStripLeft: {
      flex: 1,
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
      marginRight: 8,
    },
    ptGreenStripRight: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "900",
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.3,
    },
    ptDateFooter: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.18)",
    },
    cityLine: {
      color: inkMuted,
      marginBottom: 12,
      fontSize: 13,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    hijriHero: {
      color: ink,
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 6,
      letterSpacing: -0.3,
    },
    gregHero: {
      color: ink,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 8,
    },
    hijriNote: { color: inkSoft, fontSize: 11, lineHeight: 16, marginBottom: 4 },
    historyCard: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      marginBottom: 16,
      borderRadius: 22,
      backgroundColor: isDark ? "#050B0F" : "#071015",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.10)",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 16,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    historyTitle: {
      color: ink,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 6,
      letterSpacing: 0.2,
    },
    historySubtitle: {
      color: "rgba(255,255,255,0.74)",
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 12,
    },
    historyDay: {
      color: "rgba(255,255,255,0.82)",
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 10,
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    historyPara: {
      color: "rgba(255,255,255,0.94)",
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 12,
    },
  });
}
