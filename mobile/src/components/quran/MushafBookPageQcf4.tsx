import React, { useEffect, useMemo, useState } from "react";
import { Platform, ScrollView, View, Text } from "react-native";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import type { MushafBookPageSlice, MushafAyahRef } from "../../quran/mushafBookTypes";
import type { MushafBookPageStyles } from "../../quran/mushafBookPageStyles";
import { loadQcf4Page } from "../../quran/loadQcf4Page";
import type { Qcf4PageJson, Qcf4Word } from "../../quran/qcf4Types";
import { parseVerseKey } from "../../quran/qcf4Types";
import { ensureQcf4FontsLoaded, qcf4FontFamilyName } from "../../quran/qcf4FontLoader";
import {
  MUSHAF_BOOK_NATIVE_HATIM_INNER_SIDE_INSET,
  MUSHAF_BOOK_PAGE_EDGE_INSET,
  computeMushafBookPageBox,
} from "../../quran/mushafBookPageLayout";
import {
  QCF4_EXTERNAL_SURAH_FRAME_RESERVE,
  QCF4_PHONE_GLYPH_SCALE_QCOM,
  QCF4_PHONE_GLYPH_MAX_QCOM,
  QCF4_PHONE_LINE_PADDING,
  QCF4_PHONE_LINE_SCALE_X,
  QCF4_PHONE_NATIVE_SAFE_INSET,
  QCF4_PHONE_VERTICAL_SAFE_PADDING,
  QCF4_PHONE_VERTICAL_STRETCH_FACTOR,
  QCF4_PHONE_WEB_SAFE_INSET,
  QCF4_RENDER_LINE_COUNT,
  buildQcf4RenderableLines,
  computeQcf4LineMetrics,
  qcf4MetricLineCount,
  qcf4SafeGlyphSizeForLine,
  shouldRenderQcf4InlineSurahFrame,
} from "../../quran/mushafQcf4Layout";
import type { CachedAyah } from "../../storage/quranSurahCache";
import type { AyahMarkerRecord } from "../../storage/quranAyahMarkers";
import { MushafBookPageSecondaryAyahs } from "./MushafBookPageSecondaryAyahs";
import { MushafBookPageChrome } from "./MushafBookPageChrome";
import { MushafSurahHeader } from "./MushafSurahHeader";
import { MushafAyahSvgMarker } from "./MushafAyahSvgMarker";
import { useQuranKaraokeWordIndex } from "../../context/quranKaraokeSync";
import { surahArabicBannerTitle } from "../../data/surahArabicTitles";
import {
  resolveQuranReadingTheme,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import { surahAyahToGlobalOneBased } from "../../data/quranAyahCounts";
import { hizbForGlobalAyahOneBased } from "../../data/quranHizbBoundaries";
import { MushafBookFooter } from "./MushafBookFooter";
import { kk } from "../../i18n/kk";
import { QURAN_BOOK_FONT_FACE, loadQuranBookFonts } from "../../fonts/quranBookFonts";
import {
  QCF4_AYAH_MARKER_BLUE,
  QCF4_AYAH_MARKER_FACE,
  qcf4AyahMarkerHeight,
  qcf4AyahMarkerTextColorForPage,
} from "../../quran/mushafAyahMarkerStyle";
import {
  tajweedRuleForWordGlyph,
  type TajweedRuleKey,
} from "../../utils/alquranTajweedParse";
import { tajweedColorForRule } from "../../content/tajweedRulesCatalog";

/** 15 жолдық торда барлық аят glyph-тері бір тұрақты өлшеммен тұрсын. */
const QCF4_GLYPH_SCALE_QCOM = 0.72;
/** Glyph кесілмей, қатар арасы ашық қалуы үшін шағын қосымша өлшем. */
const QCF4_GLYPH_EXTRA_QCOM = 0;
/** Қаріптің үсті/асты қиылып қалмауы үшін Text lineHeight-қа қауіпсіз коэффициент. */
const QCF4_GLYPH_LINE_HEIGHT_SCALE_QCOM = 1.46;
const QCF4_NATIVE_GLYPH_VISUAL_SCALE_Y = 1.04;
const QCF4_NATIVE_LINE_INNER_PADDING = 2;
/** Жоғарғы джуз/бет жолы. */
const QCF4_CHROME_JUZ_RESERVE = 28;
/** Жүз/бет қатары мен сүре рамкасы арасын сәл жақындату. */
const QCF4_EXTERNAL_SURAH_FRAME_TOP_TIGHTEN = 6;
const QCF4_READABLE_WEB_FONT =
  `"${QURAN_BOOK_FONT_FACE.scheherazade}", "Scheherazade New", "${QURAN_BOOK_FONT_FACE.lateef}", Lateef, serif`;
const QCF4_TAJWEED_FETCH_TIMEOUT_MS = 14_000;

type Props = {
  page: MushafBookPageSlice;
  pagerWidth: number;
  /** Pager (көрінетін аумақ) биіктігі — бет 1 экранға дәл сиюы үшін. */
  viewportHeight?: number;
  paddingBottom: number;
  colors: ThemeColors;
  isDark?: boolean;
  styles: MushafBookPageStyles;
  readingThemeId?: QuranReadingThemeId;
  /** Тек көрінетін ±1 бет QCF4 JSON/қаріп жүктейді (604 FlatList freeze болдырмау). */
  isActive?: boolean;
  showReaderMeaning: boolean;
  showReaderTranslit: boolean;
  showTajweedColors?: boolean;
  mushafTextScale?: number;
  playingRef: MushafAyahRef | null;
  ayahAudioIsPlaying: boolean;
  loadingAyahAudio: MushafAyahRef | null;
  resumeHighlight: MushafAyahRef | null;
  ayahMarkers: Record<string, AyahMarkerRecord>;
  onPressAyah: (ref: MushafAyahRef, item: CachedAyah) => void;
  onLongPressAyah: (ref: MushafAyahRef, item: CachedAyah) => void;
  onToggleAudio: (ref: MushafAyahRef, item: CachedAyah) => void;
  onLoadFailed?: () => void;
  surahScope?: number | null;
};

function findAyahItem(page: MushafBookPageSlice, surah: number, ayah: number): CachedAyah | null {
  const row = page.ayahs.find((a) => a.surahNumber === surah && a.numberInSurah === ayah);
  return row ?? null;
}

function wordAyahRef(word: Qcf4Word): MushafAyahRef | null {
  if (!word.verse_key || word.type === "end" || word.type === "surah_header") return null;
  const parsed = parseVerseKey(word.verse_key);
  return parsed;
}

function wordHighlighted(
  word: Qcf4Word,
  playingRef: MushafAyahRef | null,
  loadingAyahAudio: MushafAyahRef | null,
  resumeHighlight: MushafAyahRef | null,
  ayahAudioIsPlaying: boolean
): boolean {
  const ref = wordAyahRef(word);
  if (!ref) return false;
  if (loadingAyahAudio?.surah === ref.surah && loadingAyahAudio.ayah === ref.ayah) return true;
  if (resumeHighlight?.surah === ref.surah && resumeHighlight.ayah === ref.ayah) return true;
  return (
    playingRef?.surah === ref.surah && playingRef.ayah === ref.ayah && ayahAudioIsPlaying
  );
}

function wordPlayingRefKey(ref: MushafAyahRef): string {
  return `${ref.surah}:${ref.ayah}`;
}

function shouldShowBismillah(surah: number, firstAyah: number): boolean {
  if (firstAyah !== 1) return false;
  if (surah === 9 || surah === 1) return false;
  return true;
}

function hasArabicScript(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u.test(text);
}

function qcf4ReadableText(word: Qcf4Word): string {
  const text = word.text?.trim();
  if (text && !/^V\d+$/i.test(text) && hasArabicScript(text)) return word.text;
  if (text && /^[A-Za-z]+$/u.test(text)) return "";
  return word.char;
}

function qcf4AyahMarkerNumber(word: Qcf4Word): string {
  const ref = word.verse_key ? parseVerseKey(word.verse_key) : null;
  const value = ref?.ayah ?? word.text?.replace(/^V/i, "") ?? "";
  return String(value).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)] ?? d);
}

