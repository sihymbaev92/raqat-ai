import React, { useMemo } from "react";
import { Platform, Text, type TextStyle } from "react-native";
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

/** Тәжуид span-дарына width/flex шектеулерін алу — мәтін ағынымен бірге wrap. */
function inlineTajweedSpanStyle(baseStyle: TextStyle, color?: string): TextStyle {
  return {
    ...baseStyle,
    flexGrow: undefined,
    flexShrink: undefined,
    flexBasis: undefined,
    width: undefined,
    minWidth: undefined,
    maxWidth: undefined,
    alignSelf: undefined,
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

/**
 * Тәжуид түстері — Al Quran `[g[` тегтері немесе HTML `<font color>` енін шектемей,
 * негізгі Text ағынымен wrap рендер.
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
  const htmlRuns = useMemo(() => (htmlMode ? htmlFontTajweedRuns(raw) : []), [htmlMode, raw]);

  if (!raw) return null;

  const rtlStyle = inlineTajweedSpanStyle(baseStyle);

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
    return <Text style={rtlStyle}>{plain}</Text>;
  }

  if (nestedInText) return spans;
  return <Text style={rtlStyle}>{spans}</Text>;
}
