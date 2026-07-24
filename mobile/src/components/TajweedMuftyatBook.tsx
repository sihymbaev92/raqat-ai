import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  FlatList,
  View,
  Text,
  StyleSheet,
  Platform,
  type ImageSourcePropType,
  type StyleProp,
  type TextStyle,
  type ListRenderItemInfo,
} from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { QURAN_BOOK_FONT_FACE } from "../fonts/quranBookFonts";
import { TAJWEED_APP_PAGES } from "../content/tajweedMuftyatScope";
import {
  getTajweedManualBookPage,
  type TajweedManualBookBlock,
  type TajweedManualBookExample,
  type TajweedManualBookPage,
  type TajweedManualCropRect,
} from "../content/tajweedManualBook";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";

/** Muftyat PDF scan — 766×1134 px (барлық бет бірдей). */
export const MUFTYAT_PAGE_ASPECT = 766 / 1134;

function tajweedArabicTextStyle(): Pick<TextStyle, "fontFamily" | "writingDirection" | "textAlign"> {
  const face = QURAN_BOOK_FONT_FACE.amiri;
  return {
    writingDirection: "rtl",
    textAlign: "right",
    ...(Platform.OS === "web"
      ? { fontFamily: `"${face}", "Scheherazade New", "Noto Naskh Arabic", "Arabic Typesetting", serif` }
      : { fontFamily: face }),
  };
}

type Props = {
  initialPage?: number;
};

export function TajweedMuftyatBook({ initialPage = 1 }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const listRef = useRef<FlatList<number>>(null);
  const { tr } = useKkAutoTranslator();

  const pageNumbers = useMemo(() => TAJWEED_APP_PAGES.map((p) => p.page), []);

  const initialIndex = useMemo(() => {
    const ix = pageNumbers.indexOf(initialPage);
    return ix >= 0 ? ix : 0;
  }, [initialPage, pageNumbers]);

  useEffect(() => {
    if (initialIndex <= 0) return;
    const id = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false, viewPosition: 0 });
      } catch {
        /* layout әлі дайын емес — onScrollToIndexFailed өтейді */
      }
    }, 80);
    return () => clearTimeout(id);
  }, [initialIndex]);

  const renderItem = useCallback(
    ({ item: page }: ListRenderItemInfo<number>) => {
      const content = getTajweedManualBookPage(page);
      if (!content) return null;
      return <TajweedManualBookPageView page={content} styles={styles} tr={tr} />;
    },
    [styles, tr]
  );

  const keyExtractor = useCallback((page: number) => `manual-tajweed-${page}`, []);

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: Math.max(0, info.averageItemLength * info.index),
        animated: false,
      });
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: info.index, animated: false, viewPosition: 0 });
      });
    },
    []
  );

  return (
    <FlatList
      ref={listRef}
      style={styles.root}
      contentContainerStyle={styles.content}
      data={pageNumbers}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      windowSize={5}
      removeClippedSubviews={Platform.OS === "android"}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={Platform.OS === "web"}
      onScrollToIndexFailed={onScrollToIndexFailed}
    />
  );
}

function TajweedManualBookPageView({
  page,
  styles,
  tr,
}: {
  page: TajweedManualBookPage;
  styles: ReturnType<typeof makeStyles>;
  tr: (text: string) => string;
}) {
  let currentArabicTargets: string[] = [];

  return (
    <View style={styles.pageBlock}>
      <View style={styles.paper}>
        {page.blocks.map((block, index) => {
          const blockTargets = arabicTargetsForBlock(block);
          if (blockTargets.length) {
            currentArabicTargets = blockTargets;
          }

          return (
            <TajweedManualBookBlockView
              key={`${page.page}-${index}-${block.type}`}
              block={block}
              styles={styles}
              targetArabicLetters={currentArabicTargets}
              tr={tr}
            />
          );
        })}
      </View>
    </View>
  );
}

