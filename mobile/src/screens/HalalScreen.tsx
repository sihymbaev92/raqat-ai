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
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  type HalalDamuCompanyCard,
  halalDamuSiteHomeUrl,
  fetchHalalDamuCompanyFull,
} from "../api/halalDamuWp";
import {
  HalalCompaniesMapModal,
  type HalalCompaniesMapModalStrings,
} from "../components/HalalCompaniesMapModal";
import { HalalCompanyDetailSheet } from "../components/halal/HalalCompanyDetailSheet";
import { isHalalMapCompanyStub } from "../utils/halalCompanyStub";
import { HalalSegmentedTabs } from "../components/halal/HalalSegmentedTabs";
import { HubScreenHero } from "../components/HubScreenHero";
import {
  OfficialSiteFullWebView,
  type OfficialSiteFullWebViewHandle,
} from "../components/OfficialSiteFullWebView";
import { HALAL_DAMU_WEBVIEW_HOSTS } from "../components/embeddedOfficialSiteNavigation";
import {
  getHalalHubWebTabs,
  HALAL_HUB_WEB_TAB_DEFAULT,
  halalHubWebTabById,
  halalHubWebTabUsesWebView,
  type HalalHubWebTabId,
} from "../config/halalHubWebTabs";
import { useOfficialSiteWebViewScreenBack } from "../hooks/useOfficialSiteWebViewScreenBack";
import { useAppLocale, useLocaleRevision } from "../i18n/runtime";
import { kk } from "../i18n/kk";
import type { MoreStackParamList } from "../navigation/types";
import { getHalalHubInstantCatalog, prefetchHalalDamuHub } from "../services/halalHubBootstrap";
import { resolveInstantHalalCompanyMapMarkers, warmHalalCompanyMapMarkers } from "../utils/halalMapBootstrap";
import { snapshotRowToCompanyCard } from "../services/halalCompaniesSnapshot";
import { menuIconAssets } from "../theme/menuIconAssets";
import { useAppTheme } from "../theme/ThemeContext";
import { domainSettingsHeaderRightContainerStyle } from "../components/settings/DomainSettingsHeaderButton";
import { runAfterInteractions } from "../utils/uiDefer";

const HalalVerifyTabPanel = lazy(() =>
  import("../components/halal/HalalVerifyTabPanel").then((m) => ({ default: m.HalalVerifyTabPanel }))
);
const HalalCatalogTabPanel = lazy(() =>
  import("../components/halal/HalalCatalogTabPanel").then((m) => ({ default: m.HalalCatalogTabPanel }))
);
const HalalMapTabPanel = lazy(() =>
  import("../components/halal/HalalMapTabPanel").then((m) => ({ default: m.HalalMapTabPanel }))
);

type Props = NativeStackScreenProps<MoreStackParamList, "Halal">;

const HEADER_BTN = 36;

function companyStubFromMapId(id: number): HalalDamuCompanyCard {
  const fromCatalog = getHalalHubInstantCatalog().find((c) => c.id === id);
  if (fromCatalog) return fromCatalog;
  return snapshotRowToCompanyCard({ id, title: `№${id}` });
}

/**
 * ХАЛАЛ ДАМУ — halaldamu.kz (WebView), Мекемелер, карта, өнім тексеру.
 * Бірінші ашылуда тек белсенді таб; сайт WebView — lazy + фонда warm.
 */
