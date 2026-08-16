import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Platform, ScrollView, View, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import { kk } from "../../i18n/kk";
import { useAppLocale } from "../../i18n/runtime";
import { useQuranReadingLocale } from "../../quran/quranReadingLocale";
import { useQuranTranslitScript } from "../../quran/quranTranslitScript";
import { quranAyahMeaningForLocale } from "../../storage/quranSurahCache";
import { resolveQuranTranslitForDisplay } from "../../utils/quranTranslitDisplay";
import { surahArabicBannerTitle } from "../../data/surahArabicTitles";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import { surahTitleForLocale } from "../../constants/surahTitleKk";
import type {
  MushafBookAyah,
  MushafBookPageSlice,
  MushafAyahRef,
} from "../../quran/mushafBookTypes";
import type { MushafBookPageStyles } from "../../quran/mushafBookPageStyles";
import { MushafContinuousArabicBlock } from "./MushafContinuousArabicBlock";
import { MushafSurahHeader } from "./MushafSurahHeader";
import { MushafBookPageChrome } from "./MushafBookPageChrome";
import {
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import type { AyahMarkerRecord } from "../../storage/quranAyahMarkers";
import { displayCachedAyahArabic, type CachedAyah } from "../../storage/quranSurahCache";
import { mushafBookEffectiveRenderBackend } from "../../quran/mushafPageRenderBackend";
import { shouldHatimUseTextHafsOffline } from "../../quran/mushafOfflineBackend";
import type { MushafAyahMapFile } from "../../quran/mushafAyahMap";
import { MushafBookPageWebp } from "./MushafBookPageWebp";
import { MushafBookPageSvg } from "./MushafBookPageSvg";
import { MushafBookPageQcf4 } from "./MushafBookPageQcf4";
import {
  MUSHAF_BOOK_PAGE_EDGE_INSET,
  computeMushafBookPageBox,
} from "../../quran/mushafBookPageLayout";
import { clearMushafBookAyahResolveCache, resolveMushafBookAyah } from "../../quran/buildMushafPagesGlobal";
import {
  forcedMushafReaderLayers,
  mushafOnePageFitScale,
  shouldForceMushafOnePageFit,
} from "../../quran/mushafBookFitPolicy";
import { useMushafPageAutoFitScale, estimateUnicodeMushafFitScale, mushafPageMinFitScale } from "../../quran/mushafPageAutoFit";
import {
  resetTurkishHatimFitSession,
  turkishHatimFitSessionKey,
} from "../../quran/mushafTurkishHatimFitSession";
import {
  QCF4_EXTERNAL_SURAH_FRAME_RESERVE,
  QCF4_EXTERNAL_SURAH_FRAME_TOP_TIGHTEN,
  QCF4_PHONE_LINE_PADDING,
  QCF4_PHONE_VERTICAL_SAFE_PADDING,
  computeHatimQcf4EquivalentTextMetrics,
  computeHatimQcf4LinesAreaH,
} from "../../quran/mushafQcf4Layout";
import { HATIM_LOCKED_MUSHAF_TEXT_SCALE } from "../../quran/mushafTextScale";
import {
  quranArabicAyahStyleForEdition,
  TURKISH_PRINT_HATIM_MEDINA_PARITY,
  TURKISH_PRINT_HATIM_BOTTOM_CLIP_SAFE,
  TURKISH_PRINT_HATIM_PAGE_TOP_INSET,
  TURKISH_PRINT_HATIM_PHONE_HORIZONTAL_SAFE,
  TURKISH_PRINT_HATIM_PHONE_LINE_PADDING,
  TURKISH_PRINT_HATIM_PHONE_VERTICAL_SAFE,
  TURKISH_PRINT_HATIM_UNIFORM_GLYPH_SIZE,
  TURKISH_PRINT_QF_FIXED_SIZE,
} from "../../quran/quranTurkishPrintTypography";
import {
  ensureBundledQuranReaderLoaded,
  isBundledQuranReaderLoaded,
} from "../../services/bundledQuranReader";
import {
  computeQuranReaderViewportMetrics,
  mushafTextScaleToReaderFontMode,
} from "../../quran/quranReaderViewportMetrics";

const MUSHAF_BOOK_PHONE_TEXT_SAFE_INSET = 10;

function shouldShowBismillah(surah: number, firstAyah: number): boolean {
  if (firstAyah !== 1) return false;
  if (surah === 9 || surah === 1) return false;
  return true;
}

function groupAyahsBySurah(ayahs: MushafBookAyah[]): { surah: number; ayahs: MushafBookAyah[] }[] {
  const out: { surah: number; ayahs: MushafBookAyah[] }[] = [];
  for (const a of ayahs) {
    const last = out[out.length - 1];
    if (!last || last.surah !== a.surahNumber) {
      out.push({ surah: a.surahNumber, ayahs: [a] });
    } else {
      last.ayahs.push(a);
    }
  }
  return out;
}

function pageArabicGlyphCount(page: MushafBookPageSlice, edition: QuranArabicScriptEditionId): number {
  return page.ayahs.reduce((sum, ayah) => {
    const resolved = resolveMushafBookAyah(ayah);
    return sum + displayCachedAyahArabic(resolved, edition).replace(/\s+/g, "").length;
  }, 0);
}

type Props = {
  page: MushafBookPageSlice;
  pagerWidth: number;
  /** Pager (көрінетін аумақ) биіктігі — бет 1 экранға дәл сиюы үшін. */
  viewportHeight?: number;
  paddingBottom: number;
  colors: ThemeColors;
  isDark: boolean;
  styles: MushafBookPageStyles;
  showReaderArabic: boolean;
  showReaderTranslit: boolean;
  showReaderMeaning: boolean;
  showTajweedColors: boolean;
  arabicScriptEdition: QuranArabicScriptEditionId;
  mushafTextScale?: number;
  playingRef: MushafAyahRef | null;
  ayahAudioIsPlaying: boolean;
  loadingAyahAudio: MushafAyahRef | null;
  resumeHighlight: MushafAyahRef | null;
  ayahMarkers: Record<string, AyahMarkerRecord>;
  ayahMap?: MushafAyahMapFile | null;
  readingThemeId?: QuranReadingThemeId;
  /** Толық сүре: тек осы сүре беттері (Бақара 2–49). */
  surahScope?: number | null;
  /** QCF4/asset backend: тек көрінетін беттер жүктеледі. */
  isActive?: boolean;
  /** Asset/font fallback болса, user-ға үнсіз degrade етпеу үшін қысқа ескерту. */
  fallbackNotice?: string;
  toEasternArabicIndic: (n: number) => string;
  onPressAyah: (ref: MushafAyahRef, item: CachedAyah) => void;
  onLongPressAyah: (ref: MushafAyahRef, item: CachedAyah) => void;
  onToggleAudio: (ref: MushafAyahRef, item: CachedAyah) => void;
};

/** Hafs 604: backend — text-hafs | svg | webp | qcf4 (native/web бір маршрут). */
export function MushafBookPageScroll(props: Props) {
  const [forceTextHafs, setForceTextHafs] = useState(false);

  useEffect(() => {
    let alive = true;
    void shouldHatimUseTextHafsOffline().then((useTextHafs) => {
      if (alive) setForceTextHafs(useTextHafs);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (props.arabicScriptEdition !== "madinah") {
    return <MushafBookPageTextHafs {...props} />;
  }

  const backend = mushafBookEffectiveRenderBackend(props.readingThemeId, {
    showTajweedColors: props.showTajweedColors,
    arabicScriptEdition: props.arabicScriptEdition,
    forceTextHafs,
  });

  if (backend === "webp" || backend === "svg" || backend === "qcf4") {
    if (backend === "qcf4") {
      return <MushafBookPageQcf4Route {...props} />;
    }
    if (backend === "webp") {
      return <MushafBookPageWebpRoute {...props} />;
    }

    const {
      page,
      pagerWidth,
      paddingBottom,
      colors,
      styles: st,
      ayahMap = null,
      showReaderMeaning,
      showReaderTranslit,
      playingRef,
      ayahAudioIsPlaying,
      loadingAyahAudio,
      resumeHighlight,
      isActive = true,
      ayahMarkers,
      onPressAyah,
      onLongPressAyah,
      onToggleAudio,
    } = props;

    const Raster = backend === "svg" ? MushafBookPageSvg : MushafBookPageWebp;
    return (
      <Raster
        page={page}
        pagerWidth={pagerWidth}
        viewportHeight={props.viewportHeight}
        paddingBottom={paddingBottom}
        readingThemeId={props.readingThemeId}
        colors={colors}
        styles={st}
        ayahMap={ayahMap}
        showReaderMeaning={showReaderMeaning}
        showReaderTranslit={showReaderTranslit}
        playingRef={playingRef}
        ayahAudioIsPlaying={ayahAudioIsPlaying}
        loadingAyahAudio={loadingAyahAudio}
        resumeHighlight={resumeHighlight}
        isActive={isActive}
        ayahMarkers={ayahMarkers}
        onPressAyah={onPressAyah}
        onLongPressAyah={onLongPressAyah}
        onToggleAudio={onToggleAudio}
      />
    );
  }

  return <MushafBookPageTextHafs {...props} />;
}

/** WebP сәтсіз болса — QCF4, содан text-hafs. */
function MushafBookPageWebpRoute(props: Props) {
  const [stage, setStage] = useState<"webp" | "qcf4" | "text">("webp");
  if (stage === "text") return <MushafBookPageTextHafs {...props} />;
  if (stage === "qcf4") {
    return <MushafBookPageQcf4Route {...props} />;
  }
  return (
    <MushafBookPageWebp
      {...props}
      ayahMap={props.ayahMap ?? null}
      onLoadFailed={() => setStage("qcf4")}
    />
  );
}

/** QCF4 сәтсіз болса — bundled text-hafs fallback (хатым/құран ашылмауын болдырмау). */
function MushafBookPageQcf4Route(props: Props) {
  const [useRasterFallback, setUseRasterFallback] = useState(false);
  const onLoadFailed = useCallback(() => setUseRasterFallback(true), []);

  if (useRasterFallback) {
    return (
      <MushafBookPageTextHafs
        {...props}
        showReaderArabic
        fallbackNotice={props.fallbackNotice ?? kk.quran.mushafAssetFallbackNotice}
      />
    );
  }

  const {
    page,
    pagerWidth,
    viewportHeight,
    paddingBottom,
    colors,
    isDark,
    styles: st,
    readingThemeId,
    isActive = true,
    showReaderMeaning,
    showReaderTranslit,
    showTajweedColors,
    mushafTextScale = 1,
    playingRef,
    ayahAudioIsPlaying,
    loadingAyahAudio,
    resumeHighlight,
    ayahMarkers,
    onPressAyah,
    onLongPressAyah,
    onToggleAudio,
  } = props;

  return (
    <MushafBookPageQcf4
      page={page}
      pagerWidth={pagerWidth}
      viewportHeight={viewportHeight}
      paddingBottom={paddingBottom}
      colors={colors}
      isDark={isDark}
      styles={st}
      readingThemeId={readingThemeId}
      isActive={isActive}
      showReaderMeaning={showReaderMeaning}
      showReaderTranslit={showReaderTranslit}
      showTajweedColors={showTajweedColors}
      mushafTextScale={mushafTextScale}
      playingRef={playingRef}
      ayahAudioIsPlaying={ayahAudioIsPlaying}
      loadingAyahAudio={loadingAyahAudio}
      resumeHighlight={resumeHighlight}
      ayahMarkers={ayahMarkers}
      onPressAyah={onPressAyah}
      onLongPressAyah={onLongPressAyah}
      onToggleAudio={onToggleAudio}
      onLoadFailed={onLoadFailed}
    />
  );
}

function MushafBookPageTextHafs({
  page,
  pagerWidth,
  viewportHeight,
  paddingBottom,
  colors,
  isDark,
  styles: st,
  readingThemeId,
  fallbackNotice,
  showReaderArabic,
  showReaderTranslit,
  showReaderMeaning,
  showTajweedColors,
  arabicScriptEdition,
  playingRef,
  ayahAudioIsPlaying,
  loadingAyahAudio,
  resumeHighlight,
  ayahMarkers,
  toEasternArabicIndic,
  onPressAyah,
  onLongPressAyah,
  onToggleAudio,
  surahScope = null,
  mushafTextScale,
  isActive = true,
}: Props) {
  const locale = useAppLocale();
  const readingLocale = useQuranReadingLocale();
  const translitScript = useQuranTranslitScript();
  const { tr } = useKkAutoTranslator();
  const vScrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const [bundledQuranReady, setBundledQuranReady] = useState(isBundledQuranReaderLoaded());
  useEffect(() => {
    if (bundledQuranReady) return;
    let alive = true;
    void ensureBundledQuranReaderLoaded().then(() => {
      if (!alive) return;
      clearMushafBookAyahResolveCache();
      setBundledQuranReady(true);
    });
    return () => {
      alive = false;
    };
  }, [bundledQuranReady]);
  useEffect(() => {
    if (arabicScriptEdition !== "turkish" || bundledQuranReady) return;
    void ensureBundledQuranReaderLoaded().then(() => {
      clearMushafBookAyahResolveCache();
      setBundledQuranReady(true);
    });
  }, [arabicScriptEdition, bundledQuranReady]);
  useEffect(() => {
    if (arabicScriptEdition === "turkish") clearMushafBookAyahResolveCache();
  }, [arabicScriptEdition, bundledQuranReady]);
  useEffect(() => {
    if (arabicScriptEdition !== "turkish") resetTurkishHatimFitSession();
  }, [arabicScriptEdition]);
  const segments = useMemo(() => groupAyahsBySurah(page.ayahs), [page.ayahs]);
  const minimalChrome = resolveQuranReadingTheme(readingThemeId).minimalPageChrome;
  const hatimOnePageFit = shouldForceMushafOnePageFit({
    arabicScriptEdition,
    readingThemeId,
    showReaderTranslit,
    showReaderMeaning,
  });
  const turkishHatimSizing = arabicScriptEdition === "turkish";
  const turkishEdgeInsets = turkishHatimSizing && hatimOnePageFit;
  const turkishLayoutOverrides = turkishHatimSizing && !TURKISH_PRINT_HATIM_MEDINA_PARITY;
  const phoneSafeInset =
    minimalChrome && turkishHatimSizing && hatimOnePageFit
      ? TURKISH_PRINT_HATIM_PHONE_HORIZONTAL_SAFE
      : minimalChrome && Platform.OS === "web" && pagerWidth <= 520
        ? MUSHAF_BOOK_PHONE_TEXT_SAFE_INSET
        : minimalChrome && Platform.OS !== "web"
          ? MUSHAF_BOOK_PHONE_TEXT_SAFE_INSET
          : 0;
  const { pageWidth, pageHeight } = computeMushafBookPageBox(
    pagerWidth,
    viewportHeight,
    paddingBottom,
    minimalChrome,
    minimalChrome ? { horizontalSafeInset: phoneSafeInset, fillViewport: true } : undefined
  );
  const fitToViewport = viewportHeight != null && viewportHeight > 0;
  const pageTextWidth = fitToViewport
    ? minimalChrome
      ? pageWidth
      : Math.max(252, pageWidth - 36)
    : undefined;
  const pageGlyphCount = pageArabicGlyphCount(page, arabicScriptEdition);
  const turkishFitSig =
    arabicScriptEdition === "turkish"
      ? page.ayahs.reduce(
          (n, ayah) =>
            n +
            (((resolveMushafBookAyah(ayah).textTurkishPrint as string | undefined) ?? "").trim()
              ? 1
              : 0),
          0
        )
      : 0;
  const sparsePage = hatimOnePageFit && pageGlyphCount < 220;
  const {
    showReaderTranslit: effectiveShowReaderTranslit,
    showReaderMeaning: effectiveShowReaderMeaning,
  } = forcedMushafReaderLayers(hatimOnePageFit, showReaderTranslit, showReaderMeaning);
  const compactBookPage = hatimOnePageFit && showReaderArabic;
  const isPhoneQcf4Page =
    (Platform.OS === "web" && pagerWidth <= 520) || (Platform.OS !== "web" && pagerWidth <= 520);
  const earlyChromeSurah = page.ayahs[0]?.surahNumber ?? 1;
  const earlyChromeAyah = page.ayahs[0]?.numberInSurah ?? 1;
  const showSurahFrameEarly = minimalChrome && earlyChromeAyah === 1;
  const titleArEarly = showSurahFrameEarly ? surahArabicBannerTitle(earlyChromeSurah) : null;
  const qcomPurePage = minimalChrome && fitToViewport;
  const turkishHatimPage = arabicScriptEdition === "turkish" && hatimOnePageFit;
  const turkishReaderViewport = useMemo(() => {
    if (!turkishHatimPage) return null;
    const scale = mushafTextScale ?? HATIM_LOCKED_MUSHAF_TEXT_SCALE;
    const fontMode = mushafTextScaleToReaderFontMode(scale);
    return computeQuranReaderViewportMetrics(pagerWidth, fontMode, scale, {
      turkishPrint: true,
      screenHeight: viewportHeight ?? pagerWidth,
    });
  }, [turkishHatimPage, pagerWidth, viewportHeight, mushafTextScale]);
  const useExternalSurahFrame =
    qcomPurePage && showSurahFrameEarly && Boolean(titleArEarly) && !turkishHatimPage;
  const turkishQfFixed = turkishHatimPage && TURKISH_PRINT_QF_FIXED_SIZE;
  const turkishUniformGlyphs =
    turkishHatimPage && (TURKISH_PRINT_HATIM_UNIFORM_GLYPH_SIZE || turkishQfFixed);
  const turkishTextContentWidth = Math.max(
    280,
    turkishReaderViewport?.contentWidth ??
      (pageTextWidth ?? pageWidth) -
        (turkishHatimPage ? TURKISH_PRINT_HATIM_PHONE_LINE_PADDING * 2 : 0)
  );
  const turkishReaderHorizontalPad =
    turkishReaderViewport?.horizontalPadding ?? TURKISH_PRINT_HATIM_PHONE_LINE_PADDING;
  const hatimQcf4Sizing = hatimOnePageFit && showReaderArabic && fitToViewport;
  const linesAreaH = hatimQcf4Sizing
    ? computeHatimQcf4LinesAreaH({
        pageHeight,
        qcomPurePage,
        useExternalSurahFrame,
        isPhoneQcf4Page,
        turkishUnicodePrint: turkishHatimPage && turkishLayoutOverrides,
        unicodeTurkishHatim: turkishHatimPage,
      })
    : 0;
  /** Түрік uniform: барлық беттер бір fontSize + бір slot биіктігі (сыrtы рамкасыз). */
  const turkishUniformMetricsLinesAreaH =
    turkishUniformGlyphs && hatimQcf4Sizing
      ? Math.max(
          80,
          computeHatimQcf4LinesAreaH({
            pageHeight,
            qcomPurePage,
            useExternalSurahFrame: false,
            isPhoneQcf4Page,
            unicodeTurkishHatim: true,
          }) - TURKISH_PRINT_HATIM_BOTTOM_CLIP_SAFE
        )
      : 0;
  const metricsLinesAreaH =
    turkishUniformGlyphs && turkishUniformMetricsLinesAreaH > 0
      ? turkishUniformMetricsLinesAreaH
      : linesAreaH;
  const phoneVerticalSafePadding = turkishHatimPage
    ? isPhoneQcf4Page
      ? TURKISH_PRINT_HATIM_PHONE_VERTICAL_SAFE
      : 0
    : turkishLayoutOverrides
      ? isPhoneQcf4Page
        ? TURKISH_PRINT_HATIM_PHONE_VERTICAL_SAFE
        : 0
      : qcomPurePage && isPhoneQcf4Page
        ? QCF4_PHONE_VERTICAL_SAFE_PADDING
        : 0;
  const qcf4TextMetrics =
    hatimQcf4Sizing && metricsLinesAreaH > 0
      ? turkishReaderViewport
        ? {
            fontSize: turkishReaderViewport.fontSize,
            lineHeight: turkishReaderViewport.lineHeight,
          }
        : computeHatimQcf4EquivalentTextMetrics({
            linesAreaH: metricsLinesAreaH,
            mushafTextScale: mushafTextScale ?? HATIM_LOCKED_MUSHAF_TEXT_SCALE,
            isPhoneQcf4Page,
            qcomPurePage,
            turkishUnicodePrint: turkishHatimPage && turkishLayoutOverrides,
            unicodeTurkishPrint: turkishHatimPage,
          })
      : null;
  const hatimViewportSized = Boolean(qcf4TextMetrics);
  const qcomTitleInk = isDark ? "#FFFFFF" : (st.mushafAyahTxt.color ?? "#111111");
  const effectiveMushafAyahTxt = quranArabicAyahStyleForEdition(
    qcf4TextMetrics
      ? {
          ...st.mushafAyahTxt,
          fontSize: qcf4TextMetrics.fontSize,
          lineHeight: qcf4TextMetrics.lineHeight,
        }
      : st.mushafAyahTxt,
    arabicScriptEdition
  );
  const turkishContentKey = `${page.key}:${arabicScriptEdition}:${bundledQuranReady ? 1 : 0}:${turkishFitSig}`;
  const inlineHeaderReserve =
    compactBookPage && minimalChrome && !useExternalSurahFrame
      ? (segments.some((s) => (s.ayahs[0]?.numberInSurah ?? 1) === 1) ? 90 : 0) +
        (segments.some((s) => shouldShowBismillah(s.surah, s.ayahs[0]?.numberInSurah ?? 1)) ? 38 : 0)
      : 0;
  const baseMushafFontSize =
    qcf4TextMetrics?.fontSize ??
    (typeof st.mushafAyahTxt.fontSize === "number" ? st.mushafAyahTxt.fontSize : 22);
  const turkishUniformSessionKey =
    turkishUniformGlyphs && metricsLinesAreaH > 0 && qcf4TextMetrics
      ? turkishHatimFitSessionKey({
          edition: arabicScriptEdition,
          pagerWidth,
          viewportHeight: viewportHeight ?? 0,
          linesAreaH: metricsLinesAreaH,
          baseFontSize: baseMushafFontSize,
          bundledReady: bundledQuranReady,
        })
      : null;
  const fitScaleInitial = compactBookPage
    ? turkishHatimPage
      ? 1
      : turkishUniformGlyphs
        ? 1
        : hatimViewportSized &&
            arabicScriptEdition === "turkish" &&
            qcf4TextMetrics &&
            linesAreaH > 0
          ? estimateUnicodeMushafFitScale({
              glyphCount: pageGlyphCount + inlineHeaderReserve,
              contentWidth: pageTextWidth ?? pageWidth,
              fontSize: qcf4TextMetrics.fontSize,
              lineHeight: qcf4TextMetrics.lineHeight,
              maxHeight: linesAreaH,
              maxScale: 1,
            })
          : hatimViewportSized
            ? 1
            : mushafOnePageFitScale(pageGlyphCount + inlineHeaderReserve, pageHeight, "book")
    : 1;
  const autoFitEnabled =
    compactBookPage && !turkishQfFixed && !turkishUniformGlyphs && !turkishHatimPage;
  const autoFitPageKey = `${page.key}:${arabicScriptEdition}:${turkishFitSig}:${bundledQuranReady ? 1 : 0}`;
  const {
    scale: autoFitScale,
    atMinScale: autoFitAtMinScale,
    onContentLayout: onAutoFitLayout,
  } = useMushafPageAutoFitScale(
    autoFitEnabled ? autoFitPageKey : `uniform-${turkishUniformSessionKey ?? "off"}`,
    fitScaleInitial,
    linesAreaH,
    baseMushafFontSize,
    {
      unicodeTextHafs: arabicScriptEdition === "turkish" && !turkishQfFixed && !turkishHatimPage,
      maxScale: 1,
    }
  );
  const [measuredArabicHeight, setMeasuredArabicHeight] = useState(0);
  const [arabicSlotH, setArabicSlotH] = useState(0);
  useEffect(() => {
    setMeasuredArabicHeight(0);
    setArabicSlotH(0);
  }, [autoFitPageKey]);
  const turkishFitHeight =
    turkishHatimPage && arabicSlotH > 0
      ? arabicSlotH
      : turkishUniformGlyphs
        ? metricsLinesAreaH
        : linesAreaH;
  const effectiveFitScale =
    turkishHatimPage || turkishQfFixed || turkishUniformGlyphs
      ? 1
      : compactBookPage
        ? autoFitScale
        : 1;
  const layoutOverflowScale =
    turkishHatimPage
      ? 1
      : turkishQfFixed
        ? 1
        : turkishUniformGlyphs
          ? turkishFitHeight > 0 && measuredArabicHeight > turkishFitHeight + 2
            ? Math.max(0.82, (turkishFitHeight / measuredArabicHeight) * 0.985)
            : 1
          : compactBookPage &&
              turkishFitHeight > 0 &&
              measuredArabicHeight > turkishFitHeight + 2 &&
              (autoFitAtMinScale ||
                effectiveFitScale <=
                  mushafPageMinFitScale(baseMushafFontSize, { unicodeTextHafs: arabicScriptEdition === "turkish" }) +
                    0.004)
            ? Math.max(0.82, (turkishFitHeight / measuredArabicHeight) * 0.985)
            : 1;
  const onArabicBlockLayout = useCallback(
    (contentHeight: number) => {
      setMeasuredArabicHeight(contentHeight);
      if (autoFitEnabled && !turkishHatimPage) {
        onAutoFitLayout(contentHeight);
      }
    },
    [autoFitEnabled, onAutoFitLayout, turkishHatimPage]
  );
  const chromeSurah = page.ayahs[0]?.surahNumber ?? 1;
  const chromeAyah = page.ayahs[0]?.numberInSurah ?? 1;

  const renderSegment = (
    seg: { surah: number; ayahs: MushafBookAyah[] },
    keySuffix = "",
    opts?: { hideExternalSurahHeader?: boolean }
  ) => {
    const firstAyah = seg.ayahs[0]?.numberInSurah ?? 1;
    const showHeader =
      minimalChrome &&
      firstAyah === 1 &&
      !(opts?.hideExternalSurahHeader && useExternalSurahFrame) &&
      !turkishUniformGlyphs;
    const showBism = shouldShowBismillah(seg.surah, firstAyah);
    const showBismBanner =
      showBism &&
      !(qcomPurePage && useExternalSurahFrame && firstAyah === 1) &&
      !turkishUniformGlyphs;
    const titleAr = surahArabicBannerTitle(seg.surah);
    const titleKk = surahTitleForLocale(seg.surah, locale, { tr });
    const playingAyah = playingRef?.surah === seg.surah ? playingRef.ayah : null;
    const loadingAyah = loadingAyahAudio?.surah === seg.surah ? loadingAyahAudio.ayah : null;
    const resumeAyah = resumeHighlight?.surah === seg.surah ? resumeHighlight.ayah : null;
    return (
      <View
        key={`${page.key}-s${seg.surah}${keySuffix}`}
        style={minimalChrome ? { width: "100%", alignSelf: "stretch" } : undefined}
      >
        {showHeader ? (
          <MushafSurahHeader
            colors={colors}
            mushafLayout
            bookPageLayout={!minimalChrome}
            qcomBookLayout={minimalChrome}
            surahArabicTitleLine={titleAr}
            showMushafBismillahBanner={showBismBanner}
            styles={st}
          />
        ) : showBismBanner && !showHeader ? (
          <MushafSurahHeader
            colors={colors}
            mushafLayout
            bookPageLayout={!minimalChrome}
            qcomBookLayout={minimalChrome}
            surahArabicTitleLine={null}
            showMushafBismillahBanner
            styles={st}
          />
        ) : null}
        <View style={minimalChrome ? { width: "100%", alignSelf: "stretch" } : undefined}>
          <MushafContinuousArabicBlock
            key={turkishContentKey}
            ayahs={seg.ayahs}
            surahNumber={seg.surah}
            arabicScriptEdition={arabicScriptEdition}
            showReaderArabic={showReaderArabic}
            showTajweedColors={showTajweedColors}
            isDark={isDark}
            readingThemeId={readingThemeId}
            playingAyahInSurah={playingAyah}
            ayahAudioIsPlaying={ayahAudioIsPlaying}
            loadingAyahAudio={loadingAyah}
            resumeHighlightAyah={resumeAyah}
            ayahMarkers={ayahMarkers}
            mushafAyahTxt={effectiveMushafAyahTxt}
            bookFitScale={effectiveFitScale}
            compactBookPage={compactBookPage}
            hatimViewportSized={hatimViewportSized}
            contentWidth={turkishTextContentWidth}
            readerEngine={Boolean(turkishReaderViewport)}
            readerFontSize={turkishReaderViewport?.fontSize}
            readerLineHeight={turkishReaderViewport?.lineHeight}
            toEasternArabicIndic={toEasternArabicIndic}
            scrollViewRef={vScrollRef}
            scrollContentRef={contentRef}
            onPressArabic={(ayahInSurah) => {
              const stub = seg.ayahs.find((a) => a.numberInSurah === ayahInSurah);
              if (stub) {
                onPressAyah({ surah: seg.surah, ayah: ayahInSurah }, resolveMushafBookAyah(stub));
              }
            }}
            onLongPressAyah={(item) =>
              onLongPressAyah(
                { surah: seg.surah, ayah: item.numberInSurah },
                resolveMushafBookAyah(item as MushafBookAyah)
              )
            }
          />
        </View>
        {effectiveShowReaderMeaning || effectiveShowReaderTranslit || playingRef || loadingAyahAudio
          ? seg.ayahs.map((a) => {
              const resolved = resolveMushafBookAyah(a);
              const isLoad =
                loadingAyahAudio?.surah === seg.surah && loadingAyahAudio.ayah === a.numberInSurah;
              const hasLoaded = playingRef?.surah === seg.surah && playingRef.ayah === a.numberInSurah;
              const isPlayingNow = hasLoaded && ayahAudioIsPlaying;
              const isAudioFocus = hasLoaded || isLoad;
              if (!effectiveShowReaderMeaning && !effectiveShowReaderTranslit && !isAudioFocus) return null;
              return (
                <View key={`${seg.surah}-${a.numberInSurah}-sec`} style={st.mushafSecondaryAyahBlock}>
                  <Text style={st.mushafSecondaryAyahRibbon}>
                    {titleKk} · {a.numberInSurah}
                  </Text>
                  {effectiveShowReaderTranslit
                    ? (() => {
                        const kiril = resolveQuranTranslitForDisplay(
                          resolved.translit,
                          resolved.text,
                          translitScript
                        );
                        return kiril ? <Text style={st.mushafAyahKiril}>{kiril}</Text> : null;
                      })()
                    : null}
                  {effectiveShowReaderMeaning && quranAyahMeaningForLocale(resolved, readingLocale) ? (
                    <Text style={st.mushafAyahKk}>
                      {quranAyahMeaningForLocale(resolved, readingLocale)}
                    </Text>
                  ) : null}
                  {isAudioFocus ? (
                    <Pressable
                      oyuBackdrop={false}
                      onPress={() => onToggleAudio({ surah: seg.surah, ayah: a.numberInSurah }, resolved)}
                      disabled={isLoad}
                      accessibilityRole="button"
                      accessibilityState={{ busy: isLoad }}
                      accessibilityLabel={
                        isLoad
                          ? kk.quran.ayahPlaySudaisA11y(a.numberInSurah)
                          : isPlayingNow
                            ? kk.quran.ayahPauseSudaisA11y(a.numberInSurah)
                            : kk.quran.ayahResumeSudaisA11y(a.numberInSurah)
                      }
                      style={({ pressed }) => [st.mushafInlineAudioControl, pressed && { opacity: 0.82 }]}
                    >
                      {isLoad ? null : (
                        <MaterialIcons
                          name={isPlayingNow ? "pause" : "play-arrow"}
                          size={18}
                          color={colors.accent}
                        />
                      )}
                      <Text style={st.mushafInlineAudioText}>
                        {isLoad
                          ? kk.quran.ayahAudioLoadingAction
                          : isPlayingNow
                            ? kk.quran.ayahAudioPauseAction
                            : kk.quran.ayahAudioResumeAction}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
          : null}
      </View>
    );
  };

  const hatimPageTopInset = turkishHatimPage
    ? TURKISH_PRINT_HATIM_PAGE_TOP_INSET
    : minimalChrome
      ? MUSHAF_BOOK_PAGE_EDGE_INSET
      : 10;

  const arabicLinesBlock =
    compactBookPage && fitToViewport && linesAreaH > 0 ? (
      <View
        style={{
          width: pageTextWidth ?? pageWidth,
          ...(turkishHatimPage ? { flex: 1, minHeight: 0 } : { height: linesAreaH }),
          alignSelf: "center",
          justifyContent: "flex-start",
          alignItems: "stretch",
          paddingHorizontal: turkishHatimPage
            ? turkishReaderHorizontalPad
            : isPhoneQcf4Page
              ? QCF4_PHONE_LINE_PADDING
              : 6,
          paddingTop: turkishHatimPage ? 0 : phoneVerticalSafePadding,
          paddingBottom: turkishHatimPage ? TURKISH_PRINT_HATIM_BOTTOM_CLIP_SAFE : phoneVerticalSafePadding,
          marginTop: 0,
          overflow: turkishHatimPage ? "visible" : "hidden",
          alignItems: "stretch",
        }}
        onLayout={
          turkishHatimPage
            ? (e) => setArabicSlotH(e.nativeEvent.layout.height)
            : undefined
        }
      >
        <View
          style={{
            width: "100%",
            alignSelf: "stretch",
            flexGrow: turkishHatimPage ? 1 : 0,
            overflow: turkishHatimPage ? "visible" : "hidden",
            ...(layoutOverflowScale !== 1
              ? {
                  transformOrigin: "top center" as const,
                  transform: [{ scale: layoutOverflowScale }],
                }
              : null),
          }}
          onLayout={(e) => onArabicBlockLayout(e.nativeEvent.layout.height)}
        >
          {segments.map((seg) =>
            renderSegment(seg, "-fit", { hideExternalSurahHeader: useExternalSurahFrame })
          )}
        </View>
      </View>
    ) : null;

  const pageBody = (
    <View
      ref={contentRef}
      style={
        fitToViewport
          ? {
              width: pageTextWidth ?? pageWidth,
              alignSelf: "center",
              overflow: turkishHatimPage ? "visible" : "hidden",
              ...(hatimOnePageFit
                ? { height: pageHeight, flexDirection: "column" as const }
                : {}),
            }
          : undefined
      }
    >
      {minimalChrome ? (
        <MushafBookPageChrome
          primarySurah={chromeSurah}
          primaryAyah={chromeAyah}
          mushafPageNumber={page.mushafPageNumber}
          styles={st}
          horizontalInset={
            turkishHatimPage ? TURKISH_PRINT_HATIM_PHONE_LINE_PADDING : undefined
          }
        />
      ) : null}
      {useExternalSurahFrame && titleArEarly ? (
        <View
          style={{
            height: QCF4_EXTERNAL_SURAH_FRAME_RESERVE,
            width: "100%",
            alignItems: "center",
            justifyContent: "flex-start",
            marginTop: turkishHatimPage
              ? -10
              : -QCF4_EXTERNAL_SURAH_FRAME_TOP_TIGHTEN,
          }}
        >
          <MushafSurahHeader
            colors={colors}
            mushafLayout
            qcomBookLayout
            surahArabicTitleLine={titleArEarly}
            showMushafBismillahBanner={false}
            styles={st}
            titleColor={qcomTitleInk}
          />
        </View>
      ) : null}
      {arabicLinesBlock ?? segments.map((seg) => renderSegment(seg))}
    </View>
  );

  const pageFace = resolveQuranReadingTheme(readingThemeId).pageFace;

  const fitViewportChrome = (
    <>
      {fallbackNotice ? (
        <Text
          style={{
            maxWidth: Math.max(252, pageWidth - 24),
            marginTop: 8,
            marginBottom: 4,
            paddingHorizontal: 12,
            paddingVertical: 7,
            borderRadius: 14,
            backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(120,53,15,0.08)",
            color: colors.muted,
            fontSize: 12,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {fallbackNotice}
        </Text>
      ) : null}
      <View style={{ width: pageWidth, height: hatimOnePageFit ? pageHeight : undefined, minHeight: minimalChrome ? undefined : pageHeight }}>
        {pageBody}
      </View>
    </>
  );

  if (!fitToViewport) {
    return (
      <ScrollView
        ref={vScrollRef}
        style={{ width: pagerWidth, flex: 1 }}
        contentContainerStyle={[st.mushafListPad, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {fallbackNotice ? (
          <Text
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 14,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(120,53,15,0.08)",
              color: colors.muted,
              fontSize: 12,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {fallbackNotice}
          </Text>
        ) : null}
        {pageBody}
      </ScrollView>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        width: pagerWidth,
        alignItems: "center",
        minHeight: 0,
        backgroundColor: pageFace,
      }}
    >
      {hatimOnePageFit ? (
        <View
          style={{
            flex: 1,
            width: pagerWidth,
            alignItems: "center",
            paddingTop: hatimPageTopInset,
            paddingBottom,
          }}
        >
          {fitViewportChrome}
        </View>
      ) : (
        <ScrollView
          ref={vScrollRef}
          style={{ flex: 1, width: pagerWidth }}
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: "center",
            paddingTop: hatimPageTopInset,
            paddingBottom,
          }}
          showsVerticalScrollIndicator
        >
          {fitViewportChrome}
        </ScrollView>
      )}
    </View>
  );
}
