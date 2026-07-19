import React, { useMemo } from "react";
import { Platform, Text, View, type TextStyle } from "react-native";
import { tajweedColorForRule } from "../content/tajweedRulesCatalog";
import {
  stripTajweedTags,
  tajweedColoredRuns,
  type TajweedColoredRun,
  type TajweedRuleKey,
} from "../utils/alquranTajweedParse";
import {
  htmlFontTajweedRuns,
  isHtmlFontTajweedText,
  stripHtmlFontTajweedTags,
  type HtmlFontTajweedRun,
} from "../utils/htmlTajweedParse";

type Props = {
  taggedText: string;
  plainText?: string;
  baseStyle: TextStyle;
  isDark: boolean;
  /** Ата-ана `<Text>` ішінде — span-дар еркін ағады, width шектелмейді. */
  nestedInText?: boolean;
};

/** Тәжуид span-дарына width/flex шектеулерін алу — мәтін ағынымен wrap; әріп шеті кесілмесін. */
export function inlineTajweedSpanStyle(
  baseStyle: TextStyle,
  color?: string,
  opts?: { compact?: boolean }
): TextStyle {
  const fontSize = typeof baseStyle.fontSize === "number" ? baseStyle.fontSize : 24;
  const spanPad = opts?.compact
    ? 0
    : Math.max(1, Math.ceil(fontSize * (Platform.OS === "android" ? 0.055 : 0.035)));
  return {
    ...baseStyle,
    flexGrow: undefined,
    flexShrink: undefined,
    flexBasis: undefined,
    width: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    alignSelf: undefined,
    marginHorizontal: 0,
    paddingHorizontal: spanPad,
    includeFontPadding: true,
    textAlign: "right",
    writingDirection: "rtl",
    ...(Platform.OS === "android" ? { textBreakStrategy: "highQuality" as const } : null),
    ...(Platform.OS === "web"
      ? ({ whiteSpace: "normal", wordWrap: "break-word", overflowWrap: "break-word" } as TextStyle)
      : null),
    ...(color ? { color } : null),
  };
}

function renderBracketRuns(
  runs: TajweedColoredRun[],
  baseStyle: TextStyle,
  isDark: boolean
): React.ReactNode[] {
  return runs.map((run, idx) => {
    const isWhitespaceOnly = /^\s+$/u.test(run.text);
    const color =
      run.rule && !isWhitespaceOnly
        ? tajweedColorForRule(run.rule as TajweedRuleKey, isDark)
        : undefined;
    return (
      <Text key={`r-${idx}-${run.rule ?? "p"}`} style={inlineTajweedSpanStyle(baseStyle, color)}>
        {run.text}
      </Text>
    );
  });
}

function renderHtmlFontRuns(runs: HtmlFontTajweedRun[], baseStyle: TextStyle): React.ReactNode[] {
  return runs.map((run, idx) => (
    <Text key={`h-${idx}-${run.color ?? "p"}`} style={inlineTajweedSpanStyle(baseStyle, run.color)}>
      {run.text}
    </Text>
  ));
}

function plainFallback(raw: string, plainText: string | undefined): string {
  if (plainText?.trim()) return plainText.trim();
  if (isHtmlFontTajweedText(raw)) return stripHtmlFontTajweedTags(raw).trim();
  if (raw.includes("[")) return stripTajweedTags(raw).trim();
  return raw.trim();
}

const rtlHostStyle = {
  width: "100%" as const,
  alignSelf: "stretch" as const,
  direction: "rtl" as const,
};

/**
 * Тәжуид түстері — Al Quran `[g[` тегтері немесе HTML `<font color>` енін шектемей,
 * негізгі Text ағынымен wrap рендер (оңнан солға).
 */
export function TajweedColoredArabicText({
  taggedText,
  plainText,
  baseStyle,
  isDark,
  nestedInText = false,
}: Props) {
  const raw = (taggedText ?? "").trim();
  const htmlMode = isHtmlFontTajweedText(raw);
  const bracketRuns = useMemo(
    () => (!htmlMode && raw.includes("[") ? tajweedColoredRuns(raw) : []),
    [htmlMode, raw]
  );
  const htmlRuns = useMemo(() => (htmlMode ? htmlFontTajweedRuns(raw, isDark) : []), [htmlMode, raw, isDark]);

  if (!raw) return null;

  const rtlStyle: TextStyle = {
    ...inlineTajweedSpanStyle(baseStyle),
    width: "100%",
    textAlign: "right",
    writingDirection: "rtl",
  };

  const spans = htmlMode
    ? htmlRuns.length
      ? renderHtmlFontRuns(htmlRuns, rtlStyle)
      : null
    : bracketRuns.length
      ? renderBracketRuns(bracketRuns, rtlStyle, isDark)
      : null;

  if (!spans) {
    const plain = plainFallback(raw, plainText);
    if (nestedInText) return plain;
    return (
      <View style={rtlHostStyle}>
        <Text style={rtlStyle}>{plain}</Text>
      </View>
    );
  }

  if (nestedInText) return spans;
  return (
    <View style={rtlHostStyle}>
      <Text style={rtlStyle}>{spans}</Text>
    </View>
  );
}