function qcf4SurahHeaderTitle(lineWords: readonly Qcf4Word[]): string | null {
  const header = lineWords.find((word) => word.type === "surah_header" && word.sura != null);
  if (!header?.sura) return null;
  return surahArabicBannerTitle(header.sura) || null;
}

function qcf4TajweedUrl(surah: number): string {
  return `https://api.alquran.cloud/v1/surah/${surah}/quran-tajweed`;
}

async function fetchQcf4TajweedMap(surah: number): Promise<Record<number, string> | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), QCF4_TAJWEED_FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(qcf4TajweedUrl(surah), { signal: ctrl.signal });
    if (!res.ok) return null;
    const body = (await res.json()) as { code?: number; data?: { ayahs?: unknown[] } };
    if (body.code !== 200 || !Array.isArray(body.data?.ayahs)) return null;
    const out: Record<number, string> = {};
    for (const raw of body.data.ayahs) {
      const ayah = raw as { numberInSurah?: number; text?: string };
      const n = typeof ayah.numberInSurah === "number" ? ayah.numberInSurah : NaN;
      const text = (ayah.text ?? "").trim();
      if (Number.isFinite(n) && text.includes("[")) out[n] = text;
    }
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Hafs 604 QCF4 — Madinah glyph JSON + page fonts (offline-friendly CDN). */
export function MushafBookPageQcf4({
  page,
  pagerWidth,
  viewportHeight,
  paddingBottom,
  colors,
  isDark = false,
  styles: st,
  readingThemeId,
  isActive = true,
  showReaderMeaning,
  showReaderTranslit,
  showTajweedColors = false,
  mushafTextScale = 1,
  playingRef,
  ayahAudioIsPlaying,
  loadingAyahAudio,
  resumeHighlight,
  onPressAyah,
  onLongPressAyah,
  onToggleAudio,
  onLoadFailed,
  surahScope = null,
}: Props) {
  const [qcfPage, setQcfPage] = useState<Qcf4PageJson | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [localTajweedByAyah, setLocalTajweedByAyah] = useState<Record<string, string>>({});

  const theme = resolveQuranReadingTheme(readingThemeId);
  const minimalChrome = theme.minimalPageChrome;
  const fitOneScreen = minimalChrome && viewportHeight != null && viewportHeight > 0;
  const isWebPhone = Platform.OS === "web" && pagerWidth <= 520;
  const isNativePhone = Platform.OS !== "web" && pagerWidth <= 520;
  const isPhoneQcf4Page = isWebPhone || isNativePhone;
  const phoneSafeInset =
    minimalChrome && isWebPhone
      ? QCF4_PHONE_WEB_SAFE_INSET
      : minimalChrome && isNativePhone
        ? QCF4_PHONE_NATIVE_SAFE_INSET
      : minimalChrome && Platform.OS !== "web"
        ? MUSHAF_BOOK_NATIVE_HATIM_INNER_SIDE_INSET
        : 0;
  const { pageWidth, pageHeight } = computeMushafBookPageBox(
    pagerWidth,
    viewportHeight,
    paddingBottom,
    fitOneScreen,
    fitOneScreen
      ? {
          allowVerticalOverflow: isPhoneQcf4Page,
          horizontalSafeInset: phoneSafeInset,
          maxVerticalStretchFactor: isPhoneQcf4Page
            ? QCF4_PHONE_VERTICAL_STRETCH_FACTOR
            : undefined,
        }
      : undefined
  );
  const firstAyah = page.ayahs[0];
  const chromeSurah = firstAyah?.surahNumber ?? 1;
  const chromeAyah = firstAyah?.numberInSurah ?? 1;
  const qcfTopSurahHeader =
    qcfPage?.lines
      .find((line) => line.line === 1)
      ?.words.find((word) => word.type === "surah_header")?.sura ?? null;
  const topSurahStart = chromeAyah === 1 ? chromeSurah : qcfTopSurahHeader;
  const showSurahFrame = minimalChrome && topSurahStart != null;
  const showBism = showSurahFrame && shouldShowBismillah(topSurahStart ?? chromeSurah, 1);
  const titleAr = showSurahFrame ? surahArabicBannerTitle(topSurahStart ?? chromeSurah) : null;
  /** Quran.com: бір экран = бір Hafs бет; 15 QCF4 жолы бұзылмайды. */
  const qcomPurePage = minimalChrome && fitOneScreen;
  const useExternalSurahFrame = qcomPurePage && showSurahFrame && Boolean(titleAr);
  const externalSurahFrameLine = useExternalSurahFrame ? 1 : null;
  const hideSurahHeaderGlyph = useExternalSurahFrame || (!qcomPurePage && showSurahFrame);
  const hideBismillahGlyph = !qcomPurePage && showBism;
  const chromeReserve = fitOneScreen && qcomPurePage ? QCF4_CHROME_JUZ_RESERVE : 0;
  const surahFrameReserve =
    fitOneScreen && useExternalSurahFrame ? QCF4_EXTERNAL_SURAH_FRAME_RESERVE : 0;
  const linesAreaH = fitOneScreen
    ? Math.max(80, pageHeight - chromeReserve - surahFrameReserve)
    : Math.max(80, pageHeight);
  const phoneVerticalSafePadding =
    qcomPurePage && isPhoneQcf4Page ? QCF4_PHONE_VERTICAL_SAFE_PADDING : 0;
  const lineMetricsAreaH = Math.max(80, linesAreaH - phoneVerticalSafePadding * 2);
  const qcomTitleInk = isDark ? "#FFFFFF" : (st.mushafAyahTxt.color ?? "#111111");
  const karaokeWordIndex = useQuranKaraokeWordIndex(Boolean(playingRef && ayahAudioIsPlaying));

  useEffect(() => {
    if (!isActive) return;
    let alive = true;
    setLoadErr(false);
    setFontsReady(false);
    void (async () => {
      try {
        const json = await loadQcf4Page(page.mushafPageNumber);
        if (!alive) return;
        if (!json) {
          setLoadErr(true);
          setQcfPage(null);
          onLoadFailed?.();
          return;
        }
        setQcfPage(json);
        const fontIds = new Set<string>();
        for (const line of json.lines) {
          for (const w of line.words) fontIds.add(w.font);
        }
        fontIds.add(json.font);
        if (Platform.OS === "web") {
          await loadQuranBookFonts().catch(() => undefined);
          const fontsOk = await ensureQcf4FontsLoaded([...fontIds]).catch(() => false);
          if (!alive) return;
          setFontsReady(fontsOk);
          return;
        }
        const fontsOk = await ensureQcf4FontsLoaded([...fontIds]);
        if (!alive) return;
        if (!fontsOk) {
          setLoadErr(true);
          setQcfPage(null);
          onLoadFailed?.();
          return;
        }
        setFontsReady(true);
      } catch {
        if (!alive) return;
        setLoadErr(true);
        setQcfPage(null);
        onLoadFailed?.();
      }
    })();
    return () => {
      alive = false;
    };
  }, [page.mushafPageNumber, isActive, onLoadFailed]);

  useEffect(() => {
    if (!isActive || !showTajweedColors) return;
    const missingSurahs = Array.from(
      new Set(
        page.ayahs
          .filter((ayah) => {
            const key = `${ayah.surahNumber}:${ayah.numberInSurah}`;
            return !((ayah.textTajweed ?? localTajweedByAyah[key] ?? "").trim().includes("["));
          })
          .map((ayah) => ayah.surahNumber)
      )
    );
    if (!missingSurahs.length) return;

    let alive = true;
    for (const surah of missingSurahs) {
      void (async () => {
        const map = await fetchQcf4TajweedMap(surah);
        if (!alive || !map) return;
        setLocalTajweedByAyah((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [ayah, text] of Object.entries(map)) {
            const key = `${surah}:${ayah}`;
            if (next[key] === text) continue;
            next[key] = text;
            changed = true;
          }
          return changed ? next : prev;
        });
      })();
    }
    return () => {
      alive = false;
    };
  }, [isActive, localTajweedByAyah, page.ayahs, showTajweedColors]);

  const renderLines = useMemo(
    () =>
      buildQcf4RenderableLines(qcfPage, {
        hideSurahHeaderGlyph,
        hideBismillahGlyph,
        useExternalSurahFrame,
        externalSurahFrameLine,
        omitQuarterGlyph: Platform.OS === "web",
      }),
    [externalSurahFrameLine, hideBismillahGlyph, hideSurahHeaderGlyph, qcfPage, useExternalSurahFrame]
  );
  const renderLineCount = Math.max(1, renderLines.length || QCF4_RENDER_LINE_COUNT);
  const metricLineCount = qcf4MetricLineCount(renderLineCount);
  const sparseQcf4Page = metricLineCount > renderLineCount;
  const { lineGap, lineHeight } = computeQcf4LineMetrics({
    linesAreaH: lineMetricsAreaH,
    renderLineCount: metricLineCount,
    fitOneScreen,
    qcomPurePage,
  });
  const qcomGlyphScale = qcomPurePage && isPhoneQcf4Page
    ? QCF4_PHONE_GLYPH_SCALE_QCOM
    : QCF4_GLYPH_SCALE_QCOM;
  const rawGlyphSize = Math.max(
    1,
    Math.round(
      lineHeight *
        (qcomPurePage ? qcomGlyphScale : minimalChrome ? 0.82 : 0.72) *
        mushafTextScale
    ) +
      (qcomPurePage ? QCF4_GLYPH_EXTRA_QCOM : 0) -
      1
  );
  const glyphSize =
    qcomPurePage && (isPhoneQcf4Page || Platform.OS !== "web")
      ? qcf4SafeGlyphSizeForLine({
          rawGlyphSize,
          lineHeight,
          maxGlyphSize: isPhoneQcf4Page ? QCF4_PHONE_GLYPH_MAX_QCOM : rawGlyphSize,
          lineHeightScale: QCF4_GLYPH_LINE_HEIGHT_SCALE_QCOM,
          visualScaleY: Platform.OS === "web" ? 1 : QCF4_NATIVE_GLYPH_VISUAL_SCALE_Y,
          lineInnerPadding: Platform.OS === "web" ? 0 : QCF4_NATIVE_LINE_INNER_PADDING,
        })
      : rawGlyphSize;
  const glyphLineHeight =
    qcomPurePage
      ? isPhoneQcf4Page
        ? Math.ceil(glyphSize * QCF4_GLYPH_LINE_HEIGHT_SCALE_QCOM)
        : Math.max(lineHeight, Math.ceil(glyphSize * QCF4_GLYPH_LINE_HEIGHT_SCALE_QCOM))
      : lineHeight;
  const phoneLineScaleX = qcomPurePage && isPhoneQcf4Page ? QCF4_PHONE_LINE_SCALE_X : 1;

  const wordOrdinalByRenderKey = useMemo(() => {
    const out = new Map<string, number>();
    const counts = new Map<string, number>();
    for (const line of renderLines) {
      line.words.forEach((word, wi) => {
        const ref = wordAyahRef(word);
        if (!ref) return;
        const ayahKey = wordPlayingRefKey(ref);
        const next = counts.get(ayahKey) ?? 0;
        out.set(`${line.line}:${wi}`, next);
        counts.set(ayahKey, next + 1);
      });
    }
    return out;
  }, [renderLines]);

  const tajweedTaggedByAyah = useMemo(() => {
    const out = new Map<string, string>();
    if (!showTajweedColors) return out;
    for (const ayah of page.ayahs) {
      const tagged =
        ayah.textTajweed || localTajweedByAyah[`${ayah.surahNumber}:${ayah.numberInSurah}`] || "";
      if (tagged.includes("[")) {
        out.set(`${ayah.surahNumber}:${ayah.numberInSurah}`, tagged);
      }
    }
    return out;
  }, [localTajweedByAyah, page.ayahs, showTajweedColors]);

  const glyphIndexInWordByRenderKey = useMemo(() => {
    const counts = new Map<string, number>();
    const out = new Map<string, number>();
    for (const line of renderLines) {
      line.words.forEach((word, wi) => {
        const ref = wordAyahRef(word);
        if (!ref || word.type !== "word") return;
        const wordRuleIndex =
          typeof word.position === "number" && word.position > 0
            ? word.position - 1
            : (counts.get(`${ref.surah}:${ref.ayah}:ord`) ?? 0);
        const k = `${ref.surah}:${ref.ayah}:${wordRuleIndex}`;
        const idx = counts.get(k) ?? 0;
        out.set(`${line.line}:${wi}`, idx);
        counts.set(k, idx + 1);
        counts.set(`${ref.surah}:${ref.ayah}:ord`, (counts.get(`${ref.surah}:${ref.ayah}:ord`) ?? 0) + 1);
      });
    }
    return out;
  }, [renderLines]);

  const onWordPress = (word: Qcf4Word) => {
    const ref = wordAyahRef(word);
    if (!ref) return;
    const item = findAyahItem(page, ref.surah, ref.ayah);
    if (item) onPressAyah(ref, item);
  };

  const onWordLongPress = (word: Qcf4Word) => {
    const ref = wordAyahRef(word);
    if (!ref) return;
    const item = findAyahItem(page, ref.surah, ref.ayah);
    if (item) onLongPressAyah(ref, item);
  };

  const canRenderQcf4Page = qcfPage != null && (fontsReady || Platform.OS === "web");

  const linesBlock = (
    <View
      style={{
        width: pageWidth,
        height: linesAreaH,
        alignSelf: "center",
        justifyContent: sparseQcf4Page ? "center" : "flex-start",
        paddingHorizontal: fitOneScreen ? (isPhoneQcf4Page ? QCF4_PHONE_LINE_PADDING : 6) : 0,
        paddingTop: phoneVerticalSafePadding,
        paddingBottom: phoneVerticalSafePadding,
        overflow: "visible",
      }}
    >
      {!isActive ? (
        <View style={{ flex: 1 }} />
      ) : !canRenderQcf4Page ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <RaqatOrnamentSpinner size={40} />
          {loadErr ? <Text style={st.muted}>QCF4</Text> : null}
        </View>
      ) : (
        renderLines.map((line, lineIndex) => {
          const lineHasSurahHeader = line.rawWords.some((word) => word.type === "surah_header");
          const inlineSurahTitle =
            shouldRenderQcf4InlineSurahFrame({
              qcomPurePage,
              useExternalSurahFrame,
              lineHasSurahHeader,
              line: line.line,
              externalSurahFrameLine,
            })
              ? qcf4SurahHeaderTitle(line.rawWords)
              : null;
          return (
            <View
              key={`qcf4-l${line.line}`}
              style={{
                height: lineHeight,
                marginBottom: lineIndex < renderLines.length - 1 ? lineGap : 0,
                flexDirection: "row-reverse",
                alignItems: "center",
                justifyContent: "center",
                flexWrap: "nowrap",
                overflow: "visible",
                width: "100%",
                transform: phoneLineScaleX < 1 ? [{ scaleX: phoneLineScaleX }] : undefined,
              }}
            >
              {inlineSurahTitle ? (
                <View
                  style={{
                    width: "100%",
                    height: lineHeight,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "visible",
                  }}
                >
                  <MushafSurahHeader
                    colors={colors}
                    mushafLayout
                    qcomBookLayout
                    qcf4LineSlotLayout
                    surahArabicTitleLine={inlineSurahTitle}
                    showMushafBismillahBanner={false}
                    styles={st}
                    titleColor={qcomTitleInk}
                  />
                </View>
              ) : (
                line.words.map((word, wi) => {
              const ref = wordAyahRef(word);
              const readableWebText = Platform.OS === "web" && !fontsReady;
              const displayedText = readableWebText ? qcf4ReadableText(word) : word.char;
              const displayedFontSize = readableWebText
                ? Math.max(16, Math.round(glyphSize * (word.type === "end" ? 0.52 : 0.7)))
                : glyphSize;
              const glyphSideBearingPad = readableWebText
                ? 0
                : Math.max(3, Math.ceil(displayedFontSize * (Platform.OS === "web" ? 0.08 : 0.1)));
              const glyphSideBearingMargin = readableWebText
                ? 2
                : Platform.OS === "web"
                  ? -glyphSideBearingPad
                  : -Math.floor(glyphSideBearingPad * 0.45);
              const stretchGlyph =
                !readableWebText && word.type !== "end" && word.type !== "surah_header";
              const glyphVisualScaleY = Platform.OS === "web" ? 1 : QCF4_NATIVE_GLYPH_VISUAL_SCALE_Y;
              const markerHeight = qcf4AyahMarkerHeight(lineHeight, glyphLineHeight);
              const hl = wordHighlighted(
                word,
                playingRef,
                loadingAyahAudio,
                resumeHighlight,
                ayahAudioIsPlaying
              );
              const isCurrentPlayingWord =
                ref != null &&
                playingRef?.surah === ref.surah &&
                playingRef.ayah === ref.ayah &&
                ayahAudioIsPlaying &&
                wordOrdinalByRenderKey.get(`${line.line}:${wi}`) === karaokeWordIndex;
              const wordOrdinal = wordOrdinalByRenderKey.get(`${line.line}:${wi}`);
              const wordRuleIndex =
                typeof word.position === "number" && word.position > 0
                  ? word.position - 1
                  : wordOrdinal;
              const tajweedRule =
                ref != null && wordRuleIndex != null
                  ? tajweedRuleForWordGlyph(
                      tajweedTaggedByAyah.get(`${ref.surah}:${ref.ayah}`),
                      wordRuleIndex,
                      glyphIndexInWordByRenderKey.get(`${line.line}:${wi}`) ?? 0
                    )
                  : undefined;
              const tappable = ref != null;
              const content =
                word.type === "end" ? (
                  <View
                    style={{
                      marginHorizontal: 2,
                      alignItems: "center",
                      justifyContent: "center",
                      height: lineHeight,
                      overflow: "visible",
                    }}
                    accessibilityLabel={`Аят ${qcf4AyahMarkerNumber(word)}`}
                  >
                    <MushafAyahSvgMarker
                      label={qcf4AyahMarkerNumber(word)}
                      stroke={QCF4_AYAH_MARKER_BLUE}
                      fill={QCF4_AYAH_MARKER_FACE}
                      textColor={qcf4AyahMarkerTextColorForPage(isDark, theme.pageFace)}
                      height={markerHeight}
                      variant="qcom"
                    />
                  </View>
                ) : (
                  <Text
                    style={{
                      fontFamily: readableWebText
                        ? QCF4_READABLE_WEB_FONT
                        : qcf4FontFamilyName(word.font),
                      fontSize: displayedFontSize,
                      lineHeight: glyphLineHeight,
                      paddingHorizontal: glyphSideBearingPad,
                      marginHorizontal: glyphSideBearingMargin,
                      fontWeight: readableWebText ? "700" : "500",
                      color:
                        word.type === "surah_header"
                          ? QCF4_AYAH_MARKER_BLUE
                          : tajweedRule
                            ? tajweedColorForRule(tajweedRule, isDark)
                          : st.mushafAyahTxt.color,
                      textShadowColor:
                        !readableWebText && word.type !== "surah_header"
                          ? st.mushafAyahTxt.color
                          : "transparent",
                      textShadowRadius: readableWebText ? 0 : 0.18,
                      transform: stretchGlyph ? [{ scaleY: glyphVisualScaleY }] : undefined,
                      backgroundColor: isCurrentPlayingWord
                        ? "rgba(16, 185, 129, 0.34)"
                        : hl
                          ? "rgba(232, 200, 106, 0.22)"
                          : "transparent",
                      writingDirection: "rtl",
                      includeFontPadding: true,
                    }}
                  >
                    {displayedText}
                  </Text>
                );
              if (!tappable) {
                return (
                  <View key={`w-${line.line}-${wi}`} style={{ overflow: "visible" }}>
                    {content}
                  </View>
                );
              }
              return (
                <Pressable
                  key={`w-${line.line}-${wi}`}
                  oyuBackdrop={false}
                  onPress={() => onWordPress(word)}
                  onLongPress={() => onWordLongPress(word)}
                  accessibilityRole="button"
                  style={{ overflow: "visible" }}
                >
                  {content}
                </Pressable>
              );
                })
              )}
            </View>
          );
        })
      )}
    </View>
  );

  const footerBlock =
    !minimalChrome && fitOneScreen && firstAyah ? (
      <MushafBookFooter
        page={page.mushafPageNumber}
        pageA11y={`${kk.quran.mushafFooterPageA11y} ${page.mushafPageNumber}`}
        colors={colors}
        isDark={Boolean(isDark)}
        bookMushaf
        hizb={hizbForGlobalAyahOneBased(
          surahAyahToGlobalOneBased(firstAyah.surahNumber, firstAyah.numberInSurah)
        )}
        surahStartsOnPage={firstAyah.numberInSurah === 1}
        readingThemeId={readingThemeId}
      />
    ) : null;

  if (fitOneScreen) {
    return (
      <ScrollView
        style={{ flex: 1, width: pagerWidth, backgroundColor: theme.pageFace }}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          justifyContent: pageHeight > (viewportHeight ?? 0) - paddingBottom ? "flex-start" : "center",
          paddingTop: qcomPurePage ? MUSHAF_BOOK_PAGE_EDGE_INSET : 2,
          paddingBottom,
        }}
        showsVerticalScrollIndicator={pageHeight > (viewportHeight ?? 0) - paddingBottom}
      >
        <View style={{ width: pageWidth, height: pageHeight }}>
          {qcomPurePage ? (
            <>
              <MushafBookPageChrome
                primarySurah={chromeSurah}
                primaryAyah={chromeAyah}
                mushafPageNumber={page.mushafPageNumber}
                styles={st}
              />
              {useExternalSurahFrame && titleAr ? (
                <View
                  style={{
                    height: surahFrameReserve,
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    marginTop: -QCF4_EXTERNAL_SURAH_FRAME_TOP_TIGHTEN,
                  }}
                >
                  <MushafSurahHeader
                    colors={colors}
                    mushafLayout
                    qcomBookLayout
                    surahArabicTitleLine={titleAr}
                    showMushafBismillahBanner={false}
                    styles={st}
                    titleColor={qcomTitleInk}
                  />
                </View>
              ) : null}
            </>
          ) : null}
          {!qcomPurePage ? (
            <>
              <MushafBookPageChrome
                primarySurah={chromeSurah}
                primaryAyah={chromeAyah}
                mushafPageNumber={page.mushafPageNumber}
                styles={st}
              />
              {showSurahFrame && titleAr ? (
                <MushafSurahHeader
                  colors={colors}
                  mushafLayout
                  qcomBookLayout
                  surahArabicTitleLine={titleAr}
                  showMushafBismillahBanner={showBism}
                  styles={st}
                />
              ) : showBism ? (
                <MushafSurahHeader
                  colors={colors}
                  mushafLayout
                  qcomBookLayout
                  surahArabicTitleLine={null}
                  showMushafBismillahBanner
                  styles={st}
                />
              ) : null}
            </>
          ) : null}
          {linesBlock}
          {!qcomPurePage ? footerBlock : null}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ width: pagerWidth, flex: 1 }}
      contentContainerStyle={[st.mushafListPad, { paddingBottom }]}
      showsVerticalScrollIndicator={false}
    >
      {minimalChrome ? (
        <MushafBookPageChrome
          primarySurah={chromeSurah}
          primaryAyah={chromeAyah}
          mushafPageNumber={page.mushafPageNumber}
          styles={st}
        />
      ) : null}
      {showSurahFrame && titleAr ? (
        <MushafSurahHeader
          colors={colors}
          mushafLayout
          qcomBookLayout={minimalChrome}
          bookPageLayout={!minimalChrome}
          surahArabicTitleLine={titleAr}
          showMushafBismillahBanner={showBism}
          styles={st}
        />
      ) : showBism ? (
        <MushafSurahHeader
          colors={colors}
          mushafLayout
          qcomBookLayout={minimalChrome}
          bookPageLayout={!minimalChrome}
          surahArabicTitleLine={null}
          showMushafBismillahBanner
          styles={st}
        />
      ) : null}
      <View style={{ width: pageWidth, height: pageHeight, alignSelf: "center" }}>{linesBlock}</View>
      {!minimalChrome && firstAyah ? footerBlock : null}
      {!minimalChrome || showReaderMeaning || showReaderTranslit ? (
        <MushafBookPageSecondaryAyahs
          ayahs={page.ayahs}
          styles={st}
          showReaderMeaning={showReaderMeaning}
          showReaderTranslit={showReaderTranslit}
          playingRef={playingRef}
          ayahAudioIsPlaying={ayahAudioIsPlaying}
          loadingAyahAudio={loadingAyahAudio}
          accentColor={colors.accent}
          onToggleAudio={onToggleAudio}
        />
      ) : null}
    </ScrollView>
  );
}
