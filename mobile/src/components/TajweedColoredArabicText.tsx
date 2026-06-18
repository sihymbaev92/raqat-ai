import React, { useCallback, useMemo, useState } from "react";
import { Platform, Text, View, type TextStyle } from "react-native";
import { WebView } from "react-native-webview";
import { tajweedColorForRule } from "../content/tajweedRulesCatalog";
import {
  stripTajweedTags,
  tajweedColoredRuns,
  type TajweedColoredRun,
  type TajweedRuleKey,
} from "../utils/alquranTajweedParse";

type Props = {
  taggedText: string;
  /** Uthmani мәтін — тег жоқ fallback үшін. */
  plainText?: string;
  baseStyle: TextStyle;
  isDark: boolean;
  /**
   * Ата-ана `<Text>` ішінде тұрса — қосарланған Text қабығын қоймау.
   * Android WebView мұнда қолданылмайды (View керек).
   */
  nestedInText?: boolean;
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildTajweedHtml(
  runs: TajweedColoredRun[],
  fallbackPlain: string,
  baseStyle: TextStyle,
  isDark: boolean
): string {
  const fontSize = typeof baseStyle.fontSize === "number" ? baseStyle.fontSize : 22;
  const lineHeight =
    typeof baseStyle.lineHeight === "number" ? baseStyle.lineHeight : Math.round(fontSize * 1.88);
  const fontFamily =
    typeof baseStyle.fontFamily === "string" && baseStyle.fontFamily.trim()
      ? baseStyle.fontFamily
      : '"Scheherazade New", "Noto Naskh Arabic", "Amiri", serif';
  const textColor =
    (typeof baseStyle.color === "string" ? baseStyle.color : null) ?? (isDark ? "#f4f4f5" : "#18181b");

  const body = runs.length
    ? runs
        .map((run) => {
          if (!run.rule || /^\s+$/u.test(run.text)) {
            return escapeHtml(run.text);
          }
          const color = tajweedColorForRule(run.rule as TajweedRuleKey, isDark);
          return `<span style="color:${color}">${escapeHtml(run.text)}</span>`;
        })
        .join("")
    : escapeHtml(fallbackPlain);

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body { margin: 0; padding: 0; background: transparent; }
  body {
    direction: rtl;
    unicode-bidi: plaintext;
    text-align: right;
    font-family: ${fontFamily};
    font-size: ${fontSize}px;
    line-height: ${lineHeight}px;
    color: ${textColor};
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    font-feature-settings: "liga" 1, "calt" 1;
  }
</style>
</head>
<body>${body}</body>
</html>`;
}

const TAJWEED_WEB_HEIGHT_SCRIPT = `
(function () {
  function postHeight() {
    var h = Math.max(
      document.body ? document.body.scrollHeight : 0,
      document.documentElement ? document.documentElement.scrollHeight : 0
    );
    if (window.ReactNativeWebView && h > 0) {
      window.ReactNativeWebView.postMessage(String(h));
    }
  }
  postHeight();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(postHeight).catch(postHeight);
  }
  true;
})();
`;

function arabicRtlStyle(): TextStyle {
  return Platform.OS === "web"
    ? {}
    : {
        writingDirection: "rtl" as const,
        textBreakStrategy: "highQuality" as const,
      };
}

function renderColoredRuns(
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
      <Text
        key={`r-${idx}-${run.rule ?? "p"}`}
        style={{ ...baseStyle, ...arabicRtlStyle(), ...(color ? { color } : null) }}
      >
        {run.text}
      </Text>
    );
  });
}

function TajweedColoredArabicWeb({
  html,
  width,
}: {
  html: string;
  width?: number;
}) {
  const [height, setHeight] = useState(48);
  const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    const next = Number.parseInt(event.nativeEvent.data, 10);
    if (Number.isFinite(next) && next > 0) {
      setHeight((prev) => (Math.abs(prev - next) > 1 ? next : prev));
    }
  }, []);

  return (
    <View style={{ width: width ?? "100%", height, alignSelf: "stretch", overflow: "hidden" }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://alquran.cloud/" }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: "transparent" }}
        containerStyle={{ backgroundColor: "transparent" }}
        onMessage={onMessage}
        injectedJavaScript={TAJWEED_WEB_HEIGHT_SCRIPT}
        androidLayerType="hardware"
      />
    </View>
  );
}

export function TajweedColoredArabicText({
  taggedText,
  plainText,
  baseStyle,
  isDark,
  nestedInText = false,
}: Props) {
  const raw = (taggedText ?? "").trim();
  const fallbackPlain = (plainText ?? stripTajweedTags(raw)).trim();
  const runs = useMemo(() => (raw.includes("[") ? tajweedColoredRuns(raw) : []), [raw]);
  const html = useMemo(
    () => buildTajweedHtml(runs, fallbackPlain || raw, baseStyle, isDark),
    [runs, fallbackPlain, raw, baseStyle, isDark]
  );

  if (!raw) return null;

  const hasTag = raw.includes("[");
  if (!hasTag) {
    const plain = plainText?.trim() || raw;
    return nestedInText ? (
      <Text style={{ ...baseStyle, ...arabicRtlStyle() }}>{plain}</Text>
    ) : (
      <Text style={baseStyle}>{plain}</Text>
    );
  }

  if (!runs.length) {
    return nestedInText ? (
      <Text style={{ ...baseStyle, ...arabicRtlStyle() }}>{fallbackPlain || raw}</Text>
    ) : (
      <Text style={baseStyle}>{fallbackPlain || raw}</Text>
    );
  }

  /** Android: Chromium арабты span арасында дұрыс байлайды (Sajda/HTML сияқты). */
  if (Platform.OS === "android" && !nestedInText) {
    return <TajweedColoredArabicWeb html={html} />;
  }

  const spans = renderColoredRuns(runs, baseStyle, isDark);
  if (nestedInText) return spans;
  return <Text style={baseStyle}>{spans}</Text>;
}
