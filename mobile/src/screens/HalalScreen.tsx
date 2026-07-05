import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HalalCatalogTabPanel } from "../components/halal/HalalCatalogTabPanel";
import { HalalSegmentedTabs } from "../components/halal/HalalSegmentedTabs";
import { HalalVerifyTabPanel } from "../components/halal/HalalVerifyTabPanel";
import { HubScreenHero } from "../components/HubScreenHero";
import {
  OfficialSiteFullWebView,
  type OfficialSiteFullWebViewHandle,
} from "../components/OfficialSiteFullWebView";
import { HALAL_DAMU_WEBVIEW_HOSTS } from "../components/embeddedOfficialSiteNavigation";
import { halalDamuSiteHomeUrl } from "../api/halalDamuWp";
import {
  getHalalHubWebTabs,
  HALAL_HUB_WEB_TAB_DEFAULT,
  halalHubWebTabById,
  halalHubWebTabUsesWebView,
  type HalalHubWebTabId,
} from "../config/halalHubWebTabs";
import { useOfficialSiteWebViewScreenBack } from "../hooks/useOfficialSiteWebViewScreenBack";
import { useAppLocale } from "../i18n/runtime";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { menuIconAssets } from "../theme/menuIconAssets";
import { useAppTheme } from "../theme/ThemeContext";
import { domainSettingsHeaderRightContainerStyle } from "../components/settings/DomainSettingsHeaderButton";

type Props = {
  navigation: NativeStackNavigationProp<MoreStackParamList, "Halal">;
};

const HEADER_BTN = 36;

/**
 * ХАЛАЛ ДАМУ — halaldamu.kz (WebView), Мекемелер каталогы, өнім тексеру.
 */
export function HalalScreen({ navigation }: Props) {
  useAppLocale();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabs = useMemo(() => getHalalHubWebTabs(), []);
  const [activeTabId, setActiveTabId] = useState<HalalHubWebTabId>(HALAL_HUB_WEB_TAB_DEFAULT);
  const activeTab = useMemo(
    () => halalHubWebTabById(activeTabId, tabs),
    [activeTabId, tabs],
  );
  const siteUrl = useMemo(() => halalDamuSiteHomeUrl(), []);
  const webRef = useRef<OfficialSiteFullWebViewHandle>(null);
  const isSiteTab = halalHubWebTabUsesWebView(activeTabId);
  const showHubHero = activeTabId === "institutions" || activeTabId === "verify";

  const [siteWebMounted, setSiteWebMounted] = useState(false);
  useEffect(() => {
    if (isSiteTab) setSiteWebMounted(true);
  }, [isSiteTab]);

  useOfficialSiteWebViewScreenBack(navigation, webRef, isSiteTab);

  const onReload = useCallback(() => {
    webRef.current?.reload();
  }, []);

  const openInBrowser = useCallback(() => {
    void Linking.openURL(siteUrl);
  }, [siteUrl]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: isSiteTab
        ? () => (
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
          )
        : undefined,
    });
  }, [navigation, colors, insets, onReload, openInBrowser, isSiteTab]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.bg },
        tabBar: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
        heroWrap: { paddingHorizontal: 12, paddingBottom: 4 },
        body: { flex: 1, minHeight: 0 },
        webPane: { flex: 1, minHeight: 0 },
        panel: { flex: 1, minHeight: 0 },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.tabBar}>
        <HalalSegmentedTabs tabs={tabs} value={activeTabId} onChange={setActiveTabId} colors={colors} />
      </View>
      {showHubHero ? (
        <View style={styles.heroWrap}>
          <HubScreenHero
            variant="halal"
            title={kk.features.halalTitle}
            image={menuIconAssets.tileHalal}
            colors={colors}
            isDark={isDark}
            eyebrow="halaldamu.kz"
            compact
            tags={[kk.features.halalHeroTagRegistry, kk.features.halalHeroTagVerify]}
          />
        </View>
      ) : null}
      <View style={styles.body}>
        {isSiteTab && siteWebMounted ? (
          <View style={styles.webPane}>
            <OfficialSiteFullWebView
              ref={webRef}
              url={siteUrl}
              colors={colors}
              title={activeTab.label}
              allowedHosts={HALAL_DAMU_WEBVIEW_HOSTS}
              userAgentTag="RaqatHalalDamu/1"
              sitePresentation="mobile"
              refreshOnFocus={false}
            />
          </View>
        ) : activeTabId === "institutions" ? (
          <View style={styles.panel}>
            <HalalCatalogTabPanel active colors={colors} />
          </View>
        ) : (
          <View style={styles.panel}>
            <HalalVerifyTabPanel colors={colors} isDark={isDark} insets={insets} />
          </View>
        )}
      </View>
    </View>
  );
}
