import React, { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { Linking, Platform, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  OfficialSiteFullWebView,
  type OfficialSiteFullWebViewHandle,
} from "../components/OfficialSiteFullWebView";
import {
  FATUA_WEBVIEW_HOSTS,
  MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT,
  MUFTYAT_WEBVIEW_HOSTS,
} from "../components/embeddedOfficialSiteNavigation";
import {
  officialIslamicSourceHomeUrl,
  type OfficialIslamicSourceId,
} from "../config/officialIslamicSources";
import { useOfficialSiteWebViewScreenBack } from "../hooks/useOfficialSiteWebViewScreenBack";
import { useAppLocale } from "../i18n/runtime";
import { FATUA_KZ_LABEL_KK, kk, MUFTYAT_KZ_LABEL_KK } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/ThemeContext";
import { domainSettingsHeaderRightContainerStyle } from "../components/settings/DomainSettingsHeaderButton";

type Props = NativeStackScreenProps<MoreStackParamList, "OfficialIslamicWeb">;

const HEADER_BTN = 36;

function screenTitleForSite(site: OfficialIslamicSourceId): string {
  return site === "fatua" ? FATUA_KZ_LABEL_KK : MUFTYAT_KZ_LABEL_KK;
}

function refreshA11yForSite(site: OfficialIslamicSourceId): string {
  return site === "fatua" ? kk.kmdbHub.openFatuaA11y : kk.kmdbHub.muftyatRefreshA11y;
}

/**
 * ҚМДБ ресми сайттары — Fatua.kz / Muftyat.kz толық WebView (halaldamu.kz сияқты).
 */
export function OfficialIslamicWebScreen({ navigation, route }: Props) {
  const locale = useAppLocale();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const site = route.params.site;
  const siteUrl = useMemo(
    () => (route.params.url?.trim() || officialIslamicSourceHomeUrl(site, locale)),
    [route.params.url, site, locale]
  );
  const allowedHosts = site === "fatua" ? FATUA_WEBVIEW_HOSTS : MUFTYAT_WEBVIEW_HOSTS;
  const webRef = useRef<OfficialSiteFullWebViewHandle>(null);

  useOfficialSiteWebViewScreenBack(navigation, webRef);

  const onReload = useCallback(() => {
    webRef.current?.reload();
  }, []);

  const openInBrowser = useCallback(() => {
    void Linking.openURL(siteUrl);
  }, [siteUrl]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: screenTitleForSite(site),
      headerRight: () => (
        <View style={[domainSettingsHeaderRightContainerStyle(insets), { flexDirection: "row", gap: 2 }]}>
          <Pressable
            onPress={onReload}
            style={({ pressed }) => ({
              width: HEADER_BTN,
              height: HEADER_BTN,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.72 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel={refreshA11yForSite(site)}
          >
            <MaterialIcons name="refresh" size={22} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={openInBrowser}
            style={({ pressed }) => ({
              width: HEADER_BTN,
              height: HEADER_BTN,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.72 : 1,
              marginRight: Platform.OS === "web" ? 4 : 0,
            })}
            accessibilityRole="button"
            accessibilityLabel={kk.common.openInBrowser}
          >
            <MaterialIcons name="open-in-new" size={22} color={colors.accent} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, colors, insets, onReload, openInBrowser, site, locale]);

  return (
    <OfficialSiteFullWebView
      ref={webRef}
      url={siteUrl}
      colors={colors}
      title={screenTitleForSite(site)}
      allowedHosts={allowedHosts}
      userAgentTag={site === "fatua" ? "RaqatFatua/1" : "RaqatMuftyat/1"}
      sitePresentation={site === "muftyat" ? "desktop" : "mobile"}
      extraPageInject={site === "muftyat" ? MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT : undefined}
      refreshOnFocus={false}
    />
  );
}
