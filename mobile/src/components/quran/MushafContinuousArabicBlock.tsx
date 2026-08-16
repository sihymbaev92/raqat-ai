import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { findNodeHandle, Platform, Text, View, type ScrollView, type TextStyle } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { AyahArabicKaraokeText } from "./AyahArabicKaraokeText";
import { MushafAyahSvgMarker } from "./MushafAyahSvgMarker";
import {
  buildQuranArabicFlowMetrics,
  QuranArabicFlowInlineText,
  QuranArabicFlowRoot,
  QuranArabicFlowRow,
  QuranArabicFlowSegment,
} from "./QuranArabicAyahFlow";
import { mushafArabicLineHeightForAyah } from "../../quran/mushafAyahArabicLineHeight";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import { displayCachedAyahArabic, type CachedAyah } from "../../storage/quranSurahCache";
import {
  ensureBundledQuranReaderLoaded,
  isBundledQuranReaderLoaded,
} from "../../services/bundledQuranReader";
import { resolveMushafBookAyah, clearMushafBookAyahResolveCache } from "../../quran/buildMushafPagesGlobal";
import type { MushafBookAyah } from "../../quran/mushafBookTypes";
import { AYAH_MARKER_COLOR_HEX, type AyahMarkerRecord } from "../../storage/quranAyahMarkers";
import { hatimUnifiedAyahMarkerFontSize, hatimUnifiedAyahMarkerHeight } from "../../quran/mushafAyahMarkerStyle";
import {
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import { quranAyahRowStyle, quranHatimBookStreamFlowStyle } from "../../quran/quranResponsiveLayout";
import { ensureHatimBookFontsLoaded, isQuranBookFontsReady } from "../../fonts/quranBookFonts";
import {
  quranArabicAyahStyleForEdition,
  TURKISH_PRINT_HATIM_MEDINA_PARITY,
  TURKISH_PRINT_HATIM_UNIFORM_GLYPH_SIZE,
  TURKISH_PRINT_QF_FIXED_SIZE,
} from "../../quran/quranTurkishPrintTypography";

export type MushafContinuousArabicHandle = {
  scrollToAyah: (ayahInSurah: number, opts?: { animated?: boolean; viewOffset?: number }) => void;
};

type Props = {
  ayahs: (CachedAyah | MushafBookAyah)[];
  surahNumber: number;
  arabicScriptEdition: QuranArabicScriptEditionId;
  showReaderArabic: boolean;
  showTajweedColors: boolean;
  isDark: boolean;
  readingThemeId?: QuranReadingThemeId;
  playingAyahInSurah: number | null;
  ayahAudioIsPlaying: boolean;
  loadingAyahAudio: number | null;
  resumeHighlightAyah: number | null;
  ayahMarkers: Record<string, AyahMarkerRecord>;
  mushafAyahTxt: TextStyle;
  toEasternArabicIndic: (n: number) => string;
  scrollViewRef: React.RefObject<ScrollView | null>;
  scrollContentRef: React.RefObject<View | null>;
  onAyahTopMeasured?: (ayahInSurah: number, topInContent: number) => void;
  bookFitScale?: number;
  compactBookPage?: boolean;
  /** Medina QCF4 viewport-өлшемі: енге байланған scale қолданылмайды. */
  hatimViewportSized?: boolean;
  /** Экран еніне байланған типография — parent pageTextWidth берсе дәлірек. */
  contentWidth?: number;
  /** Түрік Unicode хатым: viewport reader engine (Medina QCF4 slot емес). */
  readerEngine?: boolean;
  readerFontSize?: number;
  readerLineHeight?: number;
  fallbackScrollYForAyah?: (ayahInSurah: number) => number | undefined;
  accessibilityLabelForAyah?: (ayahInSurah: number) => string;
  onPressArabic: (ayahInSurah: number) => void;
  onLongPressAyah: (item: CachedAyah) => void;
};

function resolveAyahItem(raw: CachedAyah | MushafBookAyah): CachedAyah {
  return "surahNumber" in raw && typeof raw.surahNumber === "number"
    ? resolveMushafBookAyah(raw as MushafBookAyah)
    : raw;
}

function ayahHighlightStyle(
  base: TextStyle,
  plain: string,
  isDark: boolean,
  isResume: boolean,
  isPlay: boolean,
  isLoad: boolean,
  uniformLineHeight = false
): TextStyle {
  const baseLh = base.lineHeight;
  const lh =
    uniformLineHeight || typeof baseLh !== "number"
      ? baseLh
      : mushafArabicLineHeightForAyah(baseLh, plain);
  return {
    ...base,
    ...(typeof lh === "number" ? { lineHeight: lh } : null),
    backgroundColor: isResume
      ? isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.05)"
      : isPlay
        ? isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(0,0,0,0.04)"
        : "transparent",
    opacity: isLoad ? 0.72 : 1,
  };
}

