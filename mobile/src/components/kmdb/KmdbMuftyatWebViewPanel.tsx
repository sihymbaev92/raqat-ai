import React, { useCallback, useImperativeHandle, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { MUFTYAT_WEBVIEW_HOSTS } from "../embeddedOfficialSiteNavigation";
import {
  OfficialSiteFullWebView,
  type OfficialSiteFullWebViewHandle,
} from "../OfficialSiteFullWebView";
import { MUFTYAT_KK_HOME_URL } from "../../config/officialIslamicSources";
import { kk, MUFTYAT_KZ_LABEL_KK } from "../../i18n/kk";
import { openOfficialSiteExternally } from "../../config/officialSiteProxy";
import type { ThemeColors } from "../../theme/colors";

type Props = {
  colors: ThemeColors;
  /** Stack header жоқ экранда — жаңарту/браузер жолы. */
  inlineToolbar?: boolean;
  webViewRef?: React.RefObject<OfficialSiteFullWebViewHandle | null>;
};

const HEADER_BTN = 36;

/** ҚМДБ — Muftyat.kz ресми сайты (WebView). */
export function KmdbMuftyatWebViewPanel({ colors, inlineToolbar = false, webViewRef }: Props) {
  const internalRef = useRef<OfficialSiteFullWebViewHandle>(null);
  const webRef = webViewRef ?? internalRef;

  useImperativeHandle(webViewRef, () => ({
    reload: () => webRef.current?.reload(),
    canGoBack: () => webRef.current?.canGoBack() ?? false,
    goBack: () => webRef.current?.goBack(),
  }));

  const onReload = useCallback(() => {
    webRef.current?.reload();
  }, [webRef]);

  const openInBrowser = useCallback(() => {
    openOfficialSiteExternally(MUFTYAT_KK_HOME_URL);
  }, []);

  return (
    <View style={styles.root}>
      {inlineToolbar ? (
        <View style={styles.inlineToolbar}>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={onReload}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.72 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.kmdbHub.muftyatRefreshA11y}
          >
            <MaterialIcons name="refresh" size={22} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={openInBrowser}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.72 }]}
            accessibilityRole="button"
            accessibilityLabel={kk.kmdbHub.openMuftyatA11y}
          >
            <MaterialIcons name="open-in-new" size={22} color={colors.accent} />
          </Pressable>
        </View>
      ) : null}
      <OfficialSiteFullWebView
        ref={webRef}
        url={MUFTYAT_KK_HOME_URL}
        colors={colors}
        title={MUFTYAT_KZ_LABEL_KK}
        allowedHosts={MUFTYAT_WEBVIEW_HOSTS}
        userAgentTag="RaqatMuftyat/1"
        sitePresentation="desktop"
        refreshOnFocus={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inlineToolbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: Platform.OS === "ios" ? 4 : 8,
    gap: 2,
  },
  headerBtn: {
    width: HEADER_BTN,
    height: HEADER_BTN,
    alignItems: "center",
    justifyContent: "center",
  },
});
