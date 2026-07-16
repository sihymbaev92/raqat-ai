import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  OfficialSiteFullWebView,
  type OfficialSiteFullWebViewHandle,
} from "../components/OfficialSiteFullWebView";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { prefetchOfficialSiteWebPages } from "../components/officialSiteWebViewReload";
import {
  getKmdbHubWebTabs,
  KMDB_HUB_WEB_TAB_DEFAULT,
  kmdbHubWebTabById,
  kmdbHubWebTabAllowedHosts,
  kmdbHubWebTabExtraPageInject,
  kmdbHubWebTabSitePresentation,
  kmdbHubWebTabUsesWebView,
  type KmdbHubWebTabId,
} from "../config/kmdbHubWebTabs";
import { FATUA_KK_HOME_URL } from "../config/officialIslamicSources";
import { prefetchMosques2gisCatalog } from "../data/mosques2gisCatalog";
import { useOfficialSiteWebViewScreenBack } from "../hooks/useOfficialSiteWebViewScreenBack";
import { useAppLocale } from "../i18n/runtime";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { useAppTheme } from "../theme/ThemeContext";
import { domainSettingsHeaderRightContainerStyle } from "../components/settings/DomainSettingsHeaderButton";
import { runAfterInteractions } from "../utils/uiDefer";

const NearbyMosquesPanel = lazy(() =>
  import("../components/kmdb/NearbyMosquesPanel").then((m) => ({ default: m.NearbyMosquesPanel }))
);

type Props = NativeStackScreenProps<MoreStackParamList, "KmdbHub">;

type KmdbWebTabId = "muftyat" | "fatua";

const HEADER_BTN = 36;
const WEB_TAB_IDS: readonly KmdbWebTabId[] = ["muftyat", "fatua"];

function initialWebTabId(tab: KmdbHubWebTabId): KmdbWebTabId | null {
  return tab === "muftyat" || tab === "fatua" ? tab : null;
}

function addVisitedWebTab(prev: Set<KmdbWebTabId>, next: KmdbWebTabId): Set<KmdbWebTabId> {
  if (prev.has(next)) return prev;
  const out = new Set(prev);
  out.add(next);
  return out;
}

/**
 * ҚМДБ — Muftyat.kz, Fatua.kz (WebView) және Мешіттер (2GIS каталог).
 * Бірінші ашылуда тек белсенді WebView; басқа табтар кейін mount.
 */
