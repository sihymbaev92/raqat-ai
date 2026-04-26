import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Linking,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { isSurahBookmarked, toggleBookmarkSurah } from "../storage/quranBookmarks";
import {
  loadSurahAyahsCache,
  saveSurahAyahsCache,
  parseAyahsFromApiResponse,
  parseAyahsFromPlatformPayload,
  mergeAyahsPreserveOfflineExtras,
  type CachedAyah,
} from "../storage/quranSurahCache";
import { getRaqatApiBase, isRaqatApiOnlyMode } from "../config/raqatApiBase";
import { fetchPlatformQuranSurah } from "../services/platformApiClient";
import { getValidAccessToken } from "../storage/authTokens";
import { seedBundledQuranCachesIfNeeded } from "../services/bundledQuranSeed";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import { surahArabicFromBundled } from "../constants/surahBundledMeta";
import { loadQuranListCache } from "../storage/quranListCache";
import { AYAH_COUNTS_PER_SURAH } from "../data/quranAyahCounts";
import { recordHatimAyahTapped } from "../storage/hatimProgress";
import { transliterateArabicToKazakh } from "../utils/arabicTranslitKk";
import { getQuranTranslitOverride } from "../content/quranTranslitOverrides";

type Props = NativeStackScreenProps<MoreStackParamList, "QuranSurah">;

const surahUrl = (n: number) =>
  `https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`;

/** Бандл/API translit: тек қазақ кирилл болса қолданылады (латын en.transliteration — өткізіледі). */
function bundledKkTranslitOrEmpty(tr: string | undefined): string {
  const s = (tr ?? "").trim();
  if (!s) return "";
  const hasCy = /[а-яА-ЯәғқңөүұҺһіІ]/i.test(s);
  const hasLat = /[a-zA-Z]/.test(s);
  if (hasLat && !hasCy) return "";
  return hasCy ? s : "";
}

