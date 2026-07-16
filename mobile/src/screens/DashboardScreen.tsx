import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  AppState,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  applyPrayerTimeShift,
  fetchPrayerTimesForLocation,
  fetchPrayerTimesForLocationForDate,
  isPrayerTimesResultForLocalToday,
  type PrayerTimesResult,
} from "../api/prayerTimes";
import { useAppTheme } from "../theme/ThemeContext";
import { BRAND_FONT_FACE } from "../fonts/brandFont";
import { kk, APP_BRAND_KK } from "../i18n/kk";
import { homeHeaderContrastTextBase, homeHeaderBrandTitleStyle, homeHeaderDateLineStyle } from "../theme/homeHeaderContrastText";
import { typography, uiFontStyle, uiText } from "../theme/typography";
import {
  getIftarEnabled,
  getNotifEnabled,
  getPrayerMosqueShiftMin,
  getPrayerSourceMode,
  setOnboardingDone,
} from "../storage/prefs";
import { resolvePrayerScheduleLocation } from "../services/devicePrayerLocation";
import { loadPrayerCache, savePrayerCache } from "../storage/prayerCache";
import { reschedulePrayerNotifications } from "../services/prayerNotifications";
import { fireInAppPrayerAlert } from "../services/prayerNotifications";
import type { ThemeColors } from "../theme/colors";
import type { HomeTabCompositeNavigation } from "../navigation/types";
import { navigateToAppSettings, navigateToPrayerSettings } from "../navigation/navigateToSettings";
import { navigateToMoreStackScreen, navigateToRootStackScreen } from "../navigation/navigateToMoreStack";
import { runAfterInteractions } from "../utils/uiDefer";
import { shortPrayerName } from "../components/CompactPrayerTimesRow";
import { nextSalatRow, parseMinutes } from "../utils/prayerSchedule";
import { DashboardPrayerWidget } from "../components/DashboardPrayerWidget";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { DashboardQaumDuaBanner } from "../components/dashboard/DashboardQaumDuaBanner";
import { DashboardHomeServicesGrid } from "../components/dashboard/DashboardHomeServicesGrid";
import { dashboardHomeServiceWebPath, type DashboardHomeServiceKey } from "../config/dashboardHomeServices";
import { awaitKmdbHubWarm, warmHalalHubScreen, warmKmdbHubScreen } from "../services/hubScreenWarmup";
import { QiblaSensorProvider, useQiblaStable } from "../context/QiblaSensorContext";
import { formatDashboardHeaderDateLines } from "../utils/formatKkDate";
import { useAppLocale } from "../i18n/runtime";
import { getKzPresetCoords } from "../constants/kzCities";
import { fetchOpenMeteoCurrent, type OpenMeteoCurrent } from "../services/openMeteoCurrent";
import { ScreenFitScrollView } from "../components/ScreenFit";
import { shouldFireInAppPrayerMoment } from "../utils/prayerMomentAlertWindow";

function openWebRoute(path: string): boolean {
  if (Platform.OS !== "web" || typeof window === "undefined") return false;
  window.location.assign(path);
  return true;
}

type Row = { key: string; label: string; time: string };

function prayerLabelForKey(key: string): string {
  const labels: Record<string, string> = {
    fajr: kk.prayer.fajr,
    sun: kk.prayer.sunrise,
    dhuhr: kk.prayer.dhuhr,
    asr: kk.prayer.asr,
    maghrib: kk.prayer.maghrib,
    isha: kk.prayer.isha,
  };
  return labels[key] ?? key;
}

function matchesClockMinute(now: Date, timeStr: string): boolean {
  if (!timeStr?.trim()) return false;
  const target = parseMinutes(timeStr);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur === target;
}

function rowsFromResult(d: PrayerTimesResult): Row[] {
  return [
    { key: "fajr", label: prayerLabelForKey("fajr"), time: d.fajr },
    { key: "sun", label: prayerLabelForKey("sun"), time: d.sunrise },
    { key: "dhuhr", label: prayerLabelForKey("dhuhr"), time: d.dhuhr },
    { key: "asr", label: prayerLabelForKey("asr"), time: d.asr },
    { key: "maghrib", label: prayerLabelForKey("maghrib"), time: d.maghrib },
    { key: "isha", label: prayerLabelForKey("isha"), time: d.isha },
  ];
}

