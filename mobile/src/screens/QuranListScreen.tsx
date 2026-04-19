import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import {
  loadQuranListCache,
  saveQuranListCache,
  parseSurahsFromApiJson,
  parseSurahsFromPlatformIndex,
  type CachedSurah,
} from "../storage/quranListCache";
import { getRaqatApiBase, isRaqatApiOnlyMode } from "../config/raqatApiBase";
import { getRaqatContentSecret } from "../config/raqatContentSecret";
import { fetchQuranSurahs } from "../services/platformApiClient";
import { seedBundledQuranCachesIfNeeded } from "../services/bundledQuranSeed";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import { surahArabicFromBundled } from "../constants/surahBundledMeta";

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "QuranList">;
};

const SURAH_API = "https://api.alquran.cloud/v1/surah";

export function QuranListScreen({ navigation }: Props) {
  const { colors } = useAppTheme();
  const [list, setList] = useState<CachedSurah[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRemote = useCallback(async (): Promise<boolean> => {
    const base = getRaqatApiBase();
    const apiOnly = isRaqatApiOnlyMode();
    const secret = getRaqatContentSecret();
    if (base) {
      try {
        const data = await fetchQuranSurahs(base, undefined, secret || undefined);
        const arr = parseSurahsFromPlatformIndex(data);
        if (arr?.length) {
          setList(arr);
          setFromCache(false);
          setErr(null);
          await saveQuranListCache(arr);
          return true;
        }
      } catch (e) {
        if (apiOnly) throw e;
      }
    } else if (apiOnly) {
      throw new Error(kk.quran.apiOnlyRequired);
    }
    if (apiOnly) throw new Error(kk.quran.apiOnlyRequired);
    const r = await fetch(SURAH_API);
    const j = await r.json();
    const arr = parseSurahsFromApiJson(j);
    if (!arr?.length) return false;
    setList(arr);
    setFromCache(false);
    setErr(null);
    await saveQuranListCache(arr);
    return true;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      let hadCached = false;
      const cached = await loadQuranListCache();
      if (alive && cached?.list?.length) {
        hadCached = true;
        setList(cached.list);
        setFromCache(true);
        setLoading(false);
      }

      /**
       * Кеш толық болса сидингті фонда (UI қатырмай); бос болса — офлайн үшін күту керек.
       * seedBundledQuranCachesIfNeeded ішінде InteractionManager + mutex бар.
       */
      const applySeed = async () => {
        try {
          await seedBundledQuranCachesIfNeeded();
        } catch {
          /* бандл жоқ немесе сақтау сәтсіз */
        }
        if (!alive) return;
        const afterSeed = await loadQuranListCache();
        if (afterSeed?.list?.length) {
          hadCached = true;
          setList(afterSeed.list);
          setFromCache(true);
          setErr(null);
          setLoading(false);
        }
      };

      if (hadCached) {
        void applySeed();
      } else {
        await applySeed();
      }
      if (!alive) return;

      try {
        await fetchRemote();
      } catch (e) {
        if (alive && !hadCached) {
          const again = await loadQuranListCache();
          if (again?.list?.length) {
            setList(again.list);
            setFromCache(true);
            setErr(null);
          } else {
            setErr(e instanceof Error ? e.message : kk.quran.listError);
          }
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchRemote]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRemote();
    } catch {
      /* кеш тізімі қалсын */
    } finally {
      setRefreshing(false);
    }
  }, [fetchRemote]);

  const styles = makeStyles(colors);

  if (loading && !list.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>{kk.quran.loading}</Text>
      </View>
    );
  }

  if (err && !list.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err}</Text>
        <Text style={styles.muted}>{kk.common.error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      data={list}
      numColumns={2}
      keyExtractor={(item) => String(item.number)}
      columnWrapperStyle={styles.colWrap}
      contentContainerStyle={styles.pad}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      ListHeaderComponent={
        <View style={styles.listHeader}>
          {fromCache ? <Text style={styles.cacheBanner}>{kk.common.fromCache}</Text> : null}
          <Pressable
            style={({ pressed }) => [styles.hatimRow, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate("Hatim")}
            accessibilityRole="button"
            accessibilityLabel={kk.features.hatimTitle}
          >
            <View style={[styles.hatimIcon, { backgroundColor: colors.bg }]}>
              <Text style={styles.hatimEmoji}>📗</Text>
            </View>
            <View style={styles.hatimTxtCol}>
              <Text style={styles.hatimTitle}>{kk.features.hatimTitle}</Text>
              <Text style={styles.hatimSub}>{kk.quran.hatimInQuranHint}</Text>
            </View>
            <Text style={styles.hatimChev}>›</Text>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => {
        const arName = item.name.trim() ? item.name : surahArabicFromBundled(item.number);
        return (
          <Pressable
            style={({ pressed }) => [styles.cell, pressed && { opacity: 0.85 }]}
            onPress={() =>
              navigation.navigate("QuranSurah", {
                surahNumber: item.number,
                englishName: surahDisplayTitle(item.number, item.englishName),
                arabicName: arName,
              })
            }
          >
            <View style={styles.cellRow1}>
              <Text style={styles.num}>{item.number}</Text>
              <Text style={styles.kkTitle} numberOfLines={2}>
                {surahDisplayTitle(item.number, item.englishName)}
              </Text>
            </View>
            <Text style={styles.ar} numberOfLines={1}>
              {arName}
            </Text>
            <Text style={styles.ayahs}>
              {item.numberOfAyahs ?? "—"} {kk.quran.ayahs}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

function makeStyles(colors: import("../theme/colors").ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    pad: { paddingHorizontal: 8, paddingBottom: 40 },
    listHeader: { paddingHorizontal: 4, marginBottom: 4 },
    hatimRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 10,
      gap: 10,
    },
    hatimIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    hatimEmoji: { fontSize: 20 },
    hatimTxtCol: { flex: 1, minWidth: 0 },
    hatimTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
    hatimSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
    hatimChev: { color: colors.muted, fontSize: 22, fontWeight: "200" },
    colWrap: { gap: 8, paddingHorizontal: 4, marginBottom: 8 },
    cacheBanner: {
      color: colors.accent,
      fontSize: 12,
      marginBottom: 10,
      padding: 10,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    center: {
      flex: 1,
      backgroundColor: colors.bg,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    err: { color: colors.error, textAlign: "center", marginBottom: 8 },
    muted: { color: colors.muted },
    cell: {
      flex: 1,
      minWidth: 0,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cellRow1: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 2,
    },
    num: {
      fontSize: 12,
      fontWeight: "800",
      color: colors.accent,
      minWidth: 22,
    },
    kkTitle: {
      color: colors.text,
      fontWeight: "700",
      fontSize: 13,
      flex: 1,
      lineHeight: 17,
    },
    ar: {
      color: colors.muted,
      fontSize: 11,
      writingDirection: "rtl",
      textAlign: "right",
    },
    ayahs: { color: colors.muted, fontSize: 9, marginTop: 2 },
  });
}
