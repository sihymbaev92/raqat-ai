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
import {
  TajweedColoredArabicWebView,
  tajweedHtmlWebViewSupported,
} from "./TajweedColoredArabicWebView";

type Props = {
  taggedText: string;
  plainText?: string;
  baseStyle: TextStyle;
  isDark: boolean;
  /** Ата-ана `<Text>` ішінде — span-дар еркін ағады, width шектелмейді. */
  nestedInText?: boolean;
};

/** Тәжуид span-дарына width/flex шектеулерін алу — мәтін ағынымен wrap; әріп арасын ашпау. */
export function inlineTajweedSpanStyle(
  baseStyle: TextStyle,
  color?: string,
  _opts?: { compact?: boolean }
): TextStyle {
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
    paddingHorizontal: 0,
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

function resolveInk(baseStyle: TextStyle, isDark: boolean): string {
  const c = baseStyle.color;
  if (typeof c === "string" && c.trim()) return c;
  return isDark ? "#F5F5F5" : "#111111";
}

const rtlHostStyle = {
  width: "100%" as const,
  alignSelf: "stretch" as const,
  direction: "rtl" as const,
};

/**
 * Тәжуид түстері — native-та WebView HTML (араб қосылады + түстер сақталады);
 * nested/web — RN Text fallback.
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
  const hasMarkup = htmlMode || raw.includes("[");
  const ink = resolveInk(baseStyle, isDark);

  const bracketRuns = useMemo(
    () => (!htmlMode && raw.includes("[") ? tajweedColoredRuns(raw) : []),
    [htmlMode, raw]
  );
  const htmlRuns = useMemo(() => (htmlMode ? htmlFontTajweedRuns(raw, isDark) : []), [htmlMode, raw, isDark]);

  if (!raw) return null;

  // Native: браузер shaping — түстер де, әріп байланысы да.
  if (!nestedInText && hasMarkup && tajweedHtmlWebViewSupported()) {
    return (
      <View style={rtlHostStyle}>
        <TajweedColoredArabicWebView
          taggedText={raw}
          baseStyle={baseStyle}
          isDark={isDark}
          ink={ink}
        />
      </View>
    );
  }

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