function weatherCoordsFromPrayerResult(d: Pick<PrayerTimesResult, "latitude" | "longitude">): {
  lat: number;
  lon: number;
} | null {
  if (Number.isFinite(d.latitude) && Number.isFinite(d.longitude)) {
    return { lat: d.latitude as number, lon: d.longitude as number };
  }
  return null;
}

async function getDashboardPrayerShiftMin(): Promise<number> {
  const [sourceMode, shiftMin] = await Promise.all([getPrayerSourceMode(), getPrayerMosqueShiftMin()]);
  return sourceMode === "mosque" ? shiftMin : 0;
}

function signedDegHomeHeader(c: number): string {
  const r = Math.round(c);
  if (r > 0) return `+${r}°`;
  return `${r}°`;
}

/** Басты бет карточкалары — жеңіл тереңдік, жарықта тым қатты көлеңке емес */
function cardShadow(isDark: boolean) {
  return Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.32 : 0.09,
      shadowRadius: isDark ? 14 : 12,
    },
    android: { elevation: isDark ? 5 : 3 },
    default: {},
  });
}

/** Басты бет шапка биіктігі — status bar + бір қатар (күн/бренд/баптаулар). */
function homeDashboardHeaderMetrics(insets: { top: number }) {
  const statusTop =
    Platform.OS === "web"
      ? 0
      : insets.top;
  /** Екі жол күн (11/14 × 2). */
  const rowH = 28;
  return {
    statusTop,
    rowH,
    headerH: statusTop + rowH,
  };
}

/** Баптаулар түймесі өлшемі (құбыламен бір қатарда). */
const HEADER_SETTINGS_BTN = 24;
/** headerRight — баптаулар (ауа райы — намаз карточкасында) */
/** React Navigation header ішкі padding — баптауларды экран/oң safe-area шетіне. */
const HEADER_SETTINGS_RIGHT_EDGE_NUDGE = Platform.select({
  web: -16,
  ios: -12,
  android: -10,
  default: -12,
}) as number;
/** Күн/ауа райы — сол жақтан сәл оңға. */
const HEADER_DATE_WEATHER_RIGHT_NUDGE = 8;
/** RAHAT OMIR — шапка ортасында. */
function HomeHeaderBrandTitle({
  colors,
  isDark,
}: {
  colors: ThemeColors;
  isDark: boolean;
}) {
  return (
    <Text
      style={{
        ...homeHeaderContrastTextBase(colors, isDark),
        ...homeHeaderBrandTitleStyle("sm"),
        textAlign: "center",
        width: "100%",
      }}
      numberOfLines={1}
      accessibilityRole="header"
    >
      {APP_BRAND_KK}
    </Text>
  );
}

function HomeHeaderLeft({
  colors,
  isDark,
}: {
  colors: ThemeColors;
  isDark: boolean;
}) {
  const locale = useAppLocale();
  const now = new Date();
  const { gregorian, hijri } = formatDashboardHeaderDateLines(now, locale);
  const dateLineStyle = homeHeaderDateLineStyle(colors, isDark);

  return (
    <View style={{ flex: 1, minWidth: 0, paddingLeft: 2, marginLeft: HEADER_DATE_WEATHER_RIGHT_NUDGE }}>
      <Text style={dateLineStyle} numberOfLines={1}>
        {gregorian}
      </Text>
      <Text style={dateLineStyle} numberOfLines={1}>
        {hijri}
      </Text>
    </View>
  );
}

