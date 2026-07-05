import React, { useCallback, useRef } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import {
  OfficialSiteFullWebView,
  type OfficialSiteFullWebViewHandle,
} from "../OfficialSiteFullWebView";
import { HALAL_DAMU_WEBVIEW_HOSTS } from "../embeddedOfficialSiteNavigation";
import { kk } from "../../i18n/kk";
import { useI18n } from "../../i18n/useI18n";

type Props = {
  colors: ThemeColors;
  siteUrl: string;
};

/** halaldamu.kz — қолданба ішінде толық WebView (1-таб). */
export function HalalDamuWebTabPanel({ colors, siteUrl }: Props) {
  useI18n();
  const webRef = useRef<OfficialSiteFullWebViewHandle>(null);

  const onReload = useCallback(() => {
    webRef.current?.reload();
  }, []);

  const openInBrowser = useCallback(() => {
    void Linking.openURL(siteUrl);
  }, [siteUrl]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.toolbar, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          onPress={onReload}
          style={({ pressed }) => [styles.toolBtn, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.features.halalRefreshA11y}
        >
          <MaterialIcons name="refresh" size={22} color={colors.accent} />
        </Pressable>
        <Pressable
          onPress={openInBrowser}
          style={({ pressed }) => [styles.toolBtn, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel={kk.common.openInBrowser}
        >
          <MaterialIcons name="open-in-new" size={22} color={colors.accent} />
        </Pressable>
      </View>
      <View style={styles.webWrap}>
        <OfficialSiteFullWebView
          ref={webRef}
          url={siteUrl}
          colors={colors}
          title="halaldamu.kz"
          allowedHosts={HALAL_DAMU_WEBVIEW_HOSTS}
          userAgentTag="RaqatHalalDamu/1"
          sitePresentation="desktop"
          refreshOnFocus={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 8 : 4,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toolBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  webWrap: {
    flex: 1,
    minHeight: 320,
    borderRadius: 14,
    overflow: "hidden",
  },
});
