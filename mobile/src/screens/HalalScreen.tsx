import React, { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { Linking, Platform, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  OfficialSiteFullWebView,
  type OfficialSiteFullWebViewHandle,
} from "../components/OfficialSiteFullWebView";
import { HALAL_DAMU_WEBVIEW_HOSTS } from "../components/embeddedOfficialSiteNavigation";
import { halalDamuSiteHomeUrl } from "../api/halalDamuWp";
import { useOfficialSiteWebViewScreenBack } from "../hooks/useOfficialSiteWebViewScreenBack";
import { useAppLocale } from "../i18n/runtime";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/ThemeContext";
import { domainSettingsHeaderRightContainerStyle } from "../components/settings/DomainSettingsHeaderButton";

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Halal">;
};

const HEADER_BTN = 36;

/**
 * ХАЛАЛ ДАМУ — ресми halaldamu.kz толық сайты (WebView).
 */
export function HalalScreen({ navigation }: Props) {
  useAppLocale();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const siteUrl = useMemo(() => halalDamuSiteHomeUrl(), []);
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
            accessibilityLabel={kk.features.halalRefreshA11y}
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
  }, [navigation, colors, insets, onReload, openInBrowser]);

  return (
    <OfficialSiteFullWebView
      ref={webRef}
      url={siteUrl}
      colors={colors}
      title={kk.features.halalTitle}
      allowedHosts={HALAL_DAMU_WEBVIEW_HOSTS}
      userAgentTag="RaqatHalalDamu/1"
      refreshOnFocus={false}
    />
  );
}
