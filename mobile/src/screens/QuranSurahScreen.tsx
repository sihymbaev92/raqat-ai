import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
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
  saveSurahAyahsCache,
  displayCachedAyahArabic,
  quranAyahMeaningForLocale,
  type CachedAyah,
} from "../storage/quranSurahCache";
import { useQuranLocaleTranslation } from "../quran/useQuranLocaleTranslation";
import { resolveEffectiveQuranReaderNavMode, QURAN_READER_ARABIC_ONLY } from "../quran/quranReaderModePolicy";
import { useAppLocale } from "../i18n/runtime";
import { releaseBundledQuranReaderMemory } from "../services/bundledQuranReader";
import { releaseBundledQuranTranslationsMemory } from "../services/quranOfflineTranslations";
import { enrichAyahsFromBundledQuranDb } from "../services/quranKkBundledLookup";
import { enrichAyahsWithAlquranTajweed, shouldShowMushafBismillahBanner } from "../services/quranSurahTajweedEnrich";
import { useQuranSurahLoad } from "../quran/useQuranSurahLoad";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import { juzForSurahAyah, type QuranJuzStart } from "../data/quranJuzBoundaries";
import { surahArabicFromBundled } from "../constants/surahBundledMeta";
import { surahAyahToGlobalOneBased } from "../data/quranAyahCounts";
import { hizbForGlobalAyahOneBased } from "../data/quranHizbBoundaries";
import { mushafDisplayPageFromGlobalAyahOneBased } from "../data/quranMushafPageByGlobalAyah";
import {
  DEFAULT_QURAN_RECITER_EDITION,
  QURAN_KY_HAKIMOV_AUDIO_EDITION,
  QURAN_UZ_RWWAD_AUDIO_EDITION,
  isQuranReciterAudioAvailable,
  normalizeReciterEdition,
  type QuranReciterGroup,
} from "../config/quranReciters";
import {
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
import { QURAN_SCREEN_HORIZONTAL_PADDING } from "../quran/quranResponsiveLayout";
import { getQuranTranslitOverride } from "../content/quranTranslitOverrides";
import { resolveQuranTranslitForDisplay } from "../utils/quranTranslitDisplay";
import { arabicRasmStringsDiffer } from "../lib/quranArabicDualRasm";
import { AyahContextMenuSheet } from "../components/quran/AyahContextMenuSheet";
import {
  QuranSurahReaderSettingsSheet,
  type ReaderSettingsAccordionKey,
} from "../components/quran/QuranSurahReaderSettingsSheet";
import { QuranSurahReaderBody } from "../components/quran/QuranSurahReaderBody";
import { QuranSurahTranslationSheet } from "../components/quran/QuranSurahTranslationSheet";
import { QuranSurahNoteSheet } from "../components/quran/QuranSurahNoteSheet";
import { QuranSurahTajweedLegendModal } from "../components/quran/QuranSurahTajweedLegendModal";
import { QuranSurahJuzPickerSheet } from "../components/quran/QuranSurahJuzPickerSheet";
import type { MushafContinuousArabicHandle } from "../components/quran/MushafContinuousArabicBlock";
import {
  QuranSurahAyahListRow,
  type QuranSurahAyahListRowStyles,
} from "../components/quran/QuranSurahAyahListRow";
import {
  estimateQuranAyahRowHeight,
  quranAyahListRowLayoutKind,
} from "../quran/quranAyahListItemLayout";
import { buildMushafPagesForSurah, findMushafPageIndexForAyah } from "../quran/buildMushafPagesForSurah";
import { clampMushafBookPageIndex } from "../quran/mushafBookPager";
import type { MushafDensityId } from "../config/mushafConfig";
import { DEFAULT_MUSHAF_DENSITY } from "../config/mushafConfig";
import { surahArabicBannerTitle } from "../data/surahArabicTitles";
import { quranSurahListTypography } from "../theme/quranSurahListTheme";
import { clampMushafTextScale } from "../quran/mushafTextScale";
import { useMushafStyles } from "../quran/useMushafStyles";
import { makeQuranSurahScreenStyles } from "../quran/quranSurahScreenStyles";
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
  getQuranReaderShowMeaning,
  getQuranReaderShowTranslit,
  getQuranReaderAllowRotation,
  setQuranReaderAllowRotation,
  QURAN_TAJWEED_COLORS_KEY,
  QURAN_READER_RECITER_KEY,
  QURAN_READER_ARABIC_FONT_KEY,
  QURAN_READER_MUSHAF_TEXT_SCALE_KEY,
  setQuranReaderNavMode,
  setQuranReaderShowArabic,
  setQuranReaderShowMeaning,
  setQuranReaderShowTranslit,
  type AyahMarkerStyleId,
  type QuranReaderNavMode,
} from "../storage/quranReaderPrefs";
import {
  DEFAULT_QURAN_READING_THEME,
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../theme/quranComReadingTheme";
import {
  loadAyahMarkers,
  removeAyahMarker,
  setAyahMarker,
  type AyahMarkerRecord,
} from "../storage/quranAyahMarkers";
import { runAfterInteractions } from "../utils/uiDefer";

type MushafPagerPage = {
  key: string;
  ayahs: CachedAyah[];
  includeHeader: boolean;
  mushafPageNumber: number;
};
type Props = NativeStackScreenProps<MoreStackParamList, "QuranSurah">;

export function QuranSurahScreen({ route, navigation }: Props) {
  const { surahNumber, initialAyah: initialAyahParam, mushafLayout: mushafLayoutParam } = route.params;
  const mushafLayout = Boolean(mushafLayoutParam);
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const mushafArabicContentWidth = useMemo(
    () => Math.max(280, windowWidth - QURAN_SCREEN_HORIZONTAL_PADDING * 2 - 32),
    [windowWidth]
  );
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
  const {
    ayahs,
    setAyahs,
    ayahsRef,
    loading,
    err,
    refreshing,
    onRefresh,
    retryLoadSurah,
  } = useQuranSurahLoad(surahNumber);
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
  const [readerAllowRotation, setReaderAllowRotation] = useState(true);
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

  const appLocale = useAppLocale();
  const showReciterLocaleFallbackNote = useMemo(() => {
    if (appLocale === "ky") return !isQuranReciterAudioAvailable(QURAN_KY_HAKIMOV_AUDIO_EDITION);
    if (appLocale === "uz") return !isQuranReciterAudioAvailable(QURAN_UZ_RWWAD_AUDIO_EDITION);
    return false;
  }, [appLocale]);
  useQuranLocaleTranslation(surahNumber, ayahs, setAyahs);

  const ayahMeaningLine = useCallback(
    (item: CachedAyah) => quranAyahMeaningForLocale({ ...item, surahNumber }, appLocale),
    [appLocale, surahNumber]
  );

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
        const [showArabic, showTranslit, showMeaning] = await Promise.all([
          getQuranReaderShowArabic(),
          getQuranReaderShowTranslit(),
          getQuranReaderShowMeaning(),
        ]);
        if (!alive) return;
        setShowReaderArabic(showArabic);
        setShowReaderTranslit(showTranslit);
        setShowReaderMeaning(showMeaning);
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
        const r = await getQuranReaderAllowRotation();
        if (!alive) return;
        setReaderAllowRotation(r);
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
          const allowRotation = await getQuranReaderAllowRotation();
          if (cancelled) return;
          setReaderAllowRotation(allowRotation);
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
      return () => {
        releaseBundledQuranReaderMemory({ keepSurahList: true });
        releaseBundledQuranTranslationsMemory();
      };
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
        setShowReaderTranslit(value);
        void setQuranReaderShowTranslit(value);
      } else {
        setShowReaderMeaning(value);
        void setQuranReaderShowMeaning(value);
      }
    },
    [showReaderArabic, showReaderMeaning, showReaderTranslit]
  );

  const styles = useMemo(
    () => makeQuranSurahScreenStyles(colors, isDark, mushafMetrics, mushafLayout, readingThemeId),
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

  const mushafPagerExtraData = useMemo(
    () => ({
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
    }),
    [
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
      effectiveReaderNavMode,
      surahNumber,
      mushafPageWidth,
      mushafDensity,
      ayahMarkerStyleId,
    ]
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
      const kkLine = ayahMeaningLine(item);
      const body = [ar, kkLine].filter(Boolean).join("\n\n");
      await Clipboard.setStringAsync(`${latinHeaderTitle}\n${surahNumber}:${item.numberInSurah}\n\n${body}`);
      setToast(kk.quran.ayahMenuCopied);
      setAyahMenuItem(null);
    },
    [latinHeaderTitle, surahNumber, arabicScriptEdition, ayahMeaningLine]
  );

  const copyAyahWithTranslation = useCallback(
    async (item: CachedAyah) => {
      const ar = displayCachedAyahArabic(item, arabicScriptEdition);
      const kkLine = ayahMeaningLine(item);
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
    [latinHeaderTitle, surahNumber, arabicScriptEdition, ayahMeaningLine]
  );

  const shareAyahItem = useCallback(
    async (item: CachedAyah) => {
      const ar = displayCachedAyahArabic(item, arabicScriptEdition);
      const kkLine = ayahMeaningLine(item);
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
    [latinHeaderTitle, surahNumber, arabicScriptEdition, ayahMeaningLine]
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
          continuousMushaf: true,
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
          const next = normalizeReciterEdition(edition);
          setReciterEdition(next);
          void AsyncStorage.setItem(QURAN_READER_RECITER_KEY, next);
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
      <QuranSurahTranslationSheet
        visible={!!translationTargetItem}
        item={translationTargetItem}
        surahNumber={surahNumber}
        arabicScriptEdition={arabicScriptEdition}
        windowHeight={windowHeight}
        styles={styles}
        ayahMeaningLine={ayahMeaningLine}
        onClose={() => setTranslationTargetItem(null)}
      />
      <QuranSurahNoteSheet
        visible={!!noteTargetItem}
        item={noteTargetItem}
        surahNumber={surahNumber}
        noteDraft={noteDraft}
        onChangeNoteDraft={setNoteDraft}
        styles={styles}
        colors={colors}
        onCancel={() => {
          setNoteTargetItem(null);
          setNoteDraft("");
        }}
        onSave={async () => {
          if (!noteTargetItem) return;
          const prev = ayahMarkers[`${surahNumber}:${noteTargetItem.numberInSurah}`];
          await setAyahMarker(surahNumber, noteTargetItem.numberInSurah, {
            colorId: prev?.colorId ?? "gold",
            note: noteDraft.trim(),
          });
          void refreshAyahMarkers();
          setNoteTargetItem(null);
          setNoteDraft("");
        }}
      />
            <QuranSurahReaderSettingsSheet
        visible={readerSettingsOpen}
        onClose={closeReaderSettings}
        styles={styles}
        colors={colors}
        isDark={isDark}
        mushafLayout={mushafLayout}
        windowHeight={windowHeight}
        readerSettingsAccordion={readerSettingsAccordion}
        toggleReaderSettingsAccordion={toggleReaderSettingsAccordion}
        showReaderArabic={showReaderArabic}
        showReaderTranslit={showReaderTranslit}
        showReaderMeaning={showReaderMeaning}
        setReaderContentLayer={setReaderContentLayer}
        readingThemeId={readingThemeId}
        setReadingThemeId={setReadingThemeId}
        showReciterLocaleFallbackNote={showReciterLocaleFallbackNote}
        reciterEdition={reciterEdition}
        setReciterEdition={setReciterEdition}
        arabicFontPreset={arabicFontPreset}
        setArabicFontPreset={setArabicFontPreset}
        arabicScriptEdition={arabicScriptEdition}
        setArabicScriptEdition={setArabicScriptEdition}
        arabicSourcesExpanded={arabicSourcesExpanded}
        setArabicSourcesExpanded={setArabicSourcesExpanded}
        effectiveReaderNavMode={effectiveReaderNavMode}
        setReaderNavMode={setReaderNavMode}
        mushafDensity={mushafDensity}
        setMushafDensityState={setMushafDensityState}
        ayahMarkerStyleId={ayahMarkerStyleId}
        setAyahMarkerStyleIdState={setAyahMarkerStyleIdState}
        mushafTextScale={mushafTextScale}
        setMushafTextScale={setMushafTextScale}
        showTajweedColors={showTajweedColors}
        onToggleTajweedColors={onToggleTajweedColors}
        tajweedLoading={tajweedLoading}
        onOpenTajweedLegend={() => {
          closeReaderSettings();
          setTajweedLegendOpen(true);
        }}
      />
      <QuranSurahTajweedLegendModal
        visible={tajweedLegendOpen}
        styles={styles}
        colors={colors}
        isDark={isDark}
        onClose={() => setTajweedLegendOpen(false)}
        onOpenGuide={() => {
          setTajweedLegendOpen(false);
          navigation.navigate("TajweedGuide");
        }}
      />
      <QuranSurahJuzPickerSheet
        visible={juzPickerVisible}
        windowHeight={windowHeight}
        readerJuzFromAnchor={readerJuzFromAnchor}
        styles={styles}
        colors={colors}
        onClose={() => setJuzPickerVisible(false)}
        onPickJuz={navigateToJuzStart}
      />
      <QuranSurahReaderBody
        loading={loading}
        err={err}
        ayahs={ayahs}
        styles={styles}
        colors={colors}
        isDark={isDark}
        mushafLayout={mushafLayout}
        surahNumber={surahNumber}
        titleKk={titleKk}
        surahArabicTitleLine={surahArabicTitleLine}
        readerJuzFromAnchor={readerJuzFromAnchor}
        mushafFooterHizb={mushafFooterHizb}
        mushafFooterPage={mushafFooterPage}
        visibleMushafPrintPage={visibleMushafPrintPage}
        mushafChromeIconColor={mushafChromeIconColor}
        showReaderArabic={showReaderArabic}
        showReaderTranslit={showReaderTranslit}
        showReaderMeaning={showReaderMeaning}
        showTajweedColors={showTajweedColors}
        showTajweedForDisplay={showTajweedForDisplay}
        tajweedLoading={tajweedLoading}
        arabicScriptEdition={arabicScriptEdition}
        bookmarked={bookmarked}
        setBookmarked={setBookmarked}
        readerAllowRotation={readerAllowRotation}
        setReaderAllowRotation={setReaderAllowRotation}
        onToggleTajweedColors={onToggleTajweedColors}
        handleReaderBack={handleReaderBack}
        retryLoadSurah={retryLoadSurah}
        setJuzPickerVisible={setJuzPickerVisible}
        setReaderSettingsOpen={setReaderSettingsOpen}
        setTajweedLegendOpen={setTajweedLegendOpen}
        mushafAyahAudioActive={mushafAyahAudioActive}
        playingAyahInSurah={playingAyahInSurah}
        loadingAyahAudio={loadingAyahAudio}
        ayahAudioIsPlaying={ayahAudioIsPlaying}
        playAyahSudais={playAyahSudais}
        mushafPageMode={mushafPageMode}
        mushafScrollMode={mushafScrollMode}
        horizontalListRef={horizontalListRef}
        mushafPages={mushafPages}
        mushafPageWidth={mushafPageWidth}
        onHorizontalViewableItemsChanged={onHorizontalViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onMushafPagerScrollBeginDrag={onMushafPagerScrollBeginDrag}
        onMushafPagerScrollEnd={onMushafPagerScrollEnd}
        mushafPagerExtraData={mushafPagerExtraData}
        refreshing={refreshing}
        onRefresh={onRefresh}
        showMushafBismillahBanner={showMushafBismillahBanner}
        readingThemeId={readingThemeId}
        mushafHighlightAyah={mushafHighlightAyah}
        ayahMarkers={ayahMarkers}
        setAyahMenuItem={setAyahMenuItem}
        onMushafPagerVerticalReadingAnchor={onMushafPagerVerticalReadingAnchor}
        scrollTargetAyah={scrollTargetAyah}
        mushafScrollRef={mushafScrollRef}
        onMushafScroll={onMushafScroll}
        mushafScrollContentHeightRef={mushafScrollContentHeightRef}
        mushafScrollContentRef={mushafScrollContentRef}
        mushafContinuousRef={mushafContinuousRef}
        mushafArabicContentWidth={mushafArabicContentWidth}
        onMushafAyahTopMeasured={onMushafAyahTopMeasured}
        fallbackMushafScrollYForAyah={fallbackMushafScrollYForAyah}
        mushafAyahAccessibilityLabel={mushafAyahAccessibilityLabel}
        ayahMeaningLine={ayahMeaningLine}
        listRef={listRef}
        flashListRowType={flashListRowType}
        onViewableItemsChanged={onViewableItemsChanged}
        flashListPlaybackExtra={flashListPlaybackExtra}
        renderAyahListRow={renderAyahListRow}
      />

    </View>
  );
}