function HomeHeaderSettingsButton({
  navigation,
  colors,
}: {
  navigation: HomeTabCompositeNavigation;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      oyuBackdrop={false}
      onPress={() => navigateToAppSettings(navigation)}
      style={({ pressed }) => ({
        width: HEADER_SETTINGS_BTN,
        height: HEADER_SETTINGS_BTN,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={kk.settings.headerSettingsA11y}
    >
      <MaterialIcons name="tune" size={19} color={colors.text} />
    </Pressable>
  );
}

function HomeHeaderActions({
  navigation,
  colors,
}: {
  navigation: HomeTabCompositeNavigation;
  colors: ThemeColors;
}) {
  return <HomeHeaderSettingsButton navigation={navigation} colors={colors} />;
}

/** Компакт шапка — RN header орнына (артық бос орын жоқ). */
function HomeHeaderBar({
  colors,
  isDark,
  navigation,
  headerMetrics,
  insetsRight,
}: {
  colors: ThemeColors;
  isDark: boolean;
  navigation: HomeTabCompositeNavigation;
  headerMetrics: ReturnType<typeof homeDashboardHeaderMetrics>;
  insetsRight: number;
}) {
  const { statusTop, rowH } = headerMetrics;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingTop: statusTop,
        minHeight: statusTop + rowH,
        paddingBottom: 0,
        marginBottom: 2,
        paddingRight: Math.max(insetsRight, 0) + HEADER_SETTINGS_RIGHT_EDGE_NUDGE,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, zIndex: 1 }}>
        <HomeHeaderLeft colors={colors} isDark={isDark} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: statusTop,
          height: rowH,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HomeHeaderBrandTitle colors={colors} isDark={isDark} />
      </View>
      <HomeHeaderActions navigation={navigation} colors={colors} />
    </View>
  );
}

export function DashboardScreen() {
  return (
    <QiblaSensorProvider>
      <DashboardScreenWithQibla />
    </QiblaSensorProvider>
  );
}

function DashboardScreenWithQibla() {
  const { resumeHeadingSubscription } = useQiblaStable();
  return <DashboardScreenContent qiblaEnabled resumeHeadingSubscription={resumeHeadingSubscription} />;
}

