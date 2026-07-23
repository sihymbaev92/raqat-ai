import React, { useCallback, useMemo, useState } from "react";
import { Platform, View, type TextStyle } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import {
  buildTajweedColoredBodyHtml,
  buildTajweedHtmlDocument,
  resolveTajweedHtmlColorRuns,
} from "../utils/tajweedHtmlDocument";

type Props = {
  taggedText: string;
  baseStyle: TextStyle;
  isDark: boolean;
  ink: string;
};

/**
 * Native: WebView HTML span — араб shaping + тәжуид түстері бірге.
 * (RN nested Text әріптерді үзеді немесе бір түске түсіреді.)
 */
export function TajweedColoredArabicWebView({ taggedText, baseStyle, isDark, ink }: Props) {
  const fontSize = typeof baseStyle.fontSize === "number" ? baseStyle.fontSize : 26;
  const lineHeight =
    typeof baseStyle.lineHeight === "number" ? baseStyle.lineHeight : Math.round(fontSize * 1.85);
  const minHeight = Math.ceil(lineHeight * 1.15);

  const html = useMemo(() => {
    const runs = resolveTajweedHtmlColorRuns(taggedText, isDark, ink);
    const bodyHtml = buildTajweedColoredBodyHtml(runs);
    return buildTajweedHtmlDocument({
      bodyHtml,
      fontSize,
      lineHeight,
      ink,
      background: "transparent",
    });
  }, [fontSize, ink, isDark, lineHeight, taggedText]);

  const [height, setHeight] = useState(minHeight);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data) as { type?: string; h?: number };
        if (msg.type === "h" && typeof msg.h === "number" && Number.isFinite(msg.h)) {
          const next = Math.max(minHeight, Math.ceil(msg.h));
          setHeight((prev) => (Math.abs(prev - next) < 2 ? prev : next));
        }
      } catch {
        /* ignore */
      }
    },
    [minHeight]
  );

  if (Platform.OS === "web") return null;

  return (
    <View style={{ width: "100%", alignSelf: "stretch", minHeight }}>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://fonts.gstatic.com/" }}
        style={{
          width: "100%",
          height,
          backgroundColor: "transparent",
          opacity: 0.99,
        }}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        setSupportMultipleWindows={false}
        javaScriptEnabled
        domStorageEnabled={false}
        thirdPartyCookiesEnabled={false}
        sharedCookiesEnabled={false}
        allowFileAccess={false}
        mixedContentMode="always"
        overScrollMode="never"
        androidLayerType="hardware"
        onMessage={onMessage}
      />
    </View>
  );
}

export function tajweedHtmlWebViewSupported(): boolean {
  return Platform.OS === "android" || Platform.OS === "ios";
}
