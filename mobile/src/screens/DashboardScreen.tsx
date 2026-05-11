import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  InteractionManager,
  Image,
  ImageBackground,
  useWindowDimensions,
  type ImageResizeMode,
  type ImageSourcePropType,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppIconBadge } from "../components/AppIconBadge";
import type { MciName } from "../theme/appIcons";
import { menuIconAssets } from "../theme/menuIconAssets";
import { CommonActions, useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  fetchPrayerTimesForLocation,
  fetchPrayerTimesForLocationForDate,
  type PrayerTimesResult,
} from "../api/prayerTimes";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { getOnboardingDone, getSelectedCity, getNotifEnabled, getIftarEnabled } from "../storage/prefs";
import { OnboardingModal } from "../components/OnboardingModal";
import { loadPrayerCache, savePrayerCache } from "../storage/prayerCache";
import { formatRelativePastKk } from "../utils/formatRelativePastKk";
import { VoiceAssistantHeaderButton } from "../components/voice/VoiceAssistantHeaderButton";
import { reschedulePrayerNotifications } from "../services/prayerNotifications";
import { fireInAppPrayerAlert } from "../services/prayerNotifications";
import type { ThemeColors } from "../theme/colors";
import type { HomeTabCompositeNavigation } from "../navigation/types";
import { shortPrayerName } from "../components/CompactPrayerTimesRow";
import { nextSalatRow, parseMinutes } from "../utils/prayerSchedule";
import { DashboardPrayerWidget } from "../components/DashboardPrayerWidget";
import { TiltParallaxImage } from "../components/TiltParallaxImage";
import { QiblaArrowPointer } from "../components/QiblaArrowPointer";
import { useQiblaMotion, useQiblaStable } from "../context/QiblaSensorContext";
import { qiblaAlignHint } from "../lib/qiblaHints";
import { PRAYER_TIMES_HERO_BG } from "../config/dashboardPrayerHero";
import { getKzPresetCoords } from "../constants/kzCities";
/**
 * Тор + бүйір карточкалары: терезе еніне қарай максималды растр (тайл мен қақпа арасында шықпау).
 * Тор ені ≈ 31% − padding; қақпа бағанасы = сол растр ені.
 */
function dashboardRasterBoxPx(windowWidth: number, windowHeight?: number): number {
  const content = Math.max(200, windowWidth - 32);
  const gridCap = Math.floor(content * 0.31 - 12);
  const heroCap = Math.floor((content - 22) / 3);
  let box = Math.min(47, Math.max(26, Math.min(gridCap, heroCap)));
  if (windowHeight != null && windowHeight < 720) {
    box = Math.min(box, 34);
  }
  if (windowHeight != null && windowHeight < 640) {
    box = Math.min(box, 28);
  }
  return box;
}

type Row = { key: string; label: string; time: string };

function matchesClockMinute(now: Date, timeStr: string): boolean {
  if (!timeStr?.trim()) return false;
  const target = parseMinutes(timeStr);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur === target;
}

function rowsFromResult(d: PrayerTimesResult): Row[] {
  return [
    { key: "fajr", label: kk.prayer.fajr, time: d.fajr },
    { key: "sun", label: kk.prayer.sunrise, time: d.sunrise },
    { key: "dhuhr", label: kk.prayer.dhuhr, time: d.dhuhr },
    { key: "asr", label: kk.prayer.asr, time: d.asr },
    { key: "maghrib", label: kk.prayer.maghrib, time: d.maghrib },
    { key: "isha", label: kk.prayer.isha, time: d.isha },
  ];
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

function HomeHeaderLeft({
  navigation,
  colors,
}: {
  navigation: HomeTabCompositeNavigation;
  colors: ThemeColors;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        minWidth: 0,
        minHeight: 42,
        gap: 6,
        justifyContent: "flex-start",
      }}
    >
      <View
        style={{
          minWidth: 0,
          marginLeft: 0,
          marginRight: 6,
          alignItems: "flex-start",
          flex: 1,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "900",
            letterSpacing: 0.5,
            color: colors.text,
            textAlign: "left",
          }}
          accessibilityRole="header"
          numberOfLines={1}
        >
          {kk.dashboard.brandTitle}
        </Text>
      </View>
    </View>
  );
}

