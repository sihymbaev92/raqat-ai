import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { findNodeHandle, Text, View, type ScrollView, type TextStyle } from "react-native";
import { Pressable } from "@/ui/Pressable";
import { AyahArabicKaraokeText } from "./AyahArabicKaraokeText";
import { MushafAyahSvgMarker } from "./MushafAyahSvgMarker";
import { mushafArabicLineHeightForAyah } from "../../quran/mushafAyahArabicLineHeight";
import { quranArabicNoClipTextStyle } from "../../quran/quranArabicNoClipTextStyle";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import { displayCachedAyahArabic, type CachedAyah } from "../../storage/quranSurahCache";
import {
  ensureBundledQuranReaderLoaded,
  isBundledQuranReaderLoaded,
} from "../../services/bundledQuranReader";
import { resolveMushafBookAyah } from "../../quran/buildMushafPagesGlobal";
import type { MushafBookAyah } from "../../quran/mushafBookTypes";
import { AYAH_MARKER_COLOR_HEX, type AyahMarkerRecord } from "../../storage/quranAyahMarkers";
import {
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import { tajweedColorForRule } from "../../content/tajweedRulesCatalog";
import {
  parseAlquranTajweedTaggedText,
  type TajweedRuleKey,
} from "../../utils/alquranTajweedParse";

/**
 * Аят арасындағы бос орын — кітап мұсафындағы үзіліс (RTL; View-қатарда кеңістік ретінде қолданылады).
 */
const MUSHAF_INTER_AYAH_GAP_DEFAULT = 10;
/** Quran.com: аят арасы (RTL ағыны — columnGap / rowGap). Көзге ыңғайлы оқу үшін кеңірек. */
const MUSHAF_INTER_AYAH_GAP_QCOM = 18;

type TajweedFlowWordPart = { text: string; rule?: TajweedRuleKey };
type TajweedFlowWord = { text: string; parts: TajweedFlowWordPart[] };

function tajweedFlowWords(taggedText: string | null | undefined): TajweedFlowWord[] {
  const raw = (taggedText ?? "").trim();
  if (!raw.includes("[")) return [];

  const out: TajweedFlowWord[] = [];
  let parts: TajweedFlowWordPart[] = [];
  let text = "";

  const flush = () => {
    if (!text.trim()) {
      parts = [];
      text = "";
      return;
    }
    out.push({ text, parts });
    parts = [];
    text = "";
  };

  for (const segment of parseAlquranTajweedTaggedText(raw)) {
    for (const chunk of segment.text.split(/(\s+)/u)) {
      if (!chunk) continue;
      if (/^\s+$/u.test(chunk)) {
        flush();
        continue;
      }
      parts.push(segment.rule ? { text: chunk, rule: segment.rule } : { text: chunk });
      text += chunk;
    }
  }
  flush();

  return out;
}

export type MushafContinuousArabicHandle = {
  scrollToAyah: (ayahInSurah: number, opts?: { animated?: boolean; viewOffset?: number }) => void;
};

type Props = {
  ayahs: (CachedAyah | MushafBookAyah)[];
  surahNumber: number;
  /** Көрсетілетін араб жолы (Мадина немесе түрік Unicode). */
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
  /** Аят үстінің scrollY (ішкі контент координатасы) — футер/last-read үшін */
  onAyahTopMeasured?: (ayahInSurah: number, topInContent: number) => void;
  /** Түрік Unicode баспасын кітап бетіне сыйғызу үшін мәтін ағынын ғана ықшамдау. */
  bookFitScale?: number;
  compactBookPage?: boolean;
  /** measureLayout сәтсіз болса scrollTo үшін шамаман Y */
  fallbackScrollYForAyah?: (ayahInSurah: number) => number | undefined;
  accessibilityLabelForAyah?: (ayahInSurah: number) => string;
  onPressArabic: (ayahInSurah: number) => void;
  onLongPressAyah: (item: CachedAyah) => void;
};

function segmentArabicStyle(
  mushafAyahTxt: TextStyle,
  plain: string,
  isDark: boolean,
  isResume: boolean,
  isPlay: boolean,
  isLoad: boolean
): TextStyle {
  const baseLh = mushafAyahTxt.lineHeight;
  const lh =
    typeof baseLh === "number" ? mushafArabicLineHeightForAyah(baseLh, plain) : baseLh;
  return quranArabicNoClipTextStyle({
    ...mushafAyahTxt,
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
  });
}

/** Мұсаф скролл: барлық аят арабы бір үздіксін RTL мәтінде (кітап ағыны). */
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
      fallbackScrollYForAyah,
      accessibilityLabelForAyah,
      onPressArabic,
      onLongPressAyah,
    }: Props,
    ref
  ) {
    const segmentRefs = useRef<Record<number, View | null>>({});
    const layoutSigRef = useRef("");
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
            (_x, y) => {
              scrollEl.scrollTo({ y: Math.max(0, y - viewOffset), animated });
            },
            () => {
              const fb = fallbackScrollYForAyah?.(ayahInSurah);
              if (fb != null && Number.isFinite(fb)) {
                scrollEl.scrollTo({ y: Math.max(0, fb - viewOffset * 0.25), animated });
              }
            }
          );
        };

        const delays = [0, 100, 260, 480];
        for (const ms of delays) {
          setTimeout(tryScroll, ms);
        }
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
          (_x, y) => {
            onAyahTopMeasured(ayahInSurah, y);
          },
          () => {
            requestAnimationFrame(() => {
              const contentEl2 = scrollContentRef.current;
              const seg2 = segmentRefs.current[ayahInSurah];
              if (!contentEl2 || !seg2 || !onAyahTopMeasured) return;
              const ch2 = findNodeHandle(contentEl2);
              if (ch2 == null) return;
              seg2.measureLayout(
                ch2,
                (_x2, y2) => {
                  onAyahTopMeasured(ayahInSurah, y2);
                },
                () => {}
              );
            });
          }
        );
      },
      [onAyahTopMeasured, scrollContentRef]
    );

    const [bundledTextRev, setBundledTextRev] = useState(0);
    useEffect(() => {
      if (isBundledQuranReaderLoaded()) return;
      let alive = true;
      void ensureBundledQuranReaderLoaded()
        .then(() => {
          if (alive) setBundledTextRev((v) => v + 1);
        })
        .catch(() => {});
      return () => {
        alive = false;
      };
    }, []);

    if (!showReaderArabic || !ayahs.length) return null;
    void bundledTextRev;

    const baseFs = typeof mushafAyahTxt.fontSize === "number" ? mushafAyahTxt.fontSize : 22;
    const baseLh = typeof mushafAyahTxt.lineHeight === "number" ? mushafAyahTxt.lineHeight : 34;
    const theme = resolveQuranReadingTheme(readingThemeId);
    const centerFlow = theme.minimalPageChrome || compactBookPage;
    const compactFlow = compactBookPage && centerFlow;
    const fitScale = compactFlow ? Math.min(1, Math.max(0.58, bookFitScale)) : 1;
    const fs = compactFlow ? Math.max(17, Math.round(baseFs * fitScale)) : baseFs;
    const lh = compactFlow
      ? Math.max(Math.round(fs * 1.34), Math.round(baseLh * fitScale * 0.78))
      : baseLh;
    const effectiveMushafAyahTxt: TextStyle =
      compactFlow
        ? {
            ...quranArabicNoClipTextStyle(
              {
                ...mushafAyahTxt,
                fontSize: fs,
                lineHeight: lh,
                letterSpacing: 0,
              },
              { compact: true }
            ),
          }
        : mushafAyahTxt;

    const ayahShowsArab = (item: CachedAyah | MushafBookAyah) => {
      const resolved =
        "surahNumber" in item && typeof item.surahNumber === "number"
          ? resolveMushafBookAyah(item as MushafBookAyah)
          : item;
      const plain = displayCachedAyahArabic(resolved, arabicScriptEdition);
      return showTajweedColors && (resolved.textTajweed ?? "").includes("[")
        ? true
        : Boolean(plain);
    };

    const flowLineHeight = Math.round(lh * (centerFlow ? (compactFlow ? 1 : 1.08) : 1.04));
    const markerStroke = theme.markerRingOuter;
    const markerFill = centerFlow ? theme.markerFace : theme.markerAccentFill;
    const markerInk = theme.markerInk;
    const interAyahGap = centerFlow
      ? compactFlow
        ? Math.max(3, Math.round(MUSHAF_INTER_AYAH_GAP_QCOM * fitScale * 0.34))
        : MUSHAF_INTER_AYAH_GAP_QCOM
      : MUSHAF_INTER_AYAH_GAP_DEFAULT;
    const centerFlowInset = centerFlow ? (compactFlow ? 2 : Math.max(6, Math.round(fs * 0.2))) : 0;
    // Tajweed coloring already splits text into nested colored spans; splitting
    // again by word makes Hatim pages look scattered. Keep each ayah together.
    const useWordFlow = centerFlow && !showTajweedColors;
    const markerH = Math.round(
      compactFlow
        ? Math.min(22, Math.max(16, lh * 0.46))
        : centerFlow
          ? Math.min(28, Math.max(22, lh * 0.42))
        : isDark
          ? Math.min(40, Math.max(30, lh * 0.68))
          : Math.min(42, Math.max(32, lh * 0.72))
    );

    if (useWordFlow) {
      const flowItems: React.ReactNode[] = [];
      for (let i = 0; i < ayahs.length; i++) {
        const raw = ayahs[i]!;
        const item =
          "surahNumber" in raw && typeof raw.surahNumber === "number"
            ? resolveMushafBookAyah(raw as MushafBookAyah)
            : raw;
        if (!ayahShowsArab(item)) continue;
        const ayahN = item.numberInSurah;
        const isResume = resumeHighlightAyah === ayahN;
        const isPlay = playingAyahInSurah === ayahN && ayahAudioIsPlaying;
        const isLoad = loadingAyahAudio === ayahN;
        const plain = displayCachedAyahArabic(item, arabicScriptEdition);
        const arabicStyle = segmentArabicStyle(
          effectiveMushafAyahTxt,
          plain,
          isDark,
          isResume,
          isPlay,
          isLoad
        );
        const safeWordLineHeight =
          typeof arabicStyle.lineHeight === "number"
            ? Math.max(arabicStyle.lineHeight, flowLineHeight)
            : flowLineHeight;
        const wordStyle: TextStyle = {
          ...arabicStyle,
          textAlign: "right",
          lineHeight: safeWordLineHeight,
        };
        const ayahNumberColor = arabicStyle.color ?? effectiveMushafAyahTxt.color ?? markerInk;
        const coloredWords = showTajweedColors ? tajweedFlowWords(item.textTajweed) : [];
        const words: Array<string | TajweedFlowWord> = coloredWords.length
          ? coloredWords
          : plain.split(/\s+/).filter(Boolean);
        for (let wi = 0; wi < words.length; wi++) {
          const word = words[wi]!;
          flowItems.push(
            <Pressable
              key={`w-${surahNumber}:${ayahN}:${wi}`}
              oyuBackdrop={false}
              onPress={() => onPressArabic(ayahN)}
              onLongPress={() => onLongPressAyah(item)}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabelForAyah?.(ayahN)}
              accessibilityState={{ busy: isLoad }}
              style={{
                marginHorizontal: compactFlow ? 1 : Math.max(1, Math.round(fs * 0.06)),
                marginBottom: compactFlow ? 1 : Math.max(3, Math.round(safeWordLineHeight * 0.08)),
              }}
            >
              <Text style={wordStyle} suppressHighlighting>
                {typeof word === "string"
                  ? word
                  : word.parts.map((part, pi) => (
                      <Text
                        key={`tj-${surahNumber}:${ayahN}:${wi}:${pi}`}
                        style={[
                          wordStyle,
                          part.rule ? { color: tajweedColorForRule(part.rule, isDark) } : null,
                        ]}
                      >
                        {part.text}
                      </Text>
                    ))}
              </Text>
            </Pressable>
          );
        }
        flowItems.push(
          <Pressable
            key={`m-${surahNumber}:${ayahN}`}
            oyuBackdrop={false}
            onPress={() => onPressArabic(ayahN)}
            onLongPress={() => onLongPressAyah(item)}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabelForAyah?.(ayahN)}
            accessibilityState={{ busy: isLoad }}
            style={{
              marginHorizontal: compactFlow ? 1 : Math.max(1, Math.round(fs * 0.05)),
              marginBottom: compactFlow ? 1 : Math.max(4, Math.round(safeWordLineHeight * 0.12)),
              alignSelf: "center",
            }}
          >
            <MushafAyahSvgMarker
              label={toEasternArabicIndic(ayahN)}
              stroke={markerStroke}
              fill={markerFill}
              textColor={ayahNumberColor}
              height={markerH}
              variant="qcom"
            />
          </Pressable>
        );
      }

      return (
        <View
          style={{
            alignSelf: "stretch",
            width: "100%",
            flexDirection: "row-reverse",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingHorizontal: centerFlowInset,
            direction: "rtl",
          }}
        >
          {flowItems}
        </View>
      );
    }

    const segments: React.ReactNode[] = [];
    for (let i = 0; i < ayahs.length; i++) {
      const raw = ayahs[i]!;
      const item =
        "surahNumber" in raw && typeof raw.surahNumber === "number"
          ? resolveMushafBookAyah(raw as MushafBookAyah)
          : raw;
      if (!ayahShowsArab(item)) continue;
      const ayahN = item.numberInSurah;
      const markerKey = `${surahNumber}:${ayahN}`;
      const markerRec = ayahMarkers[markerKey];
      const bookmarkHex = markerRec ? AYAH_MARKER_COLOR_HEX[markerRec.colorId] : null;
      const isResume = resumeHighlightAyah === ayahN;
      const isPlay = playingAyahInSurah === ayahN && ayahAudioIsPlaying;
      const isLoad = loadingAyahAudio === ayahN;
      const plain = displayCachedAyahArabic(item, arabicScriptEdition);
      const arabicStyle = segmentArabicStyle(
        effectiveMushafAyahTxt,
        plain,
        isDark,
        isResume,
        isPlay,
        isLoad
      );
      const ayahNumberColor = arabicStyle.color ?? effectiveMushafAyahTxt.color ?? markerInk;

      segments.push(
        <View
          key={`ar-${surahNumber}:${ayahN}`}
          ref={(r) => {
            segmentRefs.current[ayahN] = r;
          }}
          onLayout={() => {
            measureSegmentTop(ayahN);
          }}
          collapsable={false}
          style={{
            maxWidth: "100%",
            width: centerFlow ? "100%" : undefined,
            alignSelf: centerFlow ? "stretch" : undefined,
            flexShrink: centerFlow ? 0 : 0,
            flexGrow: 0,
            marginBottom: centerFlow
              ? Math.max(7, Math.round(interAyahGap * 0.6))
              : Math.max(4, Math.round(interAyahGap * 0.5)),
          }}
        >
          <Pressable
            oyuBackdrop={false}
            onPress={() => onPressArabic(ayahN)}
            onLongPress={() => onLongPressAyah(item)}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabelForAyah?.(ayahN)}
            accessibilityState={{ busy: isLoad }}
            style={{
              flexDirection: "row",
              direction: "rtl",
              flexWrap: centerFlow ? "wrap" : "nowrap",
              alignItems: centerFlow ? "stretch" : "flex-start",
              justifyContent: "flex-start",
              width: centerFlow ? "100%" : undefined,
              alignSelf: centerFlow ? "stretch" : undefined,
              maxWidth: "100%",
              minWidth: 0,
            }}
          >
            <Text
              style={[
                arabicStyle,
                {
                  flexShrink: 0,
                  width: centerFlow ? "100%" : undefined,
                  minWidth: 0,
                  maxWidth: "100%",
                  textAlign: centerFlow ? "justify" : arabicStyle.textAlign,
                  ...(centerFlow ? ({ textAlignLast: "justify" } as TextStyle) : null),
                },
              ]}
              suppressHighlighting
            >
              <AyahArabicKaraokeText
                plainText={plain}
                taggedText={showTajweedColors ? item.textTajweed : undefined}
                showTajweedColors={showTajweedColors}
                isDark={isDark}
                baseStyle={arabicStyle}
                audioFocus={playingAyahInSurah === ayahN}
                audioLoading={loadingAyahAudio === ayahN}
              />
              {isLoad ? (
                <Text style={{ ...effectiveMushafAyahTxt, fontSize: Math.max(10, fs * 0.55), opacity: 0.75 }}> …</Text>
              ) : null}
            </Text>
            <MushafAyahSvgMarker
              label={toEasternArabicIndic(ayahN)}
              stroke={markerStroke}
              fill={markerFill}
              textColor={ayahNumberColor}
              height={markerH}
              variant={centerFlow ? "qcom" : "default"}
            />
            {bookmarkHex ? (
              <Text
                style={{
                  color: bookmarkHex,
                  fontSize: Math.max(11, fs * 0.58),
                  fontWeight: "800",
                  marginTop: Math.round(markerH * 0.12),
                  marginLeft: 2,
                }}
              >
                ●
              </Text>
            ) : null}
          </Pressable>
        </View>
      );

    }

    return (
      <View
        style={{
          alignSelf: "stretch",
          flexDirection: "row",
          flexWrap: "wrap",
          direction: "rtl",
          justifyContent: "flex-start",
          columnGap: centerFlow ? undefined : interAyahGap,
          rowGap: centerFlow
            ? Math.max(8, Math.round(interAyahGap * 0.9))
            : Math.max(6, Math.round(interAyahGap * 0.75)),
        }}
        onLayout={() => {
          for (const a of ayahs) {
            if (ayahShowsArab(a)) measureSegmentTop(a.numberInSurah);
          }
        }}
      >
        {segments}
      </View>
    );
  }
);