function TajweedManualBookBlockView({
  block,
  styles,
  tr,
  targetArabicLetters,
}: {
  block: TajweedManualBookBlock;
  styles: ReturnType<typeof makeStyles>;
  tr: (text: string) => string;
  targetArabicLetters: string[];
}) {
  switch (block.type) {
    case "partTitle":
      return <Text style={styles.partTitle}>{tr(block.text)}</Text>;
    case "chapterTitle":
      return (
        <View style={styles.chapterTitleWrap}>
          <Text style={styles.chapterTitle}>{tr(block.text)}</Text>
          {block.subtitle ? <Text style={styles.chapterSubtitle}>{tr(block.subtitle)}</Text> : null}
        </View>
      );
    case "rule":
      return (
        <View style={styles.ruleBlock}>
          <Text style={styles.ruleTitle}>
            {block.mark ? <Text style={[styles.ruleMark, tajweedArabicTextStyle()]}>{block.mark} </Text> : null}
            {tr(block.title)}
          </Text>
          {block.text ? <HighlightedText text={tr(block.text)} style={styles.paragraph} styles={styles} /> : null}
        </View>
      );
    case "examples":
      return (
        <ExampleGrid
          items={block.items}
          styles={styles}
          targetArabicLetters={targetArabicLetters}
          tr={tr}
        />
      );
    case "imageCrop": {
      const source = pageSource(block.sourcePage);
      if (!source) return null;
      return (
        <ScanImageCrop
          source={source}
          rect={block.rect}
          caption={tr(block.caption)}
          styles={styles}
        />
      );
    }
    case "letterLesson": {
      const source = pageSource(block.sourcePage);
      if (!source) return null;
      return (
        <LetterLessonCard
          title={tr(block.title)}
          text={tr(block.text)}
          source={source}
          mouthRect={block.mouthRect}
          mouthCaption={tr(block.mouthCaption)}
          examplesCaption={tr(block.examplesCaption)}
          examples={block.examples}
          targetArabicLetters={letterTargetsForTitle(block.title)}
          tr={tr}
          styles={styles}
        />
      );
    }
    case "exercise":
      return <HighlightedText text={tr(block.text)} style={styles.exercise} styles={styles} />;
    case "note":
      return <HighlightedText text={tr(block.text)} style={styles.note} styles={styles} />;
    case "paragraph":
    default:
      return <HighlightedText text={tr(block.text)} style={styles.paragraph} styles={styles} />;
  }
}

function HighlightedText({
  text,
  style,
  styles,
}: {
  text: string;
  style: StyleProp<TextStyle>;
  styles: ReturnType<typeof makeStyles>;
}) {
  return <Text style={style}>{renderHighlightedParts(text, styles, "highlighted-text")}</Text>;
}

const IMPORTANT_TEXT_RE =
  /(«[^»]+»|"[^"]+"|Фатха|Кәсра|Дамма|Сукун|Шәддә|Тәнуин|Харакат|Мәдд?|Һәмзә|Уасл|Тә мәрбута|Әл артиклі|Қамария|Шәмсия|Изхар|Изһар|Идғам|Иқлаб|Ихфа|Ғұнна|Қалқала|Тафхим|Тарқиқ|Уақф|Сәктә|Сәкта|Имәлә|Сәжде|Мутәмәсиләйни|Мутәжәнисәйни|Мутәқарибәйни|[ـًٌٍَُِّْٰ۪ٓۜ]+)/giu;

function renderHighlightedParts(
  text: string,
  styles: ReturnType<typeof makeStyles>,
  keyPrefix: string
) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(IMPORTANT_TEXT_RE)) {
    const value = match[0];
    const index = match.index ?? 0;
    if (index > cursor) {
      parts.push(text.slice(cursor, index));
    }
    parts.push(
      <Text key={`${keyPrefix}-${index}`} style={styles.importantText}>
        {value}
      </Text>
    );
    cursor = index + value.length;
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts.length ? parts : text;
}

