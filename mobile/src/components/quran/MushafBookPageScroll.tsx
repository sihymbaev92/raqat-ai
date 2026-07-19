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
import { resolveMushafBookAyah } from "../../quran/buildMushafPagesGlobal";
import {
  forcedMushafReaderLayers,
  mushafOnePageFitScale,
  shouldForceMushafOnePageFit,
} from "../../quran/mushafBookFitPolicy";
import { useMushafPageAutoFitScale } from "../../quran/mushafPageAutoFit";
import { MushafBookPageFitBox } from "./MushafBookPageFitBox";

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
}: Props) {
  const locale = useAppLocale();
  const readingLocale = useQuranReadingLocale();
  const translitScript = useQuranTranslitScript();
  const { tr } = useKkAutoTranslator();
  const vScrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const segments = useMemo(() => groupAyahsBySurah(page.ayahs), [page.ayahs]);
  const minimalChrome = resolveQuranReadingTheme(readingThemeId).minimalPageChrome;
  const phoneSafeInset =
    minimalChrome && Platform.OS === "web" && pagerWidth <= 520
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
  const hatimOnePageFit = shouldForceMushafOnePageFit({
    arabicScriptEdition,
    readingThemeId,
    showReaderTranslit,
    showReaderMeaning,
  });
  const pageGlyphCount = pageArabicGlyphCount(page, arabicScriptEdition);
  const sparsePage = hatimOnePageFit && pageGlyphCount < 220;
  const {
    showReaderTranslit: effectiveShowReaderTranslit,
    showReaderMeaning: effectiveShowReaderMeaning,
  } = forcedMushafReaderLayers(hatimOnePageFit, showReaderTranslit, showReaderMeaning);
  const compactBookPage = hatimOnePageFit && showReaderArabic && !sparsePage;
  const headerGlyphReserve =
    compactBookPage && minimalChrome
      ? (segments.some((s) => (s.ayahs[0]?.numberInSurah ?? 1) === 1) ? 90 : 0) +
        (segments.some((s) => shouldShowBismillah(s.surah, s.ayahs[0]?.numberInSurah ?? 1)) ? 38 : 0)
      : 0;
  const fitScaleInitial = compactBookPage
    ? mushafOnePageFitScale(pageGlyphCount + headerGlyphReserve, pageHeight, "book")
    : 1;
  const baseMushafFontSize =
    typeof st.mushafAyahTxt.fontSize === "number" ? st.mushafAyahTxt.fontSize : 22;
  const chromeReserve = minimalChrome ? 32 : 0;
  const headerBlockReserve =
    minimalChrome && sparsePage
      ? (segments.some((s) => (s.ayahs[0]?.numberInSurah ?? 1) === 1) ? 92 : 0) +
        (segments.some((s) => shouldShowBismillah(s.surah, s.ayahs[0]?.numberInSurah ?? 1)) ? 40 : 0)
      : compactBookPage
        ? headerGlyphReserve
        : 0;
  const arabicAreaHeight =
    hatimOnePageFit && fitToViewport
      ? Math.max(120, pageHeight - chromeReserve - headerBlockReserve)
      : undefined;
  const {
    scale: autoFitScale,
    atMinScale: autoFitAtMinScale,
    onContentLayout: onAutoFitLayout,
  } = useMushafPageAutoFitScale(page.key, fitScaleInitial, arabicAreaHeight ?? 0, baseMushafFontSize);
  const [fitContentOverflow, setFitContentOverflow] = useState(false);
  useEffect(() => {
    setFitContentOverflow(false);
  }, [page.key]);
  const effectiveFitScale = compactBookPage ? autoFitScale : 1;
  const onArabicBlockLayout = useCallback(
    (contentHeight: number) => {
      if (arabicAreaHeight && arabicAreaHeight > 0) {
        setFitContentOverflow(contentHeight > arabicAreaHeight + 2);
      }
      onAutoFitLayout(contentHeight);
    },
    [onAutoFitLayout, arabicAreaHeight]
  );
  const chromeSurah = page.ayahs[0]?.surahNumber ?? 1;
  const chromeAyah = page.ayahs[0]?.numberInSurah ?? 1;

  const renderSegment = (seg: { surah: number; ayahs: MushafBookAyah[] }, keySuffix = "") => {
    const firstAyah = seg.ayahs[0]?.numberInSurah ?? 1;
    const showHeader = minimalChrome && firstAyah === 1;
    const showBism = shouldShowBismillah(seg.surah, firstAyah);
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
            showMushafBismillahBanner={showBism}
            styles={st}
          />
        ) : showBism && !showHeader ? (
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
            mushafAyahTxt={st.mushafAyahTxt}
            bookFitScale={effectiveFitScale}
            compactBookPage={compactBookPage}
            contentWidth={pageTextWidth ?? pageWidth}
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

  const pageBody = (
    <View
      ref={contentRef}
      style={
        fitToViewport
          ? {
              width: pageTextWidth,
              alignSelf: "center",
              overflow: "visible",
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
        />
      ) : null}
      {compactBookPage && fitToViewport && arabicAreaHeight ? (
        <View style={{ flex: 1, width: "100%", minHeight: arabicAreaHeight, overflow: "visible" }}>
          <MushafBookPageFitBox
            pageWidth={pageTextWidth ?? pageWidth}
            pageHeight={arabicAreaHeight}
            lockOnePage
            allowOverflowScroll={fitContentOverflow && autoFitAtMinScale}
          >
            <View
              style={{ width: "100%", alignSelf: "stretch", overflow: "visible" }}
              onLayout={(e) => onArabicBlockLayout(e.nativeEvent.layout.height)}
            >
              {segments.map((seg) => renderSegment(seg, "-fit"))}
            </View>
          </MushafBookPageFitBox>
        </View>
      ) : sparsePage && fitToViewport ? (
        <View
          style={{
            flex: 1,
            width: "100%",
            justifyContent: "flex-start",
            overflow: "visible",
          }}
        >
          {segments.map((seg) => renderSegment(seg, "-sparse"))}
        </View>
      ) : (
        segments.map((seg) => renderSegment(seg))
      )}
    </View>
  );

  const pageFace = resolveQuranReadingTheme(readingThemeId).pageFace;

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
      <ScrollView
        ref={vScrollRef}
        style={{ flex: 1, width: pagerWidth }}
        scrollEnabled={!hatimOnePageFit}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          paddingTop: minimalChrome ? MUSHAF_BOOK_PAGE_EDGE_INSET : 10,
          paddingBottom,
        }}
        showsVerticalScrollIndicator={!hatimOnePageFit}
      >
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
      </ScrollView>
    </View>
  );
}
