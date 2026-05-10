import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  Switch,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable } from "@/ui/Pressable";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import * as ScreenOrientation from "expo-screen-orientation";
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
  mergeTajweedTaggedIntoAyahs,
  type CachedAyah,
} from "../storage/quranSurahCache";
import { getRaqatApiBase, isRaqatApiOnlyMode } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { fetchPlatformQuranSurah } from "../services/platformApiClient";
import { getValidAccessToken } from "../storage/authTokens";
import { seedBundledQuranCachesIfNeeded } from "../services/bundledQuranSeed";
import { mergeBundledKkMeaningsIfMissing } from "../services/quranKkBundledLookup";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import { juzForSurahAyah } from "../data/quranJuzBoundaries";
import { surahAyahToGlobalOneBased } from "../data/quranAyahCounts";
import { approxMedinaPageFromGlobalAyahOneBased, hizbForGlobalAyahOneBased } from "../data/quranHizbBoundaries";
import { QURAN_RECITER_OPTIONS, DEFAULT_QURAN_RECITER_EDITION, normalizeReciterEdition } from "../config/quranReciters";
import {
  QURAN_ARABIC_FONT_PRESETS,
  DEFAULT_QURAN_ARABIC_FONT_PRESET,
  normalizeArabicFontPreset,
  quranArabicAyahTextMetrics,
  type QuranArabicFontPresetId,
} from "../config/quranArabicFontPresets";
import { loadQuranBookFonts } from "../fonts/quranBookFonts";
import { quranAyahMp3Url } from "../services/quranSudaisAudio";
import { getQuranTranslitOverride } from "../content/quranTranslitOverrides";
import { resolveQuranTranslitForDisplay } from "../utils/quranTranslitDisplay";
import { TajweedColoredArabicText } from "../components/TajweedColoredArabicText";
import { KazakhOrnamentBand } from "../components/KazakhOrnamentBand";
import { tajweedColorForGroup, type TajweedColorGroup } from "../utils/alquranTajweedParse";
import { surahArabicBannerTitle } from "../data/surahArabicTitles";

type Props = NativeStackScreenProps<MoreStackParamList, "QuranSurah">;
const QURAN_TAJWEED_COLORS_KEY = "quran_tajweed_colors_enabled_v1";
const QURAN_READER_SHOW_ARABIC_KEY = "quran_reader_show_arabic_v1";
const QURAN_READER_SHOW_TRANSLIT_KEY = "quran_reader_show_translit_v1";
const QURAN_READER_SHOW_MEANING_KEY = "quran_reader_show_meaning_v1";
const QURAN_READER_RECITER_KEY = "quran_reader_reciter_edition_v1";
const QURAN_READER_ARABIC_FONT_KEY = "quran_reader_arabic_font_preset_v1";
const QURAN_READER_ALLOW_ROTATION_KEY = "quran_reader_allow_rotation_v1";

const surahUrl = (n: number) =>
  `https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`;

const surahTajweedUrl = (n: number) => `https://api.alquran.cloud/v1/surah/${n}/quran-tajweed`;

const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Хатым кітап стилі (жарық): скриндегі крем бет + таупе жолағы. */
const MUSHAF_LIGHT_TAUPE = "#A68E74";
const MUSHAF_LIGHT_PAGE = "#FDF6E9";
const MUSHAF_LIGHT_DESK = "#EBE4D4";

function toEasternArabicIndic(n: number): string {
  return String(Math.max(0, Math.floor(n)))
    .split("")
    .map((ch) => {
      const d = ch.charCodeAt(0) - 48;
      return d >= 0 && d <= 9 ? EASTERN_ARABIC_DIGITS[d]! : ch;
    })
    .join("");
}

/** Мушафтағы Uthmani жазу (9-сүреде жоқ; 1-сүреде 1-аяттың ішінде). */
const QURAN_STANDALONE_BISMILLAH_UTSMANI = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

function shouldShowMushafBismillahBanner(surahNumber: number): boolean {
  if (surahNumber === 9) return false;
  if (surahNumber === 1) return false;
  return true;
}

async function enrichAyahsWithAlquranTajweed(surahNum: number, ayahs: CachedAyah[]): Promise<CachedAyah[]> {
  try {
    const rt = await fetch(surahTajweedUrl(surahNum));
    if (!rt.ok) return ayahs;
    const jt = await rt.json();
    const tagged = parseAyahsFromApiResponse(jt);
    return mergeTajweedTaggedIntoAyahs(ayahs, tagged);
  } catch {
    return ayahs;
  }
}