function HomeHeaderCenter({
  navigation,
  colors,
}: {
  navigation: HomeTabCompositeNavigation;
  colors: ThemeColors;
}) {
  const insets = useSafeAreaInsets();
  const { bearing, refreshBearing } = useQiblaStable();
  const { rotateDeg, headingHasSample } = useQiblaMotion();
  const bearingReady = bearing != null;
  const motionReady = bearingReady && headingHasSample;
  const qiblaAligned =
    motionReady && qiblaAlignHint(rotateDeg, bearing, { headingReady: true }) === "aligned";

  /**
   * Құбыла: RAQAT / баптаулар қатарымен визуалды теңестіру — notch үшін жоғары тартуды азайтып, сәл төмен орналастырамыз.
   */
  const ringOuter = 52;
  const compassBox = 40;
  const pointerSize = 36;
  const islandNudge =
    Platform.OS === "ios"
      ? Math.min(7, Math.max(0, insets.top - 46) * 0.42)
      : Math.min(5, Math.max(0, insets.top - 26) * 0.22);
  /** Төменге түсіру: бұрынғы теріс margin орнына жеңіл теңестіру */
  const headerQiblaDownNudge = Math.round(4 + islandNudge * 0.25);

  return (
    <View
      style={{
        position: "absolute",
        left: "50%",
        marginLeft: -ringOuter / 2,
        width: ringOuter,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: ringOuter,
          height: ringOuter,
          marginTop: headerQiblaDownNudge,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={() => navigation.navigate("Qibla")}
          onLongPress={() => void refreshBearing()}
          style={{
            width: compassBox + 8,
            height: compassBox + 8,
            borderRadius: (compassBox + 8) / 2,
            backgroundColor: qiblaAligned
              ? "rgba(52, 211, 153, 0.42)"
              : bearingReady
                ? `${colors.success}28`
                : colors.accentSurfaceStrong,
            borderWidth: qiblaAligned ? 2.5 : 1.5,
            borderColor: qiblaAligned
              ? "rgba(52, 251, 153, 0.95)"
              : `${colors.accent}55`,
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            ...Platform.select({
              ios: qiblaAligned
                ? {
                    shadowColor: "#34F3A6",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.95,
                    shadowRadius: 14,
                  }
                : {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.12,
                    shadowRadius: 2,
                  },
              android: { elevation: qiblaAligned ? 10 : 2 },
              default: {},
            }),
          }}
          accessibilityRole="button"
          accessibilityLabel={kk.tabs.qibla}
        >
          <View style={{ opacity: motionReady ? 1 : 0.85 }} pointerEvents="none">
            <QiblaArrowPointer
              colors={colors}
              size={pointerSize}
              rotateDeg={rotateDeg}
              aligned={qiblaAligned}
              showDialRing={false}
              showDialHalo
              showTopMarker={false}
              needlePulse={false}
              showPivotHub={false}
              minimalDial
              centerOyuMedallion={false}
              ornamentNeedle={false}
              showAlignLed
              showAlignLedInMinimal
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function HomeHeaderRight({
  navigation,
  colors,
}: {
  navigation: HomeTabCompositeNavigation;
  colors: ThemeColors;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        marginRight: -2,
      }}
    >
      <VoiceAssistantHeaderButton />
      <Pressable
        onPress={() =>
          navigation.dispatch(
            CommonActions.navigate({
              name: "MoreStack",
              params: { screen: "Settings" },
            })
          )
        }
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.accentSurfaceStrong,
          alignItems: "center",
          justifyContent: "center",
        }}
        accessibilityRole="button"
        accessibilityLabel={kk.settings.headerSettingsA11y}
      >
        <MaterialIcons name="settings" size={22} color={colors.accent} />
      </Pressable>
    </View>
  );
}

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const rasterBox = dashboardRasterBoxPx(windowWidth, windowHeight);
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation<HomeTabCompositeNavigation>();
  const tabFocused = useIsFocused();
  const { refreshBearing, resumeHeadingSubscription } = useQiblaStable();
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  /** Бүгінгі парыздар өткен соң келесі таң/күн — «келесі намаз» сағатын дұрыс көрсету */
  const [tomorrowRows, setTomorrowRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  /** Намаз кэшінің `savedAt` (ISO) — сақталған уақытты көрсету үшін */
  const [prayerCacheSavedAt, setPrayerCacheSavedAt] = useState<string | null>(null);
  const [cityLabel, setCityLabel] = useState("");
  const prayerWeatherCoords = useMemo(
    () => getKzPresetCoords(cityLabel.trim(), "Kazakhstan"),
    [cityLabel]
  );
  const [prayerNotifEnabled, setPrayerNotifEnabled] = useState(true);
  /** Намаз минуты кіргенде (экран ашық) — қысқа баннер */
  const [momentBanner, setMomentBanner] = useState<string | null>(null);
  const momentPulseId = useRef<string>("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  /** Фокустағы уақыт жүктемесін шектеу — таб ауыстырып қайта кіргенде қатып қалмасын */
  const lastFocusPrayerLoadAt = useRef(0);
  /** Тор тайлдарының артқы дақы — бұрынғы көк-жасылдан сәл жұмсақ */
  const accentSoft = colors.accentSurface;
  useLayoutEffect(() => {
    const headerH =
      Platform.OS === "ios"
        ? insets.top + 44
        : (StatusBar.currentHeight ?? 0) + 48;
    /** Бір желілі тайтл — жоғары панель биіктігі */
    const headerVertPad = Platform.OS === "ios" ? 4 : 2;
    navigation.setOptions({
      headerTitleAlign: "center",
      headerTitleContainerStyle: {
        position: "absolute",
        left: 0,
        right: 0,
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "box-none",
        overflow: "visible",
      },
      headerTitle: () => <HomeHeaderCenter navigation={navigation} colors={colors} />,
      headerLeftContainerStyle: {
        paddingLeft: 0,
        marginLeft: 0,
        marginTop: 0,
        paddingTop: headerVertPad,
        paddingBottom: 0,
        alignItems: "flex-start" as const,
        justifyContent: "center" as const,
        alignSelf: "stretch" as const,
        flexGrow: 1,
        flexShrink: 1,
        maxWidth: "100%",
      },
      headerStyle: {
        backgroundColor: colors.bg,
        height: headerH,
      },
      headerRightContainerStyle: {
        paddingRight: 0,
        marginRight: 0,
        alignItems: "flex-end" as const,
        justifyContent: "center" as const,
        flexGrow: 0,
      },
      headerRight: () => <HomeHeaderRight navigation={navigation} colors={colors} />,
      headerLeft: () => <HomeHeaderLeft navigation={navigation} colors={colors} />,
    });
  }, [
    navigation,
    colors.text,
    colors.bg,
    colors.accent,
    colors.accentSurfaceStrong,
    colors.success,
    insets.top,
  ]);

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
      const { city, country } = await getSelectedCity();
      const tm = new Date();
      tm.setDate(tm.getDate() + 1);
      tm.setHours(12, 0, 0, 0);
      const pt = await fetchPrayerTimesForLocationForDate(city, country, tm, 3);
      if (cancelled) return;
      if (!pt.error) setTomorrowRows(rowsFromResult(pt));
      else setTomorrowRows(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows]);

  const load = useCallback(async (mode: "focus" | "full" = "full") => {
    const notifEn = await getNotifEnabled();
    setPrayerNotifEnabled(notifEn);
    const { city, country } = await getSelectedCity();
    const cached = await loadPrayerCache();

    const cacheRecent =
      cached &&
      cached.city === city &&
      cached.country === country &&
      !cached.error &&
      !Number.isNaN(Date.parse(cached.savedAt)) &&
      Date.now() - Date.parse(cached.savedAt) < 12 * 60 * 1000;

    if (mode === "focus" && cacheRecent && cached) {
      setRows(rowsFromResult(cached));
      setCityLabel(cached.city);
      setFromCache(true);
      setPrayerCacheSavedAt(cached.savedAt);
      setErr(null);
      return;
    }

    let usedCache = false;

    if (
      cached &&
      cached.city === city &&
      cached.country === country &&
      !cached.error
    ) {
      setRows(rowsFromResult(cached));
      setCityLabel(cached.city);
      setFromCache(true);
      setPrayerCacheSavedAt(cached.savedAt);
      setErr(null);
      usedCache = true;
    }

    const fresh = await fetchPrayerTimesForLocation(city, country, 3);

    if (!fresh.error) {
      setRows(rowsFromResult(fresh));
      setCityLabel(fresh.city);
      setFromCache(false);
      setPrayerCacheSavedAt(null);
      setErr(null);
      await savePrayerCache(fresh);
      const [en, iftar] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
      await reschedulePrayerNotifications(fresh, {
        enabled: en,
        iftarExtra: iftar,
      });
      return;
    }

    if (usedCache) {
      setErr(fresh.error ?? null);
      return;
    }

    setErr(fresh.error ?? kk.dashboard.loadError);
    setRows([]);
    setFromCache(false);
    setPrayerCacheSavedAt(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const done = await getOnboardingDone();
      if (!cancelled && !done) setShowOnboarding(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { city, country } = await getSelectedCity();
      const cached = await loadPrayerCache();
      if (cancelled) return;
      if (cached && cached.city === city && cached.country === country && !cached.error) {
        setRows(rowsFromResult(cached));
        setCityLabel(cached.city);
        setFromCache(true);
        setPrayerCacheSavedAt(cached.savedAt);
        setErr(null);
        /** Хабарламалар кестесін UI сызылғаннан кейін — бірінші кадрды бұғаттамау */
        InteractionManager.runAfterInteractions(() => {
          if (cancelled) return;
          void (async () => {
            const [en, ift] = await Promise.all([getNotifEnabled(), getIftarEnabled()]);
            if (cancelled) return;
            await reschedulePrayerNotifications(cached, { enabled: en, iftarExtra: ift });
          })();
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        const now = Date.now();
        if (now - lastFocusPrayerLoadAt.current < 12_000) return;
        lastFocusPrayerLoadAt.current = now;
        void load("focus");
      });
      return () => task.cancel();
    }, [load])
  );

  /** Дұға/тәспі табынан қайтқанда немесе Баптаулардан қаладан кейін: сенсор жазылымы + құбыла бұрышы жаңарсын */
  useFocusEffect(
    useCallback(() => {
      resumeHeadingSubscription();
      void refreshBearing();
    }, [refreshBearing, resumeHeadingSubscription])
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
          setMomentBanner(null);
          return;
        }
        const y = now.getFullYear();
        const mo = now.getMonth();
        const d = now.getDate();
        const h = now.getHours();
        const mi = now.getMinutes();
        const pulse = `${y}-${mo}-${d}-${hit.key}-${h}:${mi}`;
        setMomentBanner(kk.prayer.momentBanner(shortPrayerName(hit.key)));
        if (momentPulseId.current !== pulse) {
          momentPulseId.current = pulse;
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          void fireInAppPrayerAlert(hit.label, hit.time).catch(() => {});
        }
      };
      tick();
      const iv = setInterval(tick, 12_000);
      return () => {
        clearInterval(iv);
        setMomentBanner(null);
      };
    }, [rows, tomorrowRows])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([load("full"), refreshBearing()]);
    } finally {
      setRefreshing(false);
    }
  }, [load, refreshBearing]);

  const next = nextSalatRow(rows, tomorrowRows);
  const styles = makeStyles(colors, isDark);
  const timesPending = rows.length === 0 && err === null;
  /** Промо (Халал / AI): сол сурет ені — жиекке дейін толтыру үшін бекітілген бағана */
  const promoImageColW = Math.min(108, Math.max(76, Math.round(windowWidth * 0.24)));
  const goQuranList = () => navigation.navigate("MoreStack", { screen: "QuranList" });
  const goMoreStackScreen = (screen: "Halal" | "ImamAI") =>
    navigation.dispatch(
      CommonActions.navigate({
        name: "MoreStack",
        params: { screen },
        merge: true,
      })
    );
  const goAi = () => goMoreStackScreen("ImamAI");
  const goHalal = () => goMoreStackScreen("Halal");
  const goDuas = () => navigation.navigate("Duas", { screen: "DuasHome" });
  const goTasbih = () => navigation.navigate("Tasbih", { screen: "TasbihList" });
  const goAsma = () => navigation.navigate("AsmaAlHusna");
  const goTradition = () => navigation.navigate("MoreStack", { screen: "KazakhTradition" });

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(24, insets.bottom + 32) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.accent}
            colors={Platform.OS === "android" ? [colors.accent] : undefined}
          />
        }
      >
        {fromCache && err ? (
          <View style={styles.cacheBanner}>
            <Text style={styles.cacheBannerTitle}>{kk.common.offlineBadge}</Text>
            {prayerCacheSavedAt ? (
              <Text style={styles.cacheBannerMeta}>
                {kk.dashboard.cacheSavedLabel(formatRelativePastKk(prayerCacheSavedAt))}
              </Text>
            ) : null}
            <Text style={styles.cacheBannerErr}>{err}</Text>
            <Text style={styles.cacheBannerHint}>{kk.dashboard.offlineCachedTimesHint}</Text>
            <Text style={styles.cacheBannerHint}>{kk.dashboard.pullToRefreshHint}</Text>
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
                <ActivityIndicator size="small" color={colors.accent} />
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
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={styles.retryButtonLabel}>{kk.common.retry}</Text>
              )}
            </Pressable>
          </View>
        ) : null}

        {fromCache && !err && prayerCacheSavedAt && rows.length > 0 ? (
          <Text style={styles.cacheFootnote}>
            {kk.dashboard.cacheSavedLabel(formatRelativePastKk(prayerCacheSavedAt))}
          </Text>
        ) : null}

        <Pressable
          onPress={() => navigation.navigate("PrayerTimes")}
          accessibilityRole="button"
          accessibilityLabel={kk.dashboard.openPrayerDetailA11y}
          style={({ pressed }) => [styles.prayerHeroPress, pressed && { opacity: 0.97 }]}
        >
          <ImageBackground
            source={PRAYER_TIMES_HERO_BG}
            style={styles.prayerHeroBg}
            imageStyle={styles.prayerHeroBgImage}
            resizeMode="cover"
          >
            <DashboardPrayerWidget
              colors={colors}
              isDark={isDark}
              rows={rows}
              tomorrowRows={tomorrowRows}
              next={next}
              pending={timesPending}
              momentBanner={momentBanner}
              cityLabel={cityLabel}
              weatherCoords={prayerWeatherCoords}
              prayerNotifEnabled={prayerNotifEnabled}
              compact
            />
          </ImageBackground>
        </Pressable>

        <View style={styles.promoRow}>
          <Pressable
            style={({ pressed }) => [
              styles.heroPromoCard,
              cardShadow(isDark),
              pressed && styles.cardPress,
            ]}
            onPress={goHalal}
            accessibilityRole="button"
            accessibilityLabel={kk.features.halalTitle}
          >
            <View style={[styles.heroPromoImageCol, { width: promoImageColW }]}>
              <Image
                source={menuIconAssets.tileHalal}
                style={[styles.heroPromoImage, { width: promoImageColW }, styles.heroPromoImageLight]}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <View style={styles.heroPromoImageOverlay} pointerEvents="none" />
            </View>
            <View style={styles.heroPromoTextCol}>
              <Text style={styles.heroPromoHeadlineHalal} numberOfLines={1} adjustsFontSizeToFit>
                {kk.dashboard.promoHalalHeadline}
              </Text>
              <Text style={styles.heroPromoSublineHalal} numberOfLines={1}>
                {kk.dashboard.promoHalalSubline}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.heroPromoCard,
              cardShadow(isDark),
              pressed && styles.cardPress,
            ]}
            onPress={goAi}
            accessibilityRole="button"
            accessibilityLabel={kk.dashboard.aiRowTitle}
          >
            <View style={[styles.heroPromoImageCol, { width: promoImageColW }]}>
              <Image
                source={menuIconAssets.promoAi}
                style={[styles.heroPromoImage, { width: promoImageColW }, styles.heroPromoImageLight]}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
              <View style={styles.heroPromoImageOverlay} pointerEvents="none" />
            </View>
            <View style={[styles.heroPromoTextCol, styles.heroPromoTextColAi]}>
              <Text style={styles.heroPromoHeadlineAi} numberOfLines={1} adjustsFontSizeToFit>
                {kk.dashboard.promoAiHeadline}
              </Text>
              <Text style={styles.heroPromoSublineAi} numberOfLines={1}>
                {kk.dashboard.promoAiSubline}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.serviceGridWrap}>
          {/** Үстіңгі қатар: Құран — Намаз — Дәстір */}
          <View style={styles.serviceRow3}>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.heroQuran}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={rasterBox}
                label={kk.dashboard.heroQuranTitle}
                subLabel={kk.dashboard.quranCardSub}
                onPress={goQuranList}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                hideTitles
                mediaImageAspectRatio={1.08}
                imageScale={1.18}
              />
            </View>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.tileNamaz}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={rasterBox}
                label={kk.namazGuide.shortTitle}
                subLabel={kk.dashboard.namazCardSub}
                onPress={() => navigation.navigate("MoreStack", { screen: "NamazGuide" })}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                tiltParallax={tabFocused}
                hideTitles
                mediaImageAspectRatio={1.06}
                imageScale={1.28}
              />
            </View>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.tileDinTradition}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={rasterBox}
                label={kk.dashboard.traditionTileShort}
                subLabel={kk.dashboard.traditionTileSub}
                onPress={goTradition}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                hideTitles
                mediaImageAspectRatio={1.1}
                imageScale={1.04}
              />
            </View>
          </View>
          {/** Ортаңғы қатар: Сира — Тәжуид — Қажылық */}
          <View style={styles.serviceRow3}>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.tileSeerah}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={rasterBox}
                label={kk.dashboard.tileSeerah}
                subLabel={kk.dashboard.seerahCardSub}
                onPress={() => navigation.navigate("MoreStack", { screen: "Seerah" })}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                hideTitles
                mediaImageAspectRatio={1.02}
                imageScale={1.06}
              />
            </View>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.tileTajweed}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={rasterBox}
                label={kk.dashboard.arabicLettersTile}
                subLabel={kk.dashboard.tajweedCardSub}
                onPress={() => navigation.navigate("MoreStack", { screen: "TajweedGuide" })}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                hideTitles
                mediaImageAspectRatio={1}
                imageScale={1.28}
                imageTranslateY={7}
              />
            </View>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.tileHajj}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={rasterBox}
                label={kk.features.hajjTitle}
                subLabel={kk.dashboard.hajjCardSub}
                onPress={() => navigation.navigate("MoreStack", { screen: "Hajj" })}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                hideTitles
                mediaImageAspectRatio={1.03}
                imageScale={1.02}
              />
            </View>
          </View>
          {/** Ең төменгі қатар: Дұға — 99 есім — Тәспі */}
          <View style={styles.serviceRow3}>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.tabDuas}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={rasterBox}
                label={kk.dashboard.duasShort}
                subLabel={kk.dashboard.heroDuaSub}
                onPress={goDuas}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                hideTitles
                mediaImageAspectRatio={1.02}
                imageScale={1.05}
              />
            </View>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.tabAsma}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={rasterBox}
                label={kk.tabs.asma}
                subLabel={kk.tabs.asmaSub}
                onPress={goAsma}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                hideTitles
                mediaImageAspectRatio={1.06}
                imageScale={1.07}
              />
            </View>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.tabTasbih}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={rasterBox}
                label={kk.tabs.tasbih}
                onPress={goTasbih}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                hideTitles
                mediaImageAspectRatio={1}
                imageResizeMode="contain"
              />
            </View>
          </View>
        </View>
      </ScrollView>
      <OnboardingModal
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </>
  );
}

