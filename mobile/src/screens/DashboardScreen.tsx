import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  Platform,
  InteractionManager,
  Image,
  useWindowDimensions,
  type ImageSourcePropType,
  StatusBar,
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
import { reschedulePrayerNotifications } from "../services/prayerNotifications";
import type { ThemeColors } from "../theme/colors";
import type { HomeTabCompositeNavigation } from "../navigation/types";
import { CompactPrayerTimesRow, shortPrayerName } from "../components/CompactPrayerTimesRow";
import { DashboardHeroQiblaCard } from "../components/DashboardHeroQiblaCard";
import { useQiblaStable } from "../context/QiblaSensorContext";
import { cityLabelKkForApiName } from "../constants/kzCities";

/**
 * Тор + бүйір карточкалары: терезе еніне қарай максималды растр (тайл мен қақпа арасында шықпау).
 * Тор ені ≈ 31% − padding; қақпа бағанасы = сол растр ені.
 */
function dashboardRasterBoxPx(windowWidth: number): number {
  const content = Math.max(200, windowWidth - 32);
  const gridCap = Math.floor(content * 0.31 - 12);
  const heroCap = Math.floor((content - 22) / 3);
  return Math.min(94, Math.max(58, Math.min(gridCap, heroCap)));
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

export function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const rasterBox = dashboardRasterBoxPx(windowWidth);
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
  const accentSoft = isDark ? "rgba(56,189,248,0.10)" : "rgba(2,132,199,0.07)";

  useLayoutEffect(() => {
    const headerH =
      Platform.OS === "ios"
        ? insets.top + 36
        : (StatusBar.currentHeight ?? 0) + 42;
    navigation.setOptions({
      headerTitleAlign: "center",
      headerStyle: {
        backgroundColor: colors.bg,
        height: headerH,
      },
      headerLeft: () => (
        <View style={{ marginLeft: 8, justifyContent: "center" }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "900",
              letterSpacing: 0.6,
              color: colors.accent,
            }}
            accessibilityRole="header"
            accessibilityLabel={kk.dashboard.brandTitle}
          >
            RAQAT
          </Text>
        </View>
      ),
      headerTitle: () => (
        <View
          style={{
            paddingHorizontal: 5,
            paddingVertical: 0,
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(56,189,248,0.12)" : "rgba(2,132,199,0.08)",
          }}
          accessibilityRole="image"
          accessibilityLabel={kk.tabs.qibla}
        >
          <Image
            source={menuIconAssets.headerQibla}
            style={{ width: 36, height: 36 }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
      ),
      headerRight: () => (
        <Pressable
          onPress={() =>
            navigation.dispatch(
              CommonActions.navigate({
                name: "MoreStack",
                params: { screen: "Settings" },
              }),
            )
          }
          style={{ marginRight: 6, paddingVertical: 2, paddingHorizontal: 6 }}
          accessibilityRole="button"
          accessibilityLabel={kk.settings.headerSettingsA11y}
        >
          <MaterialIcons name="settings" size={22} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, colors.text, colors.accent, isDark, insets.top]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([load("full"), refreshBearing()]);
    } finally {
      setRefreshing(false);
    }
  };

  const next = nextPrayer(rows);
  const cityShown = cityLabelKkForApiName(cityLabel);
  const styles = makeStyles(colors, isDark);
  const timeCells = rows.map((r) => ({ key: r.key, time: r.time }));
  const timesPending = rows.length === 0 && err === null;
  /** Үстіңгі қатар (Halal / AI) иконкаларын сәл кішірейту */
  const topPromoBox = Math.max(46, rasterBox - 12);

  const goPrayerTimes = () => navigation.navigate("PrayerTimes");
  const goQuranList = () => navigation.navigate("MoreStack", { screen: "QuranList" });
  const goHadithList = () => navigation.navigate("MoreStack", { screen: "HadithList" });
  const goAi = () => navigation.navigate("MoreStack", { screen: "RaqatAI" });
  const goHalal = () => navigation.navigate("MoreStack", { screen: "Halal" });

  return (
    <>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.heroRow}>
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

        <DashboardHeroQiblaCard
          colors={colors}
          columnWidth={rasterBox}
          styles={{
            heroQiblaCard: styles.heroQiblaCard,
            heroArrowInner: styles.heroArrowInner,
            heroArrowArea: styles.heroArrowArea,
            heroArrowLift: styles.heroArrowLift,
            heroQiblaLabel: styles.heroQiblaLabel,
          }}
          cardShadow={cardShadow(isDark)}
        />

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

      {fromCache && err ? (
        <Text style={styles.cacheBanner}>
          {kk.common.offlineBadge}: {err}
        </Text>
      ) : null}

      {err && !fromCache ? <Text style={styles.err}>{err}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.prayerHero,
          cardShadow(isDark),
          pressed && styles.cardPressStrong,
        ]}
        onPress={goPrayerTimes}
        accessibilityRole="button"
        accessibilityLabel={kk.dashboard.prayerCardA11y}
      >
        {momentBanner ? (
          <View
            style={styles.momentBanner}
            accessibilityLiveRegion="polite"
            accessibilityLabel={momentBanner}
          >
            <MaterialIcons name="notifications-active" size={18} color={colors.accent} />
            <Text style={styles.momentBannerText} numberOfLines={2}>
              {momentBanner}
            </Text>
          </View>
        ) : null}
        <View style={styles.cityNextRow}>
          <Text style={styles.cityMicroCompact}>{cityShown || "—"}</Text>
          {next && rows.length > 0 ? (
            <Text style={styles.nextInline} numberOfLines={1}>
              {kk.dashboard.nextPrayer}: {next.label} {next.time}
            </Text>
          ) : null}
        </View>
        <CompactPrayerTimesRow
          colors={colors}
          rows={timeCells}
          pending={timesPending}
          embedded
          sixRows
          sixRowsCompact
          highlightKey={next?.key}
          isDark={isDark}
        />
      </Pressable>

      <View style={styles.heroRow}>
        <Pressable
          style={({ pressed }) => [
            styles.heroSideCard,
            cardShadow(isDark),
            pressed && styles.cardPress,
          ]}
          onPress={goQuranList}
          accessibilityRole="button"
          accessibilityLabel={kk.dashboard.heroQuranTitle}
        >
          <AppIconBadge
            imageSource={menuIconAssets.heroQuran}
            colors={colors}
            tintBg={accentSoft}
            size="lg"
            boxPx={rasterBox}
            border={false}
            shape="circle"
            plain
          />
          <Text style={styles.heroSideTitle} numberOfLines={2}>
            {kk.dashboard.heroQuranTitle}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.heroSideCard,
            cardShadow(isDark),
            pressed && styles.cardPress,
          ]}
          onPress={goHadithList}
          accessibilityRole="button"
          accessibilityLabel={kk.dashboard.heroHadithTitle}
        >
          <AppIconBadge
            imageSource={menuIconAssets.heroHadith}
            colors={colors}
            tintBg={accentSoft}
            size="lg"
            boxPx={rasterBox}
            border={false}
            shape="circle"
            plain
          />
          <Text style={styles.heroSideTitle} numberOfLines={2}>
            {kk.dashboard.heroHadithTitle}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.heroSideCard,
            cardShadow(isDark),
            pressed && styles.cardPress,
          ]}
          onPress={() => navigation.navigate("MoreStack", { screen: "NamazGuide" })}
          accessibilityRole="button"
          accessibilityLabel={kk.namazGuide.shortTitle}
        >
          <AppIconBadge
            imageSource={menuIconAssets.tileNamaz}
            colors={colors}
            tintBg={accentSoft}
            size="lg"
            boxPx={rasterBox}
            border={false}
            shape="circle"
            plain
          />
          <Text style={styles.heroSideTitle} numberOfLines={2}>
            {kk.namazGuide.shortTitle}
          </Text>
        </Pressable>
      </View>

      <View style={styles.menuGrid}>
        <Tile
          iconImage={menuIconAssets.tileHajj}
          iconColor={colors.accent}
          colors={colors}
          rasterBox={rasterBox}
          label={kk.features.hajjTitle}
          onPress={() => navigation.navigate("MoreStack", { screen: "Hajj" })}
          styles={styles}
          accentSoft={accentSoft}
          imageEdgeToEdge
        />
        <Tile
          iconImage={menuIconAssets.tileSeerah}
          iconColor={colors.accent}
          colors={colors}
          rasterBox={rasterBox}
          label={kk.dashboard.tileSeerah}
          onPress={() => navigation.navigate("MoreStack", { screen: "Seerah" })}
          styles={styles}
          accentSoft={accentSoft}
          imageEdgeToEdge
        />
        <Tile
          iconImage={menuIconAssets.tileTajweed}
          iconColor={colors.accent}
          colors={colors}
          rasterBox={rasterBox}
          label={kk.dashboard.arabicLettersTile}
          onPress={() => navigation.navigate("MoreStack", { screen: "TajweedGuide" })}
          styles={styles}
          accentSoft={accentSoft}
          imageEdgeToEdge
          imageLighten={0.24}
        />
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
  onPress,
  styles,
  accentSoft,
  imageEdgeToEdge,
  imageLighten,
}: {
  emoji?: string;
  glyph?: React.ReactNode;
  iconName?: MciName;
  iconImage?: ImageSourcePropType;
  iconColor?: string;
  colors: ThemeColors;
  rasterBox: number;
  label: string;
  onPress: () => void;
  styles: Record<string, object>;
  accentSoft: string;
  /** Суретті тайл қоршауына дейін үлкейту (қажылық / сира / тәжуид) */
  imageEdgeToEdge?: boolean;
  /** Беткі суретті ашығырақ ету үшін ақ қабат (0..1) */
  imageLighten?: number;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        styles.tileInGrid,
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
              style={styles.tileMediaImage}
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
        <Text style={styles.quickLabel} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const cardBorder = isDark ? "rgba(148, 163, 184, 0.12)" : colors.border;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: 16,
      paddingTop: 0,
      paddingBottom: 28,
      flexGrow: 1,
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
    heroRow: {
      flexDirection: "row",
      alignItems: "stretch",
      justifyContent: "space-between",
      gap: 9,
      marginBottom: 10,
      marginTop: 0,
    },
    heroSideCard: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: cardBorder,
      paddingVertical: 6,
      paddingHorizontal: 4,
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
      marginTop: 4,
      color: colors.text,
      fontSize: 12,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: 15,
      letterSpacing: 0.12,
    },
    heroSideMicro: {
      marginTop: 2,
      color: colors.muted,
      fontSize: 8,
      fontWeight: "600",
      textAlign: "center",
    },
    /** Ені heroRow ішінде flex:1; columnWidth — тек стрелка өлшемі үшін */
    heroQiblaCard: {
      alignSelf: "stretch",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: cardBorder,
      overflow: "hidden",
    },
    heroArrowInner: {
      flex: 1,
      width: "100%",
      flexDirection: "column",
      justifyContent: "flex-start",
      paddingTop: 4,
      paddingBottom: 5,
      paddingHorizontal: 2,
    },
    /** Стрелка орталыққа жақын, мәтін төменгі жақта */
    heroArrowArea: {
      flex: 1,
      width: "100%",
      minHeight: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    heroArrowLift: {
      marginTop: 0,
    },
    heroQiblaLabel: {
      marginTop: 2,
      paddingTop: 2,
      color: colors.accent,
      fontSize: 12,
      fontWeight: "900",
      textAlign: "center",
      lineHeight: 16,
      letterSpacing: 0.2,
      alignSelf: "stretch",
    },
    err: { color: colors.error, marginBottom: 8, fontSize: 14, lineHeight: 20 },
    prayerHero: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(56, 189, 248, 0.22)" : "rgba(2, 132, 199, 0.14)",
      paddingHorizontal: 10,
      paddingVertical: 10,
      marginBottom: 10,
      overflow: "hidden",
      ...Platform.select({
        ios: {
          shadowColor: "#0ea5e9",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.12 : 0.06,
          shadowRadius: 10,
        },
        android: { elevation: 2 },
        default: {},
      }),
    },
    momentBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(2, 132, 199, 0.08)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(56, 189, 248, 0.28)" : "rgba(2, 132, 199, 0.2)",
    },
    momentBannerText: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    cityNextRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 6,
    },
    cityMicroCompact: {
      fontSize: 13,
      fontWeight: "800",
      color: colors.muted,
      letterSpacing: 0.2,
      flexShrink: 0,
      maxWidth: "44%",
    },
    nextInline: {
      flex: 1,
      minWidth: 0,
      textAlign: "right",
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
      fontVariant: ["tabular-nums"],
      letterSpacing: 0.15,
    },
    menuGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "stretch",
      rowGap: 2,
    },
    tile: {
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 6,
      paddingHorizontal: 3,
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
      width: "31%",
      marginBottom: 8,
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
      width: 39,
      height: 39,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 3,
    },
    tileEmoji: { fontSize: 13 },
    quickLabel: {
      color: colors.text,
      fontSize: 12,
      lineHeight: 15,
      fontWeight: "900",
      textAlign: "center",
      letterSpacing: 0.15,
      marginTop: 2,
    },
    quickLabelMedia: {
      marginTop: 0,
      paddingTop: 5,
      paddingBottom: 6,
      paddingHorizontal: 3,
    },
    hint: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 18 },
  });
}
