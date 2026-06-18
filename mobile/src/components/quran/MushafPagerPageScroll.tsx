import React, { useCallback, useEffect, useRef, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ScrollView,
  View,
  Text,
  RefreshControl,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import { displayCachedAyahArabic, quranAyahMeaningForLocale, type CachedAyah } from "../../storage/quranSurahCache";
import { getCurrentLocale } from "../../i18n/runtime";
import { getQuranTranslitOverride } from "../../content/quranTranslitOverrides";
import { resolveQuranTranslitForDisplay } from "../../utils/quranTranslitDisplay";
import { pickDominantAyahAboveScrollOffset } from "../../quran/mushafScrollAnchor";
import {
  MushafContinuousArabicBlock,
  type MushafContinuousArabicHandle,
} from "./MushafContinuousArabicBlock";
import { MushafSurahHeader } from "./MushafSurahHeader";
import { AyahArabicKaraokeText } from "./AyahArabicKaraokeText";
import type { AyahMarkerRecord } from "../../storage/quranAyahMarkers";
import type { QuranReadingThemeId } from "../../theme/quranComReadingTheme";
import {
  forcedMushafReaderLayers,
  mushafOnePageFitScale,
  shouldForceMushafOnePageFit,
} from "../../quran/mushafBookFitPolicy";

export type MushafPagerPageModel = { key: string; ayahs: CachedAyah[]; includeHeader: boolean };

function pageArabicGlyphCount(page: MushafPagerPageModel, edition: QuranArabicScriptEditionId): number {
  return page.ayahs.reduce(
    (sum, ayah) => sum + displayCachedAyahArabic(ayah, edition).replace(/\s+/g, "").length,
    0
  );
}

export type MushafPagerPageStyles = {
  pad: ViewStyle;
  mushafListPad: ViewStyle;
  mushafSurahTitleBlock: ViewStyle;
  mushafSurahTitlePaper: ViewStyle;
  mushafSurahTitleAr: TextStyle;
  bismillahBanner: ViewStyle;
  mushafBismillahBanner: ViewStyle;
  bismillahBannerTxt: TextStyle;
  mushafBismillahBannerTxt: TextStyle;
  mushafAyahTxt: TextStyle;
  mushafAyahSectionCaption: TextStyle;
  mushafAyahKiril: TextStyle;
  mushafAyahKk: TextStyle;
  mushafNoKkHint: TextStyle;
  mushafSecondaryAyahBlock: ViewStyle;
  mushafSecondaryAyahRibbon: TextStyle;
  mushafInlineAudioControl: ViewStyle;
  mushafInlineAudioText: TextStyle;
};

type Props = {
  page: MushafPagerPageModel;
  pagerWidth: number;
  paddingBottom: number;
  refreshing: boolean;
  onRefresh: () => void;
  accentColor: string;
  colors: ThemeColors;
  mushafLayout: boolean;
  /** Хатым бет режимі — кітап қағазы, жинақы бисмиллә */
  bookPageLayout?: boolean;
  surahNumber: number;
  surahArabicTitleLine: string | null;
  showMushafBismillahBanner: boolean;
  styles: MushafPagerPageStyles;
  showReaderArabic: boolean;
  showReaderTranslit: boolean;
  showReaderMeaning: boolean;
  showTajweedColors: boolean;
  /** Мадина таңдалғанда ғана тәжуид тегтері қолданылады (экран жақтан сүзілген болуы керек). */
  arabicScriptEdition: QuranArabicScriptEditionId;
  readingThemeId?: QuranReadingThemeId;
  isDark: boolean;
  playingAyahInSurah: number | null;
  ayahAudioIsPlaying: boolean;
  loadingAyahAudio: number | null;
  resumeHighlightAyah: number | null;
  ayahMarkers: Record<string, AyahMarkerRecord>;
  toEasternArabicIndic: (n: number) => string;
  accessibilityLabelForAyah: (ayahInSurah: number) => string;
  onPressArabic: (ayahInSurah: number) => void;
  onLongPressAyah: (item: CachedAyah) => void;
  /** last-read / футер: бет ішіндегі тік скроллда көрінетін аят */
  onVerticalReadingAnchor?: (ayahInSurah: number) => void;
  /** last-read скролл: осы бетте осы аятқа тік скролл (горизонталды бет ауыстырғаннан кейін) */
  readingTargetAyah?: number | null;
};

/** Мұсаф бет режимі: бір беттегі аяттар арабы үздіксіз ағынмен + астында аударма/транскрипция. */
export function MushafPagerPageScroll({
  page,
  pagerWidth,
  paddingBottom,
  refreshing,
  onRefresh,
  accentColor,
  colors,
  mushafLayout,
  bookPageLayout = false,
  surahNumber,
  surahArabicTitleLine,
  showMushafBismillahBanner,
  styles: st,
  showReaderArabic,
  showReaderTranslit,
  showReaderMeaning,
  showTajweedColors,
  arabicScriptEdition,
  readingThemeId,
  isDark,
  playingAyahInSurah,
  ayahAudioIsPlaying,
  loadingAyahAudio,
  resumeHighlightAyah,
  ayahMarkers,
  toEasternArabicIndic,
  accessibilityLabelForAyah,
  onPressArabic,
  onLongPressAyah,
  onVerticalReadingAnchor,
  readingTargetAyah,
}: Props) {
  const vScrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const continuousRef = useRef<MushafContinuousArabicHandle | null>(null);
  const [viewportHeight, setViewportHeight] = useState(0);
  const pageAyahTopsRef = useRef<Record<number, number>>({});
  const contentHeightRef = useRef(0);
  const prevPageKeyRef = useRef(page.key);
  if (prevPageKeyRef.current !== page.key) {
    pageAyahTopsRef.current = {};
    prevPageKeyRef.current = page.key;
  }

  const onAyahTopMeasured = useCallback((ayahInSurah: number, topInContent: number) => {
    pageAyahTopsRef.current[ayahInSurah] = topInContent;
  }, []);

  const fallbackScrollYForAyah = useCallback(
    (ayahInSurah: number) => {
      const h = contentHeightRef.current;
      const list = page.ayahs;
      if (!h || list.length <= 1) return undefined;
      const idx = list.findIndex((a) => a.numberInSurah === ayahInSurah);
      if (idx < 0) return undefined;
      const ratio = idx / (list.length - 1);
      return ratio * h * 0.88;
    },
    [page.ayahs]
  );

  const scrollToAyahInPage = useCallback(
    (ayahInSurah: number, opts?: { animated?: boolean; viewOffset?: number }) => {
      const y = pageAyahTopsRef.current[ayahInSurah];
      const viewOffset = opts?.viewOffset ?? 88;
      if (y != null && Number.isFinite(y)) {
        vScrollRef.current?.scrollTo({
          y: Math.max(0, y - viewOffset),
          animated: opts?.animated !== false,
        });
        return;
      }
      continuousRef.current?.scrollToAyah(ayahInSurah, opts);
      const fb = fallbackScrollYForAyah(ayahInSurah);
      if (fb != null && Number.isFinite(fb)) {
        vScrollRef.current?.scrollTo({
          y: Math.max(0, fb - viewOffset),
          animated: opts?.animated !== false,
        });
      }
    },
    [fallbackScrollYForAyah]
  );

  const onVerticalScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!onVerticalReadingAnchor || !page.ayahs.length) return;
      const best = pickDominantAyahAboveScrollOffset(
        page.ayahs,
        pageAyahTopsRef.current,
        e.nativeEvent.contentOffset.y,
        96
      );
      onVerticalReadingAnchor(best);
    },
    [onVerticalReadingAnchor, page.ayahs]
  );

  useEffect(() => {
    if (!ayahAudioIsPlaying || playingAyahInSurah == null) return;
    if (!page.ayahs.some((a) => a.numberInSurah === playingAyahInSurah)) return;
    const ay = playingAyahInSurah;
    const run = () => scrollToAyahInPage(ay, { animated: true, viewOffset: 88 });
    const raf = requestAnimationFrame(run);
    const t1 = setTimeout(run, 220);
    const t2 = setTimeout(run, 520);
    const t3 = setTimeout(run, 900);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [ayahAudioIsPlaying, playingAyahInSurah, page.ayahs, scrollToAyahInPage]);

  const lastReadingRevealKeyRef = useRef("");
  useEffect(() => {
    lastReadingRevealKeyRef.current = "";
  }, [surahNumber, page.key]);

  useEffect(() => {
    if (readingTargetAyah == null || readingTargetAyah <= 0) return;
    if (!page.ayahs.some((a) => a.numberInSurah === readingTargetAyah)) return;
    const mark = `${surahNumber}:${page.key}:${readingTargetAyah}`;
    if (lastReadingRevealKeyRef.current === mark) return;
    lastReadingRevealKeyRef.current = mark;
    const ay = readingTargetAyah;
    const t = setTimeout(() => {
      scrollToAyahInPage(ay, { animated: true, viewOffset: 88 });
    }, 520);
    const t2 = setTimeout(() => {
      scrollToAyahInPage(ay, { animated: false, viewOffset: 88 });
    }, 960);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [readingTargetAyah, page.key, page.ayahs, surahNumber, scrollToAyahInPage]);

  const forceBookPageFit = shouldForceMushafOnePageFit({
    arabicScriptEdition,
    readingThemeId,
    mushafLayout,
    bookPageLayout,
  });
  const {
    showReaderTranslit: effectiveShowReaderTranslit,
    showReaderMeaning: effectiveShowReaderMeaning,
  } = forcedMushafReaderLayers(forceBookPageFit, showReaderTranslit, showReaderMeaning);
  const showPerAyahStack = effectiveShowReaderTranslit || effectiveShowReaderMeaning;
  const fitScale = forceBookPageFit
    ? mushafOnePageFitScale(pageArabicGlyphCount(page, arabicScriptEdition), viewportHeight, "pager")
    : 1;
  const compactBookPage = forceBookPageFit;
  const forcedBookContentStyle: ViewStyle | null = forceBookPageFit
    ? {
        minHeight: viewportHeight > 0 ? viewportHeight : undefined,
        paddingHorizontal: pagerWidth < 420 ? 10 : 16,
        paddingTop: page.includeHeader ? 4 : 0,
        paddingBottom: 4,
      }
    : null;

  return (
    <ScrollView
      ref={vScrollRef}
      onLayout={(e) => setViewportHeight(Math.round(e.nativeEvent.layout.height))}
      onScroll={onVerticalScroll}
      scrollEventThrottle={120}
      onContentSizeChange={(_w, h) => {
        contentHeightRef.current = h;
      }}
      style={{ width: pagerWidth, flex: 1 }}
      contentContainerStyle={[st.pad, st.mushafListPad, { paddingBottom }, forcedBookContentStyle]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View ref={contentRef} collapsable={false}>
        {page.includeHeader ? (
          <MushafSurahHeader
            colors={colors}
            mushafLayout={mushafLayout}
            bookPageLayout={bookPageLayout}
            surahArabicTitleLine={surahArabicTitleLine}
            showMushafBismillahBanner={showMushafBismillahBanner}
            styles={{
              mushafSurahTitleBlock: st.mushafSurahTitleBlock,
              mushafSurahTitlePaper: st.mushafSurahTitlePaper,
              mushafSurahTitleAr: st.mushafSurahTitleAr,
              mushafAyahTxt: st.mushafAyahTxt,
              bismillahBanner: st.bismillahBanner,
              mushafBismillahBanner: st.mushafBismillahBanner,
              bismillahBannerTxt: st.bismillahBannerTxt,
              mushafBismillahBannerTxt: st.mushafBismillahBannerTxt,
            }}
          />
        ) : null}
        {showPerAyahStack ? (
          page.ayahs.map((item) => {
            const isLoad = loadingAyahAudio === item.numberInSurah;
            const hasLoaded = playingAyahInSurah === item.numberInSurah;
            const isPlayingNow = hasLoaded && ayahAudioIsPlaying;
            const isAudioFocus = hasLoaded || isLoad;
            const arabicPlain = displayCachedAyahArabic(item, arabicScriptEdition);
            const showArBlock =
              showReaderArabic &&
              (showTajweedColors && (item.textTajweed ?? "").includes("[") ? true : Boolean(arabicPlain));
            const kkLine = quranAyahMeaningForLocale(item, getCurrentLocale());
            const kirilRead =
              getQuranTranslitOverride(surahNumber, item.numberInSurah) ??
              resolveQuranTranslitForDisplay(item.translit, arabicPlain);
            return (
              <View
                key={`pager-stack-${surahNumber}:${item.numberInSurah}`}
                style={st.mushafSecondaryAyahBlock}
                collapsable={false}
                onLayout={(e) => onAyahTopMeasured(item.numberInSurah, e.nativeEvent.layout.y)}
              >
                <Text style={st.mushafSecondaryAyahRibbon}>{toEasternArabicIndic(item.numberInSurah)}</Text>
                {showArBlock ? (
                  <Pressable
                    oyuBackdrop={false}
                    onPress={() => onPressArabic(item.numberInSurah)}
                    onLongPress={() => onLongPressAyah(item)}
                    disabled={isLoad}
                    accessibilityRole="button"
                    accessibilityState={{ busy: isLoad }}
                    accessibilityLabel={accessibilityLabelForAyah(item.numberInSurah)}
                    style={({ pressed }) => [pressed && { opacity: 0.82 }]}
                  >
                    <AyahArabicKaraokeText
                      plainText={arabicPlain}
                      taggedText={showTajweedColors ? item.textTajweed : undefined}
                      showTajweedColors={showTajweedColors}
                      isDark={isDark}
                      baseStyle={st.mushafAyahTxt}
                      audioFocus={hasLoaded}
                      audioLoading={isLoad}
                    />
                  </Pressable>
                ) : null}
                {effectiveShowReaderTranslit && kirilRead ? (
                  <>
                    <Text style={st.mushafAyahSectionCaption}>{kk.quran.translitCaption}</Text>
                    <Text style={st.mushafAyahKiril}>{kirilRead}</Text>
                  </>
                ) : null}
                {effectiveShowReaderMeaning && kkLine ? (
                  <>
                    <Text style={st.mushafAyahSectionCaption}>{kk.quran.meaningKk}</Text>
                    <Text style={st.mushafAyahKk}>{kkLine}</Text>
                  </>
                ) : null}
                {isAudioFocus ? (
                  <Pressable
                    oyuBackdrop={false}
                    onPress={() => onPressArabic(item.numberInSurah)}
                    disabled={isLoad}
                    accessibilityRole="button"
                    accessibilityState={{ busy: isLoad }}
                    accessibilityLabel={
                      isLoad
                        ? kk.quran.ayahPlaySudaisA11y(item.numberInSurah)
                        : isPlayingNow
                          ? kk.quran.ayahPauseSudaisA11y(item.numberInSurah)
                          : kk.quran.ayahResumeSudaisA11y(item.numberInSurah)
                    }
                    style={({ pressed }) => [st.mushafInlineAudioControl, pressed && { opacity: 0.82 }]}
                  >
                    {isLoad ? null : (
                      <MaterialIcons name={isPlayingNow ? "pause" : "play-arrow"} size={18} color={accentColor} />
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
        ) : (
          <MushafContinuousArabicBlock
            ref={continuousRef}
            ayahs={page.ayahs}
            surahNumber={surahNumber}
            arabicScriptEdition={arabicScriptEdition}
            showReaderArabic={showReaderArabic}
            showTajweedColors={showTajweedColors}
            isDark={isDark}
            playingAyahInSurah={playingAyahInSurah}
            ayahAudioIsPlaying={ayahAudioIsPlaying}
            loadingAyahAudio={loadingAyahAudio}
            resumeHighlightAyah={resumeHighlightAyah}
            ayahMarkers={ayahMarkers}
            mushafAyahTxt={st.mushafAyahTxt}
            bookFitScale={fitScale}
            compactBookPage={compactBookPage}
            toEasternArabicIndic={toEasternArabicIndic}
            scrollViewRef={vScrollRef}
            scrollContentRef={contentRef}
            onAyahTopMeasured={onAyahTopMeasured}
            fallbackScrollYForAyah={fallbackScrollYForAyah}
            accessibilityLabelForAyah={accessibilityLabelForAyah}
            onPressArabic={onPressArabic}
            onLongPressAyah={onLongPressAyah}
          />
        )}
      </View>
    </ScrollView>
  );
}
