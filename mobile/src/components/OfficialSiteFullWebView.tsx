import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Linking, Platform, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import type { WebView as WebViewType, WebViewNavigation } from "react-native-webview";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { kk } from "../i18n/kk";
import {
  OFFICIAL_SITE_NO_CACHE_HEADERS,
  OFFICIAL_SITE_SW_CACHE_PURGE_INJECT,
  clearOfficialSiteWebCache,
  withEmbeddedSiteCacheBust,
} from "./officialSiteWebViewReload";
import {
  OFFICIAL_SITE_DESKTOP_VIEWPORT_INJECT,
  OFFICIAL_SITE_MOBILE_VIEWPORT_INJECT,
  OFFICIAL_SITE_SPA_HISTORY_INJECT,
  buildOfficialSiteUserAgent,
  openEmbeddedSiteUrlExternally,
  shouldStayInOfficialSiteWebView,
  type OfficialSitePresentation,
} from "./embeddedOfficialSiteNavigation";

function viewportInjectFor(presentation: OfficialSitePresentation): string {
  return presentation === "desktop"
    ? OFFICIAL_SITE_DESKTOP_VIEWPORT_INJECT
    : OFFICIAL_SITE_MOBILE_VIEWPORT_INJECT;
}

function buildBeforeLoadInject(
  presentation: OfficialSitePresentation,
  forceFreshLoad: boolean
): string {
  const viewport = viewportInjectFor(presentation);
  const core = `${viewport}\n${OFFICIAL_SITE_SPA_HISTORY_INJECT}`;
  if (forceFreshLoad) return `${OFFICIAL_SITE_SW_CACHE_PURGE_INJECT}\n${core}`;
  return core;
}

function buildAfterLoadInject(presentation: OfficialSitePresentation): string {
  return `${viewportInjectFor(presentation)}\n${OFFICIAL_SITE_SPA_HISTORY_INJECT}`;
}

export type OfficialSiteFullWebViewHandle = {
  reload: () => void;
  canGoBack: () => boolean;
  goBack: () => void;
};

type Props = {
  url: string;
  colors: ThemeColors;
  title?: string;
  /** Осы домендер WebView ішінде қалады; қалған http(s) — сыртқы браузер. */
  allowedHosts: readonly string[];
  userAgentTag?: string;
  /** muftyat.kz — desktop UA + pinch-zoom (намаз жолағы, izdeu). */
  sitePresentation?: OfficialSitePresentation;
  /** @deprecated sitePresentation қолданыңыз */
  injectMobileViewport?: boolean;
  /** Экранға қайта оралғанда сайтты қайта жүктеу (әдепкі: false — кэш жылдам). */
  refreshOnFocus?: boolean;
  /** Жүктелгеннен кейін DOM-ға қосымша JS. */
  extraPageInject?: string;
};

/**
 * Ресми толық сайт WebView — мобильді UA, кэш, сілтеме сүзгісі, history back.
 * Қалыпты ашу: WebView кэші. Қолмен refresh: кэш тазалау + no-cache.
 */
