import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  InteractionManager,
  Image,
  useWindowDimensions,
  type ImageSourcePropType,
  StatusBar,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppIconBadge } from "../components/AppIconBadge";
import type { MciName } from "../theme/appIcons";
import { dashboardIcons } from "../theme/appIcons";
import { menuIconAssets } from "../theme/menuIconAssets";
import { CommonActions, useFocusEffect, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchPrayerTimesByCity, type PrayerTimesResult } from "../api/prayerTimes";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import { getSelectedCity, getNotifEnabled, getIftarEnabled } from "../storage/prefs";
import { loadPrayerCache, savePrayerCache } from "../storage/prayerCache";
import { VoiceAssistantHeaderButton } from "../components/voice/VoiceAssistantHeaderButton";
import { reschedulePrayerNotifications } from "../services/prayerNotifications";
import type { ThemeColors } from "../theme/colors";
import type { HomeTabCompositeNavigation } from "../navigation/types";
import { CompactPrayerTimesRow, shortPrayerName } from "../components/CompactPrayerTimesRow";
import { DashboardNextPrayerHero } from "../components/DashboardNextPrayerHero";
import { useQiblaStable } from "../context/QiblaSensorContext";
import { useQiblaMotion } from "../context/QiblaSensorContext";
import { QiblaArrowPointer } from "../components/QiblaArrowPointer";
/**
 * Тор + бүйір карточкалары: терезе еніне қарай максималды растр (тайл мен қақпа арасында шықпау).
 * Тор ені ≈ 31% − padding; қақпа бағанасы = сол растр ені.
 */
function dashboardRasterBoxPx(windowWidth: number, windowHeight?: number): number {
  const content = Math.max(200, windowWidth - 32);
  const gridCap = Math.floor(content * 0.31 - 12);
  const heroCap = Math.floor((content - 22) / 3);
  let box = Math.min(80, Math.max(46, Math.min(gridCap, heroCap)));
  if (windowHeight != null && windowHeight < 720) {
    box = Math.min(box, 52);
  }
  if (windowHeight != null && windowHeight < 640) {
    box = Math.min(box, 44);
  }
  return box;
}

type Row = { key: string; label: string; time: string };

function parseMinutes(t: string): number {
  const clean = t.trim().split(/\s+/)[0] ?? "";
  const p = clean.split(":");
  if (p.length < 2) return 0;
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}

function matchesClockMinute(now: Date, timeStr: string): boolean {
  if (!timeStr?.trim()) return false;
  const target = parseMinutes(timeStr);
  const cur = now.getHours() * 60 + now.getMinutes();
  return cur === target;
}