export function QuranSurahScreen({ route, navigation }: Props) {
  const { surahNumber, initialAyah: initialAyahParam, mushafLayout: mushafLayoutParam } = route.params;
  const mushafLayout = Boolean(mushafLayoutParam);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<CachedAyah>>(null);
  const titleKk = useMemo(
    () => surahDisplayTitle(surahNumber, route.params.englishName ?? ""),
    [surahNumber, route.params.englishName]
  );
  /** Ayah қолданбасындағы сияқты жоғарғы жол: латын атау (API englishName). */
  const latinHeaderTitle = useMemo(() => {
    const raw = (route.params.englishName ?? "").trim().replace(/-/g, " ");
    if (!raw) return titleKk;
    return raw.replace(/\b\w/g, (c) => c.toUpperCase());
  }, [route.params.englishName, titleKk]);
  const juzAtSurahOpening = useMemo(
    () => juzForSurahAyah(surahNumber, initialAyahParam ?? 1),
    [surahNumber, initialAyahParam]
  );
  const surahArabicTitleLine = useMemo(() => surahArabicBannerTitle(surahNumber), [surahNumber]);
  const mushafFooterAnchorGlobal = useMemo(
    () => surahAyahToGlobalOneBased(surahNumber, initialAyahParam ?? 1),
    [surahNumber, initialAyahParam]
  );
  const mushafFooterHizb = useMemo(
    () => hizbForGlobalAyahOneBased(mushafFooterAnchorGlobal),
    [mushafFooterAnchorGlobal]
  );
  const mushafFooterPageApprox = useMemo(
    () => approxMedinaPageFromGlobalAyahOneBased(mushafFooterAnchorGlobal),
    [mushafFooterAnchorGlobal]
  );
  const { colors, isDark } = useAppTheme();
  const [ayahs, setAyahs] = useState<CachedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** Сол сүре ішіндегі аят нөмірі: дыбыс жүктелген (ойнап тұрған немесе тынытылған). */
  const [playingAyahInSurah, setPlayingAyahInSurah] = useState<number | null>(null);
  const [ayahAudioIsPlaying, setAyahAudioIsPlaying] = useState(false);
  const [loadingAyahAudio, setLoadingAyahAudio] = useState<number | null>(null);
  const [showTajweedColors, setShowTajweedColors] = useState(false);
  const [showReaderArabic, setShowReaderArabic] = useState(true);
  const [showReaderTranslit, setShowReaderTranslit] = useState(true);
  const [showReaderMeaning, setShowReaderMeaning] = useState(true);
  const [reciterEdition, setReciterEdition] = useState<string>(DEFAULT_QURAN_RECITER_EDITION);
  const [arabicFontPreset, setArabicFontPreset] = useState<QuranArabicFontPresetId>(DEFAULT_QURAN_ARABIC_FONT_PRESET);
  const [tajweedLegendOpen, setTajweedLegendOpen] = useState(false);
  const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);
  const [readerAllowRotation, setReaderAllowRotation] = useState(false);
  const [tajweedLoading, setTajweedLoading] = useState(false);
  const ayahsRef = useRef<CachedAyah[]>([]);
  const quranSoundRef = useRef<Audio.Sound | null>(null);

  ayahsRef.current = ayahs;

  useEffect(() => {
    void loadQuranBookFonts();
  }, []);

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
    let alive = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem(QURAN_TAJWEED_COLORS_KEY);
        if (alive) setShowTajweedColors(v === "1");
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [a, t, m] = await Promise.all([
          AsyncStorage.getItem(QURAN_READER_SHOW_ARABIC_KEY),
          AsyncStorage.getItem(QURAN_READER_SHOW_TRANSLIT_KEY),
          AsyncStorage.getItem(QURAN_READER_SHOW_MEANING_KEY),
        ]);
        if (!alive) return;
        let ar = a !== "0";
        let tr = t !== "0";
        let kk = m !== "0";
        if (!ar && !tr && !kk) {
          ar = tr = kk = true;
          await AsyncStorage.multiSet([
            [QURAN_READER_SHOW_ARABIC_KEY, "1"],
            [QURAN_READER_SHOW_TRANSLIT_KEY, "1"],
            [QURAN_READER_SHOW_MEANING_KEY, "1"],
          ]);
        }
        if (mushafLayout) {
          ar = true;
          tr = false;
          kk = false;
        }
        setShowReaderArabic(ar);
        setShowReaderTranslit(tr);
        setShowReaderMeaning(kk);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [mushafLayout]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [re, fp] = await Promise.all([
          AsyncStorage.getItem(QURAN_READER_RECITER_KEY),
          AsyncStorage.getItem(QURAN_READER_ARABIC_FONT_KEY),
        ]);
        if (!alive) return;
        setReciterEdition(normalizeReciterEdition(re));
        setArabicFontPreset(normalizeArabicFontPreset(fp));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await AsyncStorage.getItem(QURAN_READER_ALLOW_ROTATION_KEY);
        if (!alive) return;
        setReaderAllowRotation(r === "1");
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web") return undefined;
      void (async () => {
        try {
          if (readerAllowRotation) {
            await ScreenOrientation.unlockAsync();
          } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          }
        } catch {
          /* ignore */
        }
      })();
      return () => {
        void (async () => {
          try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          } catch {
            /* ignore */
          }
        })();
      };
    }, [readerAllowRotation])
  );

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const fetchRemote = useCallback(async () => {
    const base = getRaqatApiBase();
    const apiOnly = isRaqatApiOnlyMode();
    const bearer = ((await getValidAccessToken()) ?? "").trim() || undefined;
    if (base) {
      try {
        const data = await fetchPlatformQuranSurah(base, surahNumber, {
          contentSecret: getRaqatContentReadSecret(),
          authorizationBearer: bearer,
        });
        const fromPl = parseAyahsFromPlatformPayload(data);
        if (fromPl?.length) {
          const prev = await loadSurahAyahsCache(surahNumber);
          let merged = mergeAyahsPreserveOfflineExtras(fromPl, prev?.ayahs);
          merged = await enrichAyahsWithAlquranTajweed(surahNumber, merged);
          merged = mergeBundledKkMeaningsIfMissing(surahNumber, merged);
          setAyahs(merged);
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
    let merged = mergeAyahsPreserveOfflineExtras(parsed, prev?.ayahs);
    merged = await enrichAyahsWithAlquranTajweed(surahNumber, merged);
    merged = mergeBundledKkMeaningsIfMissing(surahNumber, merged);
    setAyahs(merged);
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
        setAyahs(mergeBundledKkMeaningsIfMissing(surahNumber, cached.ayahs));
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
          setAyahs(mergeBundledKkMeaningsIfMissing(surahNumber, afterSeed.ayahs));
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
            setAyahs(mergeBundledKkMeaningsIfMissing(surahNumber, again.ayahs));
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

  const onToggleTajweedColors = useCallback(
    async (next: boolean) => {
      setShowTajweedColors(next);
      try {
        await AsyncStorage.setItem(QURAN_TAJWEED_COLORS_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      if (!next) return;
      const cur = ayahsRef.current;
      if (!cur.length) return;
      if (cur.every((a) => (a.textTajweed ?? "").includes("["))) return;
      setTajweedLoading(true);
      try {
        const enriched = mergeBundledKkMeaningsIfMissing(
          surahNumber,
          await enrichAyahsWithAlquranTajweed(surahNumber, cur)
        );
        setAyahs(enriched);
        if (enriched.some((a) => (a.textTajweed ?? "").includes("["))) {
          await saveSurahAyahsCache(surahNumber, enriched);
        } else {
          setToast(kk.quran.tajweedLoadFailedHint);
        }
      } finally {
        setTajweedLoading(false);
      }
    },
    [surahNumber]
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

  const styles = useMemo(() => makeStyles(colors, isDark, arabicFontPreset), [colors, isDark, arabicFontPreset]);

  const showMushafBismillahBanner = useMemo(
    () => showReaderArabic && ayahs.length > 0 && shouldShowMushafBismillahBanner(surahNumber),
    [showReaderArabic, ayahs.length, surahNumber]
  );

  const stopAyahAudio = useCallback(async () => {
    const s = quranSoundRef.current;
    quranSoundRef.current = null;
    setPlayingAyahInSurah(null);
    setAyahAudioIsPlaying(false);
    if (!s) return;
    try {
      await s.stopAsync();
    } catch {
      /* */
    }
    try {
      await s.unloadAsync();
    } catch {
      /* */
    }
  }, []);

  const playAyahSudais = useCallback(
    async (ayahInSurah: number) => {
      const existing = quranSoundRef.current;
      if (playingAyahInSurah === ayahInSurah && existing) {
        try {
          const st = await existing.getStatusAsync();
          if (st.isLoaded) {
            if (st.isPlaying) {
              await existing.pauseAsync();
              setAyahAudioIsPlaying(false);
              return;
            }
            await existing.playAsync();
            setAyahAudioIsPlaying(true);
            return;
          }
        } catch {
          /* жүктелген дыбыс бұзылған — төменде қайта жүктейміз */
        }
        await stopAyahAudio();
      } else {
        await stopAyahAudio();
      }
      const globalN = surahAyahToGlobalOneBased(surahNumber, ayahInSurah);
      const uri = quranAyahMp3Url(globalN, reciterEdition);
      setLoadingAyahAudio(ayahInSurah);
      try {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            allowsRecordingIOS: false,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: true,
            staysActiveInBackground: false,
            playThroughEarpieceAndroid: false,
          });
        } catch {
          /* */
        }
        const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
        quranSoundRef.current = sound;
        setPlayingAyahInSurah(ayahInSurah);
        setAyahAudioIsPlaying(true);
        sound.setOnPlaybackStatusUpdate((st) => {
          if (!st.isLoaded) return;
          if (st.didJustFinish) {
            void stopAyahAudio();
            return;
          }
          setAyahAudioIsPlaying(!!st.isPlaying);
        });
      } catch {
        setToast(kk.quran.ayahAudioError);
      } finally {
        setLoadingAyahAudio(null);
      }
    },
    [playingAyahInSurah, stopAyahAudio, surahNumber, reciterEdition]
  );

  const reciterStopAudioGuard = useRef(false);
  useEffect(() => {
    if (!reciterStopAudioGuard.current) {
      reciterStopAudioGuard.current = true;
      return;
    }
    void stopAyahAudio();
  }, [reciterEdition, stopAyahAudio]);

  useEffect(() => {
    return () => {
      void stopAyahAudio();
    };
  }, [stopAyahAudio]);

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

  const mushafBookChrome = mushafLayout;

  const readerBody = (
    <>
      <View style={[styles.topBar, mushafLayout && styles.mushafTopBar, { paddingTop: insets.top + 2 }]}>
        <Pressable
          style={[styles.topBarBtn, mushafLayout && styles.mushafTopBarBtn]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Артқа қайту"
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={mushafLayout && !isDark ? MUSHAF_LIGHT_TAUPE : colors.accent}
          />
        </Pressable>
        <View style={styles.topBarMid}>
          {mushafLayout ? (
            <>
              <Text style={styles.mushafTopSurahLatin} numberOfLines={1}>
                {latinHeaderTitle}
              </Text>
              <Text style={styles.mushafTopJuzPart} numberOfLines={1}>
                {kk.quran.readerJuzPart(juzAtSurahOpening)}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.topBarSurahLatin} numberOfLines={1}>
                {latinHeaderTitle}
              </Text>
              <Text style={styles.topBarJuzPart} numberOfLines={1}>
                {kk.quran.readerJuzPart(juzAtSurahOpening)}
              </Text>
            </>
          )}
        </View>
        <View style={styles.topBarRight}>
          <Pressable
            style={[styles.topBarBtn, mushafLayout && styles.mushafTopBarBtn]}
            onPress={() => setReaderSettingsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={kk.quran.readerSettingsA11y}
          >
            <MaterialIcons
              name="menu"
              size={22}
              color={mushafLayout && !isDark ? MUSHAF_LIGHT_TAUPE : colors.accent}
            />
          </Pressable>
          <Pressable
            style={[styles.topBarBtn, mushafLayout && styles.mushafTopBarBtn]}
            onPress={async () => {
              const next = await toggleBookmarkSurah(surahNumber);
              setBookmarked(next);
            }}
            accessibilityRole="button"
            accessibilityLabel={bookmarked ? "Белгіден алу" : "Белгілеу"}
          >
            <Text
              style={[
                styles.topBarStar,
                mushafLayout && !isDark ? { color: MUSHAF_LIGHT_TAUPE } : null,
              ]}
            >
              {bookmarked ? "★" : "☆"}
            </Text>
          </Pressable>
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={ayahs}
        keyExtractor={(a) => String(a.numberInSurah)}
        extraData={{
          playingAyahInSurah,
          loadingAyahAudio,
          ayahAudioIsPlaying,
          showTajweedColors,
          tajweedLoading,
          showReaderArabic,
          showReaderTranslit,
          showReaderMeaning,
          arabicFontPreset,
          reciterEdition,
          showMushafBismillahBanner,
          mushafLayout,
          mushafFooterHizb,
          mushafFooterPageApprox,
        }}
        ListHeaderComponent={
          <View>
            {mushafLayout && surahArabicTitleLine ? (
              <View style={styles.mushafSurahTitleBlock}>
                <KazakhOrnamentBand colors={colors} compact tone="quranGold" bleed={12} />
                <View style={styles.mushafSurahTitlePaper}>
                  <Text style={styles.mushafSurahTitleAr} accessibilityRole="header">
                    {surahArabicTitleLine}
                  </Text>
                </View>
              </View>
            ) : null}
            {showMushafBismillahBanner ? (
              <View
                style={[styles.bismillahBanner, mushafLayout && styles.mushafBismillahBanner]}
                accessibilityRole="text"
                accessibilityLabel={kk.quran.readerBismillahBannerA11y}
              >
                <Text style={[styles.bismillahBannerTxt, mushafLayout && styles.mushafBismillahBannerTxt]}>
                  {QURAN_STANDALONE_BISMILLAH_UTSMANI}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListFooterComponent={
          mushafLayout && ayahs.length ? (
            <View style={styles.mushafFooter}>
              <View
                style={styles.mushafFooterPill}
                accessibilityLabel={`${kk.quran.mushafFooterHizb(mushafFooterHizb)} · ${kk.quran.mushafFooterPageA11y}`}
              >
                <Text style={styles.mushafFooterPillHizb} numberOfLines={1}>
                  {kk.quran.mushafFooterHizb(mushafFooterHizb)}
                </Text>
                <View style={styles.mushafFooterSep} />
                <View style={styles.mushafFooterPillNumWrap}>
                  <Text style={styles.mushafFooterPillNum}>{toEasternArabicIndic(mushafFooterPageApprox)}</Text>
                </View>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.pad,
          mushafLayout && styles.mushafListPad,
          { paddingBottom: (mushafLayout ? 20 : 40) + insets.bottom },
        ]}
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
        showsVerticalScrollIndicator={!mushafLayout}
        style={mushafLayout ? styles.mushafBookFlatList : undefined}
        renderItem={({ item }) => {
          const kkLine = item.textKk?.trim() ?? "";
          const kirilRead =
            getQuranTranslitOverride(surahNumber, item.numberInSurah) ??
            resolveQuranTranslitForDisplay(item.translit, item.text);
          const showFallbackHint = showReaderMeaning && !kkLine;
          const ayahN = item.numberInSurah;
          const hasLoadedAudio = playingAyahInSurah === ayahN;
          const isPlayingNow = hasLoadedAudio && ayahAudioIsPlaying;
          const isLoad = loadingAyahAudio === ayahN;
          const audioA11y = isLoad
            ? kk.quran.ayahPlaySudaisA11y(ayahN)
            : isPlayingNow
              ? kk.quran.ayahPauseSudaisA11y(ayahN)
              : hasLoadedAudio
                ? kk.quran.ayahResumeSudaisA11y(ayahN)
                : kk.quran.ayahPlaySudaisA11y(ayahN);
          const isAudioFocus = hasLoadedAudio || isLoad;
          const showArBlock =
            showReaderArabic &&
            (showTajweedColors && (item.textTajweed ?? "").includes("[") ? true : Boolean(item.text?.trim()));
          const arabicBody =
            showArBlock ? (
              <Pressable
                onPress={() => void playAyahSudais(ayahN)}
                disabled={isLoad}
                style={({ pressed }) => [
                  mushafLayout ? styles.mushafAyahArabicTap : styles.ayahArabicTap,
                  !mushafLayout && pressed && !isLoad && styles.ayahArabicTapPressed,
                  mushafLayout && pressed && !isLoad && styles.mushafAyahArabicTapPressed,
                  isLoad && styles.ayahArabicTapDisabled,
                ]}
                accessibilityRole="button"
                accessibilityState={{ busy: isLoad }}
                accessibilityLabel={audioA11y}
              >
                {showTajweedColors && (item.textTajweed ?? "").includes("[") ? (
                  <TajweedColoredArabicText
                    taggedText={item.textTajweed!}
                    baseStyle={mushafLayout ? styles.mushafAyahTxt : styles.ayahTxt}
                    isDark={isDark}
                  />
                ) : (
                  <Text style={mushafLayout ? styles.mushafAyahTxt : styles.ayahTxt}>{item.text}</Text>
                )}
                {isLoad ? (
                  <View style={styles.ayahArabicLoadingOverlay} pointerEvents="none">
                    <ActivityIndicator size="small" color={colors.accent} />
                  </View>
                ) : null}
              </Pressable>
            ) : null;

          if (mushafLayout) {
            return (
              <View style={[styles.mushafAyahRow, isAudioFocus && styles.ayahRowAudioFocus]}>
                <View style={styles.mushafAyahArabicCluster} accessible={false}>
                  <View
                    style={styles.mushafAyahMarkerOuter}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <View style={styles.mushafAyahMarkerInner}>
                      <Text style={styles.mushafAyahMarkerTxt}>{toEasternArabicIndic(ayahN)}</Text>
                    </View>
                  </View>
                  <View style={styles.mushafAyahArabicWrap}>{arabicBody}</View>
                </View>
                <View style={styles.ayahBelowArabic}>
                  {showReaderTranslit && kirilRead ? (
                    <>
                      <Text style={styles.ayahSectionCaption}>{kk.quran.translitCaption}</Text>
                      <Text style={styles.ayahKiril}>{kirilRead}</Text>
                    </>
                  ) : null}
                  {showReaderMeaning && kkLine ? (
                    <>
                      <Text style={styles.ayahSectionCaption}>{kk.quran.meaningKk}</Text>
                      <Text style={styles.ayahKk}>{kkLine}</Text>
                    </>
                  ) : null}
                  {showFallbackHint ? <Text style={styles.noKkHint}>{kk.quran.arabicOnlyReadingHint}</Text> : null}
                </View>
              </View>
            );
          }

          return (
            <View style={[styles.ayahRow, isAudioFocus && styles.ayahRowAudioFocus]}>
              <Text style={styles.ayahIndexInline}>{`${surahNumber}:${ayahN}`}</Text>
              <View style={styles.ayahMainTap} accessible={false}>
                <View style={styles.ayahCol}>
                  {showArBlock ? <View style={styles.ayahArBlock}>{arabicBody}</View> : null}
                  <View style={styles.ayahBelowArabic}>
                    {showReaderTranslit && kirilRead ? (
                      <>
                        <Text style={styles.ayahSectionCaption}>{kk.quran.translitCaption}</Text>
                        <Text style={styles.ayahKiril}>{kirilRead}</Text>
                      </>
                    ) : null}
                    {showReaderMeaning && kkLine ? (
                      <>
                        <Text style={styles.ayahSectionCaption}>{kk.quran.meaningKk}</Text>
                        <Text style={styles.ayahKk}>{kkLine}</Text>
                      </>
                    ) : null}
                    {showFallbackHint ? <Text style={styles.noKkHint}>{kk.quran.arabicOnlyReadingHint}</Text> : null}
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
    </>
  );

  return (
    <View
      style={[
        styles.root,
        mushafBookChrome && !isDark && styles.mushafBookDesk,
        mushafBookChrome && isDark && styles.mushafBookDeskDark,
      ]}
    >
      {toast ? (
        <View style={[styles.toastWrap, { bottom: 12 + insets.bottom }]}>
          <Text style={styles.toastTxt}>{toast}</Text>
        </View>
      ) : null}
      <Modal
        visible={readerSettingsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReaderSettingsOpen(false)}
      >
        <View style={styles.readerSettingsRoot}>
          <Pressable style={styles.readerSettingsBackdrop} onPress={() => setReaderSettingsOpen(false)} />
          <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
            <View style={styles.readerSettingsHandle} />
            <Text style={styles.readerSettingsTitle}>{kk.quran.readerSettingsTitle}</Text>
            <ScrollView
              style={{ maxHeight: Math.min(520, windowHeight * 0.58) }}
              contentContainerStyle={styles.readerSettingsScrollPad}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <Text style={styles.readerSectionSubtitle}>{kk.quran.readerShowContentTitle}</Text>
              <Text style={styles.readerSettingsHint}>{kk.quran.readerShowContentHint}</Text>
              <View style={styles.readerSettingRow}>
                <Text style={styles.readerSettingRowLabel}>{kk.quran.readerShowArabicLabel}</Text>
                <Switch
                  value={showReaderArabic}
                  onValueChange={(v) => {
                    if (!v && !showReaderTranslit && !showReaderMeaning) {
                      setToast(kk.quran.readerAtLeastOneBlock);
                      return;
                    }
                    setShowReaderArabic(v);
                    void AsyncStorage.setItem(QURAN_READER_SHOW_ARABIC_KEY, v ? "1" : "0");
                  }}
                  trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                  thumbColor={showReaderArabic ? colors.accent : colors.muted}
                  accessibilityLabel={kk.quran.readerShowArabicLabel}
                />
              </View>
              <View style={styles.readerSettingRow}>
                <Text style={styles.readerSettingRowLabel}>{kk.quran.readerShowTranslitLabel}</Text>
                <Switch
                  value={showReaderTranslit}
                  onValueChange={(v) => {
                    if (!v && !showReaderArabic && !showReaderMeaning) {
                      setToast(kk.quran.readerAtLeastOneBlock);
                      return;
                    }
                    setShowReaderTranslit(v);
                    void AsyncStorage.setItem(QURAN_READER_SHOW_TRANSLIT_KEY, v ? "1" : "0");
                  }}
                  trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                  thumbColor={showReaderTranslit ? colors.accent : colors.muted}
                  accessibilityLabel={kk.quran.readerShowTranslitLabel}
                />
              </View>
              <View style={styles.readerSettingRow}>
                <Text style={styles.readerSettingRowLabel}>{kk.quran.readerShowMeaningLabel}</Text>
                <Switch
                  value={showReaderMeaning}
                  onValueChange={(v) => {
                    if (!v && !showReaderArabic && !showReaderTranslit) {
                      setToast(kk.quran.readerAtLeastOneBlock);
                      return;
                    }
                    setShowReaderMeaning(v);
                    void AsyncStorage.setItem(QURAN_READER_SHOW_MEANING_KEY, v ? "1" : "0");
                  }}
                  trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                  thumbColor={showReaderMeaning ? colors.accent : colors.muted}
                  accessibilityLabel={kk.quran.readerShowMeaningLabel}
                />
              </View>

              <View style={[styles.readerSettingRow, { marginTop: 10 }]}>
                <Text style={styles.readerSettingRowLabel}>{kk.quran.readerAllowRotationLabel}</Text>
                <Switch
                  value={readerAllowRotation}
                  onValueChange={(v) => {
                    setReaderAllowRotation(v);
                    void AsyncStorage.setItem(QURAN_READER_ALLOW_ROTATION_KEY, v ? "1" : "0");
                  }}
                  trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                  thumbColor={readerAllowRotation ? colors.accent : colors.muted}
                  accessibilityLabel={kk.quran.readerAllowRotationLabel}
                />
              </View>
              <Text style={styles.readerSettingsHint}>{kk.quran.readerAllowRotationHint}</Text>

              <View style={styles.readerSectionDividerWrap}>
                <Text style={styles.readerSectionSubtitle}>{kk.quran.readerReciterTitle}</Text>
                <Text style={styles.readerSettingsHint}>{kk.quran.readerReciterHint}</Text>
                {QURAN_RECITER_OPTIONS.map((r) => {
                  const sel = reciterEdition === r.edition;
                  return (
                    <Pressable
                      key={r.edition}
                      style={({ pressed }) => [
                        styles.readerChoiceRow,
                        sel && styles.readerChoiceRowSelected,
                        pressed && { opacity: 0.88 },
                      ]}
                      onPress={() => {
                        setReciterEdition(r.edition);
                        void AsyncStorage.setItem(QURAN_READER_RECITER_KEY, r.edition);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      accessibilityLabel={r.labelKk}
                    >
                      <MaterialIcons
                        name={sel ? "check-circle" : "radio-button-unchecked"}
                        size={22}
                        color={sel ? colors.accent : colors.muted}
                      />
                      <Text style={styles.readerChoiceLabel}>{r.labelKk}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.readerSectionDividerWrap}>
                <Text style={styles.readerSectionSubtitle}>{kk.quran.readerArabicFontTitle}</Text>
                <Text style={styles.readerSettingsHint}>{kk.quran.readerArabicFontHint}</Text>
                {QURAN_ARABIC_FONT_PRESETS.map((p) => {
                  const sel = arabicFontPreset === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      style={({ pressed }) => [
                        styles.readerChoiceRow,
                        sel && styles.readerChoiceRowSelected,
                        pressed && { opacity: 0.88 },
                      ]}
                      onPress={() => {
                        setArabicFontPreset(p.id);
                        void AsyncStorage.setItem(QURAN_READER_ARABIC_FONT_KEY, p.id);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      accessibilityLabel={p.labelKk}
                    >
                      <MaterialIcons
                        name={sel ? "check-circle" : "radio-button-unchecked"}
                        size={22}
                        color={sel ? colors.accent : colors.muted}
                      />
                      <Text style={styles.readerChoiceLabel}>{p.labelKk}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.readerSettingRow, styles.readerSettingRowAfterContent]}>
                <Text style={styles.readerSettingRowLabel}>{kk.quran.tajweedModeLabel}</Text>
                <Switch
                  value={showTajweedColors}
                  onValueChange={(v) => void onToggleTajweedColors(v)}
                  trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                  thumbColor={showTajweedColors ? colors.accent : colors.muted}
                  accessibilityLabel={kk.quran.tajweedModeLabel}
                />
              </View>
              <Text style={styles.readerSettingsHint}>{kk.quran.tajweedModeHint}</Text>
              <Text style={styles.readerTajweedExplainShort}>{kk.quran.readerTajweedExplainShort}</Text>
              {tajweedLoading ? (
                <View style={styles.readerSettingsLoading}>
                  <ActivityIndicator size="small" color={colors.accent} />
                  <Text style={styles.readerSettingsLoadingTxt}>{kk.quran.tajweedLoading}</Text>
                </View>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.readerLegendBtn, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  setReaderSettingsOpen(false);
                  setTajweedLegendOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={kk.quran.readerOpenLegend}
              >
                <MaterialIcons name="palette" size={22} color={colors.accent} />
                <Text style={styles.readerLegendBtnTxt}>{kk.quran.readerOpenLegend}</Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.readerSettingsDoneBtn, pressed && { opacity: 0.92 }]}
                onPress={() => setReaderSettingsOpen(false)}
                accessibilityRole="button"
                accessibilityLabel={kk.common.done}
              >
                <Text style={styles.readerSettingsDoneTxt}>{kk.common.done}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={tajweedLegendOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTajweedLegendOpen(false)}
      >
        <View style={styles.legendBackdrop}>
          <Pressable style={styles.legendDismiss} onPress={() => setTajweedLegendOpen(false)} />
          <View style={styles.legendCard}>
            <Text style={styles.legendTitle}>{kk.quran.tajweedLegendTitle}</Text>
            <Text style={styles.legendIntro}>{kk.quran.tajweedLegendIntro}</Text>
            <ScrollView style={styles.legendScroll} showsVerticalScrollIndicator={false}>
              {(
                [
                  ["madd", kk.quran.tajweedLegendMadd],
                  ["qalqalah", kk.quran.tajweedLegendQalqalah],
                  ["ghunnahIkhfa", kk.quran.tajweedLegendGhunnah],
                  ["silent", kk.quran.tajweedLegendSilent],
                  ["hamzaWasl", kk.quran.tajweedLegendHamza],
                  ["lamShamsi", kk.quran.tajweedLegendLam],
                  ["other", kk.quran.tajweedLegendOther],
                ] as const
              ).map(([group, label]) => (
                <View key={group} style={styles.legendLine}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: tajweedColorForGroup(group as TajweedColorGroup, isDark) },
                    ]}
                  />
                  <Text style={styles.legendTxtMultiline}>{label}</Text>
                </View>
              ))}
              <Text style={styles.legendFoot}>{kk.quran.tajweedSourceNote}</Text>
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.legendCloseBtn, pressed && { opacity: 0.88 }]}
              onPress={() => setTajweedLegendOpen(false)}
            >
              <Text style={styles.legendCloseTxt}>{kk.quran.tajweedLegendClose}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {mushafBookChrome ? (
        <View
          style={[
            styles.mushafBookPageWrap,
            { paddingBottom: Math.max(6, Math.round(insets.bottom * 0.5)) },
          ]}
        >
          <View style={[styles.mushafBookPage, isDark && styles.mushafBookPageDark]}>{readerBody}</View>
        </View>
      ) : (
        readerBody
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean, arabicFontPreset: QuranArabicFontPresetId) {
  const uiBg = colors.bg;
  const uiCard = colors.card;
  const uiBorder = colors.border;
  const uiText = colors.text;
  const uiMuted = colors.muted;
  const quranGoldBorder = isDark ? "rgba(212, 175, 55, 0.42)" : "rgba(185,138,26,0.35)";
  const quranGoldSurface = isDark ? "rgba(212, 175, 55, 0.1)" : "rgba(185,138,26,0.09)";
  /** Аят арабы: нейтралды қара/ақ сия (алтын scriptureArabic емес). */
  const quranAyahArabicInk = isDark ? "#FAFAFA" : "#000000";
  /** Кітап бетіндегі Құран мәтіні: референстегі қара сия. */
  const mushafPageInk = isDark ? quranAyahArabicInk : "#000000";
  const mushafBrownMuted = isDark ? "rgba(90,74,58,0.72)" : MUSHAF_LIGHT_TAUPE;
  const mushafBrownStrong = isDark ? "rgba(55,44,34,0.88)" : "#5C4D3D";
  const mushafMarkerBorder = isDark ? "rgba(212, 175, 55, 0.45)" : "#C4A574";
  const mushafMarkerBg = isDark ? "rgba(212, 175, 55, 0.12)" : "#FFFEF7";
  /** Араб әрпі әдепкі sans қолданбасында жұқа көрінбеуі үшін — платформаға қарай орташа қалыңдық */
  const arabicLineFontFamily = Platform.select<string | undefined>({
    ios: undefined,
    android: "sans-serif-medium",
    default: undefined,
  });
  const arabAyahFont = quranArabicAyahTextMetrics(arabicFontPreset, arabicLineFontFamily);
  const mushafArabSize =
    typeof arabAyahFont.fontSize === "number" ? Math.round(arabAyahFont.fontSize * 1.02) : undefined;
  /** Мушаф: арап жолдары мен аят блоктары арасын қысу (хатым оқу). */
  const mushafArabLineHeight =
    typeof arabAyahFont.lineHeight === "number" ? Math.round(arabAyahFont.lineHeight * 1.06) : undefined;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: uiBg },
    /** Кітап астындағы «үстел» — бет контрастта тұрады. */
    mushafBookDesk: {
      flex: 1,
      backgroundColor: MUSHAF_LIGHT_DESK,
    },
    mushafBookDeskDark: {
      flex: 1,
      backgroundColor: "#0D0C0B",
    },
    mushafBookPageWrap: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 6,
    },
    mushafBookPage: {
      flex: 1,
      backgroundColor: MUSHAF_LIGHT_PAGE,
      borderRadius: 4,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(45,36,24,0.12)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 6,
    },
    mushafBookPageDark: {
      backgroundColor: "#161513",
      borderColor: "rgba(255,255,255,0.08)",
      shadowOpacity: 0.35,
    },
    mushafBookFlatList: { flex: 1 },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: uiBg,
      padding: 24,
    },
    muted: { color: uiMuted, marginTop: 12 },
    err: { color: colors.error },
    topBar: {
      paddingHorizontal: 8,
      paddingBottom: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    /** Ayah: сол жақта сүре латын, оңда джуз. */
    topBarMid: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
      gap: 8,
    },
    topBarSurahLatin: {
      flex: 1,
      minWidth: 0,
      color: uiText,
      fontSize: 15,
      fontWeight: "800",
      letterSpacing: 0.15,
    },
    topBarJuzPart: {
      color: uiMuted,
      fontSize: 13,
      fontWeight: "800",
      flexShrink: 0,
    },
    topBarRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    topBarBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: quranGoldBorder,
      backgroundColor: quranGoldSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    topBarStar: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: "800",
      lineHeight: 20,
    },
    mushafTopBar: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(166,142,116,0.35)",
    },
    mushafTopBarBtn: {
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(166,142,116,0.45)",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(253,246,233,0.75)",
    },
    mushafTopSurahLatin: {
      flex: 1,
      minWidth: 0,
      color: isDark ? uiMuted : MUSHAF_LIGHT_TAUPE,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    mushafTopJuzPart: {
      flexShrink: 0,
      maxWidth: "46%",
      color: isDark ? uiMuted : MUSHAF_LIGHT_TAUPE,
      fontSize: 13,
      fontWeight: "600",
    },
    mushafSurahTitleBlock: {
      alignSelf: "stretch",
      alignItems: "center",
      paddingBottom: 2,
      marginBottom: 4,
    },
    mushafSurahTitlePaper: {
      alignSelf: "center",
      maxWidth: "96%",
      marginTop: -6,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(40,38,34,0.98)" : "#FFFEFB",
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(212,175,55,0.28)" : "rgba(166,142,116,0.55)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    mushafSurahTitleAr: {
      color: mushafPageInk,
      fontSize: 22,
      fontWeight: "700",
      writingDirection: "rtl",
      textAlign: "center",
      lineHeight: 28,
      letterSpacing: 0,
    },
    mushafBismillahBanner: {
      borderColor: isDark ? quranGoldBorder : "rgba(166,142,116,0.4)",
      backgroundColor: isDark ? quranGoldSurface : "rgba(253,246,233,0.65)",
      marginBottom: 12,
      paddingVertical: 12,
      paddingHorizontal: 10,
    },
    mushafBismillahBannerTxt: {
      textAlign: "center",
      color: mushafPageInk,
      fontSize:
        typeof arabAyahFont.fontSize === "number" ? Math.round(arabAyahFont.fontSize * 1.12) : 36,
      lineHeight:
        typeof arabAyahFont.lineHeight === "number" ? Math.round(arabAyahFont.lineHeight * 0.98) : 52,
      letterSpacing: 0,
    },
    mushafListPad: { paddingHorizontal: 20, paddingTop: 6 },
    mushafAyahRow: {
      marginBottom: 12,
      paddingVertical: 3,
      alignSelf: "stretch",
    },
    mushafAyahArabicCluster: {
      width: "100%",
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "center",
      gap: 4,
    },
    /** Сыртқы алтын сақина (мұсаф аят белгісі). */
    mushafAyahMarkerOuter: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 2,
      borderColor: mushafMarkerBorder,
      backgroundColor: isDark ? "transparent" : "rgba(196,165,116,0.14)",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 0,
    },
    mushafAyahMarkerInner: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: mushafMarkerBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: isDark ? 0 : StyleSheet.hairlineWidth,
      borderColor: "rgba(166,142,116,0.45)",
    },
    mushafAyahMarkerTxt: {
      color: mushafPageInk,
      fontSize: 11,
      fontWeight: "800",
    },
    mushafAyahArabicWrap: {
      flex: 1,
      minWidth: 0,
      maxWidth: "88%",
    },
    mushafAyahArabicTap: {
      position: "relative",
      alignSelf: "stretch",
      maxWidth: "100%",
    },
    mushafAyahArabicTapPressed: {
      backgroundColor: isDark ? "rgba(212,175,55,0.12)" : "rgba(185,138,26,0.08)",
      borderRadius: 12,
    },
    mushafAyahTxt: {
      color: mushafPageInk,
      writingDirection: "rtl",
      textAlign: "center",
      ...arabAyahFont,
      ...(mushafArabSize ? { fontSize: mushafArabSize } : null),
      ...(mushafArabLineHeight ? { lineHeight: mushafArabLineHeight } : null),
      letterSpacing: 0,
      ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
    },
    mushafFooter: {
      alignSelf: "stretch",
      alignItems: "flex-end",
      paddingTop: 10,
      paddingBottom: 4,
      paddingHorizontal: 4,
    },
    mushafFooterPill: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: isDark ? uiBorder : "rgba(166,142,116,0.5)",
      backgroundColor: isDark ? uiCard : "rgba(255,254,250,0.98)",
      overflow: "hidden",
    },
    mushafFooterSep: {
      width: StyleSheet.hairlineWidth,
      height: 22,
      backgroundColor: isDark ? uiBorder : "rgba(166,142,116,0.45)",
    },
    mushafFooterPillHizb: {
      fontSize: 12,
      fontWeight: "700",
      color: isDark ? uiMuted : mushafBrownMuted,
      maxWidth: 200,
      paddingVertical: 8,
      paddingLeft: 12,
      paddingRight: 8,
    },
    mushafFooterPillNumWrap: {
      justifyContent: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      minHeight: 38,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(166,142,116,0.22)",
    },
    mushafFooterPillNum: {
      fontSize: 16,
      fontWeight: "800",
      color: isDark ? uiText : mushafBrownStrong,
      textAlign: "center",
    },
    en: { color: uiText, fontWeight: "700", fontSize: 22, textAlign: "center" },
    ar: {
      color: uiMuted,
      fontSize: 15,
      marginTop: 8,
      writingDirection: "rtl",
      textAlign: "center",
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
    pad: { paddingHorizontal: 12, paddingBottom: 40 },
    ayahCol: { flex: 1, minWidth: 0 },
    ayahArBlock: {
      width: "100%",
      alignItems: "flex-end",
    },
    ayahRow: {
      alignItems: "stretch",
      marginBottom: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: uiBorder,
      backgroundColor: uiCard,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    /** Ayah: таңдалған / ойнап тұрған аят — сарғыш фон. */
    ayahRowAudioFocus: {
      backgroundColor: isDark ? "rgba(212, 175, 55, 0.16)" : "rgba(185, 138, 26, 0.14)",
      borderColor: isDark ? "rgba(212, 175, 55, 0.42)" : "rgba(185, 138, 26, 0.32)",
    },
    bismillahBanner: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
      paddingHorizontal: 14,
      marginBottom: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: quranGoldBorder,
      backgroundColor: quranGoldSurface,
    },
    bismillahBannerTxt: {
      color: quranAyahArabicInk,
      writingDirection: "rtl",
      textAlign: "center",
      ...arabAyahFont,
      fontSize:
        typeof arabAyahFont.fontSize === "number" ? Math.round(arabAyahFont.fontSize * 1.12) : 36,
      lineHeight:
        typeof arabAyahFont.lineHeight === "number" ? Math.round(arabAyahFont.lineHeight * 1.08) : 58,
      fontWeight: "500",
      letterSpacing: 0.5,
      ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
    },
    ayahMainTap: { minWidth: 0 },
    /** Дыбыс тек араб мәтінін басқанда */
    ayahArabicTap: {
      position: "relative",
      alignSelf: "stretch",
      maxWidth: "100%",
    },
    ayahArabicTapPressed: {
      backgroundColor: "rgba(185,138,26,0.1)",
      borderRadius: 12,
    },
    ayahArabicTapDisabled: { opacity: 0.85 },
    ayahArabicLoadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.4)",
    },
    ayahIndexInline: {
      color: uiMuted,
      fontSize: 12,
      marginBottom: 8,
      fontWeight: "700",
      textAlign: "center",
      width: "100%",
    },
    ayahTxt: {
      color: quranAyahArabicInk,
      writingDirection: "rtl",
      textAlign: "right",
      ...arabAyahFont,
      ...(Platform.OS === "android" ? { includeFontPadding: false } : {}),
    },
    /** Арабтан кейінгі оқылу + мағына: орталықтан (оқу қолданбаларының кең тараған түрі). */
    ayahBelowArabic: {
      width: "100%",
      marginTop: 10,
      alignItems: "center",
    },
    /** Транскрипция / мағына бөліктеріның қысқа тақырыбы */
    ayahSectionCaption: {
      marginTop: 12,
      marginBottom: 4,
      fontSize: 11,
      fontWeight: "600",
      color: uiMuted,
      letterSpacing: 0.2,
      textAlign: "center",
      width: "100%",
    },
    ayahKiril: {
      marginTop: 0,
      color: colors.scriptureTranslit,
      fontSize: 16,
      lineHeight: 26,
      textAlign: "center",
      fontWeight: "700",
      width: "100%",
    },
    noKkHint: {
      marginTop: 10,
      fontSize: 12,
      lineHeight: 18,
      color: uiMuted,
      textAlign: "center",
      width: "100%",
    },
    ayahKk: {
      marginTop: 0,
      color: colors.scriptureMeaningKk,
      fontSize: 17,
      lineHeight: 28,
      textAlign: "center",
      fontWeight: "700",
      width: "100%",
    },
    readerSettingsRoot: { flex: 1, justifyContent: "flex-end" },
    readerSettingsBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    readerSettingsSheet: {
      alignSelf: "stretch",
      marginHorizontal: 10,
      marginBottom: 6,
      backgroundColor: uiCard,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: uiBorder,
      paddingHorizontal: 18,
      paddingTop: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 12,
      elevation: 16,
    },
    readerSettingsHandle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)",
      marginBottom: 14,
    },
    readerSettingsTitle: {
      color: uiText,
      fontSize: 18,
      fontWeight: "900",
      textAlign: "center",
      marginBottom: 18,
    },
    readerSectionSubtitle: {
      color: uiText,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 6,
    },
    readerSettingsScrollPad: {
      paddingBottom: 8,
    },
    readerSectionDividerWrap: {
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    },
    readerChoiceRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: uiBorder,
      backgroundColor: uiBg,
    },
    readerChoiceRowSelected: {
      borderColor: colors.accent,
      backgroundColor: isDark ? "rgba(77,182,172,0.14)" : "rgba(21,128,61,0.1)",
    },
    readerChoiceLabel: {
      flex: 1,
      color: uiText,
      fontSize: 14,
      fontWeight: "700",
    },
    readerSettingRowAfterContent: {
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    },
    readerSettingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 4,
    },
    readerSettingRowLabel: {
      flex: 1,
      color: uiText,
      fontSize: 16,
      fontWeight: "800",
    },
    readerSettingsHint: {
      color: uiMuted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 8,
      marginBottom: 4,
    },
    readerTajweedExplainShort: {
      color: uiMuted,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
      marginBottom: 8,
      fontWeight: "600",
    },
    readerSettingsLoading: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 12,
      marginBottom: 4,
    },
    readerSettingsLoadingTxt: { color: uiMuted, fontSize: 12, fontWeight: "600", flex: 1 },
    readerLegendBtn: {
      marginTop: 14,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: quranGoldBorder,
      backgroundColor: quranGoldSurface,
    },
    readerLegendBtnTxt: {
      flex: 1,
      color: uiText,
      fontSize: 15,
      fontWeight: "800",
    },
    readerSettingsDoneBtn: {
      marginTop: 14,
      marginBottom: 4,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      backgroundColor: isDark ? "rgba(77,182,172,0.22)" : "rgba(21,128,61,0.14)",
    },
    readerSettingsDoneTxt: { color: colors.accent, fontSize: 16, fontWeight: "900" },
    legendBackdrop: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    legendDismiss: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    legendCard: {
      width: "88%",
      maxHeight: "78%",
      zIndex: 2,
      backgroundColor: uiCard,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: uiBorder,
      padding: 16,
    },
    legendTitle: { color: uiText, fontSize: 16, fontWeight: "900", marginBottom: 8 },
    legendIntro: {
      color: uiMuted,
      fontSize: 12,
      lineHeight: 18,
      fontWeight: "600",
      marginBottom: 12,
    },
    legendScroll: { maxHeight: 360 },
    legendLine: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
    legendDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
    legendTxt: { flex: 1, color: uiText, fontSize: 13, lineHeight: 20, fontWeight: "600" },
    legendTxtMultiline: { flex: 1, color: uiText, fontSize: 13, lineHeight: 20, fontWeight: "600" },
    legendFoot: {
      marginTop: 8,
      color: uiMuted,
      fontSize: 11,
      lineHeight: 16,
      fontStyle: "italic",
    },
    legendCloseBtn: {
      marginTop: 12,
      alignSelf: "stretch",
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: quranGoldSurface,
      borderWidth: 1,
      borderColor: quranGoldBorder,
      alignItems: "center",
    },
    legendCloseTxt: { color: colors.accent, fontSize: 15, fontWeight: "800" },
  });
}