const LETTER_TARGETS: Array<[string, string[]]> = [
  ["Әлиф", ["ا", "أ", "إ", "آ", "ٱ"]],
  ["Бә", ["ب"]],
  ["Тә", ["ت"]],
  ["Сә", ["ث"]],
  ["Жим", ["ج"]],
  ["Хә", ["ح"]],
  ["Ха", ["خ"]],
  ["Дәл", ["د"]],
  ["Зәл", ["ذ"]],
  ["Ра", ["ر"]],
  ["Зәй", ["ز"]],
  ["Син", ["س"]],
  ["Шин", ["ش"]],
  ["Сад", ["ص"]],
  ["Дад", ["ض"]],
  ["Та", ["ط"]],
  ["За", ["ظ"]],
  ["‘Айн", ["ع"]],
  ["Ғайн", ["غ"]],
  ["Фә", ["ف"]],
  ["Қаф", ["ق"]],
  ["Кәф", ["ك"]],
  ["Ләм", ["ل"]],
  ["Мим", ["م"]],
  ["Нун", ["ن"]],
  ["Һә", ["ه", "ة"]],
  ["Уәу", ["و"]],
  ["Йә", ["ي", "ى"]],
];

function letterTargetsForTitle(title: string): string[] {
  return LETTER_TARGETS.find(([name]) => title.includes(name))?.[1] ?? [];
}