export function KmdbHubScreen({ navigation, route }: Props) {
  const locale = useAppLocale();
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabs = useMemo(() => getKmdbHubWebTabs(), [locale]);
  const [activeTabId, setActiveTabId] = useState<KmdbHubWebTabId>(
    () => route.params?.initialTab ?? KMDB_HUB_WEB_TAB_DEFAULT
  );
  const [mountedWebTabs, setMountedWebTabs] = useState<Set<KmdbWebTabId>>(() => {
    const web = initialWebTabId(route.params?.initialTab ?? KMDB_HUB_WEB_TAB_DEFAULT);
    return web ? new Set([web]) : new Set();
  });
  const [mosquesPaneKey, setMosquesPaneKey] = useState(0);
  const [mosquesMounted, setMosquesMounted] = useState(
    () => (route.params?.initialTab ?? KMDB_HUB_WEB_TAB_DEFAULT) === "mosques"
  );

  const activeTab = useMemo(() => kmdbHubWebTabById(activeTabId, tabs), [activeTabId, tabs]);
  const usesWebView = kmdbHubWebTabUsesWebView(activeTabId);
  const muftyatRef = useRef<OfficialSiteFullWebViewHandle>(null);
  const fatuaRef = useRef<OfficialSiteFullWebViewHandle>(null);
  const activeWebRef = activeTabId === "fatua" ? fatuaRef : muftyatRef;

  useOfficialSiteWebViewScreenBack(navigation, activeWebRef, usesWebView);

  useEffect(() => {
    void prefetchOfficialSiteWebPages([FATUA_KK_HOME_URL]);
    void prefetchMosques2gisCatalog();
    const task = runAfterInteractions(() => {
      void import("../components/kmdb/NearbyMosquesPanel");
    }, 1200);
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (activeTabId === "muftyat" || activeTabId === "fatua") {
      setMountedWebTabs((prev) => addVisitedWebTab(prev, activeTabId));
    }
    if (activeTabId === "mosques") setMosquesMounted(true);
  }, [activeTabId]);

  useFocusEffect(
    useCallback(() => {
      if (activeTabId === "muftyat" || activeTabId === "fatua") {
        setMountedWebTabs((prev) => addVisitedWebTab(prev, activeTabId));
      }
      if (activeTabId === "mosques") setMosquesMounted(true);
      return () => {
        setMountedWebTabs(new Set());
        setMosquesMounted(false);
        void import("../data/mosques2gisCatalog").then((m) => m.releaseMosques2gisCatalogMemory());
      };
    }, [activeTabId])
  );

  const onReload = useCallback(() => {
    if (usesWebView) {
      activeWebRef.current?.reload();
      return;
    }
    setMosquesPaneKey((k) => k + 1);
  }, [activeWebRef, usesWebView]);

  const openInBrowser = useCallback(() => {
    void Linking.openURL(activeTab.url);
  }, [activeTab.url]);

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
            accessibilityLabel={kk.kmdbHub.muftyatRefreshA11y}
          >
            <MaterialIcons name="refresh" size={22} color={colors.accent} />
          </Pressable>
          {usesWebView ? (
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
          ) : null}
        </View>
      ),
    });
  }, [navigation, colors, insets, onReload, openInBrowser, usesWebView, locale]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.bg },
        tabRow: {
          flexDirection: "row",
          gap: 6,
          paddingHorizontal: 10,
          paddingTop: 6,
          paddingBottom: 0,
          backgroundColor: colors.bg,
        },
        tabChip: {
          flex: 1,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          borderRadius: 999,
          paddingVertical: 8,
          paddingHorizontal: 6,
          alignItems: "center",
          justifyContent: "center",
          minHeight: 34,
        },
        tabChipActive: {
          borderColor: colors.accent,
          backgroundColor: colors.accentSurface,
        },
        tabTxt: {
          color: colors.muted,
          fontSize: 12,
          fontWeight: "700",
          textAlign: "center",
        },
        tabTxtActive: { color: colors.accent, fontWeight: "900" },
        webPane: {
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          position: "relative",
        },
        webStack: { ...StyleSheet.absoluteFillObject },
        webLayer: { ...StyleSheet.absoluteFillObject },
        webLayerActive: { opacity: 1, zIndex: 1 },
        webLayerHidden: { opacity: 0, zIndex: 0 },
        mosquesLayer: { ...StyleSheet.absoluteFillObject },
        bootWrap: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
          gap: 8,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.root}>
      <View style={styles.tabRow} accessibilityRole="tablist">
        {tabs.map((tab) => {
          const selected = tab.id === activeTabId;
          return (
            <Pressable
              key={tab.id}
              style={({ pressed }) => [
                styles.tabChip,
                selected && styles.tabChipActive,
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => setActiveTabId(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={tab.label}
            >
              <Text style={[styles.tabTxt, selected && styles.tabTxtActive]} numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.webPane}>
        <View
          style={[
            styles.webStack,
            activeTabId === "mosques" ? styles.webLayerHidden : styles.webLayerActive,
          ]}
          pointerEvents={activeTabId === "mosques" ? "none" : "auto"}
        >
          {WEB_TAB_IDS.filter((id) => mountedWebTabs.has(id)).map((id) => {
            const tab = kmdbHubWebTabById(id, tabs);
            const isActive = activeTabId === id;
            return (
              <View
                key={id}
                style={[styles.webLayer, isActive ? styles.webLayerActive : styles.webLayerHidden]}
                pointerEvents={isActive ? "auto" : "none"}
              >
                <OfficialSiteFullWebView
                  ref={id === "muftyat" ? muftyatRef : fatuaRef}
                  url={tab.url}
                  colors={colors}
                  title={tab.title}
                  allowedHosts={kmdbHubWebTabAllowedHosts(id)}
                  userAgentTag={tab.userAgentTag}
                  sitePresentation={kmdbHubWebTabSitePresentation(id, windowWidth)}
                  extraPageInject={kmdbHubWebTabExtraPageInject(id)}
                  refreshOnFocus={false}
                />
              </View>
            );
          })}
        </View>
        {mosquesMounted ? (
          <View
            style={[
              styles.mosquesLayer,
              activeTabId === "mosques" ? styles.webLayerActive : styles.webLayerHidden,
            ]}
            pointerEvents={activeTabId === "mosques" ? "auto" : "none"}
          >
            <Suspense
              fallback={
                <View style={styles.bootWrap}>
                  <RaqatOrnamentSpinner size={44} />
                </View>
              }
            >
              <NearbyMosquesPanel
                key={`mosques-${mosquesPaneKey}`}
                active={activeTabId === "mosques"}
                colors={colors}
              />
            </Suspense>
          </View>
        ) : null}
      </View>
    </View>
  );
}
