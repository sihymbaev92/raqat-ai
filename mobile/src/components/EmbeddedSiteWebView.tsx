import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebView as WebViewType, WebViewNavigation } from "react-native-webview";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { kk } from "../i18n/kk";

/** Сайт мобильді «жеңіл» нұсқа бермесін — толық бет + суреттер үшін кеңейтілген UA. */
const DESKTOP_CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 RaqatEmbeddedWebView/1";

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

const EXTERNAL_SCHEME_RE = /^(?:tel|mailto|sms|intent|whatsapp|tg|geo|market):/i;

export function shouldLoadEmbeddedSiteUrl(rawUrl: string | null | undefined): boolean {
  const u = (rawUrl ?? "").trim();
  if (!u) return false;
  if (/^(?:about:blank|data:text\/html)/i.test(u)) return true;
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function shouldOpenEmbeddedSiteUrlExternally(rawUrl: string | null | undefined): boolean {
  const u = (rawUrl ?? "").trim();
  if (!u) return false;
  return EXTERNAL_SCHEME_RE.test(u) || !shouldLoadEmbeddedSiteUrl(u);
}

import { withEmbeddedSiteCacheBust } from "./officialSiteWebViewReload";
export { withEmbeddedSiteCacheBust } from "./officialSiteWebViewReload";

export type EmbeddedSiteWebViewHandle = {
  /** Түпнұсқа URL-ге оралып, кэшсіз қайта жүктейді. */
  reload: () => void;
};

type Props = {
  url: string;
  colors: ThemeColors;
  /** iframe title (web платформа) */
  title?: string;
  /** Сырттан қайта жүктеу — мән өзгерсе reload() шақырылады (modal sheet) */
  reloadKey?: number;
  /** iOS/Android: төмен тартып жаңарту */
  pullToRefreshEnabled?: boolean;
};

/**
 * Толық экранды WebView (modal емес) — halaldamu.kz сияқты ресми сайттар үшін.
 */
export const EmbeddedSiteWebView = forwardRef<EmbeddedSiteWebViewHandle, Props>(function EmbeddedSiteWebView(
  { url, colors, title, reloadKey = 0, pullToRefreshEnabled = false },
  ref
) {
  const webRef = useRef<WebViewType>(null);
  const [loadToken, setLoadToken] = useState(0);
  const resolvedUrl = useMemo(() => withEmbeddedSiteCacheBust(url, loadToken), [url, loadToken]);
  const webMountKey = loadToken > 0 ? `bust-${loadToken}` : "initial";
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, minHeight: 1, width: "100%", backgroundColor: colors.bg },
        web: { flex: 1, backgroundColor: colors.bg },
        loadingWrap: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        },
        errorWrap: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          paddingHorizontal: 24,
          backgroundColor: colors.bg,
        },
        errorText: {
          color: colors.text,
          fontSize: 15,
          lineHeight: 22,
          textAlign: "center",
          fontWeight: "700",
        },
        errorActions: {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 10,
        },
        errorBtn: {
          minHeight: 42,
          borderRadius: 999,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          backgroundColor: colors.accent,
        },
        errorBtnSecondary: {
          backgroundColor: colors.accentSurface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.accent,
        },
        errorBtnText: {
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: "900",
        },
      }),
    [colors]
  );
  const [webLoading, setWebLoading] = useState(true);
  const [webError, setWebError] = useState<string | null>(null);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const isWeb = Platform.OS === "web";
  const lastExternalReloadKeyRef = useRef(reloadKey);

  const hardReload = useCallback(() => {
    setWebError(null);
    setWebLoading(true);
    setPullRefreshing(true);
    setLoadToken(Date.now());
  }, []);

  useImperativeHandle(ref, () => ({ reload: hardReload }), [hardReload]);

  useEffect(() => {
    if (reloadKey > 0 && reloadKey !== lastExternalReloadKeyRef.current) {
      lastExternalReloadKeyRef.current = reloadKey;
      hardReload();
    }
  }, [reloadKey, hardReload]);

  const applyInject = useCallback(() => {
    webRef.current?.injectJavaScript(EMBEDDED_SITE_INJECT);
  }, []);

  const onReload = useCallback(() => {
    hardReload();
  }, [hardReload]);

  const onPullRefresh = useCallback(() => {
    hardReload();
  }, [hardReload]);

  const openInBrowser = useCallback(() => {
    if (url) void Linking.openURL(url);
  }, [url]);

  const markWebViewUnstable = useCallback(() => {
    setWebLoading(false);
    setPullRefreshing(false);
    setWebError(kk.common.embeddedSiteError);
  }, []);

  const onWebViewRenderGone = useCallback(() => {
    markWebViewUnstable();
    return true;
  }, [markWebViewUnstable]);

  const onWebViewContentTerminated = useCallback(() => {
    markWebViewUnstable();
  }, [markWebViewUnstable]);

  const shouldStartWebViewLoad = useCallback((ev: WebViewNavigation) => {
    const nextUrl = ev.url || "";
    if (shouldLoadEmbeddedSiteUrl(nextUrl)) return true;
    if (shouldOpenEmbeddedSiteUrlExternally(nextUrl)) {
      void Linking.openURL(nextUrl).catch(() => {});
    }
    return false;
  }, []);

  const finishLoad = useCallback(() => {
    applyInject();
    setWebLoading(false);
    setPullRefreshing(false);
  }, [applyInject]);

  if (!resolvedUrl) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={{ color: colors.muted }}>—</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {webError ? (
        <View style={styles.errorWrap}>
          <MaterialIcons name="public-off" size={38} color={colors.muted} />
          <Text style={styles.errorText}>{webError}</Text>
          <View style={styles.errorActions}>
            <Pressable
              onPress={onReload}
              style={({ pressed }) => [styles.errorBtn, pressed && { opacity: 0.82 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.common.retry}
            >
              <MaterialIcons name="refresh" size={19} color="#FFFFFF" />
              <Text style={styles.errorBtnText}>{kk.common.retry}</Text>
            </Pressable>
            <Pressable
              onPress={openInBrowser}
              style={({ pressed }) => [styles.errorBtn, styles.errorBtnSecondary, pressed && { opacity: 0.82 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.common.openInBrowser}
            >
              <MaterialIcons name="open-in-new" size={19} color={colors.accent} />
              <Text style={[styles.errorBtnText, { color: colors.accent }]}>{kk.common.openInBrowser}</Text>
            </Pressable>
          </View>
        </View>
      ) : isWeb ? (
        React.createElement("iframe", {
          key: webMountKey,
          src: resolvedUrl,
          title: title ?? resolvedUrl,
          onLoad: finishLoad,
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
          key={webMountKey}
          source={{ uri: resolvedUrl }}
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
          cacheEnabled={loadToken === 0}
          cacheMode={loadToken > 0 ? "LOAD_NO_CACHE" : "LOAD_DEFAULT"}
          nestedScrollEnabled
          androidLayerType="hardware"
          pullToRefreshEnabled={pullToRefreshEnabled}
          refreshing={pullRefreshing}
          onRefresh={pullToRefreshEnabled ? onPullRefresh : undefined}
          onShouldStartLoadWithRequest={shouldStartWebViewLoad}
          onContentProcessDidTerminate={onWebViewContentTerminated}
          onRenderProcessGone={onWebViewRenderGone}
          injectedJavaScriptBeforeContentLoaded={EMBEDDED_SITE_INJECT}
          injectedJavaScript={EMBEDDED_SITE_INJECT}
          onLoadEnd={finishLoad}
          renderLoading={() => (
            <View style={styles.loadingWrap}>
              <RaqatOrnamentSpinner size={48} />
            </View>
          )}
          onError={markWebViewUnstable}
          onHttpError={markWebViewUnstable}
        />
      )}
      {webLoading && !webError ? (
        <View style={styles.loadingWrap} pointerEvents="none">
          <RaqatOrnamentSpinner size={48} />
        </View>
      ) : null}
    </View>
  );
});