function nextPrayer(rows: Row[]): Row | null {
  const salat = rows.filter((r) => r.key !== "sun");
  if (!salat.length) return null;
  const now = new Date();
  const nowM = now.getHours() * 60 + now.getMinutes();
  for (const r of salat) {
    if (parseMinutes(r.time) > nowM) return r;
  }
  return salat[0];
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
  const { bearing, refreshBearing } = useQiblaStable();
  const { rotateDeg } = useQiblaMotion();
  const bearingReady = bearing != null;
  const qiblaAligned = bearingReady && Math.abs(rotateDeg) <= 12;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        minWidth: 0,
        minHeight: 42,
        gap: 6,
      }}
    >
      <Pressable
        onPress={() => navigation.navigate("Qibla")}
        onLongPress={() => void refreshBearing()}
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: qiblaAligned ? `${colors.success}33` : colors.accentSurfaceStrong,
          borderWidth: qiblaAligned ? 2 : bearingReady ? 1 : 0,
          borderColor: qiblaAligned ? `${colors.success}cc` : bearingReady ? `${colors.success}55` : "transparent",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
        accessibilityRole="button"
        accessibilityLabel={kk.tabs.qibla}
      >
        {bearingReady ? (
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.success,
              borderWidth: 1.5,
              borderColor: qiblaAligned ? `${colors.success}ff` : `${colors.bg}`,
              zIndex: 2,
              ...(Platform.OS === "ios"
                ? {
                    shadowColor: colors.success,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.85,
                    shadowRadius: 3,
                  }
                : { elevation: 4 }),
            }}
          />
        ) : null}
        {bearing == null ? (
          <MaterialIcons name="navigation" size={22} color={colors.accent} />
        ) : (
          <QiblaArrowPointer
            colors={colors}
            size={34}
            rotateDeg={rotateDeg}
            aligned={qiblaAligned}
            showDialRing
          />
        )}
      </Pressable>
      <View style={{ flex: 1, minWidth: 0, marginHorizontal: 4, alignItems: "center" }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "900",
            letterSpacing: 0.5,
            color: colors.text,
            textAlign: "center",
            width: "100%",
          }}
          accessibilityRole="header"
          numberOfLines={1}
        >
          {kk.dashboard.brandTitle}
        </Text>
      </View>
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
  const { refreshBearing } = useQiblaStable();
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [cityLabel, setCityLabel] = useState("");
  /** Намаз минуты кіргенде (экран ашық) — қысқа баннер */
  const [momentBanner, setMomentBanner] = useState<string | null>(null);
  const momentPulseId = useRef<string>("");
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
    const qiblaTopPad = Platform.OS === "ios" ? 4 : 2;
    navigation.setOptions({
      headerTitleAlign: "left",
      headerTitle: () => null,
      headerLeftContainerStyle: {
        paddingLeft: 0,
        marginLeft: 0,
        marginTop: 0,
        paddingTop: qiblaTopPad,
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
      headerRight: () => null,
      headerLeft: () => <HomeHeaderLeft navigation={navigation} colors={colors} />,
    });
  }, [
    navigation,
    colors.text,
    colors.bg,
    colors.accent,
    colors.accentSurfaceStrong,
    insets.top,
  ]);

  const load = useCallback(async (mode: "focus" | "full" = "full") => {
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
      setErr(null);
      usedCache = true;
    }

    const fresh = await fetchPrayerTimesByCity(city, country, 3);

    if (!fresh.error) {
      setRows(rowsFromResult(fresh));
      setCityLabel(fresh.city);
      setFromCache(false);
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
        }
      };
      tick();
      const iv = setInterval(tick, 12_000);
      return () => {
        clearInterval(iv);
        setMomentBanner(null);
      };
    }, [rows])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([load("full"), refreshBearing()]);
    } finally {
      setRefreshing(false);
    }
  }, [load, refreshBearing]);

  const next = nextPrayer(rows);
  const styles = makeStyles(colors, isDark);
  const timeCells = rows.map((r) => ({ key: r.key, time: r.time }));
  const timesPending = rows.length === 0 && err === null;
  const compactHome = windowHeight < 860;
  /** Үстіңгі қатар (Halal / AI) иконкаларын сәл кішірейту */
  const topPromoBox = Math.max(40, rasterBox - 14);

  const goPrayerTimes = () => navigation.navigate("PrayerTimes");
  const goQuranList = () => navigation.navigate("MoreStack", { screen: "QuranList" });
  const goHadithList = () => navigation.navigate("MoreStack", { screen: "HadithList" });
  /** Құран / сахиһ хадис — визуалды басқа 3-бағана тайлдардан сәл кішірек */
  const quranHadithIconBox = Math.max(38, Math.round(rasterBox * 0.72));
  const goAi = () => navigation.navigate("MoreStack", { screen: "RaqatAI" });
  const goHalal = () => navigation.navigate("MoreStack", { screen: "Halal" });
  const goDuas = () => navigation.navigate("Duas", { screen: "DuasHome" });
  const goTasbih = () => navigation.navigate("Tasbih", { screen: "TasbihList" });
  const goAsma = () => navigation.navigate("AsmaAlHusna");

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.scrollContent}
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
          <Text style={styles.cacheBanner}>
            {kk.common.offlineBadge}: {err}
          </Text>
        ) : null}

        {err && !fromCache ? <Text style={styles.err}>{err}</Text> : null}

        <DashboardNextPrayerHero
          colors={colors}
          isDark={isDark}
          cityApiName={cityLabel}
          next={next}
          allRows={rows}
          onPress={goPrayerTimes}
          momentBanner={momentBanner}
          compact={compactHome}
        />

        <CompactPrayerTimesRow
          colors={colors}
          rows={timeCells}
          pending={timesPending}
          onPressOpen={goPrayerTimes}
          sixRows
          sixRowsCompact
          highlightKey={next?.key}
          isDark={isDark}
          compact={compactHome}
        />

        <View style={styles.promoRow}>
          <Pressable
            style={({ pressed }) => [
              styles.heroSideCard,
              cardShadow(isDark),
              pressed && styles.cardPress,
            ]}
            onPress={goHalal}
            accessibilityRole="button"
            accessibilityLabel={kk.features.halalTitle}
          >
            <AppIconBadge
              imageSource={menuIconAssets.tileHalal}
              colors={colors}
              tintBg={accentSoft}
              size="lg"
              boxPx={topPromoBox}
              border={false}
              shape="circle"
              plain
            />
            <Text style={styles.heroSideTitle} numberOfLines={2}>
              {kk.features.halalTitle}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.heroSideCard,
              cardShadow(isDark),
              pressed && styles.cardPress,
            ]}
            onPress={goAi}
            accessibilityRole="button"
            accessibilityLabel={kk.dashboard.aiRowTitle}
          >
            <AppIconBadge
              imageSource={menuIconAssets.promoAi}
              colors={colors}
              tintBg={accentSoft}
              size="lg"
              boxPx={topPromoBox}
              border={false}
              shape="circle"
              plain
            />
            <Text style={styles.heroSideTitle} numberOfLines={2}>
              {kk.dashboard.heroAiStripTitle}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.servicesHeading} accessibilityRole="header">
          {kk.dashboard.servicesHeading}
        </Text>

        <View style={styles.serviceGridWrap}>
          {/** Үстіңгі қатар: Құран — Намаз — Хадис */}
          <View style={styles.serviceRow3}>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.heroQuran}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={quranHadithIconBox}
                label={kk.dashboard.heroQuranTitle}
                subLabel={kk.dashboard.quranCardSub}
                onPress={goQuranList}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                imageScale={0.52}
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
              />
            </View>
            <View style={styles.serviceCell3}>
              <Tile
                iconImage={menuIconAssets.heroHadith}
                iconColor={colors.accent}
                colors={colors}
                rasterBox={quranHadithIconBox}
                label={kk.dashboard.heroHadithTitle}
                subLabel={kk.dashboard.hadithCardSub}
                onPress={goHadithList}
                styles={styles}
                accentSoft={accentSoft}
                imageEdgeToEdge
                imageScale={0.52}
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
                imageScale={1.08}
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
              />
            </View>
          </View>
        </View>
      </ScrollView>
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
  /** Беткі суретті ашығырақ ету үшін ақ қабат (0..1) */
  imageLighten?: number;
  /** Тек imageEdgeToEdge суретіне scale беру (Құран/Хадис т.б.) */
  imageScale?: number;
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
      accessibilityLabel={label}
    >
      {iconImage && imageEdgeToEdge ? (
        <View style={styles.tileMediaColumn}>
          <View style={[styles.tileMediaImageWrap, { backgroundColor: colors.card }]}>
            <Image
              source={iconImage}
              style={[
                styles.tileMediaImage,
                typeof imageScale === "number" ? { transform: [{ scale: imageScale }] } : null,
              ]}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            {typeof imageLighten === "number" && imageLighten > 0 ? (
              <View style={[styles.tileMediaLight, { opacity: Math.min(0.45, Math.max(0, imageLighten)) }]} />
            ) : null}
          </View>
          <View style={styles.tileMediaSpacer} />
          <Text style={[styles.quickLabel, styles.quickLabelMedia]} numberOfLines={2}>
            {label}
          </Text>
          {subLabel ? (
            <Text style={[styles.tileSub, { color: colors.muted }]} numberOfLines={2}>
              {subLabel}
            </Text>
          ) : null}
        </View>
      ) : iconImage ? (
        <AppIconBadge
          imageSource={iconImage}
          colors={colors}
          tintBg={accentSoft}
          iconColor={iconColor}
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
        <>
          <Text style={styles.quickLabel} numberOfLines={2}>
            {label}
          </Text>
          {subLabel ? (
            <Text style={[styles.tileSub, { color: colors.muted }]} numberOfLines={2}>
              {subLabel}
            </Text>
          ) : null}
        </>
      ) : null}
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const cardBorder = isDark ? "rgba(34, 197, 94, 0.16)" : colors.border;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scrollContent: {
      paddingHorizontal: 8,
      paddingTop: 2,
      paddingBottom: 20,
    },
    promoRow: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: 6,
      marginTop: 4,
      marginBottom: 2,
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
      color: colors.accent,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: "hidden",
    },
    heroSideCard: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: cardBorder,
      paddingVertical: 2,
      paddingHorizontal: 3,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    heroSideIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    heroSideEmoji: { fontSize: 15 },
    heroSideTitle: {
      marginTop: 2,
      color: colors.text,
      fontSize: 12,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: 14,
      letterSpacing: 0.12,
    },
    heroSideMicro: {
      marginTop: 2,
      color: colors.muted,
      fontSize: 8,
      fontWeight: "600",
      textAlign: "center",
    },
    err: { color: colors.error, marginBottom: 8, fontSize: 14, lineHeight: 20 },
    servicesHeading: {
      fontSize: 16,
      fontWeight: "900",
      color: colors.text,
      letterSpacing: 0.2,
      marginTop: 4,
      marginBottom: 6,
    },
    serviceGridWrap: {
      width: "100%",
      gap: 4,
    },
    /** 3 тайл бір қатарда (үсті: құран, намаз, хадис; астында: сира, тәжуид, қажылық) */
    serviceRow3: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: 4,
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
      fontSize: 10,
      lineHeight: 13,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 2,
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
      borderRadius: 12,
      paddingVertical: 2,
      paddingHorizontal: 2,
      borderWidth: 1,
      borderColor: cardBorder,
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
    tileMediaImageWrap: {
      width: "100%",
      aspectRatio: 1,
      overflow: "hidden",
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
      fontSize: 11,
      lineHeight: 13,
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: 0.15,
      marginTop: 0,
    },
    quickLabelMedia: {
      marginTop: 0,
      paddingTop: 4,
      paddingBottom: 4,
      paddingHorizontal: 3,
    },
    hint: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 18 },
  });
}