function DashboardScreenContent({
  qiblaEnabled,
  resumeHeadingSubscription,
}: {
  qiblaEnabled: boolean;
  resumeHeadingSubscription?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const locale = useAppLocale();
  const navigation = useNavigation<HomeTabCompositeNavigation>();
  const dashboardFocused = useIsFocused();
  const headerMetrics = useMemo(() => homeDashboardHeaderMetrics(insets), [insets.top]);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  /** Бүгінгі парыздар өткен соң келесі таң/күн — «келесі намаз» сағатын дұрыс көрсету */
  const [tomorrowRows, setTomorrowRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [cityLabel, setCityLabel] = useState("");
  const [countryLabel, setCountryLabel] = useState("Kazakhstan");
  const [weatherCoordOverride, setWeatherCoordOverride] = useState<{ lat: number; lon: number } | null>(null);
  const [weatherSnap, setWeatherSnap] = useState<OpenMeteoCurrent | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [prayerNotifEnabled, setPrayerNotifEnabled] = useState(true);
  /** Намаз минуты кіргенде (экран ашық) — қысқа баннер */
  const [momentBanner, setMomentBanner] = useState<string | null>(null);
  const momentBannerRef = useRef<string | null>(null);
  const momentPulseId = useRef<string>("");
  const lastFocusPrayerLoadAt = useRef(0);
  const appActiveSinceRef = useRef(Date.now());
  const mountedRef = useRef(true);
  const prayerLoadSeqRef = useRef(0);
  const weatherCoords = useMemo(
    () => weatherCoordOverride ?? (cityLabel ? getKzPresetCoords(cityLabel, countryLabel) : null),
    [cityLabel, countryLabel, weatherCoordOverride]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      prayerLoadSeqRef.current += 1;
    };
  }, []);

  useEffect(() => {
    setRows((prev) => prev.map((row) => ({ ...row, label: prayerLabelForKey(row.key) })));
    setTomorrowRows((prev) =>
      prev ? prev.map((row) => ({ ...row, label: prayerLabelForKey(row.key) })) : prev
    );
  }, [locale]);

  useEffect(() => {
    if (!weatherCoords) {
      setWeatherSnap(null);
      setWeatherLoading(false);
      return;
    }
    let cancelled = false;
    const tick = async () => {
      setWeatherLoading(true);
      const w = await fetchOpenMeteoCurrent(weatherCoords.lat, weatherCoords.lon);
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!rows.length) {
        if (!cancelled) setTomorrowRows(null);
        return;
      }
      const salat = rows.filter((r) => r.key !== "sun" && r.time?.trim());
      if (!salat.length) {
        if (!cancelled) setTomorrowRows(null);
        return;
      }
      const nowM = new Date().getHours() * 60 + new Date().getMinutes();
      const allPast = salat.every((r) => parseMinutes(r.time) <= nowM);
      if (!allPast) {
        if (!cancelled) setTomorrowRows(null);
        return;
      }
      const { city, country } = await resolvePrayerScheduleLocation();
      const tm = new Date();
      tm.setDate(tm.getDate() + 1);
      tm.setHours(12, 0, 0, 0);
      const [ptRaw, shiftMin] = await Promise.all([
        fetchPrayerTimesForLocationForDate(city, country, tm),
        getDashboardPrayerShiftMin(),
      ]);
      const pt = shiftMin === 0 ? ptRaw : applyPrayerTimeShift(ptRaw, shiftMin);
      if (cancelled) return;
      if (!pt.error) setTomorrowRows(rowsFromResult(pt));
      else setTomorrowRows(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const load = useCallback(async (mode: "focus" | "full" = "full") => {
    const seq = ++prayerLoadSeqRef.current;
    const isCurrent = () => mountedRef.current && seq === prayerLoadSeqRef.current;
    const notifEn = await getNotifEnabled();
    if (!isCurrent()) return;
    setPrayerNotifEnabled(notifEn);
    const loc = await resolvePrayerScheduleLocation();
    if (!isCurrent()) return;
    const { city, country } = loc;
    setCityLabel(city);
    setCountryLabel(country);
    setWeatherCoordOverride({ lat: loc.lat, lon: loc.lon });
    const cached = await loadPrayerCache();
    if (!isCurrent()) return;

    const cacheRecent =
      cached &&
      cached.city === city &&
      cached.country === country &&
      !cached.error &&
      !Number.isNaN(Date.parse(cached.savedAt)) &&
      Date.now() - Date.parse(cached.savedAt) < 12 * 60 * 1000 &&
      isPrayerTimesResultForLocalToday(cached);

    if (mode === "focus" && cacheRecent && cached) {
      setRows(rowsFromResult(cached));
      setCityLabel(cached.city);
      setCountryLabel(cached.country);
      setWeatherCoordOverride(weatherCoordsFromPrayerResult(cached));
      setFromCache(true);
      setErr(null);
      return;
    }

    let usedCache = false;

    if (
      cached &&
      cached.city === city &&
      cached.country === country &&
      !cached.error &&
      isPrayerTimesResultForLocalToday(cached)
    ) {
      setRows(rowsFromResult(cached));
      setCityLabel(cached.city);
      setCountryLabel(cached.country);
      setWeatherCoordOverride(weatherCoordsFromPrayerResult(cached));
      setFromCache(true);
      setErr(null);
      usedCache = true;
    }

    const [freshRaw, shiftMin] = await Promise.all([
      fetchPrayerTimesForLocation(city, country, undefined, { lat: loc.lat, lon: loc.lon }),
      getDashboardPrayerShiftMin(),
    ]);
    if (!isCurrent()) return;
    const fresh = shiftMin === 0 ? freshRaw : applyPrayerTimeShift(freshRaw, shiftMin);

    if (!fresh.error) {
      setRows(rowsFromResult(fresh));
      setCityLabel(fresh.city);
      setCountryLabel(fresh.country);
      setWeatherCoordOverride(weatherCoordsFromPrayerResult(fresh));
      setFromCache(false);
      setErr(null);
      await savePrayerCache(fresh);
      const [en, iftar] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
      if (!isCurrent()) return;
      await reschedulePrayerNotifications(fresh, {
        enabled: en,
        iftarExtra: iftar,
        prayerTimesAlreadyAdjusted: true,
      });
      return;
    }

    if (usedCache) {
      setErr(fresh.error ?? null);
      return;
    }

    setErr(fresh.error ?? kk.dashboard.loadError);
    setRows([]);
    setCityLabel(city);
    setCountryLabel(country);
    setWeatherCoordOverride(null);
    setFromCache(false);
  }, []);

  useEffect(() => {
    void setOnboardingDone();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loc = await resolvePrayerScheduleLocation();
      const cached = await loadPrayerCache();
      if (cancelled) return;
      setCityLabel(loc.city);
      setCountryLabel(loc.country);
      setWeatherCoordOverride({ lat: loc.lat, lon: loc.lon });
      if (cached && cached.city === loc.city && cached.country === loc.country && !cached.error) {
        if (isPrayerTimesResultForLocalToday(cached)) {
          setRows(rowsFromResult(cached));
          setCityLabel(cached.city);
          setCountryLabel(cached.country);
          setWeatherCoordOverride(weatherCoordsFromPrayerResult(cached));
          setFromCache(true);
          setErr(null);
          /** Хабарламалар кестесін UI сызылғаннан кейін — бірінші кадрды бұғаттамау */
          runAfterInteractions(() => {
            if (cancelled) return;
            void (async () => {
              const [en, ift] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
              if (cancelled) return;
              await reschedulePrayerNotifications(cached, {
                enabled: en,
                iftarExtra: ift,
                prayerTimesAlreadyAdjusted: true,
              });
            })();
          });
        } else {
          void load("full");
        }
      } else {
        void load("full");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  /** Күн ауысып кэш ескірсе — қолданба алдыңғы табта ашық тұрса да жаңарту */
  useEffect(() => {
    const id = setInterval(() => {
      void (async () => {
        try {
          const c = await loadPrayerCache();
          if (!c || c.error) return;
          if (!isPrayerTimesResultForLocalToday(c)) {
            await load("full");
          }
        } catch {
          /* */
        }
      })();
    }, 60_000);
    return () => clearInterval(id);
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      const task = runAfterInteractions(() => {
        const now = Date.now();
        if (now - lastFocusPrayerLoadAt.current < 12_000) return;
        lastFocusPrayerLoadAt.current = now;
        void load("focus");
      });
      return () => task.cancel();
    }, [load])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") appActiveSinceRef.current = Date.now();
    });
    return () => sub.remove();
  }, []);

  /** Бастапқы беттегі Қағба/Құбыла белгісі тірі болсын, бірақ sensor тек Home/Qibla ішінде іске қосылады. */
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") return undefined;
      if (!resumeHeadingSubscription) return undefined;
      resumeHeadingSubscription();
      return undefined;
    }, [resumeHeadingSubscription])
  );

  useFocusEffect(
    useCallback(() => {
      const tick = () => {
        const now = new Date();
        let hit: Row | null = null;
        for (const r of rows) {
          if (matchesClockMinute(now, r.time)) {
            hit = r;
            break;
          }
        }
        if (!hit && tomorrowRows?.length) {
          for (const r of tomorrowRows) {
            if (matchesClockMinute(now, r.time)) {
              hit = r;
              break;
            }
          }
        }
        if (!hit) {
          if (momentBannerRef.current !== null) {
            momentBannerRef.current = null;
            setMomentBanner(null);
          }
          return;
        }
        const y = now.getFullYear();
        const mo = now.getMonth();
        const d = now.getDate();
        const h = now.getHours();
        const mi = now.getMinutes();
        const pulse = `${y}-${mo}-${d}-${hit.key}-${h}:${mi}`;
        const banner = kk.prayer.momentBanner(shortPrayerName(hit.key));
        if (momentBannerRef.current !== banner) {
          momentBannerRef.current = banner;
          setMomentBanner(banner);
        }
        /** Pulse тек fire терезесінде бекітіледі — ерте тексеру 8с терезені өткізіп алмасын. */
        if (
          momentPulseId.current !== pulse &&
          shouldFireInAppPrayerMoment(now, hit.time, appActiveSinceRef.current)
        ) {
          momentPulseId.current = pulse;
          void fireInAppPrayerAlert(hit.label, hit.time, hit.key)
            .then((fired) => {
              if (fired) {
                return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              return undefined;
            })
            .catch(() => {});
        }
      };
      tick();
      const iv = setInterval(tick, 15_000);
      return () => {
        clearInterval(iv);
        momentBannerRef.current = null;
        setMomentBanner(null);
      };
    }, [rows, tomorrowRows])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        Platform.OS === "web" ? [load("full")] : [load("full")]
      );
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [load]);

  const next = nextSalatRow(rows, tomorrowRows);
  const scrollTopPad = 0;
  const styles = useMemo(
    () => makeStyles(colors, isDark, scrollTopPad),
    [colors, isDark, scrollTopPad]
  );
  const timesPending = rows.length === 0 && err === null;
  const goQuranList = useCallback(
    () => {
      if (openWebRoute("/more/quran")) return;
      navigateToMoreStackScreen("QuranList", undefined, navigation);
    },
    [navigation]
  );
  const goNamazGuide = useCallback(
    () => {
      if (openWebRoute("/more/namaz-guide")) return;
      navigateToMoreStackScreen("NamazGuide", undefined, navigation);
    },
    [navigation]
  );
  const goKmdbHub = useCallback(
    () => {
      if (openWebRoute("/more/kmdb")) return;
      void (async () => {
        warmKmdbHubScreen();
        await awaitKmdbHubWarm(350);
        navigateToMoreStackScreen("KmdbHub", undefined, navigation);
      })();
    },
    [navigation]
  );
  const goHalal = useCallback(
    () => {
      if (openWebRoute("/more/halal")) return;
      warmHalalHubScreen();
      navigateToMoreStackScreen("Halal", { initialTab: "site" }, navigation);
    },
    [navigation]
  );
  const goDuas = useCallback(() => {
    if (openWebRoute("/duas")) return;
    navigation.navigate("Duas", { screen: "DuasHome" });
  }, [navigation]);
  const goTasbih = useCallback(() => {
    if (openWebRoute("/tasbih")) return;
    navigation.navigate("Tasbih", { screen: "TasbihList" });
  }, [navigation]);
  const goAsma = useCallback(
    () => {
      if (openWebRoute("/asma")) return;
      navigateToRootStackScreen("AsmaAlHusna", undefined, navigation);
    },
    [navigation]
  );
  const goPrayerTimes = useCallback(() => {
    if (openWebRoute("/prayer")) return;
    navigation.navigate("PrayerTab");
  }, [navigation]);
  const goKazakhTraditionBlock = useCallback(
    (scrollToBlockTitle: string) => {
      navigateToMoreStackScreen("KazakhTradition", { scrollToBlockTitle }, navigation);
    },
    [navigation]
  );
  const goTradition = useCallback(
    () => {
      if (openWebRoute("/more/tradition")) return;
      navigateToMoreStackScreen("KazakhTradition", undefined, navigation);
    },
    [navigation]
  );

  const onHomeServicePressIn = useCallback((key: DashboardHomeServiceKey) => {
    if (key === "quran") {
      void import("../screens/QuranListScreen");
      void import("../services/bundledQuranSeed").then((m) => m.scheduleBundledQuranSeed());
    } else if (key === "hadith") {
      void import("../screens/HadithHubScreen");
    } else if (key === "ai") {
      warmKmdbHubScreen();
      void awaitKmdbHubWarm(500);
    } else if (key === "halal") {
      warmHalalHubScreen();
    }
  }, []);

  const onHomeServicePress = useCallback(
    (key: DashboardHomeServiceKey) => {
      if (openWebRoute(dashboardHomeServiceWebPath(key))) return;
      switch (key) {
        case "quran":
          goQuranList();
          break;
        case "hadith":
          navigateToMoreStackScreen("HadithHub", undefined, navigation);
          break;
        case "namaz":
          goNamazGuide();
          break;
        case "tajweed":
          navigateToMoreStackScreen("TajweedGuide", undefined, navigation);
          break;
        case "duas":
          goDuas();
          break;
        case "tasbih":
          goTasbih();
          break;
        case "tradition":
          goTradition();
          break;
        case "seerah":
          navigateToMoreStackScreen("Seerah", undefined, navigation);
          break;
        case "asma":
          goAsma();
          break;
        case "hajj":
          navigateToMoreStackScreen("Hajj", undefined, navigation);
          break;
        case "ai":
          goKmdbHub();
          break;
        case "halal":
          goHalal();
          break;
        default:
          break;
      }
    },
    [
      navigation,
      goDuas,
      goTasbih,
      goNamazGuide,
      goQuranList,
      goTradition,
      goAsma,
      goKmdbHub,
      goHalal,
    ]
  );

  return (
    <>
      <View
        testID="screen-main-home"
        style={[
          styles.root,
          styles.fixedScreen,
          { paddingBottom: 0 },
        ]}
      >
        {fromCache && err ? (
          <View style={styles.cacheBanner}>
            <Text style={styles.cacheBannerTitle}>{kk.common.offlineBadge}</Text>
            <Text style={styles.cacheBannerErr}>{err}</Text>
            <Text style={styles.cacheBannerHint}>{kk.dashboard.offlineCachedTimesHint}</Text>
            <Pressable
              onPress={() => void onRefresh()}
              disabled={refreshing}
              accessibilityRole="button"
              accessibilityLabel={kk.dashboard.prayerTimesRetryA11y}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && !refreshing && styles.retryButtonPressed,
                refreshing && styles.retryButtonDisabled,
              ]}
            >
              {refreshing ? (
                <RaqatOrnamentSpinner size={22} />
              ) : (
                <Text style={styles.retryButtonLabel}>{kk.common.retry}</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {err && !fromCache ? (
          <View style={styles.errBanner}>
            <Text style={styles.err}>{err}</Text>
            <Text style={styles.cacheBannerHint}>{kk.dashboard.prayerTimesLoadFailedHint}</Text>
            <Pressable
              onPress={() => void onRefresh()}
              disabled={refreshing}
              accessibilityRole="button"
              accessibilityLabel={kk.dashboard.prayerTimesRetryA11y}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && !refreshing && styles.retryButtonPressed,
                refreshing && styles.retryButtonDisabled,
              ]}
            >
              {refreshing ? (
                <RaqatOrnamentSpinner size={22} />
              ) : (
                <Text style={styles.retryButtonLabel}>{kk.common.retry}</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        <HomeHeaderBar
          colors={colors}
          isDark={isDark}
          navigation={navigation}
          headerMetrics={headerMetrics}
          insetsRight={insets.right}
        />

        <ScreenFitScrollView
          style={styles.screenBody}
          bottom={16 + insets.bottom}
          includeHorizontalPadding={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dashboardContentColumn}>
            {dashboardFocused ? (
              <View style={styles.prayerHeroWrap}>
                <View style={styles.prayerHeroBg}>
                  <DashboardPrayerWidget
                    colors={colors}
                    isDark={isDark}
                    rows={rows}
                    tomorrowRows={tomorrowRows}
                    next={next}
                    pending={timesPending}
                    momentBanner={momentBanner}
                    cityLabel={cityLabel}
                    weatherSnap={weatherSnap}
                    weatherLoading={weatherLoading}
                    weatherUnavailable={!weatherCoords}
                    onPressQibla={qiblaEnabled ? () => navigation.navigate("Qibla") : undefined}
                    onPressLocationSettings={() => navigateToPrayerSettings(navigation)}
                    homeMockup
                    onPress={goPrayerTimes}
                  />
                </View>
              </View>
            ) : null}

            {dashboardFocused ? (
              <DashboardQaumDuaBanner
                colors={colors}
                isDark={isDark}
                onOpenList={() => {
                  if (openWebRoute("/more/community-dua")) return;
                  navigateToMoreStackScreen("CommunityDua", undefined, navigation);
                }}
              />
            ) : null}

            {dashboardFocused ? (
              <DashboardHomeServicesGrid
                colors={colors}
                isDark={isDark}
                onPress={onHomeServicePress}
                onPressIn={onHomeServicePressIn}
              />
            ) : null}
          </View>
        </ScreenFitScrollView>
      </View>
    </>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean, scrollTopPad: number) {
  const cardBorder = isDark ? "rgba(34, 197, 94, 0.32)" : colors.border;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    fixedScreen: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 12,
      paddingTop: scrollTopPad,
    },
    screenBody: {
      flex: 1,
      minHeight: 0,
    },
    dashboardContentColumn: {
      width: "100%",
      maxWidth: 520,
      alignSelf: "center",
    },
    launcherShellClosed: {
      flexShrink: 0,
      width: "100%",
    },
    launcherShellOpen: {
      flex: 1,
      minHeight: 0,
      width: "100%",
    },
    /** Намаз hero: бұрынғы үй батырмасы қатынасы (~2.5:1 — ені кең, биіктігі ықшам) */
    prayerHeroWrap: {
      marginTop: 0,
      marginBottom: 4,
      borderRadius: 18,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
        },
        android: {},
        default: {},
      }),
    },
    prayerHeroWrapLauncherOpen: {
      marginBottom: 4,
    },
    prayerHeroBg: {
      width: "100%",
      /** Скриншоттағы үй намаз батырмасы: ені/биіктігі ≈ 5:2 */
      aspectRatio: 5 / 2,
      justifyContent: "flex-end",
      backgroundColor: isDark ? "#0a1520" : "#1E3A55",
      borderRadius: 18,
      overflow: "hidden",
    },
    prayerHeroMorningGlow: {
      position: "absolute",
      top: -70,
      right: -58,
      width: 170,
      height: 170,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(251, 191, 36, 0.12)" : "rgba(255, 255, 255, 0.30)",
    },
    launcherPrayerHeaderBg: {
      width: "100%",
      borderRadius: 12,
      overflow: "hidden",
    },
    /** Халал + AI промо (Құрбан айт — төмендегі тордан кейін) */
    promoStack: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: 8,
      marginTop: 6,
      marginBottom: 6,
    },
    promoUnifiedCard: {
      flexDirection: "column",
      alignItems: "stretch",
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: "hidden",
    },
    promoUnifiedSplitRow: {
      flexDirection: "row",
      alignItems: "stretch",
      minHeight: 108,
    },
    promoUnifiedDivider: {
      width: StyleSheet.hairlineWidth * 2,
      minWidth: 1,
      alignSelf: "stretch",
      backgroundColor: cardBorder,
    },
    cardPress: {
      opacity: 0.92,
      transform: [{ scale: 0.985 }],
    },
    cardPressStrong: {
      opacity: 0.94,
      transform: [{ scale: 0.992 }],
    },
    cacheBanner: {
      marginBottom: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: "hidden",
    },
    cacheBannerTitle: {
      color: colors.accent,
      ...uiFontStyle("semibold"),
      ...typography.base,
      marginBottom: 6,
    },
    cacheBannerErr: {
      color: colors.error,
      ...typography.sm,
      marginBottom: 8,
    },
    cacheBannerHint: {
      color: colors.muted,
      ...typography.xs,
      marginBottom: 6,
    },
    errBanner: {
      marginBottom: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(239, 68, 68, 0.35)" : "rgba(239, 68, 68, 0.28)",
    },
    retryButton: {
      marginTop: 4,
      alignSelf: "flex-start",
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: colors.accentSurfaceStrong,
    },
    retryButtonPressed: {
      opacity: 0.88,
    },
    retryButtonDisabled: {
      opacity: 0.65,
    },
    retryButtonLabel: {
      color: colors.accent,
      ...uiFontStyle("semibold"),
      ...typography.base,
    },
    heroPromoCard: {
      flex: 1,
      minWidth: 0,
      minHeight: 92,
      flexDirection: "column",
      alignItems: "stretch",
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: "hidden",
    },
    /** Халал промо: сурет солда, ХАЛАЛ ДАМУ оңда */
    heroPromoHalalRow: {
      flexDirection: "row",
      alignItems: "stretch",
      flex: 1,
      minHeight: 92,
    },
    heroPromoHalalImageCol: {
      width: "42%",
      maxWidth: 118,
      minWidth: 78,
      flexShrink: 0,
      height: 92,
      backgroundColor: "transparent",
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
      position: "relative",
    },
    heroPromoHalalImg: {
      width: "100%",
      height: "100%",
    },
    heroPromoHalalTextCol: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      paddingVertical: 8,
      paddingLeft: 4,
      paddingRight: 10,
    },
    /** Сол бағана: сурет толық көрінсін (вебте absoluteFill биіктігі 0 болмауы үшін height бекітілген) */
    heroPromoImageCol: {
      flexShrink: 0,
      alignSelf: "stretch",
      minHeight: 84,
      height: 84,
      backgroundColor: colors.card,
      borderTopLeftRadius: 18,
      borderBottomLeftRadius: 18,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    heroPromoImage: {
      height: 84,
    },
    heroPromoTextCol: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      paddingVertical: 6,
      paddingLeft: 8,
      paddingRight: 10,
    },
    heroPromoHeadlineHalal: {
      color: colors.text,
      fontSize: 21,
      fontWeight: "900",
      letterSpacing: 0.35,
      lineHeight: 24,
      ...Platform.select({
        ios: {
          textShadowColor: isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.2)",
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 1.2,
        },
        android: {
          fontFamily: BRAND_FONT_FACE.extrabold,
        },
        default: {},
      }),
    },
    heroPromoSublineHalal: {
      marginTop: 2,
      color: colors.text,
      opacity: 0.84,
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.25,
      lineHeight: 17,
    },
    err: { color: colors.error, marginBottom: 6, ...typography.sm },
    serviceGridWrap: {
      width: "100%",
      gap: 8,
      marginTop: 10,
      padding: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
    },
  });
}
