import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { FATUA_WEBVIEW_HOSTS, MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT, MUFTYAT_WEBVIEW_HOSTS } from "../embeddedOfficialSiteNavigation";
import {
  OfficialSiteFullWebView,
  type OfficialSiteFullWebViewHandle,
} from "../OfficialSiteFullWebView";
import { HalalSegmentedTabs } from "../halal/HalalSegmentedTabs";
import { NearbyMosquesPanel } from "./NearbyMosquesPanel";
import { FATUA_KK_HOME_URL, MUFTYAT_KK_HOME_URL } from "../../config/officialIslamicSources";
import { kk, FATUA_KZ_LABEL_KK, MUFTYAT_KZ_LABEL_KK } from "../../i18n/kk";
import { openOfficialSiteExternally } from "../../config/officialSiteProxy";
import type { ThemeColors } from "../../theme/colors";

export type KmdbHubTab = "muftyat" | "fatua" | "mosques";

type WebTabId = "muftyat" | "fatua";

type WebTabConfig = {
  id: WebTabId;
  url: string;
  hosts: readonly string[];
  tag: string;
  title: string;
  refreshA11y: string;
  openA11y: string;
  sitePresentation: "mobile" | "desktop";
  extraPageInject?: string;
};

type Props = {
  colors: ThemeColors;
  inlineToolbar?: boolean;
  webViewRef?: React.RefObject<OfficialSiteFullWebViewHandle | null>;
  tab?: KmdbHubTab;
  onTabChange?: (tab: KmdbHubTab) => void;
};

const HEADER_BTN = 36;

const WEB_TABS: WebTabConfig[] = [
  {
    id: "muftyat",
    url: MUFTYAT_KK_HOME_URL,
    hosts: MUFTYAT_WEBVIEW_HOSTS,
    tag: "RaqatMuftyat/1",
    title: MUFTYAT_KZ_LABEL_KK,
    refreshA11y: kk.kmdbHub.muftyatRefreshA11y,
    openA11y: kk.kmdbHub.openMuftyatA11y,
    sitePresentation: "desktop",
    extraPageInject: MUFTYAT_EMBED_HIDE_PRAYER_BAR_INJECT,
  },
  {
    id: "fatua",
    url: FATUA_KK_HOME_URL,
    hosts: FATUA_WEBVIEW_HOSTS,
    tag: "RaqatFatua/1",
    title: FATUA_KZ_LABEL_KK,
    refreshA11y: kk.kmdbHub.fatuaRefreshA11y,
    openA11y: kk.kmdbHub.openFatuaA11y,
    sitePresentation: "mobile",
  },
];

function addVisitedTab(prev: Set<WebTabId>, next: WebTabId): Set<WebTabId> {
  if (prev.has(next)) return prev;
  const out = new Set(prev);
  out.add(next);
  return out;
}