const ARABIC_TARGETS = {
  fatha: ["َ", "ً"],
  kasra: ["ِ", "ٍ"],
  damma: ["ُ", "ٌ"],
  sukun: ["ْ"],
  shadda: ["ّ"],
  tanween: ["ً", "ٍ", "ٌ"],
  hamza: ["ء", "أ", "إ", "ؤ", "ئ"],
  wasl: ["ٱ", "ا"],
  taMarbuta: ["ة"],
  qamariya: ["أ", "ب", "ج", "ح", "خ", "ع", "غ", "ف", "ق", "ك", "م", "ه", "و", "ي"],
  shamsiya: ["ت", "ث", "د", "ذ", "ر", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ل", "ن"],
  izhar: ["ء", "أ", "إ", "ؤ", "ئ", "ه", "ع", "ح", "غ", "خ"],
  idgham: ["ي", "ر", "م", "ل", "و", "ن"],
  idghamWithGhunna: ["ي", "ن", "م", "و"],
  idghamNoGhunna: ["ل", "ر"],
  iqlab: ["ب"],
  ikhfa: ["ت", "ث", "ج", "د", "ذ", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ف", "ق", "ك"],
  ghunna: ["م", "ن"],
  qalqala: ["ق", "ط", "ب", "ج", "د"],
  madd: ["ا", "و", "ي", "ى", "ٰ", "ٓ"],
  waqf: ["ۚ", "ۖ", "ۗ", "ۙ", "ۛ", "ۜ", "ۘ", "۩"],
  saktah: ["ۜ"],
  imala: ["۪"],
} as const;

function mergeArabicTargets(...groups: ReadonlyArray<readonly string[]>): string[] {
  return Array.from(new Set(groups.flat()));
}

function arabicTargetsForBlock(block: TajweedManualBookBlock): string[] {
  if (block.type === "letterLesson") return letterTargetsForTitle(block.title);
  if (block.type !== "chapterTitle" && block.type !== "rule" && block.type !== "note") return [];

  const text = [
    block.type === "chapterTitle" ? block.text : "",
    block.type === "chapterTitle" ? block.subtitle ?? "" : "",
    block.type === "rule" ? block.title : "",
    block.type === "rule" ? block.mark ?? "" : "",
    block.type === "rule" ? block.text : "",
    block.type === "note" ? block.text : "",
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("фатха") || text.includes("ـَ")) return [...ARABIC_TARGETS.fatha];
  if (text.includes("кәсра") || text.includes("ـِ")) return [...ARABIC_TARGETS.kasra];
  if (text.includes("дамма") || text.includes("ـُ")) return [...ARABIC_TARGETS.damma];
  if (text.includes("сукун") || text.includes("ـْ")) return [...ARABIC_TARGETS.sukun];
  if (text.includes("шәддә")) return [...ARABIC_TARGETS.shadda];
  if (text.includes("тәнуин")) return [...ARABIC_TARGETS.tanween];
  if (text.includes("һәмзә")) return [...ARABIC_TARGETS.hamza];
  if (text.includes("уасл")) return [...ARABIC_TARGETS.wasl];
  if (text.includes("тә мәрбута")) return [...ARABIC_TARGETS.taMarbuta];
  if (text.includes("қамария") && text.includes("шәмсия")) {
    return mergeArabicTargets(ARABIC_TARGETS.qamariya, ARABIC_TARGETS.shamsiya);
  }
  if (text.includes("қамария")) return [...ARABIC_TARGETS.qamariya];
  if (text.includes("шәмсия")) return [...ARABIC_TARGETS.shamsiya];
  if (text.includes("изхар") || text.includes("изһар")) return [...ARABIC_TARGETS.izhar];
  if (text.includes("ғұннасыз идғам")) return [...ARABIC_TARGETS.idghamNoGhunna];
  if (text.includes("ғұнналы идғам")) return [...ARABIC_TARGETS.idghamWithGhunna];
  if (text.includes("идғам")) return [...ARABIC_TARGETS.idgham];
  if (text.includes("иқлаб")) return [...ARABIC_TARGETS.iqlab];
  if (text.includes("ихфа")) return [...ARABIC_TARGETS.ikhfa];
  if (text.includes("сукунды мим") || text.includes("шәддәлы нун") || text.includes("ғұнна")) return [...ARABIC_TARGETS.ghunna];
  if (text.includes("қалқала")) return [...ARABIC_TARGETS.qalqala];
  if (/«?ләм»?\s+әрпі|^ләм\b/.test(text)) return ["ل"];
  if (/«?ра»?\s+әрпі|^ра\b/.test(text)) return ["ر"];
  if (text.includes("имәлә")) return [...ARABIC_TARGETS.imala];
  if (text.includes("сәкта") || text.includes("сәктә")) return [...ARABIC_TARGETS.saktah];
  if (text.includes("мәд")) return [...ARABIC_TARGETS.madd];
  if (text.includes("уақф") || text.includes("тоқтау") || text.includes("тоқтал")) return [...ARABIC_TARGETS.waqf];

  return [];
}

function pageSource(page: number): ImageSourcePropType | undefined {
  return TAJWEED_APP_PAGES.find((item) => item.page === page)?.source;
}

function ScanImageCrop({
  source,
  rect,
  caption,
  styles,
  compact = false,
}: {
  source: ImageSourcePropType;
  rect: TajweedManualCropRect;
  caption: string;
  styles: ReturnType<typeof makeStyles>;
  compact?: boolean;
}) {
  const [boxWidth, setBoxWidth] = useState(0);
  const scale = boxWidth > 0 ? boxWidth / rect.width : 0;
  const boxHeight = scale > 0 ? rect.height * scale : 156;

  return (
    <View style={[styles.cropCard, compact && styles.cropCardCompact]}>
      <View
        style={[styles.cropViewport, { height: boxHeight }]}
        onLayout={(event) => setBoxWidth(event.nativeEvent.layout.width)}
      >
        {scale > 0 ? (
          <Image
            source={source}
            style={[
              styles.cropImage,
              {
                width: 766 * scale,
                height: 1134 * scale,
                left: -rect.x * scale,
                top: -rect.y * scale,
              },
            ]}
            resizeMode="stretch"
          />
        ) : null}
      </View>
      {caption ? <Text style={compact ? styles.cropCaptionCompact : styles.cropCaption}>{caption}</Text> : null}
    </View>
  );
}

function LetterLessonCard({
  title,
  text,
  source,
  mouthRect,
  mouthCaption,
  examplesCaption,
  examples,
  targetArabicLetters,
  tr,
  styles,
}: {
  title: string;
  text: string;
  source: ImageSourcePropType;
  mouthRect: TajweedManualCropRect;
  mouthCaption: string;
  examplesCaption: string;
  examples?: TajweedManualBookExample[];
  targetArabicLetters: string[];
  tr: (text: string) => string;
  styles: ReturnType<typeof makeStyles>;
}) {
  const wideMouth = mouthRect.width / mouthRect.height > 1.5;

  return (
    <View style={styles.letterCard}>
      <View style={styles.letterTopRow}>
        <View style={styles.letterTextCol}>
          <Text style={styles.letterText}>
            <Text style={styles.letterInlineTitle}>{title}</Text>
            {" — "}
            {renderHighlightedParts(text, styles, "letter-text")}
          </Text>
          <HighlightedText text={mouthCaption} style={styles.mouthCaption} styles={styles} />
        </View>
        <View style={[styles.mouthThumb, wideMouth && styles.mouthThumbWide]}>
          <ScanImageCrop source={source} rect={mouthRect} caption="" styles={styles} compact />
        </View>
      </View>

      {examples?.length ? (
        <View style={styles.examplesSection}>
          <Text style={styles.letterSectionTitle}>{examplesCaption}</Text>
          <ExampleGrid
            items={examples}
            styles={styles}
            targetArabicLetters={targetArabicLetters}
            tr={tr}
          />
        </View>
      ) : null}
    </View>
  );
}

function ExampleGrid({
  items,
  styles,
  targetArabicLetters = EMPTY_ARABIC_TARGETS,
  tr,
}: {
  items: TajweedManualBookExample[];
  styles: ReturnType<typeof makeStyles>;
  targetArabicLetters?: string[];
  tr?: (text: string) => string;
}) {
  const targetSet = useMemo(() => new Set(targetArabicLetters), [targetArabicLetters]);

  return (
    <View style={styles.exampleGrid}>
      {items.map((item) => {
        const reading = item.reading ? (tr ? tr(item.reading) : item.reading) : "";
        const length = Math.max(
          Array.from(item.arabic ?? "").length,
          Array.from(reading).length,
          Array.from(item.label ?? "").length
        );
        const wide = length > 6;
        const full = length > 18;
        return (
          <View
            key={`${item.label ?? ""}-${item.arabic ?? ""}-${item.reading ?? ""}`}
            style={[
              styles.exampleItem,
              wide && styles.exampleItemWide,
              full && styles.exampleItemFull,
            ]}
          >
            {item.label ? (
              <Text maxFontSizeMultiplier={1.15} style={styles.exampleLabel}>
                {tr ? tr(item.label) : item.label}
              </Text>
            ) : null}
            {item.arabic ? (
              <Text maxFontSizeMultiplier={1.15} style={[tajweedArabicTextStyle(), styles.exampleArabic]}>
                <HighlightedArabicText text={item.arabic} targetSet={targetSet} styles={styles} />
              </Text>
            ) : null}
            {item.reading ? (
              <Text maxFontSizeMultiplier={1.15} style={styles.exampleReading}>
                {reading}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const EMPTY_ARABIC_TARGETS: string[] = [];
const ARABIC_MARK_RE = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/;

function HighlightedArabicText({
  text,
  targetSet,
  styles,
}: {
  text: string;
  targetSet: Set<string>;
  styles: ReturnType<typeof makeStyles>;
}) {
  if (!targetSet.size) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  const chars = Array.from(text);
  let index = 0;

  while (index < chars.length) {
    let chunk = chars[index];
    index += 1;
    while (index < chars.length && ARABIC_MARK_RE.test(chars[index])) {
      chunk += chars[index];
      index += 1;
    }

    const shouldHighlight = Array.from(chunk).some((char) => targetSet.has(char));
    if (shouldHighlight) {
      nodes.push(
        <Text key={`target-${index}-${chunk}`} style={styles.exampleArabicTarget}>
          {chunk}
        </Text>
      );
      continue;
    }

    nodes.push(chunk);
  }

  return <>{nodes}</>;
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 34,
      gap: 8,
    },
    pageBlock: {
      alignSelf: "stretch",
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    paper: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: colors.card,
      gap: 10,
    },
    partTitle: {
      color: colors.error,
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "900",
      textAlign: "center",
    },
    chapterTitleWrap: {
      alignItems: "center",
      marginBottom: 2,
    },
    chapterTitle: {
      color: colors.accent,
      fontSize: 18,
      lineHeight: 25,
      fontWeight: "900",
      textAlign: "center",
    },
    chapterSubtitle: {
      color: colors.accent,
      fontSize: 15,
      lineHeight: 21,
      fontWeight: "800",
      textAlign: "center",
    },
    paragraph: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 25,
      fontWeight: "500",
      textAlign: "left",
    },
    ruleBlock: {
      gap: 4,
      marginTop: 2,
    },
    ruleTitle: {
      color: colors.error,
      fontSize: 16,
      lineHeight: 23,
      fontWeight: "900",
      fontStyle: "italic",
      textAlign: "center",
    },
    ruleMark: {
      color: colors.error,
      fontSize: 19,
      fontWeight: "900",
      fontStyle: "normal",
    },
    letterCard: {
      gap: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      paddingHorizontal: 10,
      paddingVertical: 11,
    },
    letterTopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    letterTextCol: {
      flex: 1,
      minWidth: 0,
    },
    letterInlineTitle: {
      color: colors.error,
      fontSize: 17,
      lineHeight: 24,
      fontWeight: "900",
      fontStyle: "italic",
    },
    letterText: {
      color: colors.text,
      fontSize: 16,
      lineHeight: 24,
      fontWeight: "600",
    },
    mouthCaption: {
      marginTop: 5,
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "800",
    },
    mouthThumb: {
      width: 156,
      flexShrink: 0,
    },
    mouthThumbWide: {
      width: 248,
      maxWidth: "52%",
    },
    examplesSection: {
      gap: 5,
    },
    letterSectionTitle: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "900",
      letterSpacing: 0.3,
      textTransform: "uppercase",
    },
    exampleGrid: {
      flexDirection: "row-reverse",
      flexWrap: "wrap",
      justifyContent: "center",
      rowGap: 8,
      columnGap: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.accentSurface,
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    exampleItem: {
      width: "22.8%",
      minWidth: 58,
      minHeight: 76,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
      borderRadius: 10,
      backgroundColor: colors.card,
      paddingHorizontal: 5,
      paddingTop: 7,
      paddingBottom: 8,
    },
    exampleItemWide: {
      width: "47%",
      minWidth: 120,
      minHeight: 82,
    },
    exampleItemFull: {
      width: "100%",
      minWidth: 0,
      minHeight: 86,
    },
    exampleLabel: {
      color: colors.muted,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: "800",
      textAlign: "center",
      alignSelf: "stretch",
      flexShrink: 1,
    },
    exampleArabic: {
      color: colors.accent,
      fontSize: 24,
      lineHeight: 40,
      fontWeight: "700",
      textAlign: "center",
      alignSelf: "stretch",
      flexShrink: 1,
      includeFontPadding: true,
    },
    exampleArabicTarget: {
      color: colors.error,
      fontWeight: "900",
    },
    exampleReading: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: "700",
      textAlign: "center",
      alignSelf: "stretch",
      flexShrink: 1,
      includeFontPadding: true,
    },
    importantText: {
      color: colors.error,
      fontWeight: "900",
    },
    exercise: {
      color: colors.accent,
      fontSize: 16,
      lineHeight: 23,
      fontWeight: "900",
    },
    note: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 23,
      fontWeight: "700",
      backgroundColor: colors.accentSurface,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    cropCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: "hidden",
    },
    cropCardCompact: {
      borderRadius: 10,
    },
    cropViewport: {
      alignSelf: "stretch",
      overflow: "hidden",
      backgroundColor: colors.card,
    },
    cropImage: {
      position: "absolute",
    },
    cropCaption: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: "800",
      paddingHorizontal: 12,
      paddingVertical: 10,
      textAlign: "center",
    },
    cropCaptionCompact: {
      color: colors.muted,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: "800",
      paddingHorizontal: 8,
      paddingVertical: 6,
      textAlign: "center",
    },
  });
}
