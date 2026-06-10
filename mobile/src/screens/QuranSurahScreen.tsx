import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Platform,
  Modal,
  Switch,
  ScrollView,
  TextInput,
  Share,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Pressable } from "@/ui/Pressable";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useHardwareBackPress } from "../navigation/useHardwareBackPress";
import * as ScreenOrientation from "expo-screen-orientation";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk, APP_BRAND_KK } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { isSurahBookmarked, toggleBookmarkSurah } from "../storage/quranBookmarks";
import {
  loadSurahAyahsCache,
  saveSurahAyahsCache,
  parseAyahsFromApiResponse,
  parseAyahsFromPlatformPayload,
  mergeAyahsPreserveOfflineExtras,
  mergeTajweedTaggedIntoAyahs,
  mergeDualAlquranArabicOntoBase,
  mergeTurkishPrintArabicFromParsed,
  displayCachedAyahArabic,
  quranAyahMeaningForLocale,
  type CachedAyah,
} from "../storage/quranSurahCache";
import { useQuranLocaleTranslation } from "../quran/useQuranLocaleTranslation";
import { resolveEffectiveQuranReaderNavMode } from "../quran/quranReaderModePolicy";
import { useAppLocale } from "../i18n/runtime";
import { fetchAlquranUthmaniAndUnicodeAyahs } from "../services/alquranSurahDualArabicFetch";
import { getRaqatApiBase, isRaqatApiOnlyMode } from "../config/raqatApiBase";
import { getRaqatContentReadSecret } from "../config/raqatContentSecret";
import { fetchPlatformQuranSurah } from "../services/platformApiClient";
import { getValidAccessToken } from "../storage/authTokens";
import { seedBundledQuranCachesIfNeeded } from "../services/bundledQuranSeed";
import { enrichAyahsFromBundledQuranDb } from "../services/quranKkBundledLookup";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import { juzForSurahAyah, QURAN_JUZ_STARTS, type QuranJuzStart } from "../data/quranJuzBoundaries";
import { surahArabicFromBundled } from "../constants/surahBundledMeta";
import { surahAyahToGlobalOneBased } from "../data/quranAyahCounts";
import { hizbForGlobalAyahOneBased } from "../data/quranHizbBoundaries";
import { mushafDisplayPageFromGlobalAyahOneBased } from "../data/quranMushafPageByGlobalAyah";
import {
  QURAN_RECITER_OPTIONS,
  QURAN_RECITER_GROUP_ORDER,
  DEFAULT_QURAN_RECITER_EDITION,
  normalizeReciterEdition,
  type QuranReciterGroup,
} from "../config/quranReciters";
import {
  QURAN_ARABIC_FONT_PRESETS,
  DEFAULT_QURAN_ARABIC_FONT_PRESET,
  normalizeArabicFontPreset,
  type QuranArabicFontPresetId,
} from "../config/quranArabicFontPresets";
import { DEFAULT_QURAN_ARABIC_SCRIPT_EDITION, type QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import { loadQuranBookFonts, QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";
import { useAyahPlayback } from "../quran/useAyahPlayback";
import { useAyahPlaybackScroll } from "../quran/useAyahPlaybackScroll";
import { useLastReadPersistence } from "../quran/useLastReadPersistence";
import { quranArabicNoClipTextStyle } from "../quran/quranArabicNoClipTextStyle";
import { getQuranTranslitOverride } from "../content/quranTranslitOverrides";
import { resolveQuranTranslitForDisplay } from "../utils/quranTranslitDisplay";
import { arabicRasmStringsDiffer } from "../lib/quranArabicDualRasm";
import { AyahArabicKaraokeText } from "../components/quran/AyahArabicKaraokeText";
import {
  MushafContinuousArabicBlock,
  type MushafContinuousArabicHandle,
} from "../components/quran/MushafContinuousArabicBlock";
import {
  MushafPagerPageScroll,
  type MushafPagerPageStyles,
} from "../components/quran/MushafPagerPageScroll";
import { MushafBookFooter } from "../components/quran/MushafBookFooter";
import { AyahContextMenuSheet } from "../components/quran/AyahContextMenuSheet";
import { IlluminatedManuscriptFrame } from "../components/IlluminatedManuscriptFrame";
import { MushafSurahHeader } from "../components/quran/MushafSurahHeader";
import {
  QuranSurahAyahListRow,
  type QuranSurahAyahListRowStyles,
} from "../components/quran/QuranSurahAyahListRow";
import {
  estimateQuranAyahRowHeight,
  quranAyahListRowLayoutKind,
} from "../quran/quranAyahListItemLayout";
import { buildMushafPagesForSurah, findMushafPageIndexForAyah } from "../quran/buildMushafPagesForSurah";
import { clampMushafBookPageIndex, mushafBookPagerListProps } from "../quran/mushafBookPager";
import type { MushafDensityId } from "../config/mushafConfig";
import { DEFAULT_MUSHAF_DENSITY } from "../config/mushafConfig";
import { TAJWEED_RULES_CATALOG } from "../content/tajweedRulesCatalog";
import { surahArabicBannerTitle } from "../data/surahArabicTitles";
import { quranSurahListTypography } from "../theme/quranSurahListTheme";
import {
  clampMushafTextScale,
  MUSHAF_TEXT_SCALE_MAX,
  MUSHAF_TEXT_SCALE_MIN,
  MUSHAF_TEXT_SCALE_STEP,
} from "../quran/mushafTextScale";
import { useMushafStyles } from "../quran/useMushafStyles";
import type { MushafTypographyMetrics } from "../quran/mushafTypography";
import { pickDominantAyahAboveScrollOffset } from "../quran/mushafScrollAnchor";
import { ayahNumbersForAudioPlayUntil } from "../quran/quranAyahPlayQueue";
import { getHatimAudioPlayUntil } from "../storage/hatimPrefs";
import {
  DEFAULT_AYAH_MARKER_STYLE,
  getAyahMarkerStyle,
  getMushafDensity,
  getQuranReaderNavMode,
  getQuranArabicScriptEdition,
  getQuranReadingTheme,
  getQuranReaderShowArabic,
  QURAN_TAJWEED_COLORS_KEY,
  QURAN_READER_RECITER_KEY,
  QURAN_READER_ARABIC_FONT_KEY,
  QURAN_READER_ALLOW_ROTATION_KEY,
  QURAN_READER_MUSHAF_TEXT_SCALE_KEY,
  setAyahMarkerStyle,
  setMushafDensity,
  setQuranReaderNavMode,
  setQuranArabicScriptEdition,
  setQuranReaderShowArabic,
  setQuranReadingTheme,
  type AyahMarkerStyleId,
  type QuranReaderNavMode,
} from "../storage/quranReaderPrefs";
import {
  DEFAULT_QURAN_READING_THEME,
  QURAN_READING_THEMES,
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../theme/quranComReadingTheme";
import {
  loadAyahMarkers,
  removeAyahMarker,
  setAyahMarker,
  type AyahMarkerRecord,
} from "../storage/quranAyahMarkers";

type MushafPagerPage = {
  key: string;
  ayahs: CachedAyah[];
  includeHeader: boolean;
  mushafPageNumber: number;
};
type Props = NativeStackScreenProps<MoreStackParamList, "QuranSurah">;

type ReaderSettingsAccordionKey =
  | "content"
  | "readingTheme"
  | "reciter"
  | "arabicFont"
  | "arabicScript"
  | "nav"
  | "density"
  | "ayahMarker"
  | "pageEdition"
  | "scale"
  | "tajweed";

const surahTajweedUrl = (n: number) => `https://api.alquran.cloud/v1/surah/${n}/quran-tajweed`;

/** RN fetch әдепкі timeoutсыз тұрып қалуы мүмкін — сыртқы API үшін шектеу. */
const QURAN_CLOUD_FETCH_TIMEOUT_MS = 14_000;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

import { toEasternArabicIndic } from "../utils/easternArabicIndic";
import { runAfterInteractions } from "../utils/uiDefer";

function shouldShowMushafBismillahBanner(surahNumber: number): boolean {
  if (surahNumber === 9) return false;
  if (surahNumber === 1) return false;
  return true;
}

async function enrichAyahsWithAlquranTajweed(surahNum: number, ayahs: CachedAyah[]): Promise<CachedAyah[]> {
  try {
    const rt = await fetchWithTimeout(surahTajweedUrl(surahNum), QURAN_CLOUD_FETCH_TIMEOUT_MS);
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
  /** Құрылғыдағы соңғы сүре: желіден кешке кеш жауап UI-ға жазылмасын. */
  const activeSurahLoadRef = useRef(surahNumber);
  activeSurahLoadRef.current = surahNumber;
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlashListRef<CachedAyah>>(null);
  const mushafScrollRef = useRef<ScrollView>(null);
  const mushafScrollContentRef = useRef<View>(null);
  const mushafContinuousRef = useRef<MushafContinuousArabicHandle | null>(null);
  const mushafAyahScrollTopsRef = useRef<Record<number, number>>({});
  const mushafScrollContentHeightRef = useRef(0);
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
  const [footerAnchorAyah, setFooterAnchorAyah] = useState(() => initialAyahParam ?? 1);
  const [visibleMushafPrintPage, setVisibleMushafPrintPage] = useState(1);
  const footerAnchorAyahRef = useRef(footerAnchorAyah);
  useEffect(() => {
    footerAnchorAyahRef.current = footerAnchorAyah;
  }, [footerAnchorAyah]);
  const surahArabicTitleLine = useMemo(() => surahArabicBannerTitle(surahNumber), [surahNumber]);
  const mushafFooterAnchorGlobal = useMemo(
    () => surahAyahToGlobalOneBased(surahNumber, footerAnchorAyah),
    [surahNumber, footerAnchorAyah]
  );
  const mushafFooterHizb = useMemo(
    () => hizbForGlobalAyahOneBased(mushafFooterAnchorGlobal),
    [mushafFooterAnchorGlobal]
  );
  const mushafFooterPage = useMemo(
    () => mushafDisplayPageFromGlobalAyahOneBased(mushafFooterAnchorGlobal),
    [mushafFooterAnchorGlobal]
  );
  const readerJuzFromAnchor = useMemo(
    () => juzForSurahAyah(surahNumber, footerAnchorAyah),
    [surahNumber, footerAnchorAyah]
  );
  const { colors, isDark } = useAppTheme();
  const [ayahs, setAyahs] = useState<CachedAyah[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showTajweedColors, setShowTajweedColors] = useState(false);
  const [showReaderArabic, setShowReaderArabic] = useState(true);
  const [showReaderTranslit, setShowReaderTranslit] = useState(true);
  const [showReaderMeaning, setShowReaderMeaning] = useState(true);
  const [reciterEdition, setReciterEdition] = useState<string>(DEFAULT_QURAN_RECITER_EDITION);
  const [arabicFontPreset, setArabicFontPreset] = useState<QuranArabicFontPresetId>(DEFAULT_QURAN_ARABIC_FONT_PRESET);
  const [arabicScriptEdition, setArabicScriptEdition] = useState<QuranArabicScriptEditionId>(
    DEFAULT_QURAN_ARABIC_SCRIPT_EDITION
  );
  const [tajweedLegendOpen, setTajweedLegendOpen] = useState(false);
  const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);
  const [readerSettingsAccordion, setReaderSettingsAccordion] = useState<ReaderSettingsAccordionKey | null>(null);
  const [arabicSourcesExpanded, setArabicSourcesExpanded] = useState(false);
  const [juzPickerVisible, setJuzPickerVisible] = useState(false);
  const [readerAllowRotation, setReaderAllowRotation] = useState(false);
  const [mushafTextScale, setMushafTextScale] = useState(1);
  const [tajweedLoading, setTajweedLoading] = useState(false);
  /** undefined — шешім күтілуде; null — скролл жоқ; санды — осы аятқа скролл */
  const {
    scrollTargetAyah,
    setScrollTargetAyah,
    resumeHighlightAyah,
    setResumeHighlightAyah,
    scheduleLastReadSave,
    scheduleLastReadSaveThrottled,
  } = useLastReadPersistence({
    surahNumber,
    initialAyahParam,
    footerAnchorAyahRef,
  });
  const [readerNavMode, setReaderNavMode] = useState<QuranReaderNavMode>("scroll");
  const [mushafDensity, setMushafDensityState] = useState<MushafDensityId>(DEFAULT_MUSHAF_DENSITY);
  const [ayahMarkerStyleId, setAyahMarkerStyleIdState] = useState<AyahMarkerStyleId>(DEFAULT_AYAH_MARKER_STYLE);
  const [readingThemeId, setReadingThemeId] = useState<QuranReadingThemeId>(DEFAULT_QURAN_READING_THEME);
  const [ayahMarkers, setAyahMarkers] = useState<Record<string, AyahMarkerRecord>>({});
  const [ayahMenuItem, setAyahMenuItem] = useState<CachedAyah | null>(null);
  /** Жоғарғы «Имла: …» жолы: аятқа ұзақ басқанда немесе hatimOpenReaderPrefs арқылы */
  const [noteTargetItem, setNoteTargetItem] = useState<CachedAyah | null>(null);
  const [translationTargetItem, setTranslationTargetItem] = useState<CachedAyah | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const ayahsRef = useRef<CachedAyah[]>([]);
  const onAyahAudioError = useCallback(() => setToast(kk.quran.ayahAudioError), []);
  const {
    playingAyahInSurah,
    ayahAudioIsPlaying,
    loadingAyahAudio,
    playAyahSudais,
    stopAyahAudio,
  } = useAyahPlayback({
    surahNumber,
    reciterEdition,
    arabicScriptEdition,
    ayahsRef,
    onAudioError: onAyahAudioError,
  });
  const horizontalListRef = useRef<React.ComponentRef<typeof GestureHandlerFlatList<MushafPagerPage>> | null>(null);
  const pagesRef = useRef<MushafPagerPage[]>([]);
  const mushafPagerIndexRef = useRef(0);
  const mushafPagerDragStartIndexRef = useRef<number | null>(null);
  const { metrics: mushafMetrics } = useMushafStyles({
    arabicFontPreset,
    mushafTextScale,
    isDark,
    mushafDensity,
    mushafBookLike: mushafLayout,
    readingThemeId,
  });
  const readingThemeSpec = useMemo(() => resolveQuranReadingTheme(readingThemeId), [readingThemeId]);
  const mushafChromeIconColor = mushafLayout ? readingThemeSpec.chromeInk : colors.accent;

  ayahsRef.current = ayahs;

  const appLocale = useAppLocale();
  useQuranLocaleTranslation(surahNumber, ayahs, setAyahs);

  const mushafHighlightAyah = ayahMenuItem?.numberInSurah ?? resumeHighlightAyah;

  useEffect(() => {
    setFooterAnchorAyah(initialAyahParam ?? 1);
  }, [surahNumber, initialAyahParam]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const e = await getQuranArabicScriptEdition();
      if (alive) setArabicScriptEdition(e);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const m = await getQuranReaderNavMode();
      if (alive) setReaderNavMode(m);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [d, marker, theme] = await Promise.all([
        getMushafDensity(),
        getAyahMarkerStyle(),
        getQuranReadingTheme(),
      ]);
      if (!alive) return;
      setMushafDensityState(d);
      setAyahMarkerStyleIdState(marker);
      setReadingThemeId(theme);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const refreshAyahMarkers = useCallback(async () => {
    setAyahMarkers(await loadAyahMarkers());
  }, []);

  useEffect(() => {
    void refreshAyahMarkers();
  }, [surahNumber, refreshAyahMarkers]);

  const effectiveReaderNavMode: QuranReaderNavMode = resolveEffectiveQuranReaderNavMode({
    platformOS: Platform.OS,
    mushafLayout,
    windowWidth,
    preferredMode: readerNavMode,
  });
  const mushafPageMode = mushafLayout && effectiveReaderNavMode === "page";
  const mushafScrollMode = mushafLayout && effectiveReaderNavMode === "scroll";
  const mushafAyahAudioActive = playingAyahInSurah != null || loadingAyahAudio != null;

  const mushafPages = useMemo(() => {
    if (!ayahs.length) return [] as MushafPagerPage[];
    if (mushafLayout) return buildMushafPagesForSurah(surahNumber, ayahs);
    return [] as MushafPagerPage[];
  }, [ayahs, mushafLayout, surahNumber]);

  const showTajweedForDisplay = useMemo(
    () => showTajweedColors && arabicScriptEdition === "madinah",
    [showTajweedColors, arabicScriptEdition]
  );

  pagesRef.current = mushafPages;

  useEffect(() => {
    if (!mushafPages.length) return;
    setVisibleMushafPrintPage(mushafPages[0]!.mushafPageNumber);
  }, [surahNumber, mushafPages]);

  useEffect(() => {
    mushafAyahScrollTopsRef.current = {};
  }, [surahNumber, ayahs]);

  /** Мұсаф бет режимінде горизонталды бет ені (кітап жиектері жоқ — толық экран ені). */
  const mushafPageWidth = useMemo(() => {
    if (!mushafLayout) return windowWidth;
    return windowWidth;
  }, [mushafLayout, windowWidth]);

  useAyahPlaybackScroll({
    surahNumber,
    ayahs,
    playingAyahInSurah,
    ayahAudioIsPlaying,
    mushafLayout,
    mushafPageMode,
    mushafScrollMode,
    mushafPages,
    mushafPageWidth,
    listRef,
    horizontalListRef,
    mushafContinuousRef,
  });

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
        const showArabic = await getQuranReaderShowArabic();
        if (!alive) return;
        setShowReaderArabic(showArabic);
        setShowReaderTranslit(true);
        setShowReaderMeaning(true);
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

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(QURAN_READER_MUSHAF_TEXT_SCALE_KEY);
        if (!alive) return;
        const n = parseFloat((raw ?? "").trim());
        setMushafTextScale(clampMushafTextScale(Number.isFinite(n) ? n : 1));
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
      let cancelled = false;
      const applyLockFromStorage = async () => {
        if (cancelled) return;
        try {
          const raw = await AsyncStorage.getItem(QURAN_READER_ALLOW_ROTATION_KEY);
          if (cancelled) return;
          const allowRotation = raw === "1";
          if (allowRotation) {
            await ScreenOrientation.unlockAsync();
          } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          }
        } catch {
          /* ignore */
        }
      };
      const interactionHandle = runAfterInteractions(() => {
        void applyLockFromStorage();
      });
      return () => {
        cancelled = true;
        interactionHandle?.cancel?.();
        void (async () => {
          try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          } catch {
            /* ignore */
          }
          if (Platform.OS === "android") {
            await new Promise<void>((r) => setTimeout(r, 60));
            try {
              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
            } catch {
              /* ignore */
            }
          }
        })();
      };
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      void Promise.all([getAyahMarkerStyle(), getMushafDensity()]).then(([m, d]) => {
        setAyahMarkerStyleIdState(m);
        setMushafDensityState(d);
      });
    }, [])
  );

  useEffect(() => {
    if (!route.params.hatimOpenReaderPrefs) return;
    setReaderSettingsOpen(true);
    setReaderSettingsAccordion("arabicScript");
    navigation.setParams({ hatimOpenReaderPrefs: undefined });
  }, [route.params.hatimOpenReaderPrefs, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useLayoutEffect(() => {
    setLoading(true);
    setAyahs([]);
    setErr(null);
  }, [surahNumber]);

  const fetchRemote = useCallback(async () => {
    const fetchedFor = surahNumber;
    const stillCurrent = () => activeSurahLoadRef.current === fetchedFor;
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
          if (!apiOnly) {
            const { madinah, turkishPrint } = await fetchAlquranUthmaniAndUnicodeAyahs(
              surahNumber,
              QURAN_CLOUD_FETCH_TIMEOUT_MS
            );
            merged = mergeDualAlquranArabicOntoBase(merged, madinah, turkishPrint);
          }
          merged = await enrichAyahsWithAlquranTajweed(surahNumber, merged);
          merged = await enrichAyahsFromBundledQuranDb(surahNumber, merged);
          if (!stillCurrent()) return;
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
    const { madinah, turkishPrint } = await fetchAlquranUthmaniAndUnicodeAyahs(
      surahNumber,
      QURAN_CLOUD_FETCH_TIMEOUT_MS
    );
    if (!madinah?.length) throw new Error(kk.quran.ayahError);
    const prev = await loadSurahAyahsCache(surahNumber);
    let merged = mergeAyahsPreserveOfflineExtras(madinah, prev?.ayahs);
    merged = mergeTurkishPrintArabicFromParsed(merged, turkishPrint);
    merged = await enrichAyahsWithAlquranTajweed(surahNumber, merged);
    merged = await enrichAyahsFromBundledQuranDb(surahNumber, merged);
    if (!stillCurrent()) return;
    setAyahs(merged);
    setErr(null);
    await saveSurahAyahsCache(surahNumber, merged);
  }, [surahNumber]);

  useEffect(() => {
    let mounted = true;
    const target = surahNumber;
    const ok = () => mounted && activeSurahLoadRef.current === target;
    (async () => {
      let hadCached = false;
      const cached = await loadSurahAyahsCache(target);
      if (ok() && cached?.ayahs?.length) {
        hadCached = true;
        setAyahs(await enrichAyahsFromBundledQuranDb(target, cached.ayahs));
        setLoading(false);
      }

      const applySeed = async () => {
        try {
          await seedBundledQuranCachesIfNeeded();
        } catch {
          /* кеш бандлдан толтыру сәтсіз */
        }
        if (!ok()) return;
        const afterSeed = await loadSurahAyahsCache(target);
        if (afterSeed?.ayahs?.length && ok()) {
          hadCached = true;
          setAyahs(await enrichAyahsFromBundledQuranDb(target, afterSeed.ayahs));
          setErr(null);
          setLoading(false);
        }
      };

      if (hadCached) {
        void applySeed();
      } else {
        await applySeed();
      }
      if (!ok()) return;

      try {
        await fetchRemote();
      } catch (e) {
        if (ok() && !hadCached) {
          const again = await loadSurahAyahsCache(target);
          if (ok() && again?.ayahs?.length) {
            setAyahs(await enrichAyahsFromBundledQuranDb(target, again.ayahs));
            setErr(null);
          } else if (ok()) {
            setErr(e instanceof Error ? e.message : kk.quran.ayahError);
          }
        }
      } finally {
        if (ok()) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [surahNumber, fetchRemote, loadAttempt]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (scrollTargetAyah === undefined || scrollTargetAyah === null || !ayahs.length) return;
    const idx = ayahs.findIndex((a) => a.numberInSurah === scrollTargetAyah);
    if (idx < 0) return;
    const fromSaved = initialAyahParam == null;
    const id = setTimeout(() => {
      if (mushafPageMode && mushafPages.length) {
        const pageIdx = findMushafPageIndexForAyah(mushafPages, scrollTargetAyah!);
        const pg = mushafPages[pageIdx];
        if (pg) setVisibleMushafPrintPage(pg.mushafPageNumber);
        horizontalListRef.current?.scrollToIndex({ index: pageIdx, animated: true });
      } else if (mushafScrollMode) {
        const go = () =>
          mushafContinuousRef.current?.scrollToAyah(scrollTargetAyah!, { animated: true, viewOffset: 88 });
        go();
        setTimeout(go, 180);
        setTimeout(go, 520);
      } else {
        listRef.current?.scrollToIndex({ index: idx, viewPosition: 0.12 });
      }
      if (fromSaved) setResumeHighlightAyah(scrollTargetAyah);
    }, 450);
    return () => clearTimeout(id);
  }, [scrollTargetAyah, ayahs, initialAyahParam, mushafPageMode, mushafScrollMode, mushafPages]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ isViewable?: boolean; item?: CachedAyah }> }) => {
      if (mushafPageMode || mushafScrollMode) return;
      const vis = viewableItems.find((v) => v.isViewable && v.item?.numberInSurah);
      const ayah = vis?.item?.numberInSurah;
      if (ayah == null) return;
      setFooterAnchorAyah(ayah);
      scheduleLastReadSave(ayah);
    },
    [mushafPageMode, mushafScrollMode, scheduleLastReadSave]
  );

  const updateVisibleMushafPagerPage = useCallback(
    (ix: number) => {
      const page = pagesRef.current[ix];
      const first = page?.ayahs[0];
      if (!first) return;
      mushafPagerIndexRef.current = ix;
      setVisibleMushafPrintPage(page.mushafPageNumber);
      setFooterAnchorAyah(first.numberInSurah);
      scheduleLastReadSave(first.numberInSurah);
    },
    [scheduleLastReadSave]
  );

  const onHorizontalViewableItemsChanged = useCallback(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ isViewable?: boolean; index?: number | null }>;
    }) => {
      if (!mushafLayout || effectiveReaderNavMode !== "page") return;
      const vis = viewableItems.find((v) => v.isViewable && v.index != null);
      const ix = vis?.index;
      if (ix == null) return;
      updateVisibleMushafPagerPage(ix);
    },
    [mushafLayout, effectiveReaderNavMode, updateVisibleMushafPagerPage]
  );

  const onMushafPagerScrollBeginDrag = useCallback(() => {
    mushafPagerDragStartIndexRef.current = mushafPagerIndexRef.current;
  }, []);

  const onMushafPagerScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!mushafPageMode || !mushafPages.length || mushafPageWidth <= 0) return;
      const rawIndex = clampMushafBookPageIndex(
        e.nativeEvent.contentOffset.x / mushafPageWidth,
        mushafPages.length
      );
      const startIndex = clampMushafBookPageIndex(
        mushafPagerDragStartIndexRef.current ?? mushafPagerIndexRef.current,
        mushafPages.length
      );
      const targetIndex =
        rawIndex > startIndex
          ? clampMushafBookPageIndex(startIndex + 1, mushafPages.length)
          : rawIndex < startIndex
            ? clampMushafBookPageIndex(startIndex - 1, mushafPages.length)
            : startIndex;
      mushafPagerDragStartIndexRef.current = null;
      updateVisibleMushafPagerPage(targetIndex);
      if (targetIndex !== rawIndex) {
        horizontalListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
      }
    },
    [mushafPageMode, mushafPageWidth, mushafPages.length, updateVisibleMushafPagerPage]
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 28,
      minimumViewTime: 500,
    }),
    []
  );

  const onMushafAyahTopMeasured = useCallback((ayahInSurah: number, topInContent: number) => {
    mushafAyahScrollTopsRef.current[ayahInSurah] = topInContent;
  }, []);

  const fallbackMushafScrollYForAyah = useCallback((ayahInSurah: number) => {
    const h = mushafScrollContentHeightRef.current;
    if (!h || !ayahs.length) return undefined;
    const idx = ayahs.findIndex((a) => a.numberInSurah === ayahInSurah);
    if (idx < 0) return undefined;
    if (ayahs.length === 1) return 0;
    const ratio = idx / (ayahs.length - 1);
    return ratio * h * 0.9;
  }, [ayahs]);

  const mushafAyahAccessibilityLabel = useCallback(
    (ayahN: number) => {
      const isLoad = loadingAyahAudio === ayahN;
      const hasLoaded = playingAyahInSurah === ayahN;
      const isPlayingNow = hasLoaded && ayahAudioIsPlaying;
      if (isLoad) return kk.quran.ayahPlaySudaisA11y(ayahN);
      if (isPlayingNow) return kk.quran.ayahPauseSudaisA11y(ayahN);
      if (hasLoaded) return kk.quran.ayahResumeSudaisA11y(ayahN);
      return kk.quran.ayahPlaySudaisA11y(ayahN);
    },
    [playingAyahInSurah, loadingAyahAudio, ayahAudioIsPlaying]
  );

  const onMushafPagerVerticalReadingAnchor = useCallback(
    (ayah: number) => {
      setFooterAnchorAyah(ayah);
      scheduleLastReadSaveThrottled(ayah);
    },
    [scheduleLastReadSaveThrottled]
  );

  const onMushafScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!mushafScrollMode || !ayahs.length) return;
      const best = pickDominantAyahAboveScrollOffset(
        ayahs,
        mushafAyahScrollTopsRef.current,
        e.nativeEvent.contentOffset.y,
        112
      );
      setFooterAnchorAyah(best);
      scheduleLastReadSaveThrottled(best);
    },
    [mushafScrollMode, ayahs, scheduleLastReadSaveThrottled]
  );

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
        const enriched = await enrichAyahsFromBundledQuranDb(
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

  const closeReaderSettings = useCallback(() => {
    setArabicSourcesExpanded(false);
    setReaderSettingsAccordion(null);
    setReaderSettingsOpen(false);
  }, []);

  const handleReaderBack = useCallback(() => {
    if (ayahMenuItem) {
      setAyahMenuItem(null);
      return true;
    }
    if (noteTargetItem) {
      setNoteTargetItem(null);
      return true;
    }
    if (translationTargetItem) {
      setTranslationTargetItem(null);
      return true;
    }
    if (readerSettingsOpen) {
      closeReaderSettings();
      return true;
    }
    if (tajweedLegendOpen) {
      setTajweedLegendOpen(false);
      return true;
    }
    if (juzPickerVisible) {
      setJuzPickerVisible(false);
      return true;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
    const parent = navigation.getParent();
    if (parent?.canGoBack()) {
      parent.goBack();
      return true;
    }
    return false;
  }, [
    ayahMenuItem,
    noteTargetItem,
    translationTargetItem,
    readerSettingsOpen,
    tajweedLegendOpen,
    juzPickerVisible,
    closeReaderSettings,
    navigation,
  ]);

  useHardwareBackPress(handleReaderBack, true);

  const toggleReaderSettingsAccordion = useCallback((key: ReaderSettingsAccordionKey) => {
    setReaderSettingsAccordion((cur) => (cur === key ? null : key));
  }, []);

  const setReaderContentLayer = useCallback(
    (layer: "arabic" | "translit" | "meaning", value: boolean) => {
      const nextArabic = layer === "arabic" ? value : showReaderArabic;
      const nextTranslit = layer === "translit" ? value : showReaderTranslit;
      const nextMeaning = layer === "meaning" ? value : showReaderMeaning;
      if (!nextArabic && !nextTranslit && !nextMeaning) {
        setToast(kk.quran.readerAtLeastOneBlock);
        return;
      }

      if (layer === "arabic") {
        setShowReaderArabic(value);
        void setQuranReaderShowArabic(value);
      } else if (layer === "translit") {
        setShowReaderTranslit(true);
      } else {
        setShowReaderMeaning(true);
      }
    },
    [showReaderArabic, showReaderMeaning, showReaderTranslit]
  );

  const styles = useMemo(
    () => makeStyles(colors, isDark, mushafMetrics, mushafLayout, readingThemeId),
    [colors, isDark, mushafMetrics, mushafLayout, readingThemeId]
  );

  const ayahListRowStyles = useMemo((): QuranSurahAyahListRowStyles => {
    const s = styles as QuranSurahAyahListRowStyles;
    return {
      ayahRow: s.ayahRow,
      ayahRowAudioFocus: s.ayahRowAudioFocus,
      ayahIndexInline: s.ayahIndexInline,
      ayahMainTap: s.ayahMainTap,
      ayahCol: s.ayahCol,
      ayahArBlock: s.ayahArBlock,
      ayahArabicTap: s.ayahArabicTap,
      ayahArabicTapPressed: s.ayahArabicTapPressed,
      ayahArabicTapDisabled: s.ayahArabicTapDisabled,
      ayahArabicLoadingOverlay: s.ayahArabicLoadingOverlay,
      ayahTxt: s.ayahTxt,
      ayahBelowArabic: s.ayahBelowArabic,
      ayahSectionCaption: s.ayahSectionCaption,
      ayahKiril: s.ayahKiril,
      ayahKk: s.ayahKk,
      noKkHint: s.noKkHint,
      ayahInlineAudioControl: s.ayahInlineAudioControl,
      ayahInlineAudioText: s.ayahInlineAudioText,
    };
  }, [styles]);

  const flashListLayoutOpts = useMemo(
    () => ({
      showReaderArabic,
      showReaderTranslit,
      showReaderMeaning,
    }),
    [showReaderArabic, showReaderTranslit, showReaderMeaning]
  );

  const flashListRowType = useMemo(
    () => quranAyahListRowLayoutKind(flashListLayoutOpts),
    [flashListLayoutOpts]
  );

  const onListPlayAyah = useCallback(
    (ayahN: number) => {
      void playAyahSudais(ayahN);
    },
    [playAyahSudais]
  );

  const onListLongPressAyah = useCallback((item: CachedAyah) => {
    setAyahMenuItem(item);
  }, []);

  const flashListPlaybackExtra = useMemo(
    () => ({
      playingAyahInSurah,
      loadingAyahAudio,
      ayahAudioIsPlaying,
      rowType: flashListRowType,
    }),
    [playingAyahInSurah, loadingAyahAudio, ayahAudioIsPlaying, flashListRowType]
  );

  const renderAyahListRow = useCallback(
    ({ item }: { item: CachedAyah }) => (
      <QuranSurahAyahListRow
        item={item}
        surahNumber={surahNumber}
        styles={ayahListRowStyles}
        isDark={isDark}
        accentColor={colors.accent}
        showReaderArabic={showReaderArabic}
        showReaderTranslit={showReaderTranslit}
        showReaderMeaning={showReaderMeaning}
        showTajweedForDisplay={showTajweedForDisplay}
        arabicScriptEdition={arabicScriptEdition}
        locale={appLocale}
        playingAyahInSurah={playingAyahInSurah}
        loadingAyahAudio={loadingAyahAudio}
        ayahAudioIsPlaying={ayahAudioIsPlaying}
        onPlay={onListPlayAyah}
        onLongPress={onListLongPressAyah}
      />
    ),
    [
      surahNumber,
      ayahListRowStyles,
      isDark,
      colors.accent,
      showReaderArabic,
      showReaderTranslit,
      showReaderMeaning,
      showTajweedForDisplay,
      arabicScriptEdition,
      appLocale,
      playingAyahInSurah,
      loadingAyahAudio,
      ayahAudioIsPlaying,
      onListPlayAyah,
      onListLongPressAyah,
    ]
  );

  const showMushafBismillahBanner = useMemo(
    () => showReaderArabic && ayahs.length > 0 && shouldShowMushafBismillahBanner(surahNumber),
    [showReaderArabic, ayahs.length, surahNumber]
  );

  const lastAyahInSurah = ayahs.length ? ayahs[ayahs.length - 1]!.numberInSurah : 0;
  const handlePlayUntilJuz = useCallback(
    (ayahInSurah: number) => {
      void (async () => {
        const scope = await getHatimAudioPlayUntil();
        const queue = ayahNumbersForAudioPlayUntil(
          scope,
          surahNumber,
          ayahInSurah,
          lastAyahInSurah
        );
        if (!queue.length) return;
        const [first, ...rest] = queue;
        if (scope === "ayah") {
          void playAyahSudais(first, { plan: { mode: "single", queue: [] } });
          return;
        }
        void playAyahSudais(first, { plan: { mode: "juz", queue: rest } });
      })();
    },
    [surahNumber, lastAyahInSurah, playAyahSudais]
  );
  const handlePlaySelected = useCallback(
    (ayahInSurah: number) => {
      void playAyahSudais(ayahInSurah, { plan: { mode: "single", queue: [] } });
    },
    [playAyahSudais]
  );
  const handlePlayRepeat = useCallback(
    (ayahInSurah: number) => {
      void playAyahSudais(ayahInSurah, { plan: { mode: "repeat", queue: [] } });
    },
    [playAyahSudais]
  );
  const openAyahTranslation = useCallback((item: CachedAyah) => {
    setTranslationTargetItem(item);
    setAyahMenuItem(null);
  }, []);

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

  useEffect(() => {
    if (mushafLayout || readerNavMode !== "page") return;
    let alive = true;
    void (async () => {
      await setQuranReaderNavMode("scroll");
      if (alive) setReaderNavMode("scroll");
    })();
    return () => {
      alive = false;
    };
  }, [mushafLayout, readerNavMode]);

  const copyAyahItem = useCallback(
    async (item: CachedAyah) => {
      const ar = displayCachedAyahArabic(item, arabicScriptEdition);
      const kkLine = quranAyahMeaningForLocale(item, appLocale);
      const body = [ar, kkLine].filter(Boolean).join("\n\n");
      await Clipboard.setStringAsync(`${latinHeaderTitle}\n${surahNumber}:${item.numberInSurah}\n\n${body}`);
      setToast(kk.quran.ayahMenuCopied);
      setAyahMenuItem(null);
    },
    [latinHeaderTitle, surahNumber, arabicScriptEdition, appLocale]
  );

  const copyAyahWithTranslation = useCallback(
    async (item: CachedAyah) => {
      const ar = displayCachedAyahArabic(item, arabicScriptEdition);
      const kkLine = quranAyahMeaningForLocale(item, appLocale);
      const kirilRead =
        getQuranTranslitOverride(surahNumber, item.numberInSurah) ??
        resolveQuranTranslitForDisplay(item.translit, displayCachedAyahArabic(item, arabicScriptEdition));
      const tr = kirilRead?.trim() ?? "";
      const parts: string[] = [`${latinHeaderTitle}\n${surahNumber}:${item.numberInSurah}`];
      if (ar) parts.push("", ar);
      if (tr) parts.push("", kk.quran.translitCaption, tr);
      if (kkLine) parts.push("", kk.quran.meaningKk, kkLine);
      await Clipboard.setStringAsync(parts.join("\n"));
      setToast(kk.quran.ayahMenuCopied);
      setAyahMenuItem(null);
    },
    [latinHeaderTitle, surahNumber, arabicScriptEdition, appLocale]
  );

  const shareAyahItem = useCallback(
    async (item: CachedAyah) => {
      const ar = displayCachedAyahArabic(item, arabicScriptEdition);
      const kkLine = quranAyahMeaningForLocale(item, appLocale);
      const msg = `${latinHeaderTitle} · ${surahNumber}:${item.numberInSurah}\n\n${ar}${kkLine ? `\n\n${kkLine}` : ""}`;
      if (Platform.OS === "web") {
        const nav = globalThis.navigator as (Navigator & {
          share?: (data: { title?: string; text?: string }) => Promise<void>;
        }) | undefined;
        if (typeof nav?.share === "function") {
          try {
            await nav.share({ title: APP_BRAND_KK, text: msg });
            setAyahMenuItem(null);
            return;
          } catch {
            setAyahMenuItem(null);
            return;
          }
        }
        await Clipboard.setStringAsync(msg);
        setToast(kk.quran.ayahMenuCopied);
        setAyahMenuItem(null);
        return;
      }
      try {
        await Share.share({ message: msg, title: APP_BRAND_KK });
      } catch {
        /* жабу */
      }
      setAyahMenuItem(null);
    },
    [latinHeaderTitle, surahNumber, arabicScriptEdition, appLocale]
  );

  const copyAyahDualArabic = useCallback(
    async (item: CachedAyah) => {
      const u = (item.text ?? "").trim();
      const t = (item.textTurkishPrint ?? "").trim();
      if (!u || !t) return;
      const diffLine = arabicRasmStringsDiffer(u, t)
        ? kk.quran.readerDualArabicCopyDiffNote
        : kk.quran.readerDualArabicCopySameNote;
      const parts = [
        `${latinHeaderTitle}\n${surahNumber}:${item.numberInSurah}`,
        "",
        kk.quran.readerDualArabicCopyMadinahHeader,
        u,
        "",
        kk.quran.readerDualArabicCopyTurkishHeader,
        t,
        "",
        diffLine,
      ];
      await Clipboard.setStringAsync(parts.join("\n"));
      setToast(kk.quran.ayahMenuCopiedDualArabic);
      setAyahMenuItem(null);
    },
    [latinHeaderTitle, surahNumber]
  );

  const navigateToJuzStart = useCallback(
    (j: QuranJuzStart) => {
      setJuzPickerVisible(false);
      if (mushafLayout) {
        navigation.navigate("QuranMushafBook", {
          focusSurah: j.startSurah,
          focusAyah: j.startAyah,
        });
        return;
      }
      navigation.navigate("QuranSurah", {
        surahNumber: j.startSurah,
        englishName: surahDisplayTitle(j.startSurah, ""),
        arabicName: surahArabicFromBundled(j.startSurah),
        initialAyah: j.startAyah,
      });
    },
    [navigation, mushafLayout]
  );

  const retryLoadSurah = useCallback(() => {
    setErr(null);
    setLoading(true);
    setLoadAttempt((n) => n + 1);
  }, []);

  if (loading && !ayahs.length) {
    return (
      <View style={styles.center}>
        <RaqatOrnamentSpinner size={52} />
        <Text style={styles.muted}>{kk.quran.ayahLoading}</Text>
      </View>
    );
  }

  if (err && !ayahs.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.err}>{err}</Text>
        <View style={styles.errorActions}>
          <Pressable
            onPress={handleReaderBack}
            accessibilityRole="button"
            accessibilityLabel={kk.common.back}
            style={({ pressed }) => [styles.errorSecondaryBtn, pressed && { opacity: 0.86 }]}
          >
            <MaterialIcons name="arrow-back" size={18} color={colors.text} />
            <Text style={styles.errorSecondaryBtnText}>{kk.common.back}</Text>
          </Pressable>
          <Pressable
            onPress={retryLoadSurah}
            accessibilityRole="button"
            accessibilityLabel={kk.common.retry}
            style={({ pressed }) => [styles.errorPrimaryBtn, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.errorPrimaryBtnText}>{kk.common.retry}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const showMushafPerAyahStack = showReaderTranslit || showReaderMeaning;

  const readerBody = (
    <>
      <View style={[styles.topBar, mushafLayout && styles.mushafTopBar, { paddingTop: insets.top + 2, paddingRight: 0 }]}>
        <Pressable
          style={[styles.topBarBtn, mushafLayout && styles.mushafTopBarBtn]}
          onPress={handleReaderBack}
          accessibilityRole="button"
          accessibilityLabel={kk.common.back}
        >
          <MaterialIcons
            name="arrow-back"
            size={20}
            color={mushafChromeIconColor}
          />
        </Pressable>
        <View style={[styles.topBarMid, mushafLayout && styles.mushafTopBarMid]}>
          {mushafLayout ? (
            <View style={styles.mushafTopHeaderRow}>
              <View style={styles.mushafTopLeft}>
                <Text style={styles.mushafTopJuzLeft} numberOfLines={1}>
                  {kk.quran.readerHeaderJuzHizb(readerJuzFromAnchor, mushafFooterHizb)}
                </Text>
              </View>
              <View style={styles.mushafTopRight}>
                <Text style={styles.mushafTopSurahLatinRight} numberOfLines={1}>
                  {titleKk}
                </Text>
                <Text style={styles.mushafTopSurahArRight} numberOfLines={1}>
                  {surahArabicTitleLine?.replace(/^سُورَةُ\s/u, "").trim() || surahArabicTitleLine}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.topBarSurahLatin} numberOfLines={1}>
                {kk.quran.readerHeaderTitle(titleKk)}
              </Text>
              <View style={styles.topBarJuzCluster}>
                <Text style={styles.topBarJuzPart} numberOfLines={1}>
                  {kk.quran.readerJuzPart(readerJuzFromAnchor)}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.topBarJuzPickerBtn, pressed && { opacity: 0.88 }]}
                  onPress={() => setJuzPickerVisible(true)}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={kk.quran.juzPickerListBtnA11y}
                >
                  <MaterialIcons name="view-list" size={20} color={colors.accent} />
                </Pressable>
              </View>
            </>
          )}
        </View>
        <View style={[styles.topBarRight, { paddingRight: Math.max(insets.right, 4) }]}>
          {mushafLayout ? (
            <Pressable
              style={[styles.topBarBtn, styles.mushafTopBarBtn]}
              onPress={async () => {
                const next = await toggleBookmarkSurah(surahNumber);
                setBookmarked(next);
              }}
              accessibilityRole="button"
              accessibilityLabel={bookmarked ? kk.quran.bookmarkRemove : kk.quran.bookmarkAdd}
            >
              <MaterialIcons
                name={bookmarked ? "bookmark" : "bookmark-border"}
                size={22}
                color={mushafChromeIconColor}
              />
            </Pressable>
          ) : null}
          {!mushafLayout ? (
            Platform.OS !== "web" ? (
              <Pressable
                style={styles.topBarBtn}
                onPress={async () => {
                  const v = !readerAllowRotation;
                  setReaderAllowRotation(v);
                  void AsyncStorage.setItem(QURAN_READER_ALLOW_ROTATION_KEY, v ? "1" : "0");
                  await new Promise<void>((resolve) => {
                    runAfterInteractions(() => resolve());
                  });
                  try {
                    if (v) {
                      await ScreenOrientation.unlockAsync();
                    } else {
                      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                      if (Platform.OS === "android") {
                        await new Promise<void>((r) => setTimeout(r, 40));
                        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
                      }
                    }
                  } catch {
                    /* ignore */
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel={kk.quran.readerAllowRotationTopA11y}
                accessibilityState={{ selected: readerAllowRotation }}
              >
                <MaterialIcons
                  name={readerAllowRotation ? "screen-rotation" : "screen-lock-portrait"}
                  size={22}
                  color={colors.accent}
                />
              </Pressable>
            ) : (
              <Pressable
                style={styles.topBarBtn}
                onPress={async () => {
                  const next = await toggleBookmarkSurah(surahNumber);
                  setBookmarked(next);
                }}
                accessibilityRole="button"
                accessibilityLabel={bookmarked ? kk.quran.bookmarkRemove : kk.quran.bookmarkAdd}
              >
                <Text style={styles.topBarStar}>{bookmarked ? "★" : "☆"}</Text>
              </Pressable>
            )
          ) : null}
          <Pressable
            style={[styles.topBarBtn, mushafLayout && styles.mushafTopBarBtn]}
            onPress={() => setReaderSettingsOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={kk.quran.readerSettingsA11y}
          >
            <MaterialIcons
              name="more-horiz"
              size={22}
              color={mushafChromeIconColor}
            />
          </Pressable>
        </View>
      </View>
      {mushafLayout && mushafAyahAudioActive ? (
        <Pressable
          style={({ pressed }) => [
            styles.mushafAyahAudioLoadingBar,
            pressed && playingAyahInSurah != null && loadingAyahAudio == null && { opacity: 0.9 },
          ]}
          onPress={() => {
            if (playingAyahInSurah != null && loadingAyahAudio == null) {
              void playAyahSudais(playingAyahInSurah);
            }
          }}
          disabled={loadingAyahAudio != null}
          accessibilityRole="button"
          accessibilityLabel={
            loadingAyahAudio != null
              ? kk.quran.mushafAyahAudioLoadingLine(loadingAyahAudio)
              : ayahAudioIsPlaying
                ? kk.quran.ayahPauseSudaisA11y(playingAyahInSurah ?? 0)
                : kk.quran.ayahResumeSudaisA11y(playingAyahInSurah ?? 0)
          }
        >
          {loadingAyahAudio != null ? (
            <>
              <RaqatOrnamentSpinner size={22} />
              <Text style={styles.mushafAyahAudioLoadingTxt} numberOfLines={1}>
                {kk.quran.mushafAyahAudioLoadingLine(loadingAyahAudio)}
              </Text>
            </>
          ) : (
            <>
              <MaterialIcons
                name={ayahAudioIsPlaying ? "pause" : "play-arrow"}
                size={22}
                color={colors.accent}
              />
              <Text style={styles.mushafAyahAudioLoadingTxt} numberOfLines={1}>
                {ayahAudioIsPlaying
                  ? kk.quran.mushafAyahAudioPlayingLine(playingAyahInSurah ?? 0)
                  : kk.quran.mushafAyahAudioPausedLine(playingAyahInSurah ?? 0)}
              </Text>
            </>
          )}
        </Pressable>
      ) : null}
      {mushafPageMode ? (
        <View style={styles.mushafPagerHost}>
          <GestureHandlerFlatList
            ref={horizontalListRef}
            data={mushafPages}
            keyExtractor={(p) => p.key}
            {...mushafBookPagerListProps}
            getItemLayout={(_, index) => ({
              length: mushafPageWidth,
              offset: mushafPageWidth * index,
              index,
            })}
            onViewableItemsChanged={onHorizontalViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            onScrollBeginDrag={onMushafPagerScrollBeginDrag}
            onMomentumScrollEnd={onMushafPagerScrollEnd}
            onScrollEndDrag={Platform.OS === "web" ? onMushafPagerScrollEnd : undefined}
            extraData={{
              playingAyahInSurah,
              loadingAyahAudio,
              ayahAudioIsPlaying,
              showTajweedColors,
              showTajweedForDisplay,
              tajweedLoading,
              showReaderArabic,
              showReaderTranslit,
              showReaderMeaning,
              arabicFontPreset,
              arabicScriptEdition,
              reciterEdition,
              showMushafBismillahBanner,
              mushafLayout,
              mushafFooterHizb,
              mushafFooterPage,
              readerAllowRotation,
              mushafTextScale,
              mushafHighlightAyah,
              ayahMarkers,
              readerNavMode: effectiveReaderNavMode,
              surahNumber,
              mushafPageWidth,
              mushafDensity,
              ayahMarkerStyleId,
            }}
            onScrollToIndexFailed={(info) => {
              const off = Math.max(0, info.index * mushafPageWidth);
              setTimeout(() => {
                horizontalListRef.current?.scrollToOffset({ offset: off, animated: true });
              }, 350);
            }}
            scrollEventThrottle={16}
            style={[
              styles.mushafBookFlatList,
              { width: mushafPageWidth, alignSelf: "center" },
            ]}
            renderItem={({ item: page }) => (
              <View style={[styles.mushafPagerPageShell, { width: mushafPageWidth }]}>
                <IlluminatedManuscriptFrame
                  isDark={isDark}
                  readingThemeId={readingThemeId}
                  style={{ flex: 1, width: mushafPageWidth }}
                  innerStyle={{ flex: 1, minHeight: 0 }}
                >
                  <MushafPagerPageScroll
                  page={page}
                  pagerWidth={mushafPageWidth}
                  paddingBottom={12 + insets.bottom}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  accentColor={colors.accent}
                  colors={colors}
                  mushafLayout={mushafLayout}
                  bookPageLayout
                  surahNumber={surahNumber}
                  surahArabicTitleLine={surahArabicTitleLine}
                  showMushafBismillahBanner={showMushafBismillahBanner}
                  styles={styles as unknown as MushafPagerPageStyles}
                  showReaderArabic={showReaderArabic}
                  showReaderTranslit={showReaderTranslit}
                  showReaderMeaning={showReaderMeaning}
                  showTajweedColors={showTajweedForDisplay}
                  arabicScriptEdition={arabicScriptEdition}
                  readingThemeId={readingThemeId}
                  isDark={isDark}
                  playingAyahInSurah={playingAyahInSurah}
                  ayahAudioIsPlaying={ayahAudioIsPlaying}
                  loadingAyahAudio={loadingAyahAudio}
                  resumeHighlightAyah={mushafHighlightAyah}
                  ayahMarkers={ayahMarkers}
                  toEasternArabicIndic={toEasternArabicIndic}
                  accessibilityLabelForAyah={mushafAyahAccessibilityLabel}
                  onPressArabic={(ayahInSurah) => void playAyahSudais(ayahInSurah)}
                  onLongPressAyah={(it) => setAyahMenuItem(it)}
                  onVerticalReadingAnchor={onMushafPagerVerticalReadingAnchor}
                  readingTargetAyah={typeof scrollTargetAyah === "number" ? scrollTargetAyah : null}
                />
                </IlluminatedManuscriptFrame>
              </View>
            )}
          />
          {mushafLayout && ayahs.length ? (
            <MushafBookFooter
              page={mushafPageMode ? visibleMushafPrintPage : mushafFooterPage}
              pageA11y={kk.quran.mushafFooterPageA11y}
              colors={colors}
              isDark={isDark}
              bookMushaf
              hizb={mushafFooterHizb}
              readingThemeId={readingThemeId}
            />
          ) : null}
        </View>
      ) : mushafScrollMode ? (
        <ScrollView
          ref={mushafScrollRef}
          onScroll={onMushafScroll}
          scrollEventThrottle={120}
          onContentSizeChange={(_w, h) => {
            mushafScrollContentHeightRef.current = h;
          }}
          style={styles.mushafBookFlatList}
          contentContainerStyle={StyleSheet.flatten([
            styles.pad,
            styles.mushafListPad,
            { paddingBottom: 20 + insets.bottom },
          ])}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <IlluminatedManuscriptFrame isDark={isDark} readingThemeId={readingThemeId} innerStyle={{ alignSelf: "stretch" }}>
            <View ref={mushafScrollContentRef} collapsable={false}>
            <MushafSurahHeader
              colors={colors}
              mushafLayout={mushafLayout}
              bookPageLayout={mushafLayout}
              surahArabicTitleLine={surahArabicTitleLine}
              showMushafBismillahBanner={showMushafBismillahBanner}
              styles={{
                mushafSurahTitleBlock: styles.mushafSurahTitleBlock,
                mushafSurahTitlePaper: styles.mushafSurahTitlePaper,
                mushafSurahTitleAr: styles.mushafSurahTitleAr,
                mushafAyahTxt: styles.mushafAyahTxt,
                bismillahBanner: styles.bismillahBanner,
                mushafBismillahBanner: styles.mushafBismillahBanner,
                bismillahBannerTxt: styles.bismillahBannerTxt,
                mushafBismillahBannerTxt: styles.mushafBismillahBannerTxt,
              }}
            />
            {showMushafPerAyahStack ? (
              ayahs.map((item) => {
                const ayahN = item.numberInSurah;
                const arabicPlain = displayCachedAyahArabic(item, arabicScriptEdition);
                const showArBlock =
                  showReaderArabic &&
                  (showTajweedForDisplay && (item.textTajweed ?? "").includes("[") ? true : Boolean(arabicPlain));
                const kkLine = quranAyahMeaningForLocale(item, appLocale);
                const kirilRead =
                  getQuranTranslitOverride(surahNumber, ayahN) ??
                  resolveQuranTranslitForDisplay(item.translit, arabicPlain);
                const isLoad = loadingAyahAudio === ayahN;
                const hasLoaded = playingAyahInSurah === ayahN;
                return (
                  <View
                    key={`mushaf-stack-${surahNumber}:${ayahN}`}
                    style={styles.mushafSecondaryAyahBlock}
                    collapsable={false}
                    onLayout={(e) => onMushafAyahTopMeasured(ayahN, e.nativeEvent.layout.y)}
                  >
                    <Text style={styles.mushafSecondaryAyahRibbon}>{toEasternArabicIndic(ayahN)}</Text>
                    {showArBlock ? (
                      <Pressable
                        oyuBackdrop={false}
                        onPress={() => void playAyahSudais(ayahN)}
                        onLongPress={() => setAyahMenuItem(item)}
                        disabled={isLoad}
                        accessibilityRole="button"
                        accessibilityState={{ busy: isLoad }}
                        accessibilityLabel={mushafAyahAccessibilityLabel(ayahN)}
                        style={({ pressed }) => [pressed && { opacity: 0.82 }]}
                      >
                        <AyahArabicKaraokeText
                          plainText={arabicPlain}
                          taggedText={showTajweedForDisplay ? item.textTajweed : undefined}
                          showTajweedColors={showTajweedForDisplay}
                          isDark={isDark}
                          baseStyle={styles.mushafAyahTxt}
                          audioFocus={hasLoaded}
                          audioLoading={isLoad}
                        />
                      </Pressable>
                    ) : null}
                    {showReaderTranslit && kirilRead ? (
                      <>
                        <Text style={styles.mushafAyahSectionCaption}>{kk.quran.translitCaption}</Text>
                        <Text style={styles.mushafAyahKiril}>{kirilRead}</Text>
                      </>
                    ) : null}
                    {showReaderMeaning && kkLine ? (
                      <>
                        <Text style={styles.mushafAyahSectionCaption}>{kk.quran.meaningKk}</Text>
                        <Text style={styles.mushafAyahKk}>{kkLine}</Text>
                      </>
                    ) : null}
                  </View>
                );
              })
            ) : (
              <MushafContinuousArabicBlock
                ref={mushafContinuousRef}
                ayahs={ayahs}
                surahNumber={surahNumber}
                arabicScriptEdition={arabicScriptEdition}
                showReaderArabic={showReaderArabic}
                showTajweedColors={showTajweedForDisplay}
                isDark={isDark}
                playingAyahInSurah={playingAyahInSurah}
                ayahAudioIsPlaying={ayahAudioIsPlaying}
                loadingAyahAudio={loadingAyahAudio}
                resumeHighlightAyah={mushafHighlightAyah}
                ayahMarkers={ayahMarkers}
                mushafAyahTxt={styles.mushafAyahTxt}
                toEasternArabicIndic={toEasternArabicIndic}
                scrollViewRef={mushafScrollRef}
                scrollContentRef={mushafScrollContentRef}
                onAyahTopMeasured={onMushafAyahTopMeasured}
                fallbackScrollYForAyah={fallbackMushafScrollYForAyah}
                accessibilityLabelForAyah={mushafAyahAccessibilityLabel}
                onPressArabic={(ayahInSurah) => void playAyahSudais(ayahInSurah)}
                onLongPressAyah={(it) => setAyahMenuItem(it)}
              />
            )}
            {mushafLayout && ayahs.length ? (
              <MushafBookFooter
                page={mushafFooterPage}
                pageA11y={kk.quran.mushafFooterPageA11y}
                colors={colors}
                isDark={isDark}
                bookMushaf
                hizb={mushafFooterHizb}
                readingThemeId={readingThemeId}
              />
            ) : null}
            </View>
          </IlluminatedManuscriptFrame>
        </ScrollView>
      ) : (
        <FlashList
        ref={listRef}
        data={ayahs}
        getItemType={() => flashListRowType}
        drawDistance={480}
        keyExtractor={(a) => String(a.numberInSurah)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        extraData={flashListPlaybackExtra}
        ListHeaderComponent={
          <MushafSurahHeader
            colors={colors}
            mushafLayout={mushafLayout}
            bookPageLayout={mushafLayout}
            surahArabicTitleLine={surahArabicTitleLine}
            showMushafBismillahBanner={showMushafBismillahBanner}
            styles={{
              mushafSurahTitleBlock: styles.mushafSurahTitleBlock,
              mushafSurahTitlePaper: styles.mushafSurahTitlePaper,
              mushafSurahTitleAr: styles.mushafSurahTitleAr,
              mushafAyahTxt: styles.mushafAyahTxt,
              bismillahBanner: styles.bismillahBanner,
              mushafBismillahBanner: styles.mushafBismillahBanner,
              bismillahBannerTxt: styles.bismillahBannerTxt,
              mushafBismillahBannerTxt: styles.mushafBismillahBannerTxt,
            }}
          />
        }
        ListFooterComponent={
          mushafLayout && ayahs.length ? (
            <MushafBookFooter
              page={mushafFooterPage}
              pageA11y={kk.quran.mushafFooterPageA11y}
              colors={colors}
              isDark={isDark}
              bookMushaf
              hizb={mushafFooterHizb}
              readingThemeId={readingThemeId}
            />
          ) : null
        }
        contentContainerStyle={StyleSheet.flatten([styles.pad, { paddingBottom: 40 + insets.bottom }])}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator
        renderItem={renderAyahListRow}
      />
      )}
    </>
  );

  return (
    <View style={styles.root}>
      {toast ? (
        <View style={[styles.toastWrap, { bottom: 12 + insets.bottom }]}>
          <Text style={styles.toastTxt}>{toast}</Text>
        </View>
      ) : null}
      <AyahContextMenuSheet
        visible={!!ayahMenuItem}
        ayahMenuItem={ayahMenuItem}
        surahNumber={surahNumber}
        windowHeight={windowHeight}
        windowWidth={windowWidth}
        paddingBottom={Math.max(insets.bottom, 12) + 12}
        colors={colors}
        isDark={isDark}
        onClose={() => setAyahMenuItem(null)}
        onPlaySelected={handlePlaySelected}
        onPlayUntilJuz={handlePlayUntilJuz}
        onPlayRepeat={handlePlayRepeat}
        reciterEdition={reciterEdition}
        onPickReciter={(edition) => {
          setReciterEdition(edition);
          void AsyncStorage.setItem(QURAN_READER_RECITER_KEY, edition);
        }}
        onCopy={(item) => void copyAyahItem(item)}
        onShare={(item) => void shareAyahItem(item)}
        onOpenTranslation={openAyahTranslation}
        onPickMarkerColor={async (item, cid) => {
          const prev = ayahMarkers[`${surahNumber}:${item.numberInSurah}`];
          await setAyahMarker(surahNumber, item.numberInSurah, {
            colorId: cid,
            note: prev?.note ?? "",
          });
          void refreshAyahMarkers();
          setAyahMenuItem(null);
        }}
        onRemoveMarker={async (item) => {
          await removeAyahMarker(surahNumber, item.numberInSurah);
          void refreshAyahMarkers();
          setAyahMenuItem(null);
        }}
        hasMarkerForAyah={
          ayahMenuItem ? Boolean(ayahMarkers[`${surahNumber}:${ayahMenuItem.numberInSurah}`]) : false
        }
      />
      <Modal
        visible={!!translationTargetItem}
        transparent
        animationType="fade"
        onRequestClose={() => setTranslationTargetItem(null)}
      >
        <View style={styles.readerSettingsRoot}>
          <Pressable style={styles.readerSettingsBackdrop} onPress={() => setTranslationTargetItem(null)} />
          <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
            <View style={styles.readerSettingsHandle} />
            {translationTargetItem
              ? (() => {
                  const ar = displayCachedAyahArabic(translationTargetItem, arabicScriptEdition);
                  const kkLine = quranAyahMeaningForLocale(translationTargetItem, appLocale);
                  const kirilRead =
                    getQuranTranslitOverride(surahNumber, translationTargetItem.numberInSurah) ??
                    resolveQuranTranslitForDisplay(
                      translationTargetItem.translit,
                      displayCachedAyahArabic(translationTargetItem, arabicScriptEdition)
                    );
                  return (
                    <>
                      <Text style={styles.readerSettingsTitle}>
                        {kk.quran.ayahTranslationSheetTitle(surahNumber, translationTargetItem.numberInSurah)}
                      </Text>
                      <ScrollView
                        style={{ maxHeight: Math.min(520, windowHeight * 0.62) }}
                        contentContainerStyle={styles.translationSheetContent}
                        showsVerticalScrollIndicator
                      >
                        <Text style={styles.translationSectionTitle}>{kk.quran.ayahTranslationArabic}</Text>
                        <Text selectable style={styles.translationArabicText}>
                          {ar}
                        </Text>
                        {kirilRead ? (
                          <>
                            <Text style={styles.translationSectionTitle}>{kk.quran.ayahTranslationReading}</Text>
                            <Text selectable style={styles.translationBodyText}>
                              {kirilRead}
                            </Text>
                          </>
                        ) : null}
                        <Text style={styles.translationSectionTitle}>{kk.quran.ayahTranslationMeaning}</Text>
                        <Text selectable style={styles.translationBodyText}>
                          {kkLine || kk.quran.ayahTranslationMissing}
                        </Text>
                        <Text style={styles.translationSectionTitle}>{kk.quran.ayahTranslationTafsir}</Text>
                        <Text selectable style={styles.translationTafsirText}>
                          {kk.quran.ayahTranslationTafsirBody}
                        </Text>
                      </ScrollView>
                      <Pressable
                        style={({ pressed }) => [
                          styles.readerSettingsDoneBtn,
                          { alignItems: "center", marginHorizontal: 4, marginTop: 12 },
                          pressed && { opacity: 0.92 },
                        ]}
                        onPress={() => setTranslationTargetItem(null)}
                      >
                        <Text style={styles.readerSettingsDoneTxt}>{kk.common.close}</Text>
                      </Pressable>
                    </>
                  );
                })()
              : null}
          </View>
        </View>
      </Modal>
      <Modal visible={!!noteTargetItem} transparent animationType="fade" onRequestClose={() => setNoteTargetItem(null)}>
        <View style={styles.readerSettingsRoot}>
          <Pressable style={styles.readerSettingsBackdrop} onPress={() => setNoteTargetItem(null)} />
          <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
            <View style={styles.readerSettingsHandle} />
            {noteTargetItem ? (
              <>
                <Text style={styles.readerSettingsTitle}>
                  {kk.quran.ayahMenuTitle(surahNumber, noteTargetItem.numberInSurah)}
                </Text>
                <TextInput
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  placeholder={kk.quran.ayahMenuNotePlaceholder}
                  placeholderTextColor={colors.muted}
                  multiline
                  style={{
                    minHeight: 100,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: colors.border,
                    borderRadius: 10,
                    padding: 12,
                    color: colors.text,
                    marginHorizontal: 4,
                    marginTop: 8,
                    textAlignVertical: "top",
                  }}
                />
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14, paddingHorizontal: 4 }}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.readerSettingsDoneBtn,
                      { flex: 1, alignItems: "center" },
                      pressed && { opacity: 0.92 },
                    ]}
                    onPress={() => {
                      setNoteTargetItem(null);
                      setNoteDraft("");
                    }}
                  >
                    <Text style={styles.readerSettingsDoneTxt}>{kk.quran.ayahMenuCancel}</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.readerSettingsDoneBtn,
                      { flex: 1, alignItems: "center" },
                      pressed && { opacity: 0.92 },
                    ]}
                    onPress={async () => {
                      const prev = ayahMarkers[`${surahNumber}:${noteTargetItem.numberInSurah}`];
                      await setAyahMarker(surahNumber, noteTargetItem.numberInSurah, {
                        colorId: prev?.colorId ?? "gold",
                        note: noteDraft.trim(),
                      });
                      void refreshAyahMarkers();
                      setNoteTargetItem(null);
                      setNoteDraft("");
                    }}
                  >
                    <Text style={styles.readerSettingsDoneTxt}>{kk.quran.ayahMenuSaveNote}</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
      <Modal
        visible={readerSettingsOpen}
        transparent
        animationType="fade"
        onRequestClose={closeReaderSettings}
      >
        <View style={styles.readerSettingsRoot}>
          <Pressable style={styles.readerSettingsBackdrop} onPress={closeReaderSettings} />
          <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
            <View style={styles.readerSettingsHandle} />
            <Text style={styles.readerSettingsTitle}>{kk.quran.readerSettingsTitle}</Text>
            <ScrollView
              style={{ maxHeight: Math.min(520, windowHeight * 0.58) }}
              contentContainerStyle={styles.readerSettingsScrollPad}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <View style={[styles.readerAccordionWrap, styles.readerAccordionWrapFirst]}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("content")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "content" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerShowContentTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "content" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "content" ? (
                  <View style={styles.readerAccordionPanel}>
                    <Text style={styles.readerSettingsHint}>{kk.quran.readerShowContentHint}</Text>
                    <View style={styles.readerSettingRow}>
                      <Text style={styles.readerSettingRowLabel}>{kk.quran.readerShowArabicLabel}</Text>
                      <Switch
                        value={showReaderArabic}
                        onValueChange={(v) => setReaderContentLayer("arabic", v)}
                        trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                        thumbColor={showReaderArabic ? colors.accent : colors.muted}
                        accessibilityLabel={kk.quran.readerShowArabicLabel}
                      />
                    </View>
                    <View style={styles.readerSettingRow}>
                      <Text style={styles.readerSettingRowLabel}>{kk.quran.readerShowTranslitLabel}</Text>
                      <Switch
                        value={showReaderTranslit}
                        onValueChange={(v) => setReaderContentLayer("translit", v)}
                        trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                        thumbColor={showReaderTranslit ? colors.accent : colors.muted}
                        accessibilityLabel={kk.quran.readerShowTranslitLabel}
                      />
                    </View>
                    <View style={styles.readerSettingRow}>
                      <Text style={styles.readerSettingRowLabel}>{kk.quran.readerShowMeaningLabel}</Text>
                      <Switch
                        value={showReaderMeaning}
                        onValueChange={(v) => setReaderContentLayer("meaning", v)}
                        trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                        thumbColor={showReaderMeaning ? colors.accent : colors.muted}
                        accessibilityLabel={kk.quran.readerShowMeaningLabel}
                      />
                    </View>
                  </View>
                ) : null}
              </View>

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                    <Pressable
                      onPress={() => toggleReaderSettingsAccordion("readingTheme")}
                      style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: readerSettingsAccordion === "readingTheme" }}
                    >
                      <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerReadingThemeTitle}</Text>
                      <MaterialIcons
                        name={readerSettingsAccordion === "readingTheme" ? "expand-less" : "expand-more"}
                        size={24}
                        color={colors.accent}
                      />
                    </Pressable>
                    {readerSettingsAccordion === "readingTheme" ? (
                      <View style={styles.readerAccordionPanel}>
                        <Text style={styles.readerSettingsHint}>{kk.quran.readerReadingThemeHint}</Text>
                        {QURAN_READING_THEMES.map((theme) => {
                          const sel = readingThemeId === theme.id;
                          return (
                            <Pressable
                              key={theme.id}
                              style={({ pressed }) => [
                                styles.readerChoiceRow,
                                sel && styles.readerChoiceRowSelected,
                                pressed && { opacity: 0.88 },
                              ]}
                              onPress={() => {
                                setReadingThemeId(theme.id);
                                void setQuranReadingTheme(theme.id);
                              }}
                              accessibilityRole="button"
                              accessibilityState={{ selected: sel }}
                              accessibilityLabel={theme.labelKk}
                            >
                              <MaterialIcons
                                name={sel ? "check-circle" : "radio-button-unchecked"}
                                size={22}
                                color={sel ? colors.accent : colors.muted}
                              />
                              <Text style={styles.readerChoiceLabel}>{theme.labelKk}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                </View>
              ) : null}

              <View style={styles.readerAccordionWrap}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("reciter")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "reciter" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerReciterTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "reciter" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "reciter" ? (
                  <View style={styles.readerAccordionPanel}>
                    <Text style={styles.readerSettingsHint}>{kk.quran.readerReciterHint}</Text>
                    {QURAN_RECITER_GROUP_ORDER.map((group) => {
                      const items = QURAN_RECITER_OPTIONS.filter((r) => r.group === group);
                      if (!items.length) return null;
                      const groupLabel: Record<QuranReciterGroup, string> = {
                        kk: kk.quran.readerReciterGroupKk,
                        ru: kk.quran.readerReciterGroupRu,
                        ar: kk.quran.readerReciterGroupAr,
                      };
                      return (
                        <View key={group}>
                          <Text style={styles.readerSectionSubtitle}>{groupLabel[group]}</Text>
                          {items.map((r) => {
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
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <View style={styles.readerAccordionWrap}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("arabicFont")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "arabicFont" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerArabicFontTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "arabicFont" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "arabicFont" ? (
                  <View style={styles.readerAccordionPanel}>
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
                ) : null}
              </View>

              <View style={styles.readerAccordionWrap}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("arabicScript")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "arabicScript" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerArabicScriptTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "arabicScript" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "arabicScript" ? (
                  <View style={styles.readerAccordionPanel}>
                <Text style={styles.readerSettingsHint}>{kk.quran.readerArabicScriptHint}</Text>
                {(
                  [
                    { id: "madinah" as const, label: kk.quran.readerArabicScriptMadinah },
                    { id: "turkish" as const, label: kk.quran.readerArabicScriptTurkish },
                  ] as const
                ).map((opt) => {
                  const sel = arabicScriptEdition === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      style={({ pressed }) => [
                        styles.readerChoiceRow,
                        sel && styles.readerChoiceRowSelected,
                        pressed && { opacity: 0.88 },
                      ]}
                      onPress={() => {
                        setArabicScriptEdition(opt.id);
                        void setQuranArabicScriptEdition(opt.id);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      accessibilityLabel={opt.label}
                    >
                      <MaterialIcons
                        name={sel ? "check-circle" : "radio-button-unchecked"}
                        size={22}
                        color={sel ? colors.accent : colors.muted}
                      />
                      <Text style={styles.readerChoiceLabel}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  style={({ pressed }) => [
                    styles.readerChoiceRow,
                    pressed && { opacity: 0.88 },
                    { marginTop: 4 },
                  ]}
                  onPress={() => setArabicSourcesExpanded((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: arabicSourcesExpanded }}
                  accessibilityLabel={
                    arabicSourcesExpanded
                      ? kk.quran.readerArabicScriptSourcesToggleHide
                      : kk.quran.readerArabicScriptSourcesToggleShow
                  }
                >
                  <MaterialIcons
                    name={arabicSourcesExpanded ? "expand-less" : "expand-more"}
                    size={22}
                    color={colors.accent}
                  />
                  <Text style={styles.readerChoiceLabel}>
                    {arabicSourcesExpanded
                      ? kk.quran.readerArabicScriptSourcesToggleHide
                      : kk.quran.readerArabicScriptSourcesToggleShow}
                  </Text>
                </Pressable>
                {arabicSourcesExpanded ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.readerSectionSubtitle}>{kk.quran.readerArabicScriptSourcesTitle}</Text>
                    <Text style={styles.readerSettingsHint}>{kk.quran.readerArabicScriptSourcesBody}</Text>
                  </View>
                ) : null}
                  </View>
                ) : null}
              </View>

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("nav")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "nav" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerNavTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "nav" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "nav" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerNavModesHint}</Text>
                  {(["scroll", "page"] as const).map((mode) => {
                    const sel = effectiveReaderNavMode === mode;
                    return (
                      <Pressable
                        key={mode}
                        style={({ pressed }) => [
                          styles.readerChoiceRow,
                          sel && styles.readerChoiceRowSelected,
                          pressed && { opacity: 0.88 },
                        ]}
                        onPress={() => {
                          setReaderNavMode(mode);
                          void setQuranReaderNavMode(mode);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: sel }}
                        accessibilityLabel={mode === "scroll" ? kk.quran.readerNavScroll : kk.quran.readerNavPage}
                      >
                        <MaterialIcons
                          name={sel ? "check-circle" : "radio-button-unchecked"}
                          size={22}
                          color={sel ? colors.accent : colors.muted}
                        />
                        <Text style={styles.readerChoiceLabel}>
                          {mode === "scroll" ? kk.quran.readerNavScroll : kk.quran.readerNavPage}
                        </Text>
                      </Pressable>
                    );
                  })}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("density")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "density" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerMushafDensityTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "density" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "density" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerMushafDensityHint}</Text>
                  {(["tight", "medium", "comfort"] as const).map((d) => {
                    const sel = mushafDensity === d;
                    const labelKk =
                      d === "tight"
                        ? kk.quran.readerMushafDensityTight
                        : d === "comfort"
                          ? kk.quran.readerMushafDensityComfort
                          : kk.quran.readerMushafDensityMedium;
                    return (
                      <Pressable
                        key={d}
                        style={({ pressed }) => [
                          styles.readerChoiceRow,
                          sel && styles.readerChoiceRowSelected,
                          pressed && { opacity: 0.88 },
                        ]}
                        onPress={() => {
                          setMushafDensityState(d);
                          void setMushafDensity(d);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: sel }}
                        accessibilityLabel={labelKk}
                      >
                        <MaterialIcons
                          name={sel ? "check-circle" : "radio-button-unchecked"}
                          size={22}
                          color={sel ? colors.accent : colors.muted}
                        />
                        <Text style={styles.readerChoiceLabel}>{labelKk}</Text>
                      </Pressable>
                    );
                  })}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("ayahMarker")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "ayahMarker" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerAyahMarkerStyleTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "ayahMarker" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "ayahMarker" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerAyahMarkerStyleHint}</Text>
                  {(["ring_svg", "classic"] as const).map((sid) => {
                    const sel = ayahMarkerStyleId === sid;
                    const labelKk =
                      sid === "ring_svg" ? kk.quran.readerAyahMarkerRingSvg : kk.quran.readerAyahMarkerClassic;
                    return (
                      <Pressable
                        key={sid}
                        style={({ pressed }) => [
                          styles.readerChoiceRow,
                          sel && styles.readerChoiceRowSelected,
                          pressed && { opacity: 0.88 },
                        ]}
                        onPress={() => {
                          setAyahMarkerStyleIdState(sid);
                          void setAyahMarkerStyle(sid);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: sel }}
                        accessibilityLabel={labelKk}
                      >
                        <MaterialIcons
                          name={sel ? "check-circle" : "radio-button-unchecked"}
                          size={22}
                          color={sel ? colors.accent : colors.muted}
                        />
                        <Text style={styles.readerChoiceLabel}>{labelKk}</Text>
                      </Pressable>
                    );
                  })}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("pageEdition")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "pageEdition" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerMushafPageEditionTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "pageEdition" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "pageEdition" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerMushafPageEditionHint}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("scale")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "scale" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerMushafScaleTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "scale" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "scale" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerMushafScaleHint}</Text>
                  <View style={styles.readerMushafScaleRow}>
                    <Pressable
                      style={({ pressed }) => [styles.readerMushafScaleBtn, pressed && { opacity: 0.88 }]}
                      onPress={() => {
                        const next = clampMushafTextScale(mushafTextScale - MUSHAF_TEXT_SCALE_STEP);
                        setMushafTextScale(next);
                        void AsyncStorage.setItem(QURAN_READER_MUSHAF_TEXT_SCALE_KEY, String(next));
                      }}
                      disabled={mushafTextScale <= MUSHAF_TEXT_SCALE_MIN + 1e-6}
                      accessibilityRole="button"
                      accessibilityLabel={kk.quran.readerMushafScaleSmallerA11y}
                    >
                      <MaterialIcons name="remove" size={22} color={colors.accent} />
                    </Pressable>
                    <Text
                      style={styles.readerMushafScaleValue}
                      accessibilityRole="text"
                      accessibilityLabel={kk.quran.readerMushafScaleValueA11y(
                        Math.round(mushafTextScale * 100)
                      )}
                    >
                      {Math.round(mushafTextScale * 100)}%
                    </Text>
                    <Pressable
                      style={({ pressed }) => [styles.readerMushafScaleBtn, pressed && { opacity: 0.88 }]}
                      onPress={() => {
                        const next = clampMushafTextScale(mushafTextScale + MUSHAF_TEXT_SCALE_STEP);
                        setMushafTextScale(next);
                        void AsyncStorage.setItem(QURAN_READER_MUSHAF_TEXT_SCALE_KEY, String(next));
                      }}
                      disabled={mushafTextScale >= MUSHAF_TEXT_SCALE_MAX - 1e-6}
                      accessibilityRole="button"
                      accessibilityLabel={kk.quran.readerMushafScaleLargerA11y}
                    >
                      <MaterialIcons name="add" size={22} color={colors.accent} />
                    </Pressable>
                  </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View style={[styles.readerAccordionWrap, styles.readerSettingRowAfterContent]}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("tajweed")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "tajweed" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.tajweedModeLabel}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "tajweed" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "tajweed" ? (
                  <View style={styles.readerAccordionPanel}>
                    <View style={styles.readerSettingRow}>
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
                  <RaqatOrnamentSpinner size={20} />
                  <Text style={styles.readerSettingsLoadingTxt}>{kk.quran.tajweedLoading}</Text>
                </View>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.readerLegendBtn, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  closeReaderSettings();
                  setTajweedLegendOpen(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={kk.quran.readerOpenLegend}
              >
                <MaterialIcons name="palette" size={22} color={colors.accent} />
                <Text style={styles.readerLegendBtnTxt}>{kk.quran.readerOpenLegend}</Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
              </Pressable>
                  </View>
                ) : null}
              </View>
              <Pressable
                style={({ pressed }) => [styles.readerSettingsDoneBtn, pressed && { opacity: 0.92 }]}
                onPress={closeReaderSettings}
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
              {TAJWEED_RULES_CATALOG.map((meta) => (
                <View key={meta.rule} style={styles.legendLine}>
                  <View
                    style={[
                      styles.legendDot,
                      { backgroundColor: isDark ? meta.colorDark : meta.colorLight },
                    ]}
                  />
                  <View style={styles.legendTxtCol}>
                    <Text style={styles.legendRuleTitle}>
                      {meta.labelKk}{" "}
                      <Text style={styles.legendTag}>{meta.tagOpen}</Text>
                    </Text>
                    <Text style={styles.legendTxtMultiline}>{meta.detailKk}</Text>
                  </View>
                </View>
              ))}
              <Text style={styles.legendFoot}>{kk.quran.tajweedSourceNote}</Text>
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.readerLegendBtn, pressed && { opacity: 0.9 }, { marginTop: 4 }]}
              onPress={() => {
                setTajweedLegendOpen(false);
                navigation.navigate("TajweedGuide");
              }}
              accessibilityRole="button"
              accessibilityLabel={kk.quran.tajweedOpenGuideA11y}
            >
              <MaterialIcons name="menu-book" size={22} color={colors.accent} />
              <Text style={styles.readerLegendBtnTxt}>{kk.quran.tajweedOpenGuide}</Text>
              <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.legendCloseBtn, pressed && { opacity: 0.88 }]}
              onPress={() => setTajweedLegendOpen(false)}
            >
              <Text style={styles.legendCloseTxt}>{kk.quran.tajweedLegendClose}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={juzPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setJuzPickerVisible(false)}
      >
        <View style={styles.readerSettingsRoot}>
          <Pressable style={styles.readerSettingsBackdrop} onPress={() => setJuzPickerVisible(false)} />
          <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
            <View style={styles.readerSettingsHandle} />
            <Text style={styles.readerSettingsTitle}>{kk.quran.juzPickerSheetTitle}</Text>
            <ScrollView
              style={{ maxHeight: Math.min(480, windowHeight * 0.62) }}
              contentContainerStyle={styles.readerSettingsScrollPad}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {QURAN_JUZ_STARTS.map((row) => {
                const surahTitle = surahDisplayTitle(row.startSurah, "");
                const isCurrentJuz = row.juz === readerJuzFromAnchor;
                return (
                  <Pressable
                    key={row.juz}
                    style={({ pressed }) => [
                      styles.juzPickerRow,
                      isCurrentJuz && styles.readerChoiceRowSelected,
                      pressed && { opacity: 0.88 },
                    ]}
                    onPress={() => navigateToJuzStart(row)}
                    accessibilityRole="button"
                    accessibilityLabel={`${kk.quran.juzTitle(row.juz)}. ${kk.quran.juzStartsAtLine(surahTitle, row.startAyah)}`}
                  >
                    <View style={styles.juzPickerRowTextCol}>
                      <Text style={styles.juzPickerRowTitle}>{kk.quran.juzTitle(row.juz)}</Text>
                      <Text style={styles.juzPickerRowSub} numberOfLines={2}>
                        {kk.quran.juzStartsAtLine(surahTitle, row.startAyah)}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              style={({ pressed }) => [styles.readerSettingsDoneBtn, pressed && { opacity: 0.92 }]}
              onPress={() => setJuzPickerVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={kk.common.done}
            >
              <Text style={styles.readerSettingsDoneTxt}>{kk.common.done}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {readerBody}
    </View>
  );
}

function makeStyles(
  colors: ThemeColors,
  isDark: boolean,
  mushMetrics: MushafTypographyMetrics,
  mushafLayout: boolean,
  readingThemeId: QuranReadingThemeId
) {
  const readingTheme = resolveQuranReadingTheme(readingThemeId);
  const bookDesk = readingTheme.desk;
  const uiBg = readingTheme.pageFace;
  const uiCard = readingTheme.pageFace;
  const uiBorder = readingTheme.pageBorderColor;
  const uiText = readingTheme.titleInk;
  const uiMuted = readingTheme.chromeInk;
  const quranChromeBorder = readingTheme.pageBorderColor;
  const quranChromeSurface = readingTheme.titlePaperBg;
  /** Аят арабы: muftyat оқулық нақышында жасыл, басқа пресеттерде қара/ақ. */
  const {
    scale,
    arabAyahFont,
    mushafArabSize,
    mushafArabLineHeight,
    mushafTitleFs,
    mushafTitleLh,
    mushafBismFont,
    mushafBismLh,
    densityLayout,
  } = mushMetrics;
  const quranAyahArabicInk = readingTheme.arabicInk;
  const mushafMutedInk = uiMuted;
  const mushafStrongInk = uiText;
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: uiBg, position: "relative" },
    mushafBookFlatList: { flex: 1 },
    mushafPagerHost: {
      direction: "ltr",
      flex: 1,
      minHeight: 0,
      backgroundColor: bookDesk,
    },
    mushafPagerPageShell: {
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
    },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: uiBg,
      padding: 24,
    },
    muted: { color: uiMuted, marginTop: 12 },
    err: { color: colors.error, textAlign: "center", lineHeight: 20 },
    errorActions: {
      marginTop: 18,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    errorPrimaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    errorPrimaryBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
    errorSecondaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: uiBorder,
      backgroundColor: uiCard,
    },
    errorSecondaryBtnText: { color: colors.text, fontSize: 13, fontWeight: "800" },
    topBar: {
      paddingLeft: 8,
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
      color: uiText,
      fontSize: 13,
      fontWeight: "800",
      flexShrink: 1,
      minWidth: 0,
    },
    topBarJuzCluster: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      flexShrink: 1,
      minWidth: 0,
      maxWidth: "52%",
    },
    topBarJuzPickerBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 0,
      borderColor: quranChromeBorder,
      backgroundColor: quranChromeSurface,
      alignItems: "center",
      justifyContent: "center",
    },
    topBarJuzPickerBtnMushaf: {
      borderColor: isDark ? "rgba(255,255,255,0.22)" : quranChromeBorder,
      backgroundColor: "transparent",
    },
    topBarRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    ayahMenuImlaBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 8,
      paddingVertical: 8,
      marginTop: 4,
      marginBottom: 8,
      borderRadius: 10,
      borderWidth: 0,
      borderColor: uiBorder,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : quranChromeSurface,
    },
    ayahMenuImlaHint: {
      flex: 1,
      minWidth: 0,
      fontSize: 12,
      fontWeight: "800",
      color: uiMuted,
    },
    ayahMenuImlaPill: {
      flexShrink: 0,
      maxWidth: 160,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: isDark ? "rgba(38,166,154,0.22)" : "rgba(38,166,154,0.14)",
      borderWidth: 1,
      borderColor: colors.accent,
    },
    ayahMenuImlaPillTurkish: {
      borderColor: colors.prayerCalmGreen,
      backgroundColor: isDark ? "rgba(77,182,172,0.22)" : "rgba(77,182,172,0.18)",
    },
    ayahMenuImlaPillTxt: {
      fontSize: 12,
      fontWeight: "900",
      color: uiText,
    },
    topBarBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 0,
      borderColor: quranChromeBorder,
      backgroundColor: quranChromeSurface,
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
      backgroundColor: uiBg,
      borderBottomWidth: 0,
      borderBottomColor: "transparent",
    },
    mushafTopBarMid: {
      backgroundColor: "transparent",
    },
    mushafAyahAudioLoadingBar: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "stretch",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
      marginHorizontal: 12,
      marginBottom: 4,
      borderRadius: 10,
      borderWidth: 0,
      borderColor: uiBorder,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : quranChromeSurface,
    },
    mushafAyahAudioLoadingTxt: {
      fontSize: 13,
      fontWeight: "600",
      color: uiText,
      flexShrink: 1,
    },
    mushafTopBarBtn: {
      borderColor: isDark ? "rgba(255,255,255,0.14)" : quranChromeBorder,
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : quranChromeSurface,
    },
    mushafTopSurahLatin: {
      flex: 1,
      minWidth: 0,
      color: uiMuted,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    mushafTopHeaderCenter: {
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    mushafTopTitleCenter: {
      ...quranSurahListTypography.readerTitle,
      color: uiText,
      alignSelf: "stretch",
    },
    mushafTopSubtitleCenter: {
      ...quranSurahListTypography.readerSubtitle,
      color: uiMuted,
      alignSelf: "stretch",
    },
    mushafTopHeaderRow: {
      flex: 1,
      minWidth: 0,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10,
    },
    mushafTopLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flexShrink: 0,
    },
    mushafTopJuzLeft: {
      color: uiText,
      fontSize: 13,
      fontWeight: "600",
    },
    mushafTopRight: {
      flex: 1,
      minWidth: 0,
      alignItems: "flex-end",
    },
    mushafTopSurahLatinRight: {
      color: uiText,
      fontSize: 14,
      fontWeight: "600",
      textAlign: "right",
    },
    mushafTopSurahArRight: {
      marginTop: 2,
      color: uiMuted,
      fontSize: 14,
      fontWeight: "400",
      textAlign: "right",
      writingDirection: "rtl",
    },
    mushafTopJuzPart: {
      flexShrink: 1,
      minWidth: 0,
      flex: 1,
      color: uiText,
      fontSize: 13,
      fontWeight: "600",
    },
    mushafSurahTitleBlock: {
      alignSelf: "stretch",
      alignItems: "center",
      paddingBottom: 2,
      marginBottom: 10,
    },
    mushafSurahTitlePaper: {
      alignSelf: "center",
      maxWidth: "96%",
      marginTop: 4,
      paddingVertical: 0,
      paddingHorizontal: 0,
      backgroundColor: "transparent",
      borderBottomWidth: 0,
      borderBottomColor: "transparent",
    },
    mushafSurahTitleAr: {
      color: uiText,
      fontSize: 24,
      fontWeight: "400",
      writingDirection: "rtl",
      textAlign: "center",
      lineHeight: 40,
      letterSpacing: 0.04,
      ...Platform.select({
        web: {
          fontFamily: `"${QURAN_BOOK_FONT_FACE.amiri}", "Scheherazade New", "Noto Naskh Arabic", serif`,
        },
        default: { fontFamily: QURAN_BOOK_FONT_FACE.amiri },
      }),
    },
    mushafBismillahBanner: {
      borderColor: "transparent",
      backgroundColor: "transparent",
      marginBottom: densityLayout.mushafBismillahBannerMarginBottom,
      paddingVertical: densityLayout.mushafBismillahBannerPaddingVertical,
      paddingHorizontal: 10,
    },
    mushafBismillahBannerTxt: {
      textAlign: "center",
      color: quranAyahArabicInk,
      ...(mushafBismFont ? { fontSize: mushafBismFont } : { fontSize: Math.round(36 * scale) }),
      ...(mushafBismLh ? { lineHeight: mushafBismLh } : { lineHeight: Math.round(52 * scale) }),
      letterSpacing: 0,
      ...(arabAyahFont.fontFamily
        ? { fontFamily: arabAyahFont.fontFamily }
        : { fontFamily: QURAN_BOOK_FONT_FACE.lateef }),
    },
    mushafListPad: { paddingHorizontal: 26, paddingTop: 10 },
    /** Мұсаф скролл: арабтан кейінгі транскрипция/мағына блоктары */
    mushafSecondaryAyahBlock: {
      alignSelf: "stretch",
      marginTop: 12,
      paddingBottom: 2,
    },
    mushafSecondaryAyahRibbon: {
      alignSelf: "stretch",
      textAlign: "right",
      writingDirection: "rtl",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 0.4,
      color: uiMuted,
      marginBottom: 4,
      ...Platform.select({
        web: arabAyahFont.fontFamily ? { fontFamily: arabAyahFont.fontFamily } : {},
        default: arabAyahFont.fontFamily
          ? { fontFamily: arabAyahFont.fontFamily }
          : { fontFamily: QURAN_BOOK_FONT_FACE.lateef },
      }),
    },
    mushafAyahRow: {
      marginBottom: densityLayout.mushafAyahRowMarginBottom,
      paddingVertical: densityLayout.mushafAyahRowPaddingVertical,
      alignSelf: "stretch",
    },
    mushafAyahRowResumeHighlight: {
      borderLeftWidth: 0,
      borderLeftColor: "transparent",
      paddingLeft: 6,
      marginLeft: -2,
      borderRadius: 2,
    },
    mushafAyahArabicCluster: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: densityLayout.mushafAyahArabicClusterGap,
    },
    mushafAyahBookmarkRail: {
      width: 14,
      paddingTop: 3,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    mushafAyahBookmarkDot: {
      width: 11,
      height: 11,
      borderRadius: 6,
      borderWidth: 0,
      borderColor: "transparent",
    },
    /** Мұсаф аят белгісі. */
    mushafAyahMarkerOuter: {
      width: 34,
      height: 34,
      borderRadius: 17,
      borderWidth: 0,
      borderColor: "transparent",
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 0,
    },
    mushafAyahMarkerInner: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 0,
      borderColor: "transparent",
    },
    mushafAyahMarkerTxt: {
      color: uiMuted,
      fontSize: Math.max(12, Math.round(13 * scale)),
      fontWeight: "400",
      letterSpacing: 0.32,
      ...Platform.select({
        web: arabAyahFont.fontFamily ? { fontFamily: arabAyahFont.fontFamily } : {},
        default: arabAyahFont.fontFamily
          ? { fontFamily: arabAyahFont.fontFamily }
          : { fontFamily: QURAN_BOOK_FONT_FACE.lateef },
      }),
    },
    mushafAyahArabicWrap: {
      flex: 1,
      minWidth: 0,
    },
    mushafAyahArabicTap: {
      position: "relative",
      alignSelf: "stretch",
      maxWidth: "100%",
    },
    mushafAyahArabicTapPressed: {
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
      borderRadius: 12,
    },
    mushafAyahTxt: quranArabicNoClipTextStyle({
      color: quranAyahArabicInk,
      writingDirection: "rtl",
      textAlign: "justify",
      ...arabAyahFont,
      ...(mushafArabSize ? { fontSize: mushafArabSize } : null),
      ...(mushafArabLineHeight ? { lineHeight: mushafArabLineHeight } : null),
      letterSpacing: 0.12,
    }),
    /** Мұсаф кітап көрінісі: қазақша/транскрипция — кітап денесі қарпі мен жылы сия */
    mushafAyahSectionCaption: {
      marginTop: 4,
      marginBottom: 2,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.6,
      color: uiMuted,
      textAlign: "center",
      width: "100%",
    },
    mushafAyahKiril: {
      marginTop: 0,
      color: uiText,
      fontSize: 15,
      lineHeight: 24,
      textAlign: "center",
      fontWeight: "500",
      width: "100%",
      ...Platform.select({
        ios: { fontFamily: "Georgia" },
        android: { fontFamily: "serif" },
        default: {},
      }),
    },
    mushafAyahKk: {
      marginTop: 0,
      color: uiText,
      fontSize: 16,
      lineHeight: 27,
      textAlign: "center",
      fontWeight: "500",
      width: "100%",
      ...Platform.select({
        ios: { fontFamily: "Georgia" },
        android: { fontFamily: "serif" },
        default: {},
      }),
    },
    mushafNoKkHint: {
      marginTop: 8,
      fontSize: 11,
      lineHeight: 17,
      fontStyle: "italic",
      color: uiMuted,
      textAlign: "center",
      width: "100%",
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
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "transparent",
      backgroundColor: "transparent",
      overflow: "hidden",
    },
    mushafFooterSep: {
      width: 0,
      height: 22,
      backgroundColor: "transparent",
    },
    mushafFooterPillHizb: {
      fontSize: 12,
      fontWeight: "700",
      color: uiMuted,
      maxWidth: 200,
      paddingVertical: 8,
      paddingLeft: 12,
      paddingRight: 8,
    },
    mushafFooterPillNumWrap: {
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 10,
      minHeight: 40,
      backgroundColor: "transparent",
    },
    mushafFooterPillNum: {
      fontSize: 16,
      fontWeight: "800",
      color: uiText,
      textAlign: "center",
    },
    mushafFooterPillEdition: {
      fontSize: 10,
      fontWeight: "700",
      marginTop: 2,
      color: uiMuted,
      textAlign: "center",
      maxWidth: 88,
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
      marginBottom: 18,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "transparent",
      backgroundColor: uiBg,
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
    /** Ayah: таңдалған / ойнап тұрған аят */
    ayahRowAudioFocus: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    bismillahBanner: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
      paddingHorizontal: 14,
      marginBottom: 12,
      borderRadius: 0,
      borderWidth: 0,
      borderColor: "transparent",
      backgroundColor: "transparent",
    },
    bismillahBannerTxt: quranArabicNoClipTextStyle({
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
    }),
    ayahMainTap: { minWidth: 0 },
    /** Дыбыс тек араб мәтінін басқанда */
    ayahArabicTap: {
      position: "relative",
      alignSelf: "stretch",
      maxWidth: "100%",
    },
    ayahArabicTapPressed: {
      backgroundColor: "transparent",
      borderRadius: 0,
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
    ayahTxt: quranArabicNoClipTextStyle({
      color: quranAyahArabicInk,
      writingDirection: "rtl",
      textAlign: "right",
      ...arabAyahFont,
    }),
    /** Арабтан кейінгі оқылу + мағына: орталықтан (оқу қолданбаларының кең тараған түрі). */
    ayahBelowArabic: {
      width: "100%",
      marginTop: 10,
      alignItems: "center",
    },
    /** Транскрипция / қазақша мағына: секция тақырыбы (мұсаф астындағы блоктар үшін де қолданылады) */
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
      color: uiText,
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
      color: uiText,
      fontSize: 17,
      lineHeight: 28,
      textAlign: "center",
      fontWeight: "700",
      width: "100%",
    },
    ayahInlineAudioControl: {
      marginTop: 10,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.04)",
    },
    ayahInlineAudioText: {
      color: uiMuted,
      fontSize: 12,
      fontWeight: "800",
    },
    mushafInlineAudioControl: {
      marginTop: 8,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 999,
      backgroundColor: "rgba(0,0,0,0.04)",
    },
    mushafInlineAudioText: {
      color: uiMuted,
      fontSize: 12,
      fontWeight: "800",
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
    translationSheetContent: {
      paddingHorizontal: 4,
      paddingBottom: 6,
    },
    translationSectionTitle: {
      marginTop: 12,
      marginBottom: 6,
      color: colors.accent,
      fontSize: 13,
      fontWeight: "900",
      letterSpacing: 0.2,
      textTransform: "uppercase",
    },
    translationArabicText: {
      ...arabAyahFont,
      color: uiText,
      fontSize: Math.max(mushafArabSize ?? 30, 30),
      lineHeight: Math.max(mushafArabLineHeight ?? 54, 54),
      textAlign: "right",
      writingDirection: "rtl",
    },
    translationBodyText: {
      color: uiText,
      fontSize: 17,
      lineHeight: 26,
      fontWeight: "700",
    },
    translationTafsirText: {
      color: uiMuted,
      fontSize: 15,
      lineHeight: 23,
      fontWeight: "600",
    },
    readerSectionSubtitle: {
      color: uiText,
      fontSize: 15,
      fontWeight: "800",
      marginBottom: 6,
    },
    readerAccordionWrap: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    },
    readerAccordionWrapFirst: {
      marginTop: 0,
      paddingTop: 0,
      borderTopWidth: 0,
    },
    readerAccordionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
      paddingVertical: 4,
    },
    readerAccordionHeaderTitle: {
      flex: 1,
      color: uiText,
      fontSize: 15,
      fontWeight: "800",
    },
    readerAccordionPanel: {
      marginTop: 6,
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
    juzPickerRow: {
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: uiBorder,
      backgroundColor: uiBg,
    },
    juzPickerRowTextCol: { flex: 1, minWidth: 0 },
    juzPickerRowTitle: { color: uiText, fontSize: 15, fontWeight: "800" },
    juzPickerRowSub: { color: uiMuted, fontSize: 12, marginTop: 3, lineHeight: 16 },
    readerChoiceLabel: {
      flex: 1,
      color: uiText,
      fontSize: 14,
      fontWeight: "700",
    },
    readerMushafScaleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      marginTop: 10,
      marginBottom: 4,
    },
    readerMushafScaleBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: uiBorder,
      backgroundColor: uiCard,
      alignItems: "center",
      justifyContent: "center",
    },
    readerMushafScaleValue: {
      minWidth: 56,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "900",
      color: uiText,
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
      borderColor: quranChromeBorder,
      backgroundColor: quranChromeSurface,
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
    legendScroll: { maxHeight: 420 },
    legendLine: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
    legendDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
    legendTxtCol: { flex: 1, minWidth: 0 },
    legendRuleTitle: { color: uiText, fontSize: 14, lineHeight: 20, fontWeight: "800" },
    legendTag: { color: uiMuted, fontSize: 12, fontWeight: "600" },
    legendTxt: { flex: 1, color: uiText, fontSize: 13, lineHeight: 20, fontWeight: "600" },
    legendTxtMultiline: { color: uiMuted, fontSize: 12, lineHeight: 18, fontWeight: "500", marginTop: 2 },
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
      backgroundColor: quranChromeSurface,
      borderWidth: 1,
      borderColor: quranChromeBorder,
      alignItems: "center",
    },
    legendCloseTxt: { color: colors.accent, fontSize: 15, fontWeight: "800" },
  });
}
