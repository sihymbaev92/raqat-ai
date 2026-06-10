import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import type { WebView as WebViewType } from "react-native-webview";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../theme/colors";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { kk } from "../i18n/kk";

type Props = {
  visible: boolean;
  url: string;
  onClose: () => void;
  colors: ThemeColors;
  /** Тақырып жолы (жоғары панель) */
  title: string;
};

/** Сайт мобильді «жеңіл» нұсқа бермесін — толық бет + суреттер үшін кеңейтілген UA. */
const DESKTOP_CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 RaqatEmbeddedWebView/1";

/**
 * viewport-fit=cover экран дөңес шеттерінде контентті кеседі; таб суреттерінің дөңес бұрыштары үшін
 * safe-area + горизонталь padding және таб/nav ішіндегі img үшін object-fit / border-radius бекітеміз.
 * onLoadEnd қайта шақырылады (ішкі навигация).
 */
const EMBEDDED_SITE_TAB_IMAGE_FIX_CSS = [
  "[role=tablist], [role=tablist] * { overflow: visible !important; }",
  "[role=tablist], nav .menu, .nav-tabs, .elementor-tabs-wrapper, .et_pb_tabs_controls, .wp-block-navigation {",
  "  padding-left: max(6px, env(safe-area-inset-left, 0px)) !important;",
  "  padding-right: max(6px, env(safe-area-inset-right, 0px)) !important;",
  "}",
  "nav img, [role=tablist] img, [role=tab] img, .nav-tabs img, .wp-block-navigation img,",
  ".tabs img, .et_pb_tabs img, .elementor-tab-title img, .elementor-widget-nav-menu img,",
  ".elementor-tabs-wrapper img, .elementor-tab-desktop-title img {",
  "  object-fit: contain !important;",
  "  max-width: 100% !important;",
  "  height: auto !important;",
  "  border-radius: 12px !important;",
  "  box-sizing: border-box !important;",
  "  -webkit-mask-image: none !important;",
  "  mask-image: none !important;",
  "  -webkit-backface-visibility: visible;",
  "  backface-visibility: visible;",
  "}",
].join("\n");

const EMBEDDED_SITE_INJECT = `
(function () {
  try {
    var d = document;
    var de = d.documentElement;
    if (de) {
      de.style.width = "100%";
      de.style.maxWidth = "100%";
      de.style.overflowX = "auto";
    }
    var b = d.body;
    if (b) {
      b.style.margin = "0";
      b.style.maxWidth = "100%";
      b.style.boxSizing = "border-box";
      b.style.overflowX = "auto";
      b.style.paddingLeft = "max(14px, env(safe-area-inset-left, 0px))";
      b.style.paddingRight = "max(14px, env(safe-area-inset-right, 0px))";
      b.style.paddingBottom = "max(12px, env(safe-area-inset-bottom, 0px))";
    }
    var head = d.getElementsByTagName("head")[0];
    if (!head) return;
    var m = d.querySelector('meta[name="viewport"]');
    if (!m) {
      m = d.createElement("meta");
      m.setAttribute("name", "viewport");
      head.insertBefore(m, head.firstChild);
    }
    m.setAttribute(
      "content",
      "width=device-width, initial-scale=1, minimum-scale=0.25, maximum-scale=5, user-scalable=yes"
    );
    var sid = "raqat-embedded-webview-visual-fix";
    var old = d.getElementById(sid);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var s = d.createElement("style");
    s.id = sid;
    s.type = "text/css";
    s.appendChild(d.createTextNode(${JSON.stringify(EMBEDDED_SITE_TAB_IMAGE_FIX_CSS)}));
    head.appendChild(s);
  } catch (e) {}
})();
true;
`;

/**
 * Ресми сайтты қолданба ішінде толық көрсету (WebView).
 * HTML көшірмесіз — тікелей URL жүктеледі.
 */
export function EmbeddedSiteSheet({ visible, url, onClose, colors, title }: Props) {
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebViewType>(null);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.bg },
        toolbar: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 6,
          paddingVertical: 6,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
          gap: 4,
        },
        iconBtn: {
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
        },
        toolbarTitle: {
          flex: 1,
          fontSize: 15,
          fontWeight: "800",
          color: colors.text,
        },
        webWrap: {
          flex: 1,
          minHeight: 1,
          width: "100%",
          overflow: "visible",
        },
        web: { flex: 1, backgroundColor: colors.bg },
        loadingWrap: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        },
      }),
    [colors]
  );
  const [key, setKey] = useState(0);
  const [webLoading, setWebLoading] = useState(true);
  const isWeb = Platform.OS === "web";
  const onReload = useCallback(() => {
    setKey((k) => k + 1);
    setWebLoading(true);
  }, []);

  useEffect(() => {
    if (visible && url) setWebLoading(true);
  }, [visible, url, key]);

  const applyInject = useCallback(() => {
    webRef.current?.injectJavaScript(EMBEDDED_SITE_INJECT);
  }, []);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.toolbar}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.common.cancel}
          >
            <MaterialIcons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={styles.toolbarTitle} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={onReload}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
          >
            <MaterialIcons name="refresh" size={24} color={colors.accent} />
          </Pressable>
        </View>
        {url ? (
          <View style={styles.webWrap}>
            {isWeb ? (
              React.createElement("iframe", {
                key,
                src: url,
                title,
                onLoad: () => setWebLoading(false),
                style: {
                  width: "100%",
                  height: "100%",
                  border: "0",
                  flex: 1,
                  backgroundColor: colors.bg,
                },
              })
            ) : (
              <WebView
                ref={webRef}
                key={key}
                source={{ uri: url }}
                style={styles.web}
                userAgent={DESKTOP_CHROME_UA}
                startInLoadingState
                javaScriptEnabled
                domStorageEnabled
                allowsBackForwardNavigationGestures={Platform.OS === "ios"}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                allowsFullscreenVideo
                setSupportMultipleWindows={false}
                sharedCookiesEnabled
                thirdPartyCookiesEnabled={Platform.OS === "android"}
                mixedContentMode="compatibility"
                cacheEnabled
                nestedScrollEnabled
                androidLayerType="hardware"
                injectedJavaScriptBeforeContentLoaded={EMBEDDED_SITE_INJECT}
                injectedJavaScript={EMBEDDED_SITE_INJECT}
                onLoadEnd={() => {
                  applyInject();
                  setWebLoading(false);
                }}
                renderLoading={() => (
                  <View style={styles.loadingWrap}>
                    <RaqatOrnamentSpinner size={48} />
                  </View>
                )}
                onError={() => {
                  setWebLoading(false);
                }}
              />
            )}
            {webLoading ? (
              <View style={styles.loadingWrap} pointerEvents="none">
                <RaqatOrnamentSpinner size={48} />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.loadingWrap}>
            <Text style={{ color: colors.muted }}>—</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