export const OfficialSiteFullWebView = forwardRef<OfficialSiteFullWebViewHandle, Props>(
  function OfficialSiteFullWebView(
    {
      url,
      colors,
      title,
      allowedHosts,
      userAgentTag = "RaqatOfficialSite/1",
      sitePresentation: sitePresentationProp,
      injectMobileViewport = true,
      refreshOnFocus = false,
      extraPageInject,
    },
    ref
  ) {
    const sitePresentation: OfficialSitePresentation =
      sitePresentationProp ?? (injectMobileViewport ? "mobile" : "desktop");
    const webRef = useRef<WebViewType>(null);
    const focusBootRef = useRef(true);
    const reloadGenRef = useRef(0);
    const [sessionToken, setSessionToken] = useState(0);
    const [forceFreshLoad, setForceFreshLoad] = useState(false);
    const [webLoading, setWebLoading] = useState(true);
    const [webError, setWebError] = useState<string | null>(null);
    const [pullRefreshing, setPullRefreshing] = useState(false);
    const [historyCanGoBack, setHistoryCanGoBack] = useState(false);
    const [spaCanGoBack, setSpaCanGoBack] = useState(false);

    const resolvedUrl = useMemo(() => {
      if (forceFreshLoad && sessionToken > 0) {
        return withEmbeddedSiteCacheBust(url, sessionToken);
      }
      return url;
    }, [url, sessionToken, forceFreshLoad]);

    const webSource = useMemo(() => {
      if (forceFreshLoad) {
        return { uri: resolvedUrl, headers: OFFICIAL_SITE_NO_CACHE_HEADERS };
      }
      return { uri: resolvedUrl };
    }, [resolvedUrl, forceFreshLoad]);

    const webMountKey = sessionToken > 0 ? `session-${sessionToken}` : "boot";
    const userAgent = useMemo(
      () => buildOfficialSiteUserAgent(userAgentTag, sitePresentation),
      [userAgentTag, sitePresentation]
    );
    const isWeb = Platform.OS === "web";

    const styles = useMemo(
      () =>
        StyleSheet.create({
          root: { flex: 1, backgroundColor: colors.bg },
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
          },
          errorText: {
            color: colors.text,
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
            fontWeight: "700",
          },
          errorBtn: {
            minHeight: 42,
            borderRadius: 999,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: colors.accent,
          },
          errorBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
        }),
      [colors]
    );

    const bumpSession = useCallback(() => {
      reloadGenRef.current += 1;
      setSessionToken(Date.now() + reloadGenRef.current);
    }, []);

    const hardReloadHome = useCallback(() => {
      setWebError(null);
      setWebLoading(true);
      setPullRefreshing(true);
      setHistoryCanGoBack(false);
      setSpaCanGoBack(false);
      setForceFreshLoad(true);
      void clearOfficialSiteWebCache().finally(() => {
        bumpSession();
      });
    }, [bumpSession]);

    const softReloadPage = useCallback(() => {
      hardReloadHome();
    }, [hardReloadHome]);

    useFocusEffect(
      useCallback(() => {
        if (!refreshOnFocus || isWeb) return;
        if (focusBootRef.current) {
          focusBootRef.current = false;
          return;
        }
        hardReloadHome();
      }, [refreshOnFocus, isWeb, hardReloadHome])
    );

    const goBackInWebView = useCallback(() => {
      if (spaCanGoBack) {
        webRef.current?.injectJavaScript(`(function(){try{history.back();}catch(e){}})();true;`);
        return;
      }
      webRef.current?.goBack();
    }, [spaCanGoBack]);

    const canGoBackInWebView = useCallback(() => {
      try {
        if (webRef.current?.canGoBack()) return true;
      } catch {
        /* web ref әлі дайын емес */
      }
      return historyCanGoBack || spaCanGoBack;
    }, [historyCanGoBack, spaCanGoBack]);

    useImperativeHandle(
      ref,
      () => ({
        reload: hardReloadHome,
        canGoBack: canGoBackInWebView,
        goBack: goBackInWebView,
      }),
      [hardReloadHome, canGoBackInWebView, goBackInWebView]
    );

    const finishLoad = useCallback(() => {
      setWebLoading(false);
      setPullRefreshing(false);
    }, []);

    const markError = useCallback(() => {
      setWebLoading(false);
      setPullRefreshing(false);
      setWebError(kk.common.embeddedSiteError);
    }, []);

    const onNavigationStateChange = useCallback((nav: WebViewNavigation) => {
      setHistoryCanGoBack(Boolean(nav.canGoBack));
    }, []);

    const onWebMessage = useCallback((event: { nativeEvent: { data: string } }) => {
      try {
        const payload = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          canGoBack?: boolean;
        };
        if (payload.type === "raqat-spa-nav") {
          setSpaCanGoBack(Boolean(payload.canGoBack));
        }
      } catch {
        /* басқа postMessage */
      }
    }, []);

    const shouldStartLoad = useCallback(
      (ev: WebViewNavigation) => {
        const nextUrl = ev.url || "";
        if (shouldStayInOfficialSiteWebView(nextUrl, allowedHosts)) return true;
        openEmbeddedSiteUrlExternally(nextUrl);
        return false;
      },
      [allowedHosts]
    );

    const afterLoadInject = useMemo(
      () => buildAfterLoadInject(sitePresentation),
      [sitePresentation]
    );

    const beforeLoadInject = useMemo(
      () => buildBeforeLoadInject(sitePresentation, forceFreshLoad),
      [sitePresentation, forceFreshLoad]
    );

    const applyPageInject = useCallback(() => {
      webRef.current?.injectJavaScript(afterLoadInject);
      if (extraPageInject) {
        webRef.current?.injectJavaScript(extraPageInject);
      }
    }, [afterLoadInject, extraPageInject]);

    const combinedAfterLoadInject = useMemo(() => {
      const parts: string[] = [afterLoadInject.replace(/\ntrue;\s*$/, "")];
      if (extraPageInject) parts.push(extraPageInject.replace(/\ntrue;\s*$/, ""));
      return `${parts.join("\n")}\ntrue;`;
    }, [afterLoadInject, extraPageInject]);

    if (!resolvedUrl) {
      return (
        <View style={styles.loadingWrap}>
          <RaqatOrnamentSpinner size={48} />
        </View>
      );
    }

    return (
      <View style={styles.root}>
        {webError ? (
          <View style={styles.errorWrap}>
            <MaterialIcons name="public-off" size={38} color={colors.muted} />
            <Text style={styles.errorText}>{webError}</Text>
            <Pressable
              onPress={hardReloadHome}
              style={({ pressed }) => [styles.errorBtn, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.common.retry}
            >
              <MaterialIcons name="refresh" size={19} color="#FFFFFF" />
              <Text style={styles.errorBtnText}>{kk.common.retry}</Text>
            </Pressable>
          </View>
        ) : isWeb ? (
          React.createElement("iframe", {
            key: webMountKey,
            src: resolvedUrl,
            title: title ?? resolvedUrl,
            onLoad: finishLoad,
            style: { width: "100%", height: "100%", border: 0, flex: 1 },
          })
        ) : (
          <WebView
            ref={webRef}
            key={webMountKey}
            source={webSource}
            style={styles.web}
            userAgent={userAgent}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled={Platform.OS === "android"}
            cacheEnabled={!forceFreshLoad}
            cacheMode={forceFreshLoad ? "LOAD_NO_CACHE" : "LOAD_DEFAULT"}
            mixedContentMode="always"
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            setSupportMultipleWindows={false}
            nestedScrollEnabled
            androidLayerType="hardware"
            pullToRefreshEnabled
            refreshing={pullRefreshing}
            onRefresh={softReloadPage}
            onShouldStartLoadWithRequest={shouldStartLoad}
            onNavigationStateChange={onNavigationStateChange}
            onMessage={onWebMessage}
            injectedJavaScriptBeforeContentLoaded={beforeLoadInject}
            injectedJavaScript={combinedAfterLoadInject}
            onLoadEnd={() => {
              applyPageInject();
              finishLoad();
            }}
            onError={markError}
            onHttpError={markError}
            onRenderProcessGone={() => {
              markError();
              return true;
            }}
            onContentProcessDidTerminate={markError}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loadingWrap}>
                <RaqatOrnamentSpinner size={48} />
              </View>
            )}
          />
        )}
        {webLoading && !webError ? (
          <View style={styles.loadingWrap} pointerEvents="none">
            <RaqatOrnamentSpinner size={48} />
          </View>
        ) : null}
      </View>
    );
  }
);

/** @deprecated OfficialSiteFullWebView қолданыңыз */
export const HalalDamuFullSiteWebView = OfficialSiteFullWebView;
export type HalalDamuFullSiteWebViewHandle = OfficialSiteFullWebViewHandle;
