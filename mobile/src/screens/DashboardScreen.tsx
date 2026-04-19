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
} from "react-native";
import * as Haptics from "expo-haptics";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppIconBadge } from "../components/AppIconBadge";
import type { MciName } from "../theme/appIcons";
import { menuIconAssets } from "../theme/menuIconAssets";
import { CommonActions, useFocusEffect, useNavigation } from "@react-navigation/native";
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
  const { width: windowWidth } = useWindowDimensions();
  const rasterBox = dashboardRasterBoxPx(windowWidth);
  /** AI жолы: тордағы дөңгелектерден кішірек батырма */
  const promoAiIconBox = Math.max(46, Math.min(64, Math.round(rasterBox * 0.68)));
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
    navigation.setOptions({
      headerTitleAlign: "center",
      headerLeft: () => (
        <View style={{ marginLeft: 10, justifyContent: "center" }}>
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
        <Pressable
          onPress={() => navigation.navigate("Qibla")}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={kk.tabs.qibla}
          style={{
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderRadius: 10,
            backgroundColor: isDark ? "rgba(56,189,248,0.12)" : "rgba(2,132,199,0.08)",
          }}
        >
          <Image
            source={menuIconAssets.headerQibla}
            style={{ width: 22, height: 22 }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Pressable>
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
          style={{ marginRight: 6, paddingVertical: 4, paddingHorizontal: 6 }}
          accessibilityRole="button"
          accessibilityLabel={kk.settings.headerSettingsA11y}
        >
          <MaterialIcons name="settings" size={22} color={colors.accent} />
        </Pressable>
      ),
    });
  }, [navigation, colors.text, colors.accent, isDark]);

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

  const goPrayerTimes = () => navigation.navigate("PrayerTimes");
  const goQuranList = () => navigation.navigate("MoreStack", { screen: "QuranList" });
  const goHadithList = () => navigation.navigate("MoreStack", { screen: "HadithList" });
  const goAi = () => navigation.navigate("MoreStack", { screen: "RaqatAI" });

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

      <Pressable
        style={({ pressed }) => [
          styles.promoAiFull,
          { minHeight: Math.max(54, promoAiIconBox + 14) },
          cardShadow(isDark),
          pressed && styles.cardPress,
        ]}
        onPress={goAi}
        accessibilityRole="button"
        accessibilityLabel={kk.dashboard.aiRowTitle}
      >
        <View style={styles.promoAiRow}>
          <AppIconBadge
            imageSource={menuIconAssets.promoAi}
            colors={colors}
            tintBg={accentSoft}
            size="lg"
            boxPx={promoAiIconBox}
            border={false}
            shape="circle"
            plain
          />
          <Text style={styles.promoAiFullTitle} numberOfLines={2}>
            {kk.dashboard.aiRowTitle}
          </Text>
        </View>
      </Pressable>

      <View style={styles.menuGrid}>
        <Tile
          iconImage={menuIconAssets.tileNamaz}
          iconColor={colors.accent}
          colors={colors}
          rasterBox={rasterBox}
          label={kk.namazGuide.shortTitle}
          onPress={() => navigation.navigate("MoreStack", { screen: "NamazGuide" })}
          styles={styles}
          accentSoft={accentSoft}
        />
        <Tile
          iconImage={menuIconAssets.tileHalal}
          iconColor={colors.accent}
          colors={colors}
          rasterBox={rasterBox}
          label={kk.features.halalTitle}
          onPress={() => navigation.navigate("MoreStack", { screen: "Halal" })}
          styles={styles}
          accentSoft={accentSoft}
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
        />
        <Tile
          iconImage={menuIconAssets.tileHajj}
          iconColor={colors.accent}
          colors={colors}
          rasterBox={rasterBox}
          label={kk.features.hajjTitle}
          onPress={() => navigation.navigate("MoreStack", { screen: "Hajj" })}
          styles={styles}
          accentSoft={accentSoft}
        />
        <Tile
          iconImage={menuIconAssets.tileDaily}
          iconColor={colors.accent}
          colors={colors}
          rasterBox={rasterBox}
          label={kk.dashboard.tileDailyAyah}
          onPress={() => navigation.navigate("MoreStack", { screen: "DailyAyah" })}
          styles={styles}
          accentSoft={accentSoft}
        />
        <Tile
          iconImage={menuIconAssets.tileCommunity}
          iconColor={colors.accent}
          colors={colors}
          rasterBox={rasterBox}
          label={kk.dashboard.tileCommunityDua}
          onPress={() => navigation.navigate("MoreStack", { screen: "CommunityDua" })}
          styles={styles}
          accentSoft={accentSoft}
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
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, styles.tileInGrid, pressed && styles.tilePress]}
      onPress={onPress}
    >
      {iconImage ? (
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
      <Text style={styles.quickLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  const cardBorder = isDark ? "rgba(148, 163, 184, 0.12)" : colors.border;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: 16,
      paddingTop: 8,
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
      fontSize: 13,
      lineHeight: 18,
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
      gap: 6,
      marginBottom: 10,
      marginTop: 2,
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
      fontSize: 9,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 12,
      letterSpacing: 0.12,
    },
    heroSideMicro: {
      marginTop: 2,
      color: colors.muted,
      fontSize: 8,
      fontWeight: "600",
      textAlign: "center",
    },
    /** Ені DashboardScreen ішінде columnWidth (rasterBox) арқылы беріледі */
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
      fontSize: 11,
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 14,
      letterSpacing: 0.2,
      alignSelf: "stretch",
    },
    err: { color: colors.error, marginBottom: 8 },
    prayerHero: {
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(56, 189, 248, 0.22)" : "rgba(2, 132, 199, 0.14)",
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginBottom: 12,
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
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 0.2,
    },
    cityNextRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      marginBottom: 8,
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
    promoAiFull: {
      width: "100%",
      minHeight: 56,
      marginBottom: 10,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: cardBorder,
      paddingVertical: 7,
      paddingHorizontal: 10,
      overflow: "hidden",
    },
    promoAiRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      gap: 8,
    },
    promoAiFullTitle: {
      flex: 1,
      minWidth: 0,
      color: colors.text,
      fontSize: 12,
      fontWeight: "800",
      textAlign: "right",
      lineHeight: 16,
      letterSpacing: 0.15,
    },
    menuGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
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
      fontSize: 9,
      lineHeight: 12,
      fontWeight: "700",
      textAlign: "center",
      letterSpacing: 0.15,
      marginTop: 2,
    },
    hint: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 18 },
  });
}
