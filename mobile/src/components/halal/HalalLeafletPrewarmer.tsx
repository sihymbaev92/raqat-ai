import React, { useMemo } from "react";
import { Platform, View } from "react-native";
import { WebView } from "react-native-webview";
import { buildHalalLeafletPrewarmHtml } from "../../utils/halalMapLeafletHtml";
import {
  SECURE_ANDROID_WEBVIEW_PROPS,
  SECURE_HTML_WEBVIEW_ORIGIN_WHITELIST,
} from "../webviewAndroidSecurity";

/** Halal hub ашылғанда Leaflet CDN-ін WebView кэшіне алдын ала жүктейді. */
export function HalalLeafletPrewarmer() {
  const html = useMemo(() => buildHalalLeafletPrewarmHtml(), []);
  if (Platform.OS === "web") return null;

  return (
    <View
      style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" }}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <WebView
        source={{ html, baseUrl: "https://unpkg.com/" }}
        originWhitelist={[...SECURE_HTML_WEBVIEW_ORIGIN_WHITELIST]}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        {...SECURE_ANDROID_WEBVIEW_PROPS}
      />
    </View>
  );
}
