import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
  Platform,
  Share,
  FlatList,
  PanResponder,
  Animated,
} from "react-native";
import { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import * as Clipboard from "expo-clipboard";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { IlluminatedManuscriptFrame } from "../components/IlluminatedManuscriptFrame";
import {
  HatimPageTurnOverlay,
  runHatimPageTurnAnimation,
  springHatimPageTurnBack,
  type HatimPageTurnDirection,
} from "../components/quran/HatimPageTurnOverlay";
import { MushafBookFooter } from "../components/quran/MushafBookFooter";
import { MushafBookPageScroll } from "../components/quran/MushafBookPageScroll";
import { AyahContextMenuSheet } from "../components/quran/AyahContextMenuSheet";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/ThemeContext";
import { kk, APP_BRAND_KK } from "../i18n/kk";
import { toEasternArabicIndic } from "../utils/easternArabicIndic";
import { ensureBundledQuranReaderLoaded } from "../services/bundledQuranReader";
import { loadBundledTajweedSurahMap } from "../services/bundledQuranTajweed";
import {
  buildQcf4MushafPagesGlobal,
  buildQcf4MushafPagesGlobalLight,
  buildMushafPagesGlobal,
  buildMushafPagesGlobalLight,
  filterMushafBookPagesForSurah,
  findMushafBookPageIndexForAyah,
  mushafBookPageIndex,
  resolveMushafBookAyah,
} from "../quran/buildMushafPagesGlobal";
import type { MushafBookPageSlice, MushafAyahRef } from "../quran/mushafBookTypes";
import { makeMushafBookPageStyles } from "../quran/mushafBookPageStyles";
import { useMushafStyles } from "../quran/useMushafStyles";
import {
  MUSHAF_BOOK_PAGER_NATIVE_SCROLL_ENABLED,
  mushafBookOffsetForVisualIndex,
  mushafBookPageOffsetForIndex,
  mushafBookPageIndexForSwipe,
  mushafBookPagerListProps,
  mushafBookVisualIndexForPageIndex,
} from "../quran/mushafBookPager";
import { mushafPageForSurahAyah } from "../quran/mushafPageForSurahAyah";
import {
  isMushafBookRasterBackend,
  mushafBookEffectiveRenderBackend,
  mushafBookPageRenderBackend,
} from "../quran/mushafPageRenderBackend";
import { loadMushafAyahMap, type MushafAyahMapFile } from "../quran/mushafAyahMap";
import { preloadAdjacentQcf4Pages } from "../quran/loadQcf4Page";
import {
  hatimPageGrabAnchor,
  hatimPageTurnCanDrag,
  hatimPageTurnProgressFromDx,
  hatimPageTurnShouldCommit,
  hatimPageTurnSignedDx,
  hatimPageTurnSwapDelayMs,
} from "../quran/hatimInteractivePageTurn";
import { hatimPagePeelClipAnimatedStyle } from "../quran/hatimPageCurlTransform";
import { AYAH_COUNTS_PER_SURAH } from "../data/quranAyahCounts";
import { juzForSurahAyah } from "../data/quranJuzBoundaries";
import { hizbForGlobalAyahOneBased } from "../data/quranHizbBoundaries";
import { surahDisplayTitle } from "../constants/surahTitleKk";
import { surahArabicListTitle } from "../data/surahArabicTitles";
import {
  quranAyahMp3Url,
  quranReciterHasAudioForGlobalAyah,
  quranReciterSupportsArabicKaraoke,
  quranReciterUsesAyahAudio,
} from "../services/quranSudaisAudio";
import { resolveCachedOrRemoteQuranAudioUri } from "../services/quranAudioCache";
import { ayahNumbersForAudioPlayUntil } from "../quran/quranAyahPlayQueue";
import {
  getHatimAudioPlayUntil,
  setHatimAudioPlayUntil,
  type HatimAudioPlayUntil,
} from "../storage/hatimPrefs";
import { recordHatimAyahTapped, saveHatimResume } from "../storage/hatimProgress";
import { loadAyahMarkers, removeAyahMarker, setAyahMarker, type AyahMarkerRecord } from "../storage/quranAyahMarkers";
import { resetQuranKaraokePlayback, setQuranKaraokePlayback } from "../context/quranKaraokeSync";
import { fetchQuranComAyahAudioSegments } from "../services/quranComAudioSegments";
import {
  type AyahWordTimestampSegment,
  karaokeWordIndexFromPlaybackMs,
  karaokeWordIndexMonotonicForward,
  splitAyahArabicWords,
} from "../utils/quranAyahAudioKaraoke";
import {
  getMushafDensity,
  getQuranArabicScriptEdition,
  getQuranReaderShowArabic,
  getQuranReaderShowMeaning,
  getQuranReaderShowTranslit,
  getQuranReadingTheme,
  setMushafDensity,
  setQuranArabicFontPreset,
  setQuranArabicScriptEdition,
  setQuranMushafTextScale,
  setQuranReaderShowArabic,
  setQuranReaderShowMeaning,
  setQuranReaderShowTranslit,
  setQuranReadingTheme,
  setQuranTajweedColorsEnabled,
  QURAN_READER_RECITER_KEY,
  QURAN_READER_ARABIC_FONT_KEY,
  QURAN_TAJWEED_COLORS_KEY,
} from "../storage/quranReaderPrefs";
import { DEFAULT_QURAN_RECITER_EDITION, normalizeReciterEdition } from "../config/quranReciters";
import {
  DEFAULT_QURAN_ARABIC_FONT_PRESET,
  normalizeArabicFontPreset,
  type QuranArabicFontPresetId,
} from "../config/quranArabicFontPresets";
import { DEFAULT_QURAN_ARABIC_SCRIPT_EDITION } from "../config/quranArabicScriptEdition";
import { DEFAULT_MUSHAF_DENSITY } from "../config/mushafConfig";
import {
  DEFAULT_QURAN_READING_THEME,
  resolveQuranReadingTheme,
} from "../theme/quranComReadingTheme";
import { loadQuranBookFonts } from "../fonts/quranBookFonts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { surahAyahToGlobalOneBased } from "../data/quranAyahCounts";
import {
  displayCachedAyahArabic,
  parseAyahsFromApiResponse,
  quranAyahMeaningForLocale,
  type CachedAyah,
} from "../storage/quranSurahCache";
import { HATIM_LOCKED_MUSHAF_TEXT_SCALE } from "../quran/mushafTextScale";
import {
  resolveHatimBookArabicFont,
  resolveHatimBookDensity,
  resolveHatimBookReadingTheme,
  resolveHatimBookScript,
  hatimBookUsesBundledTextHafsOffline,
  preloadHatimOfflineAssets,
  persistHatimBookLockedPrefs,
} from "../quran/hatimBookPolicy";
import { HATIM_MUSHAF_ARABIC_ONLY, hatimMushafReaderLayers } from "../quran/quranReaderModePolicy";
import { getQuranTranslitOverride } from "../content/quranTranslitOverrides";
import { resolveQuranTranslitForDisplay } from "../utils/quranTranslitDisplay";
import { useAppLocale } from "../i18n/runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";
import {
  getQuranSurahTranslation,
  isQuranTranslationLocale,
  mergeTranslationIntoMushafPages,
  quranTranslationFieldForLocale,
} from "../services/quranTranslationEditions";
import { useMushafBookLastReadPersistence } from "../quran/useMushafBookLastReadPersistence";
import { useMushafBookAyahFocus } from "../quran/useMushafBookAyahFocus";
import { useMushafBookAudioScroll } from "../quran/useMushafBookAudioScroll";
import {
  mushafBookContentWidth,
  mushafBookNativeContentWidth,
} from "../quran/mushafBookPageLayout";
import { isMushafBookRenderPageActive } from "../quran/mushafBookActivePage";
import { shouldRenderSingleMushafBookPage } from "../quran/quranReaderModePolicy";
import { fetchAlquranUthmaniAndUnicodeAyahs } from "../services/alquranSurahDualArabicFetch";
import { runWhenHeavyWorkAllowed } from "../utils/uiDefer";

type Props = NativeStackScreenProps<MoreStackParamList, "QuranMushafBook">;
type HatimAyahSelection = { ref: MushafAyahRef; item: CachedAyah };
type HatimPageTurnState = { key: number; direction: HatimPageTurnDirection } | null;

const HATIM_REMOTE_QURAN_FETCH_TIMEOUT_MS = 14_000;

function buildHatimInitialLightPages(): MushafBookPageSlice[] {
  try {
    const light = hatimBookUsesBundledTextHafsOffline()
      ? buildMushafPagesGlobalLight()
      : buildQcf4MushafPagesGlobalLight();
    return light.length ? light : [];
  } catch {
    return [];
  }
}

function hatimTajweedUrl(surah: number): string {
  return `https://api.alquran.cloud/v1/surah/${surah}/quran-tajweed`;
}

async function fetchHatimTajweedMap(surah: number): Promise<Record<number, string> | null> {
  const bundled = await loadBundledTajweedSurahMap(surah);
  if (bundled) return bundled;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HATIM_REMOTE_QURAN_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(hatimTajweedUrl(surah), { signal: ctrl.signal });
    if (!res.ok) return null;
    const tagged = parseAyahsFromApiResponse(await res.json());
    if (!tagged?.length) return null;
    const out: Record<number, string> = {};
    for (const ayah of tagged) {
      const text = (ayah.text ?? "").trim();
      if (text.includes("[")) out[ayah.numberInSurah] = text;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function mergeTajweedIntoMushafPages(
  pages: MushafBookPageSlice[],
  surah: number,
  map: Record<number, string>
): MushafBookPageSlice[] {
  let changed = false;
  const next = pages.map((page) => {
    let pageChanged = false;
    const ayahs = page.ayahs.map((ayah) => {
      if (ayah.surahNumber !== surah) return ayah;
      const textTajweed = (map[ayah.numberInSurah] ?? "").trim();
      if (!textTajweed || ayah.textTajweed === textTajweed) return ayah;
      pageChanged = true;
      changed = true;
      return { ...ayah, textTajweed };
    });
    return pageChanged ? { ...page, ayahs } : page;
  });
  return changed ? next : pages;
}

async function fetchHatimTurkishPrintMap(surah: number): Promise<Record<number, string> | null> {
  const { turkishPrint } = await fetchAlquranUthmaniAndUnicodeAyahs(
    surah,
    HATIM_REMOTE_QURAN_FETCH_TIMEOUT_MS
  );
  if (!turkishPrint?.length) return null;
  const out: Record<number, string> = {};
  for (const ayah of turkishPrint) {
    const text = (ayah.text ?? "").trim();
    if (text) out[ayah.numberInSurah] = text;
  }
  return Object.keys(out).length ? out : null;
}

function mergeTurkishPrintIntoMushafPages(
  pages: MushafBookPageSlice[],
  surah: number,
  map: Record<number, string>
): MushafBookPageSlice[] {
  let changed = false;
  const next = pages.map((page) => {
    let pageChanged = false;
    const ayahs = page.ayahs.map((ayah) => {
      if (ayah.surahNumber !== surah) return ayah;
      const textTurkishPrint = (map[ayah.numberInSurah] ?? "").trim();
      if (!textTurkishPrint || ayah.textTurkishPrint === textTurkishPrint) return ayah;
      pageChanged = true;
      changed = true;
      return { ...ayah, textTurkishPrint };
    });
    return pageChanged ? { ...page, ayahs } : page;
  });
  return changed ? next : pages;
}

function hatimShortTafsirForAyah(meaning: string, tr: (text: string) => string): string {
  const text = meaning.trim();
  if (!text) return tr(kk.quran.ayahTranslationTafsirBody);
  return `${tr(kk.quran.ayahTranslationTafsirPrefix)} — ${text} ${tr(kk.quran.ayahTranslationTafsirSuffix)}`;
}

export function QuranMushafBookScreen({ route, navigation }: Props) {
  const { initialPage, focusSurah, focusAyah, continuousMushaf } = route.params ?? {};
  const surahScope =
    !continuousMushaf && focusSurah != null && focusSurah >= 1 && focusSurah <= 114
      ? focusSurah
      : null;
  const routeStartPageIndex =
    focusSurah != null && focusAyah != null
      ? mushafBookPageIndex(mushafPageForSurahAyah(focusSurah, focusAyah))
      : initialPage != null
        ? mushafBookPageIndex(initialPage)
        : 0;
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [pages, setPages] = useState<MushafBookPageSlice[]>(buildHatimInitialLightPages);
  const [loading, setLoading] = useState(() => pages.length === 0);
  const [err, setErr] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(routeStartPageIndex);
  const [pageTurn, setPageTurn] = useState<HatimPageTurnState>(null);
  const [dragDirection, setDragDirection] = useState<HatimPageTurnDirection | null>(null);
  const [pageTurnGrabY, setPageTurnGrabY] = useState(0.5);
  /** Curl анимациясында ескі бет майысады; pageIndex бірден жаңарады. */
  const [pageTurnSourceIndex, setPageTurnSourceIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((message: string, hideAfterMs: number) => {
    if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    setToast(message);
    toastHideTimerRef.current = setTimeout(() => {
      toastHideTimerRef.current = null;
      setToast(null);
    }, hideAfterMs);
  }, []);
  useEffect(
    () => () => {
      if (toastHideTimerRef.current) clearTimeout(toastHideTimerRef.current);
    },
    []
  );
  const [pagerViewWidth, setPagerViewWidth] = useState(0);
  const [pagerViewHeight, setPagerViewHeight] = useState(0);
  const pagerWidthStableRef = useRef(0);
  const pagerHeightStableRef = useRef(0);
  const pageIndexFromViewabilityRef = useRef(false);
  const pageTurnAnim = useRef(new Animated.Value(0)).current;
  const pageTurnPrevIndexRef = useRef(routeStartPageIndex);
  const pageTurnReadyRef = useRef(false);
  const pageIndexRef = useRef(routeStartPageIndex);
  const dragDirectionRef = useRef<HatimPageTurnDirection | null>(null);
  const dragGrabYRatioRef = useRef(0.5);
  const pageTurnSourceIndexRef = useRef<number | null>(null);
  const pageTurnSwapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextPageTurnAnimRef = useRef(false);

  const [showReaderArabic, setShowReaderArabic] = useState(true);
  const [showReaderTranslit, setShowReaderTranslit] = useState(false);
  const [showReaderMeaning, setShowReaderMeaning] = useState(false);
  const [showTajweedColors, setShowTajweedColors] = useState(false);
  const [reciterEdition, setReciterEdition] = useState(DEFAULT_QURAN_RECITER_EDITION);
  const [arabicScriptEdition, setArabicScriptEdition] = useState(resolveHatimBookScript());
  const [mushafDensity, setMushafDensityState] = useState(resolveHatimBookDensity());
  const [mushafTextScale, setMushafTextScale] = useState(HATIM_LOCKED_MUSHAF_TEXT_SCALE);
  const [arabicFontPreset, setArabicFontPreset] = useState<QuranArabicFontPresetId>(
    resolveHatimBookArabicFont()
  );
  const [readingThemeId, setReadingThemeId] = useState(resolveHatimBookReadingTheme());
  const [hatimPlayUntil, setHatimPlayUntil] = useState<HatimAudioPlayUntil>("juz");
  const [ayahMarkers, setAyahMarkers] = useState<Record<string, AyahMarkerRecord>>({});
  const [playingRef, setPlayingRef] = useState<MushafAyahRef | null>(null);
  const [ayahAudioIsPlaying, setAyahAudioIsPlaying] = useState(false);
  const [loadingAyahAudio, setLoadingAyahAudio] = useState<MushafAyahRef | null>(null);
  const [menuAyah, setMenuAyah] = useState<{ ref: MushafAyahRef; item: CachedAyah } | null>(null);
  const [translationTarget, setTranslationTarget] = useState<{ ref: MushafAyahRef; item: CachedAyah } | null>(null);
  const [translationTargetMeaning, setTranslationTargetMeaning] = useState<string | null>(null);
  const [ayahMap, setAyahMap] = useState<MushafAyahMapFile | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  /** Bundled Құран мәтіні web-те жүктелгенде беттер қайта сызылуы үшін. */
  const [quranTextRev, setQuranTextRev] = useState(0);
  const appLocale = useAppLocale();
  const { tr: appTr } = useKkAutoTranslator();

  const MushafPagerList = Platform.OS === "web" ? FlatList : GestureHandlerFlatList;
  /** Веб (RN FlatList) пен нативтегі (gesture-handler FlatList) типтері әртүрлі — ортақ ref. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioProgressRef = useRef({ pos: 0, dur: 0 });
  const karaokeWordCountRef = useRef(0);
  const karaokePlainTextRef = useRef("");
  const karaokeSegmentsRef = useRef<readonly AyahWordTimestampSegment[] | null>(null);
  const karaokeSegmentRefDurRef = useRef(0);
  const lastKaraokeWordIdxRef = useRef(-1);
  const lastAudioPositionMsRef = useRef(0);
  const lastAudioPlayingRef = useRef(false);
  const translationInFlightRef = useRef<Set<string>>(new Set());
  const tajweedInFlightRef = useRef<Set<number>>(new Set());
  const turkishPrintInFlightRef = useRef<Set<number>>(new Set());
  const mountedRef = useRef(true);
  const audioPlanRef = useRef<{ mode: "single" | "juz" | "repeat"; queue: number[] }>({
    mode: "single",
    queue: [],
  });
  const playingRefState = useRef<MushafAyahRef | null>(null);
  const audioRequestSeqRef = useRef(0);

  const { metrics } = useMushafStyles({
    arabicFontPreset,
    mushafTextScale,
    isDark,
    mushafDensity,
    mushafBookLike: true,
    readingThemeId,
  });
  const readingTheme = useMemo(() => resolveQuranReadingTheme(readingThemeId), [readingThemeId]);
  const pagerLayoutWidth = Platform.OS === "web" ? windowWidth : pagerViewWidth > 0 ? pagerViewWidth : windowWidth;
  const bookPageWidth = useMemo(
    () =>
      Platform.OS === "web"
        ? mushafBookContentWidth(pagerLayoutWidth)
        : mushafBookNativeContentWidth(pagerLayoutWidth),
    [pagerLayoutWidth]
  );
  const pagerPages = useMemo(() => [...pages].reverse(), [pages]);
  const effectiveShowTajweedColors = showTajweedColors && arabicScriptEdition === "madinah";
  const useQcf4PageRanges = useMemo(
    () =>
      !hatimBookUsesBundledTextHafsOffline() &&
      mushafBookEffectiveRenderBackend(readingThemeId, {
        showTajweedColors: effectiveShowTajweedColors,
        arabicScriptEdition,
      }) === "qcf4",
    [arabicScriptEdition, effectiveShowTajweedColors, readingThemeId]
  );
  const hatimReaderLayers = hatimMushafReaderLayers();
  const effectiveShowReaderTranslit = HATIM_MUSHAF_ARABIC_ONLY
    ? hatimReaderLayers.showReaderTranslit
    : showReaderTranslit;
  const effectiveShowReaderMeaning = HATIM_MUSHAF_ARABIC_ONLY
    ? hatimReaderLayers.showReaderMeaning
    : showReaderMeaning;
  const effectiveShowReaderArabic = HATIM_MUSHAF_ARABIC_ONLY
    ? hatimReaderLayers.showReaderArabic
    : showReaderArabic;
  /** Quran.com хатымда бет телефон экранының төрт бұрышына дейін жайылады. */
  const topInset = readingTheme.minimalPageChrome || Platform.OS === "web" ? 0 : insets.top;
  /** Кей Android-та gesture/navigation bar safe-area 0 болып келеді — төменгі аят кесілмеуі үшін аз резерв. */
  const bottomInset = readingTheme.minimalPageChrome && Platform.OS !== "web" ? Math.max(insets.bottom, 8) : 0;
  /** Хатым беті нақты pager өлшемімен салынады; native-та 0 биіктікпен ерте render жасамаймыз. */
  const mushafViewportHeight = useMemo(() => {
    if (pagerViewHeight > 0) return pagerViewHeight;
    return Math.max(320, Math.floor(windowHeight - topInset - bottomInset - (readingTheme.minimalPageChrome ? 0 : 96)));
  }, [pagerViewHeight, readingTheme.minimalPageChrome, topInset, bottomInset, windowHeight]);
  const hatimAutoFitReady = true;
  const styles = useMemo(
    () => makeMushafBookPageStyles(colors, isDark, metrics, readingThemeId),
    [colors, isDark, metrics, readingThemeId]
  );

  const startPageIndex = useMemo(() => {
    return routeStartPageIndex;
  }, [routeStartPageIndex]);

  const { resumeHighlight, setResumeHighlight } = useMushafBookAyahFocus({
    continuousMushaf,
    focusSurah,
    focusAyah,
    initialPage,
    pages,
    loading,
    pagerLayoutWidth,
    listRef,
    setPageIndex,
  });

  const routeFocusKey = `${focusSurah ?? ""}:${focusAyah ?? ""}:${initialPage ?? ""}`;
  const prevRouteFocusKeyRef = useRef(routeFocusKey);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pageTurnSwapTimerRef.current) {
        clearTimeout(pageTurnSwapTimerRef.current);
        pageTurnSwapTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    pageIndexRef.current = pageIndex;
  }, [pageIndex]);

  useEffect(() => {
    if (!pages.length || loading) {
      pageTurnPrevIndexRef.current = pageIndex;
      pageTurnReadyRef.current = false;
      return;
    }
    const prev = pageTurnPrevIndexRef.current;
    pageTurnPrevIndexRef.current = pageIndex;
    if (!pageTurnReadyRef.current) {
      pageTurnReadyRef.current = true;
      return;
    }
    if (prev === pageIndex) return;
    if (skipNextPageTurnAnimRef.current) return;
    if (dragDirectionRef.current) return;

    pageTurnAnim.stopAnimation();
    pageTurnAnim.setValue(0);
    setPageTurn({
      key: Date.now(),
      direction: pageIndex > prev ? "forward" : "backward",
    });
    runHatimPageTurnAnimation(pageTurnAnim, () => setPageTurn(null));
  }, [loading, pageIndex, pageTurnAnim, pages.length]);

  useEffect(() => {
    let alive = true;
    const applyPages = (built: MushafBookPageSlice[], opts?: { keepPageIndex?: boolean }) => {
      if (!alive || !built.length) return;
      const list = surahScope != null ? filterMushafBookPagesForSurah(built, surahScope) : built;
      if (!list.length) return;
      setPages(list);
      if (opts?.keepPageIndex) {
        setLoading(false);
        setErr(null);
        return;
      }
      const ix =
        surahScope != null && focusAyah != null
          ? findMushafBookPageIndexForAyah(list, surahScope, focusAyah)
          : surahScope != null && initialPage != null
            ? Math.max(0, list.findIndex((pg) => pg.mushafPageNumber === initialPage))
            : surahScope != null
              ? 0
              : focusSurah != null && focusAyah != null
                ? findMushafBookPageIndexForAyah(list, focusSurah, focusAyah)
                : startPageIndex;
      setPageIndex(ix);
      setLoading(false);
      setErr(null);
    };

    try {
      const light = useQcf4PageRanges ? buildQcf4MushafPagesGlobalLight() : buildMushafPagesGlobalLight();
      if (light.length) {
        applyPages(light);
      } else {
        setErr(kk.common.error);
        setLoading(false);
      }
    } catch (e) {
      if (__DEV__) console.error("[QuranMushafBook] light pages failed", e);
      if (alive) {
        setErr(kk.common.error);
        setLoading(false);
      }
      return () => {
        alive = false;
      };
    }

    if (Platform.OS === "web") {
      void loadQuranBookFonts().catch(() => {});
      void (async () => {
        try {
          const { loadQcf4FontMap, loadQcf4Page, preloadAdjacentQcf4Pages } = await import(
            "../quran/loadQcf4Page"
          );
          void loadQcf4FontMap().catch(() => null);
          void loadQcf4Page(1).catch(() => null);
          void loadQcf4Page(2).catch(() => null);
          preloadAdjacentQcf4Pages(1, 1);
          await runWhenHeavyWorkAllowed();
          await ensureBundledQuranReaderLoaded();
          await runWhenHeavyWorkAllowed();
          if (!alive) return;
          // Web renders one visible page and resolves text lazily from the loaded Quran cache.
          // Replacing all 604 pages with full objects causes visible freezes on Hatim/Quran.
          setQuranTextRev((v) => v + 1);
        } catch (e) {
          if (__DEV__) console.warn("[QuranMushafBook] bundled quran load failed", e);
        }
      })();
      return () => {
        alive = false;
      };
    }

    void (async () => {
      try {
        await preloadHatimOfflineAssets();
        if (!alive) return;
        const buildFullPages = () =>
          useQcf4PageRanges ? buildQcf4MushafPagesGlobal() : buildMushafPagesGlobal();
        let full = buildFullPages();
        const firstText = full[0]?.ayahs[0]?.text?.replace(/^\uFEFF/, "").trim() ?? "";
        if (!firstText.length) {
          const { invalidateBundledJsonCache } = await import("../utils/loadBundledJson");
          const { clearMushafPagesGlobalCache } = await import("../quran/buildMushafPagesGlobal");
          const { releaseBundledQuranReaderMemory } = await import("../services/bundledQuranReader");
          await invalidateBundledJsonCache("quran-uthmani-full.json");
          releaseBundledQuranReaderMemory({ keepSurahList: true });
          clearMushafPagesGlobalCache();
          await preloadHatimOfflineAssets();
          if (!alive) return;
          full = buildFullPages();
        }
        if (full.length) applyPages(full, { keepPageIndex: true });
        setQuranTextRev((v) => v + 1);
      } catch (e) {
        if (__DEV__) console.error("[QuranMushafBook] load failed", e);
        /* Light/QCF4 беттер көрсетілген — фон enrich сәтсіз болса да «Қате» экранын шығармау. */
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [
    focusSurah,
    focusAyah,
    startPageIndex,
    loadKey,
    surahScope,
    initialPage,
    continuousMushaf,
    useQcf4PageRanges,
  ]);

  useEffect(() => {
    if (prevRouteFocusKeyRef.current === routeFocusKey) return;
    prevRouteFocusKeyRef.current = routeFocusKey;
    if (!pages.length || loading) return;
    if (focusSurah != null && focusAyah != null) return;
    const ix =
      initialPage != null
        ? Math.max(0, pages.findIndex((pg) => pg.mushafPageNumber === initialPage))
        : routeStartPageIndex;
    if (ix < 0) return;
    setPageIndex(ix);
    pageIndexFromViewabilityRef.current = true;
    listRef.current?.scrollToOffset({
      offset: mushafBookPageOffsetForIndex(ix, pagerLayoutWidth, pages.length),
      animated: false,
    });
  }, [
    routeFocusKey,
    pages.length,
    loading,
    focusSurah,
    focusAyah,
    initialPage,
    routeStartPageIndex,
    pagerLayoutWidth,
  ]);

  const resolveHatimSelection = useCallback((selection: HatimAyahSelection): HatimAyahSelection => {
    const resolved = resolveMushafBookAyah({
      ...selection.item,
      surahNumber: selection.ref.surah,
    });
    return {
      ref: selection.ref,
      item: {
        ...selection.item,
        ...resolved,
      },
    };
  }, []);

  useEffect(() => {
    if (!isMushafBookRasterBackend(readingThemeId)) return;
    let alive = true;
    void loadMushafAyahMap().then((map) => {
      if (alive && map) setAyahMap(map);
    });
    return () => {
      alive = false;
    };
  }, [readingThemeId]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        await persistHatimBookLockedPrefs();
        const [showArabic, showTranslit, showMeaning, tj, rec, markers, playScope] = await Promise.all([
          getQuranReaderShowArabic(),
          getQuranReaderShowTranslit(),
          getQuranReaderShowMeaning(),
          AsyncStorage.getItem(QURAN_TAJWEED_COLORS_KEY),
          AsyncStorage.getItem(QURAN_READER_RECITER_KEY),
          loadAyahMarkers(),
          getHatimAudioPlayUntil(),
        ]);
        setShowReaderArabic(showArabic);
        setShowReaderTranslit(showTranslit);
        setShowReaderMeaning(showMeaning);
        if (tj != null) setShowTajweedColors(tj === "1");
        setReciterEdition(normalizeReciterEdition(rec));
        setArabicFontPreset(resolveHatimBookArabicFont());
        setArabicScriptEdition(resolveHatimBookScript());
        setMushafDensityState(resolveHatimBookDensity());
        setMushafTextScale(HATIM_LOCKED_MUSHAF_TEXT_SCALE);
        setReadingThemeId(resolveHatimBookReadingTheme());
        setHatimPlayUntil(playScope);
        setAyahMarkers(markers);
        void preloadHatimOfflineAssets();
      })();
    }, [])
  );

  useEffect(() => {
    if (!pages.length || loading) return;
    if (pageIndexFromViewabilityRef.current) {
      pageIndexFromViewabilityRef.current = false;
      return;
    }
    listRef.current?.scrollToOffset({
      offset: mushafBookPageOffsetForIndex(pageIndex, pagerLayoutWidth, pages.length),
      animated: false,
    });
  }, [pages.length, loading, pageIndex, pagerLayoutWidth]);

  const { scrollToAyahPage } = useMushafBookAudioScroll({
    pages,
    playingRef,
    ayahAudioIsPlaying,
    windowWidth: pagerLayoutWidth,
    listRef,
    setPageIndex,
  });

  const flushKaraokeProgress = useCallback(() => {
    const { pos, dur } = audioProgressRef.current;
    const plain = karaokePlainTextRef.current;
    if (karaokeWordCountRef.current <= 0 || dur <= 0) return;
    let idx = karaokeWordIndexFromPlaybackMs(
      pos,
      dur,
      plain,
      karaokeSegmentsRef.current,
      karaokeSegmentRefDurRef.current
    );
    idx = karaokeWordIndexMonotonicForward(
      idx,
      lastKaraokeWordIdxRef.current,
      pos,
      lastAudioPositionMsRef.current
    );
    lastAudioPositionMsRef.current = pos;
    lastKaraokeWordIdxRef.current = idx;
    setQuranKaraokePlayback(idx, dur);
  }, []);

  const resetKaraokeState = useCallback(() => {
    audioProgressRef.current = { pos: 0, dur: 0 };
    karaokeWordCountRef.current = 0;
    karaokePlainTextRef.current = "";
    karaokeSegmentsRef.current = null;
    karaokeSegmentRefDurRef.current = 0;
    lastKaraokeWordIdxRef.current = -1;
    lastAudioPositionMsRef.current = 0;
    lastAudioPlayingRef.current = false;
    resetQuranKaraokePlayback();
  }, []);

  const ayahForRef = useCallback(
    (ref: MushafAyahRef) => {
      for (const pg of pages) {
        const row = pg.ayahs.find((a) => a.surahNumber === ref.surah && a.numberInSurah === ref.ayah);
        if (row) return row;
      }
      return null;
    },
    [pages]
  );

  const stopAudio = useCallback(async () => {
    resetKaraokeState();
    try {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
    } catch {
      /* */
    }
    soundRef.current = null;
    setAyahAudioIsPlaying(false);
    setPlayingRef(null);
    playingRefState.current = null;
  }, [resetKaraokeState]);

  useEffect(() => () => {
    void stopAudio();
  }, [stopAudio]);

  const playAyah = useCallback(
    async (ref: MushafAyahRef, plan?: { mode: "single" | "juz" | "repeat"; queue: number[] }) => {
      const existing = soundRef.current;
      if (!plan && existing && playingRefState.current?.surah === ref.surah && playingRefState.current.ayah === ref.ayah) {
        try {
          const status = await existing.getStatusAsync();
          if (status.isLoaded) {
            if (status.isPlaying) {
              await existing.pauseAsync();
              setAyahAudioIsPlaying(false);
              try {
                const paused = await existing.getStatusAsync();
                if (paused.isLoaded) {
                  audioProgressRef.current = {
                    pos: paused.positionMillis ?? 0,
                    dur: paused.durationMillis ?? 0,
                  };
                  flushKaraokeProgress();
                }
              } catch {
                /* */
              }
            } else {
              await existing.playAsync();
              setAyahAudioIsPlaying(true);
            }
            return;
          }
        } catch {
          /* ескі дыбыс бұзылса, төменде қайта жүктейміз */
        }
      }
      const requestSeq = audioRequestSeqRef.current + 1;
      audioRequestSeqRef.current = requestSeq;
      await stopAudio();
      setLoadingAyahAudio(ref);
      try {
        const isAyahTimedAudio = quranReciterUsesAyahAudio(reciterEdition);
        const globalN = surahAyahToGlobalOneBased(ref.surah, ref.ayah);
        if (!quranReciterHasAudioForGlobalAyah(globalN, reciterEdition)) {
          audioPlanRef.current = { mode: "single", queue: [] };
          setToast(kk.quran.ayahAudioError);
          return;
        }
        const remoteUri = quranAyahMp3Url(globalN, reciterEdition);
        const uri = await resolveCachedOrRemoteQuranAudioUri(remoteUri);
        const ayahRow = ayahForRef(ref);
        const useArabicKaraoke = isAyahTimedAudio && quranReciterSupportsArabicKaraoke(reciterEdition);
        const plainForKaraoke = useArabicKaraoke && ayahRow ? displayCachedAyahArabic(ayahRow, arabicScriptEdition) : "";
        karaokePlainTextRef.current = plainForKaraoke;
        karaokeWordCountRef.current = splitAyahArabicWords(plainForKaraoke).length;
        karaokeSegmentsRef.current = null;
        karaokeSegmentRefDurRef.current = 0;
        if (useArabicKaraoke && plainForKaraoke) {
          void fetchQuranComAyahAudioSegments(ref.surah, ref.ayah, reciterEdition).then((meta) => {
            if (audioRequestSeqRef.current !== requestSeq || !meta) return;
            karaokeSegmentsRef.current = meta.segments;
            karaokeSegmentRefDurRef.current = meta.referenceDurationMs;
            flushKaraokeProgress();
          });
        }
        lastKaraokeWordIdxRef.current = -1;
        lastAudioPositionMsRef.current = 0;
        resetQuranKaraokePlayback();
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true, progressUpdateIntervalMillis: 40 }
        );
        if (audioRequestSeqRef.current !== requestSeq) {
          try {
            await sound.stopAsync();
          } catch {
            /* */
          }
          try {
            await sound.unloadAsync();
          } catch {
            /* */
          }
          return;
        }
        soundRef.current = sound;
        audioPlanRef.current = isAyahTimedAudio ? plan ?? { mode: "single", queue: [] } : { mode: "single", queue: [] };
        setPlayingRef(ref);
        playingRefState.current = ref;
        setAyahAudioIsPlaying(true);
        scrollToAyahPage(ref, true);
        sound.setOnPlaybackStatusUpdate((st) => {
          if (soundRef.current !== sound || audioRequestSeqRef.current !== requestSeq) return;
          if (!st.isLoaded) return;
          if (st.didJustFinish) {
            const p = audioPlanRef.current;
            const cur = playingRefState.current;
            if (p.mode === "repeat" && cur) {
              void playAyah(cur, { mode: "repeat", queue: [] });
              return;
            }
            if (p.mode === "juz" && p.queue.length > 0 && cur) {
              const [nextAyah, ...rest] = p.queue;
              audioPlanRef.current = { mode: "juz", queue: rest };
              void playAyah({ surah: cur.surah, ayah: nextAyah }, { mode: "juz", queue: rest });
              return;
            }
            void stopAudio();
          } else {
            const isPlaying = !!st.isPlaying;
            if (isPlaying !== lastAudioPlayingRef.current) {
              lastAudioPlayingRef.current = isPlaying;
              setAyahAudioIsPlaying(isPlaying);
            }
            const pos = st.positionMillis ?? 0;
            const dur = st.durationMillis ?? 0;
            audioProgressRef.current = { pos, dur };
            if (!isPlaying) {
              flushKaraokeProgress();
              return;
            }
            if (karaokeWordCountRef.current <= 0 || dur <= 0) return;
            let idx = karaokeWordIndexFromPlaybackMs(
              pos,
              dur,
              karaokePlainTextRef.current,
              karaokeSegmentsRef.current,
              karaokeSegmentRefDurRef.current
            );
            idx = karaokeWordIndexMonotonicForward(
              idx,
              lastKaraokeWordIdxRef.current,
              pos,
              lastAudioPositionMsRef.current
            );
            lastAudioPositionMsRef.current = pos;
            if (idx !== lastKaraokeWordIdxRef.current) {
              lastKaraokeWordIdxRef.current = idx;
              setQuranKaraokePlayback(idx, dur);
            }
          }
        });
      } catch {
        setToast(kk.quran.ayahAudioError);
      } finally {
        setLoadingAyahAudio(null);
      }
    },
    [arabicScriptEdition, ayahForRef, flushKaraokeProgress, reciterEdition, scrollToAyahPage, stopAudio]
  );

  const reciterStopAudioGuard = useRef(false);
  useEffect(() => {
    if (!reciterStopAudioGuard.current) {
      reciterStopAudioGuard.current = true;
      return;
    }
    void stopAudio();
  }, [reciterEdition, stopAudio]);

  const onAyahTap = useCallback(
    async (ref: MushafAyahRef) => {
      setResumeHighlight(ref);
      const count = AYAH_COUNTS_PER_SURAH[ref.surah - 1] ?? 0;
      const { completedSurah } = await recordHatimAyahTapped(ref.surah, ref.ayah, count);
      if (completedSurah) showToast(kk.hatim.surahCompletedToast, 2200);
      else showToast(kk.hatim.ayahProgressSaved, 2200);
    },
    [setResumeHighlight, showToast]
  );

  const hatimAyahShareText = useCallback(
    (selection: HatimAyahSelection) => {
      const { ref, item } = resolveHatimSelection(selection);
      const surahTitle = surahDisplayTitle(ref.surah, "");
      const ar = displayCachedAyahArabic(item, arabicScriptEdition);
      const kkLine =
        (appLocale !== "kk" && translationTarget?.ref.surah === ref.surah &&
          translationTarget.ref.ayah === ref.ayah && translationTargetMeaning) ||
        quranAyahMeaningForLocale(item, appLocale);
      return `${surahTitle} · ${ref.surah}:${item.numberInSurah}\n\n${ar}${kkLine ? `\n\n${kkLine}` : ""}`;
    },
    [arabicScriptEdition, appLocale, resolveHatimSelection, translationTarget, translationTargetMeaning]
  );

  useEffect(() => {
    if (!translationTarget) return;
    let alive = true;
    void (async () => {
      await ensureBundledQuranReaderLoaded().catch(() => {});
      if (!alive) return;
      setTranslationTarget((prev) => {
        if (!prev) return prev;
        if (
          prev.ref.surah !== translationTarget.ref.surah ||
          prev.ref.ayah !== translationTarget.ref.ayah
        ) {
          return prev;
        }
        const next = resolveHatimSelection(prev);
        const prevMeaning = quranAyahMeaningForLocale(prev.item, "kk");
        const nextMeaning = quranAyahMeaningForLocale(next.item, "kk");
        const prevArabic = displayCachedAyahArabic(prev.item, arabicScriptEdition);
        const nextArabic = displayCachedAyahArabic(next.item, arabicScriptEdition);
        return prevMeaning === nextMeaning && prevArabic === nextArabic ? prev : next;
      });
    })();
    return () => {
      alive = false;
    };
  }, [
    arabicScriptEdition,
    resolveHatimSelection,
    translationTarget?.ref.ayah,
    translationTarget?.ref.surah,
  ]);

  /** Аударма парағы ашылғанда таңдалған тілдегі bundled Quran meaning-ті ортақ сервистен аламыз. */
  useEffect(() => {
    setTranslationTargetMeaning(null);
    if (!translationTarget) return;
    if (!isQuranTranslationLocale(appLocale)) return;
    let alive = true;
    const { ref } = translationTarget;
    void (async () => {
      const map = await getQuranSurahTranslation(ref.surah, appLocale);
      if (!alive || !map) return;
      const text = (map[ref.ayah] ?? "").trim();
      if (text) setTranslationTargetMeaning(text);
      setPages((prev) => mergeTranslationIntoMushafPages(prev, appLocale, ref.surah, map));
    })();
    return () => {
      alive = false;
    };
  }, [translationTarget, appLocale]);

  const copyHatimAyah = useCallback(
    async (selection: HatimAyahSelection) => {
      await Clipboard.setStringAsync(hatimAyahShareText(selection));
      setMenuAyah(null);
      showToast(kk.quran.ayahMenuCopied, 1800);
    },
    [hatimAyahShareText, showToast]
  );

  const shareHatimAyah = useCallback(
    async (selection: HatimAyahSelection) => {
      const msg = hatimAyahShareText(selection);
      if (Platform.OS === "web") {
        const nav = globalThis.navigator as (Navigator & {
          share?: (data: { title?: string; text?: string }) => Promise<void>;
        }) | undefined;
        if (typeof nav?.share === "function") {
          try {
            await nav.share({ title: APP_BRAND_KK, text: msg });
            setMenuAyah(null);
            return;
          } catch {
            setMenuAyah(null);
            return;
          }
        }
        await Clipboard.setStringAsync(msg);
        setMenuAyah(null);
        showToast(kk.quran.ayahMenuCopied, 1800);
        return;
      }
      try {
        await Share.share({ message: msg, title: APP_BRAND_KK });
      } catch {
        /* Жүйелік бөлісу терезесі жабылса да мәзірді жабамыз. */
      }
      setMenuAyah(null);
    },
    [hatimAyahShareText]
  );

  const currentPage = pages[pageIndex];
  const pageCurlDirection = pageTurn?.direction ?? dragDirection;
  const pageCurlActive = Boolean(pageCurlDirection);
  const curlSourceIndex = pageTurnSourceIndex ?? pageIndex;
  const curlingPage = pages[curlSourceIndex];
  const peekPage = useMemo(() => {
    if (!pageCurlDirection || !pages.length) return null;
    if (pageCurlDirection === "forward") return pages[curlSourceIndex + 1] ?? null;
    return pages[curlSourceIndex - 1] ?? null;
  }, [pageCurlDirection, curlSourceIndex, pages]);
  const showFullPeekUnderlay = Boolean(pageTurn) && Platform.OS === "ios";
  const pagePeelClipStyle = useMemo(() => {
    if (!pageCurlDirection || !pageCurlActive) return null;
    return hatimPagePeelClipAnimatedStyle(pageTurnAnim, pageCurlDirection, bookPageWidth);
  }, [pageCurlActive, pageCurlDirection, pageTurnAnim, bookPageWidth]);

  useMushafBookLastReadPersistence(pages, pageIndex);

  useEffect(() => {
    if (!continuousMushaf || !currentPage?.mushafPageNumber) return;
    const first = currentPage.ayahs[0];
    if (!first || first.surahNumber < 1 || first.numberInSurah < 1) return;
    const t = setTimeout(() => {
      void saveHatimResume(first.surahNumber, first.numberInSurah);
    }, 650);
    return () => clearTimeout(t);
  }, [continuousMushaf, currentPage?.mushafPageNumber]);

  useEffect(() => {
    if (!useQcf4PageRanges || !currentPage?.mushafPageNumber || loading) return;
    preloadAdjacentQcf4Pages(currentPage.mushafPageNumber, 1);
  }, [useQcf4PageRanges, currentPage?.mushafPageNumber, loading]);

  useEffect(() => {
    if (!currentPage || !isQuranTranslationLocale(appLocale)) return;
    const field = quranTranslationFieldForLocale(appLocale);
    const surahs = Array.from(new Set(currentPage.ayahs.map((a) => a.surahNumber)));
    const missing = surahs.filter((surah) =>
      currentPage.ayahs.some(
        (a) =>
          a.surahNumber === surah && !((a[field] as string | undefined) ?? "").trim()
      )
    );
    if (!missing.length) return;

    let alive = true;
    for (const surah of missing) {
      const key = `${appLocale}:${surah}`;
      if (translationInFlightRef.current.has(key)) continue;
      translationInFlightRef.current.add(key);
      void (async () => {
        const map = await getQuranSurahTranslation(surah, appLocale);
        if (alive && map) {
          setPages((prev) => mergeTranslationIntoMushafPages(prev, appLocale, surah, map));
        }
        translationInFlightRef.current.delete(key);
      })();
    }

    return () => {
      alive = false;
    };
  }, [appLocale, currentPage]);

  useEffect(() => {
    if (!currentPage || !showTajweedColors || arabicScriptEdition !== "madinah") return;
    const surahs = Array.from(new Set(currentPage.ayahs.map((a) => a.surahNumber)));
    const missing = surahs.filter((surah) =>
      currentPage.ayahs.some(
        (a) =>
          a.surahNumber === surah &&
          !((a.textTajweed as string | undefined) ?? "").includes("[")
      )
    );
    if (!missing.length) return;

    for (const surah of missing) {
      if (tajweedInFlightRef.current.has(surah)) continue;
      tajweedInFlightRef.current.add(surah);
      void (async () => {
        const map = await fetchHatimTajweedMap(surah);
        if (mountedRef.current && map) {
          setPages((prev) => mergeTajweedIntoMushafPages(prev, surah, map));
        }
        tajweedInFlightRef.current.delete(surah);
      })();
    }
  }, [arabicScriptEdition, currentPage, showTajweedColors]);

  useEffect(() => {
    if (!currentPage || arabicScriptEdition !== "turkish") return;
    const surahs = Array.from(new Set(currentPage.ayahs.map((a) => a.surahNumber)));
    const missing = surahs.filter((surah) =>
      currentPage.ayahs.some(
        (a) =>
          a.surahNumber === surah &&
          !((a.textTurkishPrint as string | undefined) ?? "").trim()
      )
    );
    if (!missing.length) return;

    let alive = true;
    for (const surah of missing) {
      if (turkishPrintInFlightRef.current.has(surah)) continue;
      turkishPrintInFlightRef.current.add(surah);
      void (async () => {
        const map = await fetchHatimTurkishPrintMap(surah);
        if (alive && map) {
          setPages((prev) => mergeTurkishPrintIntoMushafPages(prev, surah, map));
        }
        turkishPrintInFlightRef.current.delete(surah);
      })();
    }

    return () => {
      alive = false;
    };
  }, [arabicScriptEdition, currentPage]);

  const refreshAyahMarkers = useCallback(async () => {
    setAyahMarkers(await loadAyahMarkers());
  }, []);

  const hatimReaderSettingsHandlers = useMemo(
    () => ({
      onReadingTheme: () => {},
      onMushafTextScale: () => {
        setMushafTextScale(HATIM_LOCKED_MUSHAF_TEXT_SCALE);
        void setQuranMushafTextScale(HATIM_LOCKED_MUSHAF_TEXT_SCALE);
      },
      onMushafDensity: () => {
        setMushafDensityState(resolveHatimBookDensity());
        void setMushafDensity(resolveHatimBookDensity());
      },
      onArabicFontPreset: () => {
        setArabicFontPreset(resolveHatimBookArabicFont());
        void setQuranArabicFontPreset(resolveHatimBookArabicFont());
      },
      onShowReaderArabic: (v: boolean) => {
        setShowReaderArabic(v);
        void setQuranReaderShowArabic(v);
      },
      onShowReaderTranslit: (v: boolean) => {
        setShowReaderTranslit(v);
        void setQuranReaderShowTranslit(v);
      },
      onShowReaderMeaning: (v: boolean) => {
        setShowReaderMeaning(v);
        void setQuranReaderShowMeaning(v);
      },
      onShowTajweedColors: (v: boolean) => {
        setShowTajweedColors(v);
        void setQuranTajweedColorsEnabled(v);
      },
      onArabicScriptEdition: () => {
        setArabicScriptEdition(resolveHatimBookScript());
        void setQuranArabicScriptEdition(resolveHatimBookScript());
      },
      onPlayUntil: (scope: HatimAudioPlayUntil) => {
        setHatimPlayUntil(scope);
        void setHatimAudioPlayUntil(scope);
      },
      onOpenFullHatimSettings: () => navigation.navigate("HatimSettings"),
    }),
    [navigation]
  );

  const topMeta = useMemo(() => {
    const first = currentPage?.ayahs[0];
    if (!first) {
      return {
        surahTitle: kk.features.hatimTitle,
        surahArabic: "",
        juz: 1,
        hizb: 1,
      };
    }
    const globalN = surahAyahToGlobalOneBased(first.surahNumber, first.numberInSurah);
    return {
      surahTitle: surahDisplayTitle(first.surahNumber, ""),
      surahArabic: surahArabicListTitle(first.surahNumber),
      juz: juzForSurahAyah(first.surahNumber, first.numberInSurah),
      hizb: hizbForGlobalAyahOneBased(globalN),
    };
  }, [currentPage]);

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 60 }),
    []
  );

  const pagerExtraData = useMemo(
    () => ({
      quranTextRev,
      pageIndex,
      readingThemeId,
      mushafTextScale,
      mushafDensity,
      showReaderArabic: effectiveShowReaderArabic,
      effectiveShowReaderTranslit,
      effectiveShowReaderMeaning,
      effectiveShowTajweedColors,
      arabicScriptEdition,
      ayahMarkers,
      playingRef,
      ayahAudioIsPlaying,
      loadingAyahAudio,
      resumeHighlight,
      ayahMap,
    }),
    [
      quranTextRev,
      pageIndex,
      readingThemeId,
      mushafTextScale,
      mushafDensity,
      effectiveShowReaderArabic,
      effectiveShowReaderTranslit,
      effectiveShowReaderMeaning,
      effectiveShowTajweedColors,
      arabicScriptEdition,
      ayahMarkers,
      playingRef,
      ayahAudioIsPlaying,
      loadingAyahAudio,
      resumeHighlight,
      ayahMap,
    ]
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index?: number | null }> }) => {
      const ix = viewableItems[0]?.index;
      if (ix == null) return;
      const logicalIndex = mushafBookVisualIndexForPageIndex(ix, pages.length);
      setPageIndex((prev) => {
        if (prev === logicalIndex) return prev;
        pageIndexFromViewabilityRef.current = true;
        return logicalIndex;
      });
    },
    [pages.length]
  );

  const scrollToHatimPageIndex = useCallback(
    (nextIndex: number, animated: boolean) => {
      if (!pages.length) return;
      const target = Math.max(0, Math.min(pages.length - 1, Math.round(nextIndex)));
      pageIndexFromViewabilityRef.current = true;
      setPageIndex(target);
      listRef.current?.scrollToOffset({
        offset: mushafBookPageOffsetForIndex(target, pagerLayoutWidth, pages.length),
        animated,
      });
    },
    [pages.length, pagerLayoutWidth]
  );

  const hatimPagerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          if (loading || !pages.length) return false;
          if (dragDirectionRef.current) return true;
          const absDx = Math.abs(gesture.dx);
          const absDy = Math.abs(gesture.dy);
          return absDx >= 8 && absDx > absDy * 1.08;
        },
        onMoveShouldSetPanResponder: (_, gesture) => {
          if (loading || !pages.length) return false;
          if (dragDirectionRef.current) return true;
          const absDx = Math.abs(gesture.dx);
          const absDy = Math.abs(gesture.dy);
          return absDx >= 8 && absDx > absDy * 1.08;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (_, gesture) => {
          const grabH =
            pagerViewHeight > 0 ? pagerViewHeight : Math.max(320, windowHeight * 0.72);
          dragGrabYRatioRef.current = Math.max(0, Math.min(1, gesture.y0 / grabH));
          pageTurnAnim.stopAnimation();
          pageTurnAnim.setValue(0);
        },
        onPanResponderMove: (_, gesture) => {
          const grabH =
            pagerViewHeight > 0 ? pagerViewHeight : Math.max(320, windowHeight * 0.72);
          if (!dragDirectionRef.current) {
            const anchor = hatimPageGrabAnchor(
              gesture.x0,
              gesture.y0,
              pagerLayoutWidth,
              grabH,
              gesture.dx
            );
            if (!anchor) return;
            if (!hatimPageTurnCanDrag(anchor.direction, pageIndexRef.current, pages.length)) {
              return;
            }
            dragDirectionRef.current = anchor.direction;
            setPageTurnGrabY(dragGrabYRatioRef.current);
            setDragDirection(anchor.direction);
            pageTurnSourceIndexRef.current = pageIndexRef.current;
            setPageTurnSourceIndex(pageIndexRef.current);
          }
          const dir = dragDirectionRef.current;
          if (!dir) return;
          const signedDx = hatimPageTurnSignedDx(dir, gesture.dx);
          const progress = hatimPageTurnProgressFromDx(signedDx, pagerLayoutWidth);
          pageTurnAnim.setValue(progress);
        },
        onPanResponderRelease: (_, gesture) => {
          const grabH =
            pagerViewHeight > 0 ? pagerViewHeight : Math.max(320, windowHeight * 0.72);
          if (!dragDirectionRef.current) {
            const anchor = hatimPageGrabAnchor(
              gesture.x0,
              gesture.y0,
              pagerLayoutWidth,
              grabH,
              gesture.dx
            );
            if (anchor && hatimPageTurnCanDrag(anchor.direction, pageIndexRef.current, pages.length)) {
              dragDirectionRef.current = anchor.direction;
              pageTurnSourceIndexRef.current = pageIndexRef.current;
              setPageTurnSourceIndex(pageIndexRef.current);
            }
          }
          const dir = dragDirectionRef.current;
          if (!dir) {
            const quickNext = mushafBookPageIndexForSwipe(
              pageIndexRef.current,
              pages.length,
              gesture.dx,
              gesture.vx,
              pagerLayoutWidth
            );
            if (quickNext !== pageIndexRef.current) {
              skipNextPageTurnAnimRef.current = true;
              scrollToHatimPageIndex(quickNext, false);
              skipNextPageTurnAnimRef.current = false;
            }
            return;
          }
          const signedDx = hatimPageTurnSignedDx(dir, gesture.dx);
          const progress = hatimPageTurnProgressFromDx(signedDx, pagerLayoutWidth);
          const commit = hatimPageTurnShouldCommit(
            signedDx,
            gesture.vx,
            pagerLayoutWidth,
            progress
          );
          if (commit) {
            const sourceIndex = pageTurnSourceIndexRef.current ?? pageIndexRef.current;
            const next = dir === "forward" ? sourceIndex + 1 : sourceIndex - 1;
            pageTurnSourceIndexRef.current = sourceIndex;
            setPageTurnSourceIndex(sourceIndex);
            setPageTurn({ key: Date.now(), direction: dir });
            skipNextPageTurnAnimRef.current = true;
            if (pageTurnSwapTimerRef.current) {
              clearTimeout(pageTurnSwapTimerRef.current);
            }
            pageTurnSwapTimerRef.current = setTimeout(() => {
              pageTurnSwapTimerRef.current = null;
              scrollToHatimPageIndex(next, false);
            }, hatimPageTurnSwapDelayMs(progress));
            runHatimPageTurnAnimation(
              pageTurnAnim,
              () => {
                if (pageTurnSwapTimerRef.current) {
                  clearTimeout(pageTurnSwapTimerRef.current);
                  pageTurnSwapTimerRef.current = null;
                  scrollToHatimPageIndex(next, false);
                }
                pageTurnAnim.setValue(0);
                setPageTurn(null);
                setDragDirection(null);
                setPageTurnSourceIndex(null);
                pageTurnSourceIndexRef.current = null;
                dragDirectionRef.current = null;
                skipNextPageTurnAnimRef.current = false;
              },
              { fromProgress: progress }
            );
            return;
          }
          springHatimPageTurnBack(pageTurnAnim, () => {
            setDragDirection(null);
            setPageTurnSourceIndex(null);
            pageTurnSourceIndexRef.current = null;
            dragDirectionRef.current = null;
          });
        },
        onPanResponderTerminate: () => {
          springHatimPageTurnBack(pageTurnAnim, () => {
            setDragDirection(null);
            setPageTurnSourceIndex(null);
            pageTurnSourceIndexRef.current = null;
            dragDirectionRef.current = null;
          });
        },
      }),
    [
      loading,
      pages.length,
      pagerLayoutWidth,
      pagerViewHeight,
      windowHeight,
      pageTurnAnim,
      scrollToHatimPageIndex,
    ]
  );

  const getPagerItemLayout = useCallback(
    (_: ArrayLike<MushafBookPageSlice> | null | undefined, index: number) => ({
      length: pagerLayoutWidth,
      offset: mushafBookOffsetForVisualIndex(index, pagerLayoutWidth),
      index,
    }),
    [pagerLayoutWidth]
  );

  const onPagerScrollToIndexFailed = useCallback(
    ({ index }: { index: number }) => {
      setTimeout(() => {
        listRef.current?.scrollToOffset({
          offset: mushafBookOffsetForVisualIndex(index, pagerLayoutWidth),
          animated: false,
        });
      }, 200);
    },
    [pagerLayoutWidth]
  );

  useEffect(() => {
    navigation.setOptions({
      title: kk.features.hatimTitle,
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate("HatimSettings")}
          style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.82 : 1 }]}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={kk.hatim.settingsBtnA11y}
        >
          <MaterialIcons name="settings" size={24} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, colors.text]);

  if (!pages.length && (loading || err)) {
    return (
      <View style={styles.center}>
        <RaqatOrnamentSpinner size={loading && !err ? 36 : 48} />
        <Text style={[styles.muted, { marginTop: 12, textAlign: "center", paddingHorizontal: 24 }]}>
          {err ?? (loading ? kk.common.loading : kk.common.error)}
        </Text>
        {err ? (
          <Pressable
            style={({ pressed }) => [{ marginTop: 16, padding: 12, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => {
              setErr(null);
              setPages([]);
              setLoading(true);
              setLoadKey((k) => k + 1);
            }}
            accessibilityRole="button"
            accessibilityLabel={kk.common.retry}
          >
            <Text style={{ color: colors.accent, fontWeight: "700" }}>{kk.common.retry}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: topInset, paddingBottom: bottomInset }]}>
      {!readingTheme.minimalPageChrome ? (
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {appTr(kk.quran.readerHeaderJuzHizb(topMeta.juz, topMeta.hizb))}
          </Text>
          <View style={styles.topBarRight}>
            <Text style={styles.topBarSurahTitle} numberOfLines={1}>
              {appTr(topMeta.surahTitle)}
            </Text>
            {topMeta.surahArabic ? (
              <Text style={styles.topBarSurahArabic} numberOfLines={1}>
                {topMeta.surahArabic}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
      <View
        style={[styles.pagerHost, { position: "relative" }]}
        {...hatimPagerPanResponder.panHandlers}
        onLayout={(e) => {
          const w = Math.round(e.nativeEvent.layout.width);
          const h = Math.round(e.nativeEvent.layout.height);
          if (w > 0 && Math.abs(w - pagerWidthStableRef.current) >= 2) {
            pagerWidthStableRef.current = w;
            setPagerViewWidth(w);
          }
          if (h <= 0) return;
          if (Math.abs(h - pagerHeightStableRef.current) < 2) return;
          pagerHeightStableRef.current = h;
          setPagerViewHeight(h);
        }}
      >
        {!hatimAutoFitReady ? (
          <View style={styles.center}>
            <RaqatOrnamentSpinner size={36} />
            <Text style={styles.muted}>{kk.common.loading}</Text>
          </View>
        ) : shouldRenderSingleMushafBookPage(Platform.OS) && currentPage ? (
          <View style={[styles.pageShell, { width: pagerLayoutWidth, alignItems: "center" }]}>
            {peekPage ? (
              <View
                style={{
                  position: "absolute",
                  width: bookPageWidth,
                  flex: 1,
                  alignSelf: "center",
                  zIndex: 0,
                }}
              >
                {showFullPeekUnderlay ? (
                  <IlluminatedManuscriptFrame
                    isDark={isDark}
                    readingThemeId={readingThemeId}
                    style={{ flex: 1, width: bookPageWidth, maxWidth: bookPageWidth }}
                    innerStyle={{ flex: 1, minHeight: 0 }}
                  >
                    <MushafBookPageScroll
                      page={peekPage}
                      pagerWidth={bookPageWidth}
                      viewportHeight={mushafViewportHeight}
                      paddingBottom={readingTheme.minimalPageChrome ? 0 : 12 + insets.bottom}
                      colors={colors}
                      isDark={isDark}
                      styles={styles}
                      isActive={false}
                      showReaderArabic={effectiveShowReaderArabic}
                      showReaderTranslit={effectiveShowReaderTranslit}
                      showReaderMeaning={effectiveShowReaderMeaning}
                      showTajweedColors={effectiveShowTajweedColors}
                      arabicScriptEdition={arabicScriptEdition}
                      mushafTextScale={mushafTextScale}
                      playingRef={playingRef}
                      ayahAudioIsPlaying={ayahAudioIsPlaying}
                      loadingAyahAudio={loadingAyahAudio}
                      resumeHighlight={null}
                      ayahMarkers={ayahMarkers}
                      ayahMap={ayahMap}
                      readingThemeId={readingThemeId}
                      surahScope={surahScope}
                      toEasternArabicIndic={toEasternArabicIndic}
                      onPressAyah={() => {}}
                      onLongPressAyah={() => {}}
                      onToggleAudio={() => {}}
                    />
                  </IlluminatedManuscriptFrame>
                ) : (
                  <View
                    style={{
                      flex: 1,
                      width: bookPageWidth,
                      backgroundColor: readingTheme.pageFace,
                      borderRadius: 4,
                    }}
                  />
                )}
              </View>
            ) : null}
            <Animated.View
              style={[
                {
                  flex: 1,
                  zIndex: 2,
                  maxWidth: bookPageWidth,
                  alignSelf: "center",
                },
                pageCurlActive && pagePeelClipStyle ? pagePeelClipStyle : { width: bookPageWidth },
              ]}
            >
              <View style={{ width: bookPageWidth, flex: 1 }}>
              <IlluminatedManuscriptFrame
                isDark={isDark}
                readingThemeId={readingThemeId}
                style={{ flex: 1, width: bookPageWidth, maxWidth: bookPageWidth }}
                innerStyle={{ flex: 1, minHeight: 0 }}
              >
                <MushafBookPageScroll
                  page={curlingPage ?? currentPage}
                  pagerWidth={bookPageWidth}
                  viewportHeight={mushafViewportHeight}
                  paddingBottom={readingTheme.minimalPageChrome ? 0 : 12 + insets.bottom}
                  colors={colors}
                  isDark={isDark}
                  styles={styles}
                  isActive
                  showReaderArabic={effectiveShowReaderArabic}
                  showReaderTranslit={effectiveShowReaderTranslit}
                  showReaderMeaning={effectiveShowReaderMeaning}
                  showTajweedColors={effectiveShowTajweedColors}
                  arabicScriptEdition={arabicScriptEdition}
                  mushafTextScale={mushafTextScale}
                  playingRef={playingRef}
                  ayahAudioIsPlaying={ayahAudioIsPlaying}
                  loadingAyahAudio={loadingAyahAudio}
                  resumeHighlight={curlSourceIndex === pageIndex ? resumeHighlight : null}
                  ayahMarkers={ayahMarkers}
                  ayahMap={ayahMap}
                  readingThemeId={readingThemeId}
                  surahScope={surahScope}
                  toEasternArabicIndic={toEasternArabicIndic}
                  onPressAyah={(ref) => void onAyahTap(ref)}
                  onLongPressAyah={(ref, item) => setMenuAyah({ ref, item })}
                  onToggleAudio={(ref) => void playAyah(ref)}
                />
              </IlluminatedManuscriptFrame>
              </View>
            </Animated.View>
          </View>
        ) : (
          <MushafPagerList
            ref={listRef}
            data={pagerPages}
            keyExtractor={(p) => p.key}
            {...mushafBookPagerListProps}
            initialNumToRender={1}
            maxToRenderPerBatch={1}
            windowSize={3}
            updateCellsBatchingPeriod={50}
            scrollEnabled={MUSHAF_BOOK_PAGER_NATIVE_SCROLL_ENABLED}
            initialScrollIndex={mushafBookVisualIndexForPageIndex(pageIndex, pages.length)}
            removeClippedSubviews={Platform.OS === "android"}
            extraData={pagerExtraData}
            getItemLayout={getPagerItemLayout}
            onScrollToIndexFailed={onPagerScrollToIndexFailed}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            renderItem={({ item: page, index }) => {
              const logicalIndex = mushafBookVisualIndexForPageIndex(index, pages.length);
              return (
                <View style={[styles.pageShell, { width: pagerLayoutWidth, alignItems: "center" }]}>
                  <IlluminatedManuscriptFrame
                    isDark={isDark}
                    readingThemeId={readingThemeId}
                    style={{ flex: 1, width: bookPageWidth, maxWidth: bookPageWidth }}
                    innerStyle={{ flex: 1, minHeight: 0 }}
                  >
                    <MushafBookPageScroll
                      page={page}
                      pagerWidth={bookPageWidth}
                      viewportHeight={mushafViewportHeight}
                      paddingBottom={readingTheme.minimalPageChrome ? 0 : 12 + insets.bottom}
                      colors={colors}
                      isDark={isDark}
                      styles={styles}
                      isActive={isMushafBookRenderPageActive(logicalIndex, pageIndex)}
                      showReaderArabic={effectiveShowReaderArabic}
                      showReaderTranslit={effectiveShowReaderTranslit}
                      showReaderMeaning={effectiveShowReaderMeaning}
                      showTajweedColors={effectiveShowTajweedColors}
                      arabicScriptEdition={arabicScriptEdition}
                      mushafTextScale={mushafTextScale}
                      playingRef={playingRef}
                      ayahAudioIsPlaying={ayahAudioIsPlaying}
                      loadingAyahAudio={loadingAyahAudio}
                      resumeHighlight={resumeHighlight}
                      ayahMarkers={ayahMarkers}
                      ayahMap={ayahMap}
                      readingThemeId={readingThemeId}
                      surahScope={surahScope}
                      toEasternArabicIndic={toEasternArabicIndic}
                      onPressAyah={(ref) => void onAyahTap(ref)}
                      onLongPressAyah={(ref, item) => setMenuAyah({ ref, item })}
                      onToggleAudio={(ref) => void playAyah(ref)}
                    />
                  </IlluminatedManuscriptFrame>
                </View>
              );
            }}
          />
        )}
        {(pageTurn || dragDirection) && pageCurlDirection ? (
          <HatimPageTurnOverlay
            key={pageTurn?.key ?? "drag"}
            progress={pageTurnAnim}
            direction={pageCurlDirection}
            pageWidth={bookPageWidth}
            pageFace={readingTheme.pageFace}
            isDark={isDark}
            interactive={Boolean(dragDirection && !pageTurn)}
            grabYRatio={pageTurnGrabY}
            shadowOnly={Platform.OS === "android" && Boolean(dragDirection && !pageTurn)}
          />
        ) : null}
      </View>
      {!readingTheme.minimalPageChrome ? (
        <MushafBookFooter
          page={currentPage?.mushafPageNumber ?? 1}
          pageA11y={`${kk.quran.mushafFooterPageA11y} ${currentPage?.mushafPageNumber ?? 1}`}
          colors={colors}
          isDark={isDark}
          bookMushaf
          hizb={topMeta.hizb}
          readingThemeId={readingThemeId}
        />
      ) : null}
      {toast ? (
        <View
          style={{
            position: "absolute",
            bottom: 24 + insets.bottom,
            alignSelf: "center",
            backgroundColor: colors.card,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "700" }}>{toast}</Text>
        </View>
      ) : null}
      <Modal
        visible={translationTarget != null}
        transparent
        animationType="fade"
        onRequestClose={() => setTranslationTarget(null)}
      >
        <View style={hatimTranslationStyles.root}>
          <Pressable style={hatimTranslationStyles.backdrop} onPress={() => setTranslationTarget(null)} />
          <View
            style={[
              hatimTranslationStyles.sheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12) + 12,
              },
            ]}
          >
            <View style={[hatimTranslationStyles.handle, { backgroundColor: colors.border }]} />
            {translationTarget
              ? (() => {
                  const { ref, item } = resolveHatimSelection(translationTarget);
                  const ar = displayCachedAyahArabic(item, arabicScriptEdition);
                  const kkLine =
                    (appLocale !== "kk" && translationTargetMeaning) ||
                    quranAyahMeaningForLocale(item, appLocale);
                  const kirilRead =
                    getQuranTranslitOverride(ref.surah, item.numberInSurah) ??
                    resolveQuranTranslitForDisplay(item.translit, ar);
                  return (
                    <>
                      <Text style={[hatimTranslationStyles.title, { color: colors.text }]}>
                        {appTr(kk.quran.ayahMenuTranslationTafsir)} · {ref.surah}:{item.numberInSurah}
                      </Text>
                      <ScrollView
                        style={{ maxHeight: Math.min(520, windowHeight * 0.62) }}
                        contentContainerStyle={hatimTranslationStyles.content}
                        showsVerticalScrollIndicator
                      >
                        <Text style={[hatimTranslationStyles.section, { color: colors.accent }]}>
                          {appTr(kk.quran.ayahTranslationArabic)}
                        </Text>
                        <Text selectable style={[hatimTranslationStyles.arabic, { color: colors.text }]}>
                          {ar}
                        </Text>
                        {kirilRead ? (
                          <>
                            <Text style={[hatimTranslationStyles.section, { color: colors.accent }]}>
                              {appTr(kk.quran.ayahTranslationReading)}
                            </Text>
                            <Text selectable style={[hatimTranslationStyles.body, { color: colors.text }]}>
                              {kirilRead}
                            </Text>
                          </>
                        ) : null}
                        <Text style={[hatimTranslationStyles.section, { color: colors.accent }]}>
                          {appTr(kk.quran.ayahTranslationMeaning)}
                        </Text>
                        <Text selectable style={[hatimTranslationStyles.body, { color: colors.text }]}>
                          {kkLine || appTr(kk.quran.ayahTranslationMissing)}
                        </Text>
                        <Text style={[hatimTranslationStyles.section, { color: colors.accent }]}>
                          {appTr(kk.quran.ayahTranslationTafsir)}
                        </Text>
                        <Text selectable style={[hatimTranslationStyles.tafsir, { color: colors.muted }]}>
                          {hatimShortTafsirForAyah(kkLine, appTr)}
                        </Text>
                      </ScrollView>
                      <Pressable
                        style={({ pressed }) => [
                          hatimTranslationStyles.doneBtn,
                          { backgroundColor: colors.accent },
                          pressed && { opacity: 0.92 },
                        ]}
                        onPress={() => setTranslationTarget(null)}
                      >
                        <Text style={hatimTranslationStyles.doneText}>{appTr(kk.common.close)}</Text>
                      </Pressable>
                    </>
                  );
                })()
              : null}
          </View>
        </View>
      </Modal>
      <AyahContextMenuSheet
        visible={menuAyah != null}
        ayahMenuItem={menuAyah?.item ?? null}
        surahNumber={menuAyah?.ref.surah ?? 1}
        windowHeight={windowHeight}
        windowWidth={windowWidth}
        paddingBottom={insets.bottom}
        colors={colors}
        isDark={isDark}
        onClose={() => setMenuAyah(null)}
        onPlaySelected={(ayahInSurah) => {
          const ref = menuAyah?.ref;
          if (!ref) return;
          setMenuAyah(null);
          void playAyah({ surah: ref.surah, ayah: ayahInSurah }, { mode: "single", queue: [] });
        }}
        onPlayUntilJuz={(ayahInSurah) => {
          const ref = menuAyah?.ref;
          if (!ref) return;
          void (async () => {
            const scope = await getHatimAudioPlayUntil();
            const last = AYAH_COUNTS_PER_SURAH[ref.surah - 1] ?? ayahInSurah;
            const queue = ayahNumbersForAudioPlayUntil(scope, ref.surah, ayahInSurah, last);
            const [first, ...rest] = queue;
            if (!first) return;
            setMenuAyah(null);
            if (scope === "ayah") {
              void playAyah({ surah: ref.surah, ayah: first }, { mode: "single", queue: [] });
            } else {
              void playAyah({ surah: ref.surah, ayah: first }, { mode: "juz", queue: rest });
            }
          })();
        }}
        onPlayRepeat={(ayahInSurah) => {
          const ref = menuAyah?.ref;
          if (!ref) return;
          setMenuAyah(null);
          void playAyah({ surah: ref.surah, ayah: ayahInSurah }, { mode: "repeat", queue: [] });
        }}
        reciterEdition={reciterEdition}
        onPickReciter={(edition) => {
          const next = normalizeReciterEdition(edition);
          setReciterEdition(next);
          void AsyncStorage.setItem(QURAN_READER_RECITER_KEY, next);
        }}
        onCopy={() => {
          if (menuAyah) void copyHatimAyah(menuAyah);
        }}
        onShare={() => {
          if (menuAyah) void shareHatimAyah(menuAyah);
        }}
        onOpenTranslation={() => {
          const selection = menuAyah;
          setMenuAyah(null);
          if (!selection) return;
          setTranslationTarget(resolveHatimSelection(selection));
          void ensureBundledQuranReaderLoaded().then(() => {
            setTranslationTarget((prev) => {
              if (
                !prev ||
                prev.ref.surah !== selection.ref.surah ||
                prev.ref.ayah !== selection.ref.ayah
              ) {
                return prev;
              }
              return resolveHatimSelection(prev);
            });
          });
        }}
        onPickMarkerColor={async (item, cid) => {
          const ref = menuAyah?.ref;
          if (!ref) return;
          const prev = ayahMarkers[`${ref.surah}:${item.numberInSurah}`];
          await setAyahMarker(ref.surah, item.numberInSurah, {
            colorId: cid,
            note: prev?.note ?? "",
          });
          void refreshAyahMarkers();
          setMenuAyah(null);
        }}
        onRemoveMarker={async (item) => {
          const ref = menuAyah?.ref;
          if (!ref) return;
          await removeAyahMarker(ref.surah, item.numberInSurah);
          void refreshAyahMarkers();
          setMenuAyah(null);
        }}
        hasMarkerForAyah={
          menuAyah ? Boolean(ayahMarkers[`${menuAyah.ref.surah}:${menuAyah.item.numberInSurah}`]) : false
        }
        hatimReaderSettings={{
          values: {
            readingThemeId,
            arabicFontPreset,
            mushafTextScale,
            mushafTextScaleLocked: true,
            mushafDensity,
            showReaderArabic,
            showReaderTranslit,
            showReaderMeaning,
            showTajweedColors,
            arabicScriptEdition,
            playUntil: hatimPlayUntil,
          },
          handlers: hatimReaderSettingsHandlers,
        }}
      />
    </View>
  );
}

const hatimTranslationStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    marginHorizontal: 10,
    marginBottom: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 16,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  content: {
    paddingBottom: 6,
  },
  section: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  arabic: {
    fontSize: 30,
    lineHeight: 54,
    textAlign: "right",
    writingDirection: "rtl",
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "700",
  },
  tafsir: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
  },
  doneBtn: {
    marginTop: 12,
    marginBottom: 4,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  doneText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
});