function Tile({
  emoji,
  glyph,
  iconName,
  iconImage,
  iconColor,
  colors,
  rasterBox,
  label,
  subLabel,
  onPress,
  styles,
  accentSoft,
  imageEdgeToEdge,
  imageLighten,
  imageScale,
  imageTranslateY,
  imageResizeMode,
  mediaImageAspectRatio,
  hideTitles,
  tiltParallax,
}: {
  emoji?: string;
  glyph?: React.ReactNode;
  iconName?: MciName;
  iconImage?: ImageSourcePropType;
  iconColor?: string;
  colors: ThemeColors;
  rasterBox: number;
  label: string;
  /** Скриннот: кішіп субтитр */
  subLabel?: string;
  onPress: () => void;
  styles: Record<string, object>;
  accentSoft: string;
  /** Суретті тайл қоршауына дейін үлкейту (қажылық / сира / тәжуид) */
  imageEdgeToEdge?: boolean;
  /** Тор тайлдарында негізгі тақырып пен субтитрді көрсетпеу (доступтілік үшін label сақталады) */
  hideTitles?: boolean;
  /** Беткі суретті ашығырақ ету үшін ақ қабат (0..1) */
  imageLighten?: number;
  /** Тек imageEdgeToEdge: суретті масштабтау (әдепкі — толық толтыру; керек болса ғана беріңіз) */
  imageScale?: number;
  /** Тек imageEdgeToEdge: суретті тігінен жылжыту (px) */
  imageTranslateY?: number;
  /** Тек imageEdgeToEdge: әдепкі cover; contain — кесілмей толық сурет (мысалы зікір тайлы) */
  imageResizeMode?: ImageResizeMode;
  /** Сурет қабатының ені/биіктігі (үлкенірек = қысқарақ биіктік). Әдепкі 1.07 */
  mediaImageAspectRatio?: number;
  /** true: суретті құрылғы еңкейтуімен жеңіл 3D-параллакс (тек imageEdgeToEdge) */
  tiltParallax?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        styles.serviceTile3,
        imageEdgeToEdge && styles.tileMedia,
        imageEdgeToEdge && styles.tileMediaOuter,
        pressed && styles.tilePress,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={subLabel && hideTitles ? `${label}. ${subLabel}` : label}
    >
      {iconImage && imageEdgeToEdge ? (
        <View style={styles.tileMediaColumn}>
          <View
            style={[
              styles.tileMediaImageWrap,
              { aspectRatio: mediaImageAspectRatio ?? 1.07, backgroundColor: colors.card },
              hideTitles ? { borderBottomLeftRadius: 12, borderBottomRightRadius: 12 } : null,
            ]}
          >
            {tiltParallax ? (
              <TiltParallaxImage
                source={iconImage}
                trackingActive={tiltParallax}
                resizeMode={imageResizeMode ?? "cover"}
                imageStyle={[
                  styles.tileMediaImage,
                  (() => {
                    const t: { scale?: number; translateY?: number }[] = [];
                    if (typeof imageScale === "number") t.push({ scale: imageScale });
                    if (typeof imageTranslateY === "number") t.push({ translateY: imageTranslateY });
                    return t.length ? { transform: t } : null;
                  })(),
                ]}
              />
            ) : (
              <Image
                source={iconImage}
                style={[
                  styles.tileMediaImage,
                  (() => {
                    const t: { scale?: number; translateY?: number }[] = [];
                    if (typeof imageScale === "number") t.push({ scale: imageScale });
                    if (typeof imageTranslateY === "number") t.push({ translateY: imageTranslateY });
                    return t.length ? { transform: t } : null;
                  })(),
                ]}
                resizeMode={imageResizeMode ?? "cover"}
                accessibilityIgnoresInvertColors
              />
            )}
            {typeof imageLighten === "number" && imageLighten > 0 ? (
              <View style={[styles.tileMediaLight, { opacity: Math.min(0.45, Math.max(0, imageLighten)) }]} />
            ) : null}
          </View>
          {hideTitles ? null : (
            <>
              <View style={styles.tileMediaSpacer} />
              <Text style={[styles.quickLabel, styles.quickLabelMedia]} numberOfLines={1}>
                {label}
              </Text>
              {subLabel ? (
                <Text style={[styles.tileSub, { color: colors.muted }]} numberOfLines={1}>
                  {subLabel}
                </Text>
              ) : null}
            </>
          )}
        </View>
      ) : iconImage ? (
        <AppIconBadge
          imageSource={iconImage}
          colors={colors}
          tintBg={accentSoft}
          iconColor={iconColor}
          imageOpacity={0.82}
          size="lg"
          boxPx={rasterBox}
          border={false}
          shape="circle"
          plain
        />
      ) : iconName ? (
        <AppIconBadge
          name={iconName}
          colors={colors}
          tintBg={accentSoft}
          iconColor={iconColor}
          size="lg"
          boxPx={rasterBox}
          border={false}
          shape="circle"
          plain
        />
      ) : glyph != null ? (
        <View style={[styles.tileIcon, { backgroundColor: accentSoft }]}>{glyph}</View>
      ) : (
        <View style={[styles.tileIcon, { backgroundColor: accentSoft }]}>
          <Text style={styles.tileEmoji}>{emoji ?? ""}</Text>
        </View>
      )}
      {!imageEdgeToEdge || !iconImage ? (
        hideTitles ? null : (
          <>
            <Text style={styles.quickLabel} numberOfLines={1}>
              {label}
            </Text>
            {subLabel ? (
              <Text style={[styles.tileSub, { color: colors.muted }]} numberOfLines={1}>
                {subLabel}
              </Text>
            ) : null}
          </>
        )
      ) : null}
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const cardBorder = isDark ? "rgba(34, 197, 94, 0.16)" : colors.border;
  const ornamentBorder = isDark ? "rgba(124,58,10,0.38)" : "rgba(124,58,10,0.28)";
  const ornamentSurface = isDark ? "rgba(124,58,10,0.12)" : "rgba(124,58,10,0.06)";
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 8,
      /** Төменгі шегініс — ScrollView contentContainerStyle ішінде insets.bottom қосылады */
      paddingBottom: 0,
    },
    /** Намаз карточкасы: артқы сурет + glass (сурет: assets/dashboard/prayer_times_hero.png) */
    prayerHeroPress: {
      marginBottom: 10,
      borderRadius: 22,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
        },
        android: { elevation: 8 },
        default: {},
      }),
    },
    prayerHeroBg: {
      width: "100%",
      minHeight: 212,
    },
    prayerHeroBgImage: {
      borderRadius: 22,
    },
    /** Халал + Рақат AI: бір қатарда екі промо карточка */
    promoRow: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: 8,
      marginTop: 6,
      marginBottom: 6,
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
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 6,
    },
    cacheBannerMeta: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 6,
    },
    cacheBannerErr: {
      color: colors.error,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 8,
    },
    cacheFootnote: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
      marginBottom: 6,
      marginTop: -2,
      paddingHorizontal: 2,
    },
    cacheBannerHint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
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
      fontSize: 15,
      fontWeight: "800",
    },
    heroPromoCard: {
      flex: 1,
      minWidth: 0,
      minHeight: 84,
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: colors.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: "hidden",
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
    heroPromoImageLight: {
      opacity: 0.9,
    },
    heroPromoImageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#FFFFFF",
      opacity: 0.12,
    },
    heroPromoTextCol: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      paddingVertical: 6,
      paddingLeft: 8,
      paddingRight: 10,
    },
    /** AI промо: мәтінді робот суретіне сәл жақындату */
    heroPromoTextColAi: {
      paddingLeft: 3,
      paddingRight: 8,
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
          fontFamily: "sans-serif-black",
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
    heroPromoHeadlineAi: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "900",
      letterSpacing: 0.35,
      lineHeight: 17,
    },
    heroPromoSublineAi: {
      marginTop: 2,
      color: colors.text,
      opacity: 0.84,
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.25,
      lineHeight: 17,
    },
    err: { color: colors.error, marginBottom: 6, fontSize: 14, lineHeight: 20 },
    serviceGridWrap: {
      width: "100%",
      gap: 8,
      marginTop: 10,
      padding: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: ornamentBorder,
      backgroundColor: colors.accentSurface,
    },
    /** 3 тайл бір қатарда (үсті: құран, намаз, дәстүр; астында: сира, тәжуид, қажылық) */
    serviceRow3: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 8,
      width: "100%",
    },
    serviceCell3: {
      flex: 1,
      minWidth: 0,
    },
    serviceTile3: {
      width: "100%",
      minWidth: 0,
    },
    tileSub: {
      fontSize: 9,
      lineHeight: 11,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 0,
      paddingHorizontal: 2,
    },
    menuGrid: {
      flexDirection: "row",
      flexWrap: "nowrap",
      justifyContent: "space-between",
      alignItems: "stretch",
      gap: 6,
    },
    tile: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingVertical: 4,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: ornamentBorder,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.22 : 0.07,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    tilePress: {
      opacity: 0.9,
      transform: [{ scale: 0.97 }],
    },
    tileInGrid: {
      flex: 1,
      minWidth: 0,
      marginBottom: 0,
      alignSelf: "stretch",
    },
    /** Қажылық / сира / тәжуид: сурет тайл шетіне дейін */
    tileMedia: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      alignItems: "stretch",
      overflow: "hidden",
    },
    /** Тор қатарындағы үш тайл биіктігін теңестіру */
    tileMediaOuter: { flex: 1 },
    tileMediaColumn: {
      flex: 1,
      alignSelf: "stretch",
      minHeight: 0,
    },
    tileMediaSpacer: { flexGrow: 1, minHeight: 0 },
    /** Ені/биіктік > 1 — сурет қабаты сәл тікелей қысқа (карточка сақталады) */
    tileMediaImageWrap: {
      width: "100%",
      overflow: "hidden",
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    tileMediaLight: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "#ffffff",
    },
    tileMediaImage: {
      width: "100%",
      height: "100%",
    },
    tileIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    tileEmoji: { fontSize: 13 },
    quickLabel: {
      color: colors.text,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: 0.08,
      marginTop: 2,
    },
    quickLabelMedia: {
      marginTop: 0,
      paddingTop: 1,
      paddingBottom: 0,
      paddingHorizontal: 2,
    },
    hint: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 18 },
  });
}
