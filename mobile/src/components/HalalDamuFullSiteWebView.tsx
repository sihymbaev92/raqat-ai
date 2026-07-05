import React, {
  forwardRef,
  useCallback,
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
import {
  shouldLoadEmbeddedSiteUrl,
  shouldOpenEmbeddedSiteUrlExternally,
  withEmbeddedSiteCacheBust,
} from "./EmbeddedSiteWebView";

/** halaldamu.kz мобильді нұсқасы — толық сайт WebView-да. */
const HALAL_DAMU_MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 RaqatHalalDamu/1";

export type HalalDamuFullSiteWebViewHandle = {
  /** Басты бетті кэшсіз қайта жүктейді. */
  reload: () => void;
};

type Props = {
  url: string;
  colors: ThemeColors;
  title?: string;
};

/**
 * halaldamu.kz толық сайты — CSS/JS инъекциясыз, кэшсіз, мобильді UA.
 */
export const HalalDamuFullSiteWebView = forwardRef<HalalDamuFullSiteWebViewHandle, Props>(
  function HalalDamuFullSiteWebView({ url, colors, title }, ref) {
    const webRef = useRef<WebViewType>(null);
    const [sessionToken, setSessionToken] = useState(0);
    const [webLoading, setWebLoading] = useState(true);
    const [webError, setWebError] = useState<string | null>(null);
    const [pullRefreshing, setPullRefreshing] = useState(false);
    const resolvedUrl = useMemo(
      () => withEmbeddedSiteCacheBust(url, sessionToken),
      [url, sessionToken]
    );
    const webMountKey = sessionToken > 0 ? `session-${sessionToken}` : "initial";
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

    const hardReloadHome = useCallback(() => {
      setWebError(null);
      setWebLoading(true);
      setPullRefreshing(true);
      setSessionToken(Date.now());
    }, []);

    const softReloadPage = useCallback(() => {
      setWebError(null);
      setWebLoading(true);
      setPullRefreshing(true);
      webRef.current?.reload();
    }, []);

    useImperativeHandle(ref, () => ({ reload: hardReloadHome }), [hardReloadHome]);

    const finishLoad = useCallback(() => {
      setWebLoading(false);
      setPullRefreshing(false);
    }, []);

    const markError = useCallback(() => {
      setWebLoading(false);
      setPullRefreshing(false);
      setWebError(kk.common.embeddedSiteError);
    }, []);

    const shouldStartLoad = useCallback((ev: WebViewNavigation) => {
      const nextUrl = ev.url || "";
      if (shouldLoadEmbeddedSiteUrl(nextUrl)) return true;
      if (shouldOpenEmbeddedSiteUrlExternally(nextUrl)) {
        void Linking.openURL(nextUrl).catch(() => {});
      }
      return false;
    }, []);

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
            title: title ?? "halaldamu.kz",
            onLoad: finishLoad,
            style: { width: "100%", height: "100%", border: 0, flex: 1 },
          })
        ) : (
          <WebView
            ref={webRef}
            key={webMountKey}
            source={{ uri: resolvedUrl }}
            style={styles.web}
            userAgent={HALAL_DAMU_MOBILE_UA}
            incognito
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled={Platform.OS === "android"}
            cacheEnabled={false}
            cacheMode="LOAD_NO_CACHE"
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
            onLoadEnd={finishLoad}
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