export function QuranSurahScreen({ route, navigation }: Props) {
  const { surahNumber, initialAyah: initialAyahParam } = route.params;
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<CachedAyah>>(null);
  const titleKk = useMemo(
    () => surahDisplayTitle(surahNumber, route.params.englishName ?? ""),
    [surahNumber, route.params.englishName]
  );
  const [arabicTitle, setArabicTitle] = useState(
    () => (route.params.arabicName?.trim() ? route.params.arabicName : surahArabicFromBundled(surahNumber))
  );
  const { colors, isDark } = useAppTheme();
  const [ayahs, setAyahs] = useState<CachedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const b = await isSurahBookmarked(surahNumber);
      if (alive) setBookmarked(b);
    })();
    return () => {
      alive = false;
    };
  }, [surahNumber]);

  useEffect(() => {
    const fromRoute = route.params.arabicName?.trim();
    if (fromRoute) {
      setArabicTitle(fromRoute);
      return;
    }
    const bundled = surahArabicFromBundled(surahNumber);
    if (bundled) setArabicTitle(bundled);
    let cancelled = false;
    void loadQuranListCache().then((c) => {
      if (cancelled) return;
      const hit = c?.list?.find((s) => s.number === surahNumber);
      if (hit?.name?.trim()) setArabicTitle(hit.name);
    });
    return () => {
      cancelled = true;
    };
  }, [surahNumber, route.params.arabicName]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={async () => {
            const next = await toggleBookmarkSurah(surahNumber);
            setBookmarked(next);
          }}
          style={{ paddingHorizontal: 12 }}
        >
          <Text style={{ color: colors.accent, fontSize: 22 }}>
            {bookmarked ? "★" : "☆"}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, bookmarked, surahNumber, colors.accent]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: titleKk });
  }, [navigation, titleKk]);

  const fetchRemote = useCallback(async () => {
    const base = getRaqatApiBase();
    const apiOnly = isRaqatApiOnlyMode();
    const bearer = ((await getValidAccessToken()) ?? "").trim() || undefined;
    if (base) {
      try {
        const data = await fetchPlatformQuranSurah(base, surahNumber, {
          authorizationBearer: bearer,
        });
        const fromPl = parseAyahsFromPlatformPayload(data);
        if (fromPl?.length) {
          const prev = await loadSurahAyahsCache(surahNumber);
          const merged = mergeAyahsPreserveOfflineExtras(fromPl, prev?.ayahs);
          setAyahs(merged);
          setFromCache(false);
          setErr(null);
          await saveSurahAyahsCache(surahNumber, merged);
          return;
        }
      } catch (e) {
        if (apiOnly) throw e;
      }
    } else if (apiOnly) {
      throw new Error(kk.quran.apiOnlyRequired);
    }
    if (apiOnly) throw new Error(kk.quran.apiOnlyRequired);
    const r = await fetch(surahUrl(surahNumber));
    const j = await r.json();
    const parsed = parseAyahsFromApiResponse(j);
    if (!parsed?.length) throw new Error(kk.quran.ayahError);
    const prev = await loadSurahAyahsCache(surahNumber);
    const merged = mergeAyahsPreserveOfflineExtras(parsed, prev?.ayahs);
    setAyahs(merged);
    setFromCache(false);
    setErr(null);
    await saveSurahAyahsCache(surahNumber, merged);
  }, [surahNumber]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      let hadCached = false;
      const cached = await loadSurahAyahsCache(surahNumber);
      if (mounted && cached?.ayahs?.length) {
        hadCached = true;
        setAyahs(cached.ayahs);
        setFromCache(true);
        setLoading(false);
      }

      const applySeed = async () => {
        try {
          await seedBundledQuranCachesIfNeeded();
        } catch {
          /* кеш бандлдан толтыру сәтсіз */
        }
        if (!mounted) return;
        const afterSeed = await loadSurahAyahsCache(surahNumber);
        if (afterSeed?.ayahs?.length && mounted) {
          hadCached = true;
          setAyahs(afterSeed.ayahs);
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
      if (!mounted) return;

      try {
        await fetchRemote();
      } catch (e) {
        if (mounted && !hadCached) {
          const again = await loadSurahAyahsCache(surahNumber);
          if (again?.ayahs?.length) {
            setAyahs(again.ayahs);
            setFromCache(true);
            setErr(null);
          } else {
            setErr(e instanceof Error ? e.message : kk.quran.ayahError);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [surahNumber, fetchRemote]);

  const ayahCountForSurah = useMemo(() => {
    const i = surahNumber - 1;
    if (i >= 0 && i < AYAH_COUNTS_PER_SURAH.length) return AYAH_COUNTS_PER_SURAH[i];
    return 0;
  }, [surahNumber]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const target = initialAyahParam;
    if (!target || !ayahs.length) return;
    const idx = ayahs.findIndex((a) => a.numberInSurah === target);
    if (idx < 0) return;
    const id = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: idx, viewPosition: 0.12 });
    }, 450);
    return () => clearTimeout(id);
  }, [initialAyahParam, ayahs]);

  const onAyahPress = useCallback(
    async (ayahNum: number) => {
      const total =
        ayahCountForSurah > 0
          ? ayahCountForSurah
          : ayahs.length > 0
            ? ayahs.length
            : 1;
      try {
        const { completedSurah } = await recordHatimAyahTapped(surahNumber, ayahNum, total);
        setToast(
          completedSurah ? kk.hatim.surahCompletedToast : kk.hatim.ayahProgressSaved
        );
      } catch {
        setToast(kk.hatim.ayahProgressSaved);
      }
    },
    [ayahs.length, ayahCountForSurah, surahNumber]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchRemote();
    } catch {
      /* кеш мәтіні қалсын */
    } finally {
      setRefreshing(false);
    }
  }, [fetchRemote]);

  const styles = useMemo(() => makeStyles(colors, isDark), [colors, isDark]);

  const openAudio = () => {
    const n = String(surahNumber).padStart(3, "0");
    Linking.openURL(
      `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${n}.mp3`
    );
  };

  const openSite = () => {
    Linking.openURL(`https://quran.com/${surahNumber}`);
  };

  if (loading && !ayahs.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>{kk.quran.ayahLoading}</Text>
      </View>
    );
  }

  if (err && !ayahs.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {toast ? (
        <View style={[styles.toastWrap, { bottom: 12 + insets.bottom }]}>
          <Text style={styles.toastTxt}>{toast}</Text>
        </View>
      ) : null}
      <View style={styles.meta}>
        {fromCache ? <Text style={styles.cacheBanner}>{kk.common.fromCache}</Text> : null}
        <Text style={styles.en}>{titleKk}</Text>
        {arabicTitle ? <Text style={styles.ar}>{arabicTitle}</Text> : null}
        <View style={styles.actions}>
          <Pressable style={styles.linkBtn} onPress={openAudio}>
            <Text style={styles.linkTxt}>{kk.quran.audioOpen}</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={openSite}>
            <Text style={styles.linkTxt}>quran.com</Text>
          </Pressable>
        </View>
        {ayahs.length > 0 && !ayahs.some((a) => a.textKk && a.textKk.trim()) ? (
          <Text style={styles.apiHint}>{kk.quran.kkApiHint}</Text>
        ) : null}
        <Text style={styles.hatimHint}>{kk.hatim.tapAyahHint}</Text>
      </View>
      <FlatList
        ref={listRef}
        data={ayahs}
        keyExtractor={(a) => String(a.numberInSurah)}
        contentContainerStyle={styles.pad}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            listRef.current?.scrollToIndex({
              index: info.index,
              viewPosition: 0.12,
              animated: true,
            });
          }, 350);
        }}
        renderItem={({ item }) => {
          const kkLine = item.textKk?.trim() ?? "";
          const fromBundle = bundledKkTranslitOrEmpty(item.translit);
          const kirilRead =
            getQuranTranslitOverride(surahNumber, item.numberInSurah) ??
            (fromBundle || transliterateArabicToKazakh(item.text));
          const showFallbackHint = !kkLine;
          return (
            <Pressable
              onPress={() => void onAyahPress(item.numberInSurah)}
              style={({ pressed }) => [styles.ayahRow, pressed && styles.ayahRowPressed]}
              accessibilityRole="button"
              accessibilityLabel={`${item.numberInSurah}-аят`}
            >
              <Text style={styles.ayahNum}>{item.numberInSurah}</Text>
              <View style={styles.ayahCol}>
                <View style={styles.ayahArBlock}>
                  <Text style={styles.ayahTxt}>{item.text}</Text>
                </View>
                {kirilRead ? (
                  <>
                    <Text style={styles.kirilLabel}>Оқылуы (қаз. кирилл)</Text>
                    <Text style={styles.ayahKiril}>{kirilRead}</Text>
                  </>
                ) : null}
                {kkLine ? (
                  <>
                    <Text style={styles.meaningLabel}>{kk.quran.meaningKk}</Text>
                    <Text style={styles.ayahKk}>{kkLine}</Text>
                  </>
                ) : null}
                {showFallbackHint ? (
                  <Text style={styles.noKkHint}>{kk.quran.arabicOnlyReadingHint}</Text>
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.bg,
      padding: 24,
    },
    muted: { color: colors.muted, marginTop: 12 },
    err: { color: colors.error },
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
    meta: {
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    en: { color: colors.scriptureMeaningKk, fontWeight: "700", fontSize: 16 },
    ar: {
      color: colors.scriptureArabic,
      fontSize: 18,
      marginTop: 4,
      writingDirection: "rtl",
      textAlign: "right",
    },
    apiHint: {
      marginTop: 10,
      color: colors.muted,
      fontSize: 11,
      lineHeight: 16,
    },
    hatimHint: {
      marginTop: 10,
      fontSize: 11,
      lineHeight: 16,
      color: colors.accent,
      fontWeight: "600",
    },
    toastWrap: {
      position: "absolute",
      left: 16,
      right: 16,
      zIndex: 50,
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.accent,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
    toastTxt: { color: colors.text, fontSize: 14, fontWeight: "700", textAlign: "center" },
    actions: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
    linkBtn: {
      backgroundColor: colors.card,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 10,
      marginBottom: 8,
    },
    linkTxt: { color: colors.accent, fontWeight: "600", fontSize: 13 },
    pad: { padding: 12, paddingBottom: 40 },
    ayahCol: { flex: 1, minWidth: 0 },
    ayahArBlock: {
      width: "100%",
      alignItems: "flex-end",
    },
    ayahRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 14,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 8,
      marginHorizontal: -8,
    },
    ayahRowPressed: {
      backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
    },
    ayahNum: {
      color: colors.accent,
      fontSize: 12,
      fontWeight: "800",
      minWidth: 28,
      marginRight: 10,
    },
    ayahTxt: {
      color: colors.scriptureArabic,
      fontSize: 17,
      lineHeight: 30,
      writingDirection: "rtl",
      textAlign: "right",
    },
    meaningLabel: {
      marginTop: 8,
      fontSize: 11,
      fontWeight: "800",
      color: colors.accent,
      letterSpacing: 0.2,
    },
    kirilLabel: {
      marginTop: 8,
      fontSize: 11,
      fontWeight: "800",
      color: colors.accent,
      letterSpacing: 0.2,
    },
    ayahKiril: {
      marginTop: 4,
      color: colors.scriptureTranslit,
      fontSize: 15,
      lineHeight: 23,
      textAlign: "left",
    },
    noKkHint: {
      marginTop: 10,
      fontSize: 12,
      lineHeight: 18,
      color: colors.muted,
    },
    ayahKk: {
      marginTop: 4,
      color: colors.scriptureMeaningKk,
      fontSize: 17,
      lineHeight: 27,
      textAlign: "left",
    },
  });
}