function markerHeight(lineHeight: number, compact: boolean, centerFlow: boolean, isDark: boolean): number {
  if (compact || centerFlow) return hatimUnifiedAyahMarkerHeight();
  return isDark
    ? Math.min(40, Math.max(30, lineHeight * 0.68))
    : Math.min(42, Math.max(32, lineHeight * 0.72));
}

/** Мұсаф: барлық аят — бір RTL wrap ағыны (кесілмей, экранға бейімделген). */
export const MushafContinuousArabicBlock = forwardRef<MushafContinuousArabicHandle, Props>(
  function MushafContinuousArabicBlock(
    {
      ayahs,
      surahNumber,
      arabicScriptEdition,
      showReaderArabic,
      showTajweedColors,
      isDark,
      readingThemeId,
      playingAyahInSurah,
      ayahAudioIsPlaying,
      loadingAyahAudio,
      resumeHighlightAyah,
      ayahMarkers,
      mushafAyahTxt,
      toEasternArabicIndic,
      scrollViewRef,
      scrollContentRef,
      onAyahTopMeasured,
      bookFitScale = 1,
      compactBookPage = false,
      hatimViewportSized = false,
      contentWidth: contentWidthProp,
      readerEngine = false,
      readerFontSize,
      readerLineHeight,
      fallbackScrollYForAyah,
      accessibilityLabelForAyah,
      onPressArabic,
      onLongPressAyah,
    }: Props,
    ref
  ) {
    const segmentRefs = useRef<Record<number, View | null>>({});
    const layoutSigRef = useRef("");
    const [measuredWidth, setMeasuredWidth] = useState(contentWidthProp ?? 360);
    const layoutWidth = Math.max(280, contentWidthProp ?? measuredWidth);

    const layoutSig = `${surahNumber}:${arabicScriptEdition}:${showReaderArabic ? 1 : 0}:${ayahs.length}:${
      ayahs[0]?.numberInSurah ?? 0
    }:${ayahs[ayahs.length - 1]?.numberInSurah ?? 0}`;
    if (layoutSigRef.current !== layoutSig) {
      segmentRefs.current = {};
      layoutSigRef.current = layoutSig;
    }

    const scrollToAyah = useCallback(
      (ayahInSurah: number, opts?: { animated?: boolean; viewOffset?: number }) => {
        const animated = opts?.animated !== false;
        const viewOffset = opts?.viewOffset ?? 96;
        const tryScroll = () => {
          const scrollEl = scrollViewRef.current;
          const contentEl = scrollContentRef.current;
          const seg = segmentRefs.current[ayahInSurah];
          if (!scrollEl || !contentEl || !seg) return;
          const contentHandle = findNodeHandle(contentEl);
          if (contentHandle == null) return;
          seg.measureLayout(
            contentHandle,
            (_x, y) => scrollEl.scrollTo({ y: Math.max(0, y - viewOffset), animated }),
            () => {
              const fb = fallbackScrollYForAyah?.(ayahInSurah);
              if (fb != null && Number.isFinite(fb)) {
                scrollEl.scrollTo({ y: Math.max(0, fb - viewOffset * 0.25), animated });
              }
            }
          );
        };
        for (const ms of [0, 100, 260, 480]) setTimeout(tryScroll, ms);
      },
      [fallbackScrollYForAyah, scrollContentRef, scrollViewRef]
    );

    useImperativeHandle(ref, () => ({ scrollToAyah }), [scrollToAyah]);

    const measureSegmentTop = useCallback(
      (ayahInSurah: number) => {
        const contentEl = scrollContentRef.current;
        const seg = segmentRefs.current[ayahInSurah];
        if (!contentEl || !seg || !onAyahTopMeasured) return;
        const contentHandle = findNodeHandle(contentEl);
        if (contentHandle == null) return;
        seg.measureLayout(
          contentHandle,
          (_x, y) => onAyahTopMeasured(ayahInSurah, y),
          () => {
            requestAnimationFrame(() => {
              const contentEl2 = scrollContentRef.current;
              const seg2 = segmentRefs.current[ayahInSurah];
              if (!contentEl2 || !seg2 || !onAyahTopMeasured) return;
              const ch2 = findNodeHandle(contentEl2);
              if (ch2 == null) return;
              seg2.measureLayout(ch2, (_x2, y2) => onAyahTopMeasured(ayahInSurah, y2), () => {});
            });
          }
        );
      },
      [onAyahTopMeasured, scrollContentRef]
    );

    const [bundledTextRev, setBundledTextRev] = useState(0);
    const [turkishFontsReady, setTurkishFontsReady] = useState(
      () => arabicScriptEdition !== "turkish" || Platform.OS === "web"
    );
    useEffect(() => {
      let alive = true;
      const loadBundled = () => {
        if (isBundledQuranReaderLoaded()) {
          clearMushafBookAyahResolveCache();
          setBundledTextRev((v) => v + 1);
          return;
        }
        void ensureBundledQuranReaderLoaded()
          .then(() => {
            if (!alive) return;
            clearMushafBookAyahResolveCache();
            setBundledTextRev((v) => v + 1);
          })
          .catch(() => {});
      };
      loadBundled();
      return () => {
        alive = false;
      };
    }, [arabicScriptEdition]);
    useEffect(() => {
      if (arabicScriptEdition !== "turkish" || Platform.OS === "web") {
        setTurkishFontsReady(true);
        return;
      }
      let alive = true;
      void (async () => {
        const ready = await isQuranBookFontsReady();
        if (!alive) return;
        if (ready) {
          setTurkishFontsReady(true);
          return;
        }
        const loaded = await ensureHatimBookFontsLoaded();
        if (alive) setTurkishFontsReady(loaded);
      })();
      return () => {
        alive = false;
      };
    }, [arabicScriptEdition]);

    if (!showReaderArabic || !ayahs.length) return null;
    if (arabicScriptEdition === "turkish" && !turkishFontsReady && Platform.OS !== "web") return null;
    void bundledTextRev;

    const editionAyahTxt = quranArabicAyahStyleForEdition(mushafAyahTxt, arabicScriptEdition, {
      fontsReady: turkishFontsReady,
    });
    const theme = resolveQuranReadingTheme(readingThemeId);
    const centerFlow = theme.minimalPageChrome || compactBookPage;
    const compactFlow = compactBookPage && centerFlow;
    const turkishPrint = arabicScriptEdition === "turkish";
    const turkishPrintHatim = turkishPrint && compactFlow;
    const turkishMedinaParity = turkishPrint && TURKISH_PRINT_HATIM_MEDINA_PARITY;
    const turkishUniformGlyphs = turkishPrintHatim && TURKISH_PRINT_HATIM_UNIFORM_GLYPH_SIZE;
    const turkishQfFixed = turkishPrint && TURKISH_PRINT_QF_FIXED_SIZE;
    const baseFs = typeof editionAyahTxt.fontSize === "number" ? editionAyahTxt.fontSize : 22;
    const baseLh =
      typeof editionAyahTxt.lineHeight === "number" ? editionAyahTxt.lineHeight : undefined;

    const metrics = buildQuranArabicFlowMetrics(
      readerEngine && readerFontSize != null && readerLineHeight != null
        ? {
            contentWidth: layoutWidth,
            baseFontSize: readerFontSize,
            baseLineHeight: readerLineHeight,
            baseTextStyle: editionAyahTxt,
            ayahScrollStyle: true,
            readerEngine: true,
            parentHandlesHorizontalInset: true,
          }
        : {
            contentWidth: layoutWidth,
            baseFontSize: baseFs,
            baseTextStyle: editionAyahTxt,
            compact: compactFlow,
            fitScale: turkishQfFixed || turkishPrintHatim ? 1 : compactFlow ? bookFitScale : 1,
            fitScaleFloor: turkishQfFixed
              ? 1
              : compactFlow && turkishPrint
                ? 0.45
                : undefined,
            minFontSize:
              turkishQfFixed || turkishUniformGlyphs ? baseFs : compactFlow && turkishPrint ? 14 : undefined,
            skipWidthFactor: hatimViewportSized || turkishQfFixed,
            baseLineHeight: hatimViewportSized || turkishQfFixed ? baseLh : undefined,
            medinaParity: turkishMedinaParity,
            turkishPrintHatim: turkishPrintHatim && !turkishMedinaParity,
            turkishHatimEdge: turkishPrintHatim && !compactBookPage,
            parentHandlesHorizontalInset: compactBookPage && turkishPrintHatim,
            turkishMedinaParity,
            turkishQfFixedSize: turkishQfFixed,
          }
    );

    const markerStroke = theme.markerRingOuter;
    const markerFill = centerFlow ? theme.markerFace : theme.markerAccentFill;
    const markerInk = theme.markerInk;
    const markerH = markerHeight(metrics.lineHeight, compactFlow, centerFlow, isDark);
    const segmentGap =
      compactFlow && arabicScriptEdition === "turkish"
        ? Math.max(1, Math.round(metrics.fontSize * 0.04))
        : compactFlow
          ? Math.max(4, Math.round(metrics.fontSize * 0.2))
          : 8;
    const continuousBookStream = compactBookPage;

    const ayahShowsArab = (item: CachedAyah | MushafBookAyah) => {
      const resolved = resolveAyahItem(item);
      const plain = displayCachedAyahArabic(resolved, arabicScriptEdition);
      return showTajweedColors && (resolved.textTajweed ?? "").includes("[") ? true : Boolean(plain);
    };

    const flowNodes: React.ReactNode[] = [];
    for (let i = 0; i < ayahs.length; i++) {
      const item = resolveAyahItem(ayahs[i]!);
      if (!ayahShowsArab(item)) continue;
      const ayahN = item.numberInSurah;
      const markerKey = `${surahNumber}:${ayahN}`;
      const markerRec = ayahMarkers[markerKey];
      const bookmarkHex = markerRec ? AYAH_MARKER_COLOR_HEX[markerRec.colorId] : null;
      const isResume = resumeHighlightAyah === ayahN;
      const isPlay = playingAyahInSurah === ayahN && ayahAudioIsPlaying;
      const isLoad = loadingAyahAudio === ayahN;
      const plain = displayCachedAyahArabic(item, arabicScriptEdition);
      const highlightStyle = ayahHighlightStyle(
        metrics.baseTextStyle,
        plain,
        isDark,
        isResume,
        isPlay,
        isLoad,
        turkishUniformGlyphs
      );
      const ayahNumberColor = highlightStyle.color ?? metrics.baseTextStyle.color ?? markerInk;

      const ayahEndMarker = `\u2060\uFD3F${toEasternArabicIndic(ayahN)}\uFD3E\u2009`;

      const ayahInlineText = (
        <QuranArabicFlowInlineText
          metrics={metrics}
          highlightStyle={highlightStyle}
          hatimAutoFit={false}
        >
          <AyahArabicKaraokeText
            plainText={plain}
            taggedText={showTajweedColors ? item.textTajweed : undefined}
            showTajweedColors={showTajweedColors}
            isDark={isDark}
            baseStyle={highlightStyle}
            nestedInText
            audioFocus={playingAyahInSurah === ayahN}
            audioLoading={loadingAyahAudio === ayahN}
          />
          {continuousBookStream ? (
            <Text
              style={{
                ...metrics.baseTextStyle,
                fontSize: metrics.fontSize,
                lineHeight: metrics.lineHeight,
                color: markerInk,
              }}
            >
              {ayahEndMarker}
            </Text>
          ) : null}
          {isLoad ? (
            <Text
              style={{
                ...metrics.baseTextStyle,
                fontSize: Math.max(10, metrics.fontSize * 0.55),
                opacity: 0.75,
              }}
            >
              {" …"}
            </Text>
          ) : null}
        </QuranArabicFlowInlineText>
      );

      flowNodes.push(
        <QuranArabicFlowSegment
          key={`ar-${surahNumber}:${ayahN}`}
          segmentRef={(r) => {
            segmentRefs.current[ayahN] = r;
          }}
          onSegmentLayout={() => measureSegmentTop(ayahN)}
          style={
            continuousBookStream
              ? {
                  marginHorizontal: 0,
                  marginBottom: 0,
                  width: "100%",
                  maxWidth: "100%",
                  alignSelf: "stretch",
                  flexShrink: 0,
                }
              : {
                  marginHorizontal: compactFlow ? 1 : 2,
                  marginBottom: centerFlow
                    ? arabicScriptEdition === "turkish"
                      ? Math.max(1, Math.round(segmentGap * 0.5))
                      : Math.max(2, Math.round(segmentGap * 0.5))
                    : segmentGap,
                  width: "100%",
                  maxWidth: "100%",
                  alignSelf: "stretch",
                }
          }
        >
          <Pressable
            oyuBackdrop={false}
            onPress={() => onPressArabic(ayahN)}
            onLongPress={() => onLongPressAyah(item)}
            delayLongPress={380}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabelForAyah?.(ayahN)}
            accessibilityState={{ busy: isLoad }}
            style={
              continuousBookStream
                ? {
                    width: "100%",
                    maxWidth: "100%",
                    alignSelf: "stretch",
                    flexShrink: 0,
                    overflow: "visible",
                  }
                : quranAyahRowStyle()
            }
          >
            {ayahInlineText}
            {!continuousBookStream ? (
              <MushafAyahSvgMarker
                label={toEasternArabicIndic(ayahN)}
                stroke={markerStroke}
                fill={markerFill}
                textColor={ayahNumberColor}
                height={markerH}
                numberFontSize={centerFlow || compactFlow ? hatimUnifiedAyahMarkerFontSize() : undefined}
                variant={centerFlow ? "qcom" : "default"}
              />
            ) : null}
            {bookmarkHex ? (
              <Text
                style={{
                  color: bookmarkHex,
                  fontSize: Math.max(11, metrics.fontSize * 0.58),
                  fontWeight: "800",
                  alignSelf: "center",
                }}
              >
                ●
              </Text>
            ) : null}
          </Pressable>
        </QuranArabicFlowSegment>
      );
    }

    return (
      <QuranArabicFlowRoot
        metrics={metrics}
        compactFlex={compactFlow && !turkishPrintHatim}
        onLayoutWidth={contentWidthProp ? undefined : setMeasuredWidth}
      >
        <QuranArabicFlowRow
          style={continuousBookStream ? quranHatimBookStreamFlowStyle() : undefined}
          onFlowLayout={() => {
            for (const a of ayahs) {
              if (ayahShowsArab(a)) measureSegmentTop(a.numberInSurah);
            }
          }}
        >
          {flowNodes}
        </QuranArabicFlowRow>
      </QuranArabicFlowRoot>
    );
  }
);