/** ҚМДБ — Muftyat / Fatua WebView + жақын мешіттер (native). Lazy mount: бір уақытта бір WebView. */
export function KmdbOfficialSitesPanel({
  colors,
  inlineToolbar = false,
  webViewRef,
  tab: controlledTab,
  onTabChange,
}: Props) {
  const muftyatRef = useRef<OfficialSiteFullWebViewHandle>(null);
  const fatuaRef = useRef<OfficialSiteFullWebViewHandle>(null);
  const webRefs: Record<WebTabId, React.RefObject<OfficialSiteFullWebViewHandle | null>> = {
    muftyat: muftyatRef,
    fatua: fatuaRef,
  };

  const [internalTab, setInternalTab] = useState<KmdbHubTab>("muftyat");
  const tab = controlledTab ?? internalTab;
  const [mountedWebTabs, setMountedWebTabs] = useState<Set<WebTabId>>(() => new Set(["muftyat"]));
  const [mosquesMounted, setMosquesMounted] = useState(false);

  useEffect(() => {
    if (tab === "muftyat" || tab === "fatua") {
      setMountedWebTabs((prev) => addVisitedTab(prev, tab));
    }
    if (tab === "mosques") setMosquesMounted(true);
  }, [tab]);

  const setTab = useCallback(
    (next: KmdbHubTab) => {
      if (onTabChange) onTabChange(next);
      else setInternalTab(next);
    },
    [onTabChange]
  );

  const isWebViewTab = tab === "muftyat" || tab === "fatua";
  const activeWebTab = tab === "fatua" ? "fatua" : "muftyat";
  const siteConfig = useMemo(
    () => WEB_TABS.find((s) => s.id === activeWebTab) ?? WEB_TABS[0]!,
    [activeWebTab]
  );

  useImperativeHandle(
    webViewRef,
    () => ({
      reload: () => {
        if (tab === "mosques") return;
        webRefs[activeWebTab].current?.reload();
      },
      canGoBack: () => {
        if (tab === "mosques") return false;
        return webRefs[activeWebTab].current?.canGoBack() ?? false;
      },
      goBack: () => {
        if (tab === "mosques") return;
        webRefs[activeWebTab].current?.goBack();
      },
    }),
    [tab, activeWebTab]
  );

  const onReload = useCallback(() => {
    if (tab === "mosques") return;
    webRefs[activeWebTab].current?.reload();
  }, [tab, activeWebTab]);

  const openInBrowser = useCallback(() => {
    if (tab === "mosques") return;
    openOfficialSiteExternally(siteConfig.url);
  }, [tab, siteConfig.url]);

  const tabs = useMemo(
    () => [
      { id: "muftyat" as const, label: MUFTYAT_KZ_LABEL_KK },
      { id: "fatua" as const, label: FATUA_KZ_LABEL_KK },
      { id: "mosques" as const, label: kk.kmdbHub.tabMosques },
    ],
    []
  );

  return (
    <View style={styles.root}>
      {inlineToolbar && isWebViewTab ? (
        <View style={styles.inlineToolbar}>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={onReload}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.72 }]}
            accessibilityRole="button"
            accessibilityLabel={siteConfig.refreshA11y}
          >
            <MaterialIcons name="refresh" size={22} color={colors.accent} />
          </Pressable>
          <Pressable
            onPress={openInBrowser}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.72 }]}
            accessibilityRole="button"
            accessibilityLabel={siteConfig.openA11y}
          >
            <MaterialIcons name="open-in-new" size={22} color={colors.accent} />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.tabBar}>
        <HalalSegmentedTabs tabs={tabs} value={tab} onChange={setTab} colors={colors} />
      </View>
      <View style={styles.body}>
        <View
          style={[styles.layer, tab === "mosques" ? styles.layerActive : styles.layerHidden]}
          pointerEvents={tab === "mosques" ? "auto" : "none"}
        >
          {mosquesMounted ? <NearbyMosquesPanel active={tab === "mosques"} colors={colors} /> : null}
        </View>
        <View
          style={[styles.layer, isWebViewTab ? styles.layerActive : styles.layerHidden]}
          pointerEvents={isWebViewTab ? "auto" : "none"}
        >
          <View style={styles.webStack}>
            {WEB_TABS.filter((site) => mountedWebTabs.has(site.id)).map((site) => (
              <View
                key={site.id}
                style={[styles.webLayer, activeWebTab === site.id ? styles.webLayerActive : styles.webLayerHidden]}
                pointerEvents={activeWebTab === site.id ? "auto" : "none"}
              >
                <OfficialSiteFullWebView
                  ref={webRefs[site.id]}
                  url={site.url}
                  colors={colors}
                  title={site.title}
                  allowedHosts={site.hosts}
                  userAgentTag={site.tag}
                  sitePresentation={site.sitePresentation}
                  extraPageInject={site.extraPageInject}
                  refreshOnFocus={false}
                />
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
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
  body: { flex: 1, position: "relative" },
  layer: { ...StyleSheet.absoluteFillObject },
  layerActive: { opacity: 1, zIndex: 1 },
  layerHidden: { opacity: 0, zIndex: 0 },
  webStack: { flex: 1, position: "relative" },
  webLayer: { ...StyleSheet.absoluteFillObject },
  webLayerActive: { opacity: 1, zIndex: 1 },
  webLayerHidden: { opacity: 0, zIndex: 0 },
});