export function HalalScreen({ navigation, route }: Props) {
  const locale = useAppLocale();
  const localeRevision = useLocaleRevision();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const tabs = useMemo(() => getHalalHubWebTabs(), [locale, localeRevision]);
  const initialTab = route.params?.initialTab ?? HALAL_HUB_WEB_TAB_DEFAULT;
  const [activeTabId, setActiveTabId] = useState<HalalHubWebTabId>(() => initialTab);
  const [siteMounted, setSiteMounted] = useState(() => initialTab === "site");
  const [institutionsMounted, setInstitutionsMounted] = useState(() => initialTab === "institutions");
  const [mapMounted, setMapMounted] = useState(() => initialTab === "map");
  const [verifyMounted, setVerifyMounted] = useState(() => initialTab === "verify");
  /** Сайт WebView — site табында бірден (interaction күту жоқ). */
  const [siteWebReady, setSiteWebReady] = useState(() => initialTab === "site");
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapCompanyCount, setMapCompanyCount] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<HalalDamuCompanyCard | null>(null);

  const activeTab = useMemo(
    () => halalHubWebTabById(activeTabId, tabs),
    [activeTabId, tabs]
  );
  const siteUrl = useMemo(
    () => route.params?.siteUrl?.trim() || halalDamuSiteHomeUrl(),
    [route.params?.siteUrl]
  );
  const webRef = useRef<OfficialSiteFullWebViewHandle>(null);
  const isSiteTab = halalHubWebTabUsesWebView(activeTabId);
  const showHubHero =
    activeTabId === "institutions" || activeTabId === "verify" || activeTabId === "map";

  const mapStrings = useMemo<HalalCompaniesMapModalStrings>(
    () => ({
      title: kk.features.halalMapTitle,
      loading: kk.features.halalMapLoading,
      empty: kk.features.halalMapEmpty,
      error: kk.features.halalMapError,
      close: kk.common.close,
      openDetail: kk.features.halalMapOpenDetail,
      footerNote: kk.features.halalMapFooterNote,
    }),
    [locale, localeRevision]
  );

  useOfficialSiteWebViewScreenBack(navigation, webRef, isSiteTab);

  useEffect(() => {
    if (activeTabId === "site") {
      setSiteMounted(true);
      setSiteWebReady(true);
    }
    if (activeTabId === "institutions") setInstitutionsMounted(true);
    if (activeTabId === "map") setMapMounted(true);
    if (activeTabId === "verify") setVerifyMounted(true);
  }, [activeTabId]);

  useEffect(() => {
    void import("../components/officialSiteWebViewReload").then((m) =>
      m.prefetchOfficialSiteWebPages([siteUrl])
    );
    const task = runAfterInteractions(() => {
      void prefetchHalalDamuHub();
      warmHalalCompanyMapMarkers();
    }, 400);
    return () => task.cancel();
  }, [siteUrl]);

  useFocusEffect(
    useCallback(() => {
      if (activeTabId === "site") {
        setSiteMounted(true);
        setSiteWebReady(true);
      }
      if (activeTabId === "institutions") setInstitutionsMounted(true);
      if (activeTabId === "map") setMapMounted(true);
      if (activeTabId === "verify") setVerifyMounted(true);
      return () => {
        void import("../services/halalCompaniesSnapshot").then((m) =>
          m.releaseHalalCompaniesSnapshotMemory()
        );
        void import("../api/halalDamuWp").then((m) => m.releaseHalalDamuMemoryCache());
      };
    }, [activeTabId])
  );

  useEffect(() => {
    if (!mapMounted) return;
    setMapCompanyCount(resolveInstantHalalCompanyMapMarkers().length);
    warmHalalCompanyMapMarkers();
  }, [mapMounted]);

  const onReload = useCallback(() => {
    webRef.current?.reload();
  }, []);

  const openInBrowser = useCallback(() => {
    void Linking.openURL(siteUrl);
  }, [siteUrl]);

  const openMapModal = useCallback(() => setMapModalOpen(true), []);
  const closeMapModal = useCallback(() => setMapModalOpen(false), []);

  const onSelectCompanyFromMap = useCallback((id: number) => {
    const seed = companyStubFromMapId(id);
    setSelectedCompany(seed);
    if (!isHalalMapCompanyStub(seed)) return;
    void fetchHalalDamuCompanyFull(seed).then(({ card }) => {
      setSelectedCompany((prev) => (prev?.id === id ? card : prev));
    });
  }, []);

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
  }, [navigation, colors, insets, onReload, openInBrowser, isSiteTab, locale]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.bg },
        tabBar: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
        heroWrap: { paddingHorizontal: 12, paddingBottom: 4 },
        mapPad: { flex: 1, paddingHorizontal: 12, paddingTop: 4 },
        body: { flex: 1, minHeight: 0, position: "relative" },
        layer: { ...StyleSheet.absoluteFillObject },
        layerActive: { opacity: 1, zIndex: 1 },
        layerHidden: { opacity: 0, zIndex: 0 },
      }),
    [colors]
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
        <View
          style={[styles.layer, isSiteTab ? styles.layerActive : styles.layerHidden]}
          pointerEvents={isSiteTab ? "auto" : "none"}
        >
          {siteMounted && siteWebReady ? (
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
              ) : null}
            </View>
        <View
          style={[styles.layer, activeTabId === "institutions" ? styles.layerActive : styles.layerHidden]}
          pointerEvents={activeTabId === "institutions" ? "auto" : "none"}
        >
          {institutionsMounted ? (
            <Suspense fallback={null}>
              <HalalCatalogTabPanel active={activeTabId === "institutions"} colors={colors} />
            </Suspense>
              ) : null}
            </View>
        <View
          style={[styles.layer, activeTabId === "map" ? styles.layerActive : styles.layerHidden]}
          pointerEvents={activeTabId === "map" ? "auto" : "none"}
        >
          {mapMounted ? (
            <ScrollView style={styles.mapPad} contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}>
              <Suspense fallback={null}>
                <HalalMapTabPanel
            colors={colors}
                companyCount={mapCompanyCount}
                onOpenMap={openMapModal}
              />
              </Suspense>
              </ScrollView>
              ) : null}
            </View>
        <View
          style={[styles.layer, activeTabId === "verify" ? styles.layerActive : styles.layerHidden]}
          pointerEvents={activeTabId === "verify" ? "auto" : "none"}
        >
          {verifyMounted ? (
            <Suspense fallback={null}>
              <HalalVerifyTabPanel
                colors={colors}
                isDark={isDark}
                insets={insets}
                onOpenInstitutions={() => setActiveTabId("institutions")}
              />
            </Suspense>
              ) : null}
            </View>
      </View>
      <HalalCompaniesMapModal
        visible={mapModalOpen}
        onClose={closeMapModal}
        onSelectCompanyId={onSelectCompanyFromMap}
        strings={mapStrings}
        colors={colors}
      />
      <HalalCompanyDetailSheet
        visible={selectedCompany != null}
        company={selectedCompany}
                      colors={colors}
                      isDark={isDark}
        onClose={() => setSelectedCompany(null)}
      />
                </View>
  );
}
