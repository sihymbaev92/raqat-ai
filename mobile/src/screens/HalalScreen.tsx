import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  TextInput,
  Modal,
  Platform,
  RefreshControl,
  Share,
} from "react-native";
import { runAfterInteractions } from "../utils/uiDefer";
import * as Clipboard from "expo-clipboard";
import { Pressable } from "@/ui/Pressable";
import { RasterImage } from "@/ui/RasterImage";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";
import { getHalalDamuUrl } from "../config/halalDamuUrl";
import { getRaqatApiBase, hydrateRaqatApiBaseOverride } from "../config/raqatApiBase";
import { HALAL_PHOTO_ANALYZE_MS, resolveAiTimeoutMs } from "../config/aiRequestPolicy";
import { menuIconAssets } from "../theme/menuIconAssets";
import type {
  HalalDamuCompanyCard,
  HalalDamuProductItem,
  HalalDamuAdditiveItem,
  HalalDamuExtraLinkKind,
  HalalDamuListMeta,
} from "../api/halalDamuWp";
import {
  fetchHalalDamuCompanyById,
  fetchHalalDamuCompaniesCatalog,
  fetchHalalDamuCompaniesList,
  invalidateHalalDamuAllCaches,
  searchHalalDamuCompanies,
  fetchHalalDamuProductsByBarcode,
  searchHalalDamuProducts,
  searchHalalDamuAdditives,
  fetchHalalDamuProductsByCompany,
  halalDamuCompanyWebUrl,
  halalDamuRegistryWebSearchUrl,
  halalDamuSiteHomeUrl,
} from "../api/halalDamuWp";
import {
  loadHalalFavorites,
  toggleHalalFavorite,
  isHalalFavorite,
  loadHalalLookupHistory,
  pushHalalLookupHistory,
  clearHalalLookupHistory,
  type HalalFavoriteCompany,
  type HalalLookupHistoryEntry,
} from "../storage/halalLocalPrefs";
import {
  clearHalalScanResults,
  findHalalScanResult,
  loadHalalScanResults,
  pushHalalScanResult,
  type HalalScanResultSnapshot,
} from "../storage/halalScanResults";
import { HalalCertBadge } from "../components/HalalCertBadge";
import { HubScreenHero } from "../components/HubScreenHero";
import { HalalNearbyBlock } from "../components/HalalNearbyBlock";
import { RaqatOrnamentSpinner } from "../components/RaqatOrnamentSpinner";
import { ScreenFitScrollView } from "../components/ScreenFit";
import { HalalFilterChipRow, type HalalFilterChip } from "../components/HalalFilterChipRow";
import { halalInstitutionCategoryFilterChips, labelForHalalInstitutionCategory } from "../utils/halalCategoryLabels";
import { halalCertTone } from "../utils/halalCertDisplay";
import { fetchPlatformAiAnalyzeImage } from "../services/platformApiClient";
import { formatAiApiError } from "../utils/formatAiApiError";
import { isHollowAiServerReply } from "../utils/explainEmptyAiResponse";
import { getValidAccessToken } from "../storage/authTokens";
import { resolveImagePickerBase64 } from "../utils/resolveImagePickerBase64";
import * as ImagePicker from "expo-image-picker";
import { HalalBarcodeCameraModal } from "../components/HalalBarcodeCameraModal";
import { HalalCompaniesMapModal } from "../components/HalalCompaniesMapModal";
import { OfficialFeedCard } from "../components/OfficialFeedCard";
import { halalCompanyToFeedItem } from "../utils/officialFeedMappers";
import { HalalSegmentedTabs } from "../components/halal/HalalSegmentedTabs";
import { HalalStatsBar } from "../components/halal/HalalStatsBar";
import { HalalVerifyHub, type HalalCheckFlowPhase } from "../components/halal/HalalVerifyHub";
import { HalalProductResultCard } from "../components/halal/HalalProductResultCard";
import { HalalProductsApiBanner } from "../components/halal/HalalProductsApiBanner";
import { HALAL_HUB_LIST_OPTS, prefetchHalalDamuHub, readHalalHubCatalogSnapshot } from "../services/halalHubBootstrap";
import {
  buildHalalLookupCacheKey,
  readHalalLookupCache,
  writeHalalLookupCache,
} from "../utils/halalLookupCache";
import { resolveHalalProductSearch } from "../utils/halalProductSearch";
import {
  lookupHalalProductsSeedByBarcode,
  getHalalProductsSeedCount,
  mergeHalalProductItems,
  searchHalalProductsSeed,
} from "../services/halalProductsSeedKz";
import { probeHalalProductsApi, type HalalProductsApiProbe } from "../services/halalProductsApiProbe";
import {
  filterHalalCompaniesInstant,
  INSTANT_HALAL_SEARCH_LIMIT,
  dedupeHalalCompanyCards,
  mergeHalalCompanyLists,
  type HalalInstantCompanyFilter,
} from "../utils/halalInstantSearch";
const SEARCH_DEBOUNCE_MS = 240;
const HALAL_VERIFY_DEBOUNCE_MS = 260;
const COMPANY_SEARCH_PER_PAGE = 22;
/** Алғашқы API/лезде көрсетілетін қатар саны */
const COMPANY_SEARCH_FIRST_PAGE = INSTANT_HALAL_SEARCH_LIMIT;
/** Тізімде WP логотип сұрауларын өткізу — ашылу/шығу кезінде UI қатуын азайтады */
const HALAL_LIST_FETCH_OPTS = HALAL_HUB_LIST_OPTS;
const MAX_SEARCH_ACCUM = 220;

/** Сервер жауабындағы BARCODE:/NAME: жолдарын halaldamu іздеуіне ажыратады. */
function parseHalalVisionMachineLines(raw: string): {
  display: string;
  barcode: string | null;
  name: string | null;
} {
  const t = (raw ?? "").trim();
  if (!t) return { display: "", barcode: null, name: null };
  const bcM = t.match(/^\s*BARCODE:\s*(.+)$/im);
  let barcode: string | null = null;
  if (bcM) {
    const v = (bcM[1] ?? "").trim();
    if (v && !/^none$/i.test(v) && !/^жоқ$/i.test(v) && !/^—+$/.test(v)) {
      const d = v.replace(/\D/g, "");
      if (d.length >= 8 && d.length <= 14) barcode = d;
    }
  }
  const nmM = t.match(/^\s*NAME:\s*(.+)$/im);
  let name: string | null = null;
  if (nmM) {
    const v = (nmM[1] ?? "").trim();
    if (v && !/^none$/i.test(v) && !/^жоқ$/i.test(v) && !/^—+$/.test(v)) {
      name = v.slice(0, 120);
    }
  }
  const display = t
    .split(/\r?\n/)
    .filter((ln) => !/^\s*BARCODE:\s*/i.test(ln) && !/^\s*NAME:\s*/i.test(ln))
    .join("\n")
    .trim();
  return { display: display || t, barcode, name };
}

const HALAL_VISION_CLIENT_PROMPT = [
  "Соңында дәл екі жолды ғана шығар (өзге қосымша жол жоқ):",
  "BARCODE: <штрихкодтың тек сандары немесе NONE>",
  "NAME: <өнімнің қысқа атауы: қазақ/орыс/ағыл немесе NONE>",
  "Көрінбесе екеуіне де NONE жаз.",
].join("\n");

function halalTelDialUrl(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

const HALAL_LINK_MCI: Record<HalalDamuExtraLinkKind, keyof typeof MaterialCommunityIcons.glyphMap> = {
  whatsapp: "whatsapp",
  instagram: "instagram",
  facebook: "facebook",
  telegram: "send-circle-outline",
  youtube: "youtube",
  tiktok: "music-note",
  vk: "account-group-outline",
  other: "link-variant",
};

function halalExtraLinkChipLabel(kind: HalalDamuExtraLinkKind): string {
  switch (kind) {
    case "whatsapp":
      return "WhatsApp";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "telegram":
      return "Telegram";
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "vk":
      return "VK";
    default:
      return kk.features.halalHubLinkOther;
  }
}

type HalalHubMainTab = "institutions" | "verify" | "map";
type HalalNearbyLookupKind = "institution" | "product" | "mosque";
type HalalCheckSummaryTone = "ok" | "warn" | "bad" | "neutral";

function buildHalalCheckSummary(
  products: HalalDamuProductItem[],
  additives: HalalDamuAdditiveItem[],
  companies: HalalDamuCompanyCard[]
): { tone: HalalCheckSummaryTone; title: string; body: string; icon: keyof typeof MaterialIcons.glyphMap } | null {
  if (!products.length && !additives.length && !companies.length) return null;
  const productTones = products.map((p) => halalCertTone(p.certificateStatus));
  if (productTones.includes("bad")) {
    return {
      tone: "bad",
      title: kk.features.halalVerifySummaryBadTitle,
      body: kk.features.halalVerifySummaryBadBody,
      icon: "report-problem",
    };
  }
  if (productTones.includes("ok")) {
    return {
      tone: "ok",
      title: kk.features.halalVerifySummaryOkTitle,
      body: kk.features.halalVerifySummaryOkBody(products.length),
      icon: "verified",
    };
  }
  if (additives.length > 0) {
    return {
      tone: "warn",
      title: kk.features.halalVerifySummaryAdditiveTitle,
      body: kk.features.halalVerifySummaryAdditiveBody(additives.length),
      icon: "science",
    };
  }
  if (companies.length > 0) {
    return {
      tone: "neutral",
      title: kk.features.halalVerifySummaryCompanyTitle,
      body: kk.features.halalVerifySummaryCompanyBody(companies.length),
      icon: "store",
    };
  }
  return null;
}

function fastSeedProductsForQuery(query: string, status?: string): HalalDamuProductItem[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const digits = q.replace(/\D/g, "");
  const seed = mergeHalalProductItems(
    digits.length >= 8 ? lookupHalalProductsSeedByBarcode(digits) : [],
    searchHalalProductsSeed(digits || q, INSTANT_HALAL_SEARCH_LIMIT)
  );
  const s = status?.trim().toLowerCase();
  return s ? seed.filter((p) => (p.certificateStatus ?? "").toLowerCase() === s) : seed;
}

export function HalalScreen() {
  useAppLocale();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const siteUrl = useMemo(() => getHalalDamuUrl(), []);

  const [catalogItems, setCatalogItems] = useState<HalalDamuCompanyCard[]>([]);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogMeta, setCatalogMeta] = useState<HalalDamuListMeta | null>(null);
  const [catalogErr, setCatalogErr] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncFromCache, setSyncFromCache] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchItems, setSearchItems] = useState<HalalDamuCompanyCard[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<HalalDamuCompanyCard | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [scanOpen, setScanOpen] = useState(false);
  const [checkInput, setCheckInput] = useState("");
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkErr, setCheckErr] = useState<string | null>(null);
  const [checkProducts, setCheckProducts] = useState<HalalDamuProductItem[]>([]);
  const [checkAdditives, setCheckAdditives] = useState<HalalDamuAdditiveItem[]>([]);
  const [checkCompanies, setCheckCompanies] = useState<HalalDamuCompanyCard[]>([]);
  const [checkLookupDone, setCheckLookupDone] = useState(false);
  /** Сурет → platform AI талдауы мәтіні (BARCODE/NAME жолдары көрсетуден алынады) */
  const [photoAnalysisText, setPhotoAnalysisText] = useState<string | null>(null);
  const [goodsQuickBusy, setGoodsQuickBusy] = useState(false);
  const [goodsQuick, setGoodsQuick] = useState("");
  const [goodsQuickDebounced, setGoodsQuickDebounced] = useState("");
  const [checkInputDebounced, setCheckInputDebounced] = useState("");
  const [additiveDetail, setAdditiveDetail] = useState<HalalDamuAdditiveItem | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mainTab, setMainTab] = useState<HalalHubMainTab>("institutions");
  const [nearbyLookupKind, setNearbyLookupKind] = useState<HalalNearbyLookupKind>("institution");
  /** halal-bot companies сүзгілері (API category_type / certificate_status) */
  const [instCertFilter, setInstCertFilter] = useState<string>("");
  const [instCategoryFilter, setInstCategoryFilter] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [searchMeta, setSearchMeta] = useState<HalalDamuListMeta | null>(null);
  /** Ұйым карточкасынан: products?company_id= */
  const [companyBrowse, setCompanyBrowse] = useState<{
    id: number;
    title: string;
    items: HalalDamuProductItem[];
    loading: boolean;
    error: string | null;
  } | null>(null);
  const [favorites, setFavorites] = useState<HalalFavoriteCompany[]>([]);
  const [lookupHistory, setLookupHistory] = useState<HalalLookupHistoryEntry[]>([]);
  const [scanResults, setScanResults] = useState<HalalScanResultSnapshot[]>([]);
  const [goodsProductStatusFilter, setGoodsProductStatusFilter] = useState("");
  const [checkFlowPhase, setCheckFlowPhase] = useState<HalalCheckFlowPhase>(null);
  const [instFiltersOpen, setInstFiltersOpen] = useState(false);
  const [lastCheckQuery, setLastCheckQuery] = useState<string | null>(null);
  const [productsApiProbe, setProductsApiProbe] = useState<HalalProductsApiProbe | null>(null);
  const [productsApiProbeLoading, setProductsApiProbeLoading] = useState(false);
  const seedProductCount = useMemo(() => getHalalProductsSeedCount(), []);

  /** Экран фокуста емес — жауап келгенде setState жасамау (шығу кезінде қату) */
  const screenActiveRef = useRef(true);
  const catalogLoadEpochRef = useRef(0);
  const lookupGenerationRef = useRef(0);
  const catalogItemsRef = useRef(catalogItems);
  catalogItemsRef.current = catalogItems;
  const instCertFilterRef = useRef(instCertFilter);
  instCertFilterRef.current = instCertFilter;
  const instCategoryFilterRef = useRef(instCategoryFilter);
  instCategoryFilterRef.current = instCategoryFilter;

  const companyInstantFilterOpts = useMemo(
    (): HalalInstantCompanyFilter => ({
      certificateStatus: instCertFilter.trim() || undefined,
      categoryType: instCategoryFilter.trim() || undefined,
    }),
    [instCertFilter, instCategoryFilter]
  );

  const productQueryOpts = useMemo(
    () => ({
      status: goodsProductStatusFilter.trim() || undefined,
      perPage: INSTANT_HALAL_SEARCH_LIMIT,
    }),
    [goodsProductStatusFilter]
  );

  useEffect(() => {
    let cancelled = false;
    setProductsApiProbeLoading(true);
    void probeHalalProductsApi()
      .then((probe) => {
        if (!cancelled) setProductsApiProbe(probe);
      })
      .finally(() => {
        if (!cancelled) setProductsApiProbeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const checkSummary = useMemo(
    () => buildHalalCheckSummary(checkProducts, checkAdditives, checkCompanies),
    [checkProducts, checkAdditives, checkCompanies]
  );

  const halalMapModalStrings = useMemo(
    () => ({
      title: kk.features.halalMapTitle,
      loading: kk.features.halalMapLoading,
      empty: kk.features.halalMapEmpty,
      error: kk.features.halalMapError,
      close: kk.features.halalHubClose,
      openDetail: kk.features.halalMapOpenDetail,
      footerNote: kk.features.halalMapFooterNote,
    }),
    []
  );

  const recordLookupHistory = useCallback(async (query: string, kind: HalalLookupHistoryEntry["kind"]) => {
    const next = await pushHalalLookupHistory(query, kind);
    setLookupHistory(next);
  }, []);

  const focusVerifyCheck = useCallback(() => {
    setMainTab("verify");
    setCompanyBrowse(null);
  }, []);

  const onMainTabChange = useCallback((tab: HalalHubMainTab) => {
    setMainTab(tab);
    if (tab === "map") {
      setMapOpen(true);
    } else {
      setMapOpen(false);
    }
  }, []);

  const closeHalalMap = useCallback(() => {
    setMapOpen(false);
    setMainTab("institutions");
  }, []);

  const lookupHalalRegistry = useCallback(
    async (rawQuery: string, opts?: { useMainBusy?: boolean; silentBusy?: boolean }) => {
      const q = rawQuery.trim();
      const useMainBusy = opts?.useMainBusy !== false;
      const silentBusy = opts?.silentBusy === true;
      if (q.length < 2) return;

      const gen = ++lookupGenerationRef.current;
      const cacheKey = buildHalalLookupCacheKey(q, goodsProductStatusFilter);
      const cached = readHalalLookupCache(cacheKey);
      if (cached) {
        if (gen !== lookupGenerationRef.current) return;
        setCheckErr(null);
        setCheckLookupDone(true);
        setCompanyBrowse(null);
        setCheckProducts(cached.products);
        setCheckAdditives(cached.additives);
        setCheckCompanies(cached.companies);
        return;
      }

      if (!silentBusy) {
        if (useMainBusy) setCheckFlowPhase("registry");
        else setGoodsQuickBusy(true);
      }
      setCheckErr(null);
      setCheckLookupDone(false);
      setCompanyBrowse(null);
      setCheckProducts([]);
      setCheckAdditives([]);
      const instantSeedProducts = fastSeedProductsForQuery(q, goodsProductStatusFilter);
      if (instantSeedProducts.length > 0) {
        setCheckProducts(instantSeedProducts);
      }
      const instantCompanies = filterHalalCompaniesInstant(catalogItemsRef.current, q, {
        ...companyInstantFilterOpts,
        limit: INSTANT_HALAL_SEARCH_LIMIT,
      });
      setCheckCompanies(instantCompanies);
      try {
        const [prodResolved, add, comp] = await Promise.all([
          resolveHalalProductSearch(q, catalogItemsRef.current, productQueryOpts),
          searchHalalDamuAdditives(q, { perPage: INSTANT_HALAL_SEARCH_LIMIT }),
          q.length >= 3
            ? searchHalalDamuCompanies(q, {
                ...HALAL_LIST_FETCH_OPTS,
                ...companyInstantFilterOpts,
                perPage: INSTANT_HALAL_SEARCH_LIMIT,
              })
            : Promise.resolve({ items: [] as HalalDamuCompanyCard[], error: undefined }),
        ]);
        if (gen !== lookupGenerationRef.current) return;
        const hasError = Boolean(prodResolved.error || add.error || comp.error);
        if (hasError) setCheckErr(kk.features.halalHubNetworkErr);
        const products = mergeHalalProductItems(prodResolved.items, instantSeedProducts);
        setCheckProducts(products);
        setCheckAdditives(add.items);
        setCheckCompanies(mergeHalalCompanyLists(comp.items, instantCompanies));
        if (!hasError) {
          writeHalalLookupCache(cacheKey, {
            products,
            additives: add.items,
            companies: comp.items,
          });
        }
        void recordLookupHistory(q, "text");
      } finally {
        if (gen !== lookupGenerationRef.current) return;
        if (!silentBusy) {
          if (useMainBusy) setCheckFlowPhase(null);
          else setGoodsQuickBusy(false);
        }
        setCheckLookupDone(true);
      }
    },
    [productQueryOpts, goodsProductStatusFilter, recordLookupHistory, companyInstantFilterOpts]
  );

  const runTextHalalCheck = useCallback(async () => {
    const q = checkInput.trim();
    if (q.length < 2) {
      Alert.alert(kk.common.error, kk.features.halalCheckMin2);
      return;
    }
    setCheckBusy(true);
    try {
      await lookupHalalRegistry(q, { useMainBusy: true, silentBusy: true });
    } finally {
      setCheckBusy(false);
    }
  }, [checkInput, lookupHalalRegistry]);

  const applyBarcodePipeline = useCallback(async (raw: string, opts?: { silentBusy?: boolean }) => {
    const silentBusy = opts?.silentBusy === true;
    const trimmed = raw.trim();
    if (!trimmed) return;
    focusVerifyCheck();
    setCheckInput(trimmed);
    const digits = trimmed.replace(/\D/g, "");
    setLastCheckQuery(digits || trimmed);
    setPhotoAnalysisText(null);
    setCheckLookupDone(false);
    setCheckFlowPhase("registry");
    setCheckErr(null);
    setCheckProducts([]);
    setCheckAdditives([]);
    const instantSeedProducts = fastSeedProductsForQuery(digits || trimmed, goodsProductStatusFilter);
    if (instantSeedProducts.length > 0) {
      setCheckProducts(instantSeedProducts);
    }
    const instantCompanies = filterHalalCompaniesInstant(catalogItemsRef.current, digits || trimmed, {
      ...companyInstantFilterOpts,
      limit: INSTANT_HALAL_SEARCH_LIMIT,
    });
    setCheckCompanies(instantCompanies);
    try {
      const [byBc, byTxt, add, comp] = await Promise.all([
        fetchHalalDamuProductsByBarcode(digits || trimmed, productQueryOpts),
        searchHalalDamuProducts(trimmed.length >= 2 ? trimmed : digits, productQueryOpts),
        searchHalalDamuAdditives((digits.length >= 2 ? digits : trimmed).slice(0, 40), {
          perPage: INSTANT_HALAL_SEARCH_LIMIT,
        }),
        digits.length >= 3
          ? searchHalalDamuCompanies(digits, {
              ...HALAL_LIST_FETCH_OPTS,
              ...companyInstantFilterOpts,
              perPage: INSTANT_HALAL_SEARCH_LIMIT,
            })
          : Promise.resolve({ items: [] as HalalDamuCompanyCard[], error: undefined }),
      ]);
      let merged: HalalDamuProductItem[] = mergeHalalProductItems(byBc.items, instantSeedProducts);
      merged = mergeHalalProductItems(merged, byTxt.items);
      if (merged.length === 0 && (trimmed.length >= 2 || digits.length >= 2)) {
        merged = mergeHalalProductItems(merged, searchHalalProductsSeed(digits || trimmed, INSTANT_HALAL_SEARCH_LIMIT));
      }
      if (merged.length === 0 && (trimmed.length >= 2 || digits.length >= 2)) {
        const fallback = await resolveHalalProductSearch(digits || trimmed, catalogItemsRef.current, productQueryOpts);
        merged = mergeHalalProductItems(merged, fallback.items);
      }
      if (byBc.error || byTxt.error || add.error || comp.error) setCheckErr(kk.features.halalHubNetworkErr);
      setCheckProducts(merged);
      setCheckAdditives(add.items);
      setCheckCompanies(mergeHalalCompanyLists(comp.items, instantCompanies));
      void recordLookupHistory(digits || trimmed, "barcode");
      const bcKey = digits || trimmed;
      if (bcKey.length >= 4) {
        const nextScan = await pushHalalScanResult({
          barcode: bcKey,
          products: merged,
          additives: add.items,
          companies: comp.items,
        });
        setScanResults(nextScan);
      }
    } finally {
      setCheckLookupDone(true);
      setCheckFlowPhase(null);
    }
  }, [focusVerifyCheck, productQueryOpts, recordLookupHistory, companyInstantFilterOpts, goodsProductStatusFilter]);

  const openCameraForManualText = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert(kk.common.error, kk.features.halalScanWebUnavailable);
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.status !== "granted") {
      Alert.alert(kk.common.error, kk.features.halalCheckCamPerm);
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.38,
      base64: true,
    });
    if (res.canceled || !res.assets[0]) return;

    await hydrateRaqatApiBaseOverride();
    const apiBase = getRaqatApiBase();
    if (!apiBase) {
      Alert.alert(kk.common.error, kk.features.halalPhotoVisionNeedApi);
      return;
    }

    const asset = res.assets[0];
    const resolved = await resolveImagePickerBase64(asset);
    if (!resolved?.base64) {
      Alert.alert(kk.common.error, kk.features.halalPhotoReadFail);
      return;
    }
    if (resolved.base64.length > 4_500_000) {
      Alert.alert(kk.common.error, kk.features.halalPhotoTooLarge);
      return;
    }

    focusVerifyCheck();
    setPhotoAnalysisText(null);
    setCheckErr(null);
    setCheckFlowPhase("ai");
    try {
      const bearer = ((await getValidAccessToken()) ?? "").trim();
      const timeoutMs = await resolveAiTimeoutMs(HALAL_PHOTO_ANALYZE_MS);
      const aiRes = await fetchPlatformAiAnalyzeImage(apiBase, {
        imageB64: resolved.base64,
        mimeType: resolved.mime,
        lang: "kk",
        prompt: HALAL_VISION_CLIENT_PROMPT,
        timeoutMs,
        authorizationBearer: bearer || undefined,
      });
      const rawText = typeof aiRes.text === "string" ? aiRes.text.trim() : "";
      if (
        !rawText ||
        aiRes.ok === false ||
        (aiRes.status != null && aiRes.status >= 400) ||
        isHollowAiServerReply(rawText)
      ) {
        const errLine =
          aiRes.error || (aiRes.status != null && aiRes.status >= 400)
            ? formatAiApiError(aiRes.status, { error: aiRes.error, detail: aiRes.detail })
            : "";
        setCheckErr(errLine || kk.features.halalPhotoVisionFail);
        return;
      }
      const { display, barcode, name } = parseHalalVisionMachineLines(rawText);
      setPhotoAnalysisText(display || rawText);

      if (barcode) {
        await applyBarcodePipeline(barcode, { silentBusy: true });
      } else if (name && name.length >= 2) {
        setLastCheckQuery(name);
        setCheckFlowPhase("registry");
        setCheckInput(name);
        await lookupHalalRegistry(name, { useMainBusy: false, silentBusy: true });
      } else {
        setLastCheckQuery(null);
      }
    } finally {
      setCheckFlowPhase(null);
    }
  }, [applyBarcodePipeline, focusVerifyCheck, lookupHalalRegistry]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchText.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchText]);

  useEffect(() => {
    setCheckLookupDone(false);
  }, [checkInput]);

  useEffect(() => {
    const t = setTimeout(() => setGoodsQuickDebounced(goodsQuick.trim()), HALAL_VERIFY_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [goodsQuick]);

  useEffect(() => {
    const t = setTimeout(() => setCheckInputDebounced(checkInput.trim()), HALAL_VERIFY_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [checkInput]);

  useEffect(() => {
    if (mainTab !== "verify") return;
    if (goodsQuickDebounced.length < 2) return;
    if (!screenActiveRef.current) return;
    let cancelled = false;
    const task = runAfterInteractions(() => {
      if (cancelled || !screenActiveRef.current) return;
      void lookupHalalRegistry(goodsQuickDebounced, { useMainBusy: false });
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [mainTab, goodsQuickDebounced, lookupHalalRegistry, goodsProductStatusFilter]);

  useEffect(() => {
    if (mainTab !== "verify") return;
    if (checkInputDebounced.length < 2) return;
    if (checkFlowPhase) return;
    if (!screenActiveRef.current) return;
    const gen = ++lookupGenerationRef.current;
    void (async () => {
      await lookupHalalRegistry(checkInputDebounced, { useMainBusy: false });
      if (gen !== lookupGenerationRef.current) return;
    })();
  }, [mainTab, checkInputDebounced, lookupHalalRegistry, goodsProductStatusFilter, checkFlowPhase]);

  const catalogFilterOpts = useMemo(
    () => ({
      certificateStatus: instCertFilter.trim() || undefined,
      categoryType: instCategoryFilter.trim() || undefined,
    }),
    [instCertFilter, instCategoryFilter]
  );

  const catalogQueryOpts = useCallback(
    (page: number) => ({
      ...catalogFilterOpts,
      perPage: page === 1 ? COMPANY_SEARCH_FIRST_PAGE : COMPANY_SEARCH_PER_PAGE,
      page,
    }),
    [catalogFilterOpts]
  );

  const instCertFilterChips = useMemo(
    (): HalalFilterChip[] => [
      { value: "", label: kk.features.halalFilterAll },
      { value: "active", label: kk.features.halalFilterCertActive },
      { value: "expired", label: kk.features.halalFilterCertExpired },
      { value: "draft", label: kk.features.halalFilterCertDraft },
    ],
    []
  );

  const instCategoryFilterChips = useMemo((): HalalFilterChip[] => halalInstitutionCategoryFilterChips(), []);

  const goodsProductStatusChips = useMemo(
    (): HalalFilterChip[] => [
      { value: "", label: kk.features.halalFilterAll },
      { value: "halal", label: kk.features.halalProductStatusHalal },
      { value: "doubtful", label: kk.features.halalProductStatusDoubtful },
      { value: "haram", label: kk.features.halalProductStatusHaram },
    ],
    []
  );

  const loadCatalog = useCallback(
    async (opts?: { page?: number; append?: boolean; forceNetwork?: boolean; silent?: boolean }) => {
      const page = opts?.page ?? 1;
      const append = opts?.append === true;
      const forceNetwork = opts?.forceNetwork === true;
      const silent = opts?.silent === true;
      const epoch = catalogLoadEpochRef.current;
      if (!screenActiveRef.current) return;
      try {
        if (!append && !silent) {
          setCatalogLoading(true);
          setCatalogErr(null);
        }
        const useCache = page === 1 && !append;
        let items: HalalDamuCompanyCard[];
        let error: string | undefined;
        let meta: HalalDamuListMeta | undefined;
        let syncedAt: string | null = null;
        let fromCache = false;
        if (useCache) {
          const res = await fetchHalalDamuCompaniesCatalog({
            ...catalogQueryOpts(page),
            ...HALAL_LIST_FETCH_OPTS,
            forceNetwork,
          });
          items = res.items;
          error = res.error;
          meta = res.meta;
          syncedAt = res.syncedAt;
          fromCache = res.fromCache;
        } else {
          const res = await fetchHalalDamuCompaniesList({
            ...catalogQueryOpts(page),
            ...HALAL_LIST_FETCH_OPTS,
          });
          items = res.items;
          error = res.error;
          meta = res.meta;
          syncedAt = res.syncedAt ?? null;
          fromCache = res.fromDisk === true;
        }
        if (!screenActiveRef.current || epoch !== catalogLoadEpochRef.current) return;
        if (error) setCatalogErr(kk.features.halalHubNetworkErr);
        else setCatalogErr(null);
        if (syncedAt) setLastSyncedAt(syncedAt);
        setSyncFromCache(fromCache);
        setCatalogMeta(meta ?? null);
        setCatalogPage(page);
        setCatalogItems((prev) => {
          const merged =
            !append || page === 1
              ? items
              : mergeHalalCompanyLists(prev, items);
          const deduped = dedupeHalalCompanyCards(merged);
          return deduped.length > MAX_SEARCH_ACCUM ? deduped.slice(0, MAX_SEARCH_ACCUM) : deduped;
        });
        if (!append) setCatalogLoading(false);
      } catch {
        if (epoch === catalogLoadEpochRef.current && !append) {
          if (!silent) {
            setCatalogErr(kk.features.halalHubNetworkErr);
          }
          setCatalogLoading(false);
        }
      }
    },
    [catalogQueryOpts]
  );

  const refreshLocalHalalPrefs = useCallback(async () => {
    const [fav, hist, scans] = await Promise.all([
      loadHalalFavorites(),
      loadHalalLookupHistory(),
      loadHalalScanResults(),
    ]);
    setFavorites(fav);
    setLookupHistory(hist);
    setScanResults(scans);
  }, []);

  const restoreScanSnapshot = useCallback((snap: HalalScanResultSnapshot) => {
    focusVerifyCheck();
    setCheckInput(snap.barcode);
    setLastCheckQuery(snap.barcode);
    setCheckProducts(snap.products);
    setCheckAdditives(snap.additives);
    setCheckCompanies(snap.companies);
    setCheckLookupDone(true);
    setCheckErr(null);
    setPhotoAnalysisText(null);
    setCompanyBrowse(null);
  }, [focusVerifyCheck]);

  useFocusEffect(
    useCallback(() => {
      screenActiveRef.current = true;
      void hydrateRaqatApiBaseOverride();
      void prefetchHalalDamuHub();
      const prefsTask = runAfterInteractions(() => {
        if (screenActiveRef.current) void refreshLocalHalalPrefs();
      });
      return () => {
        screenActiveRef.current = false;
        prefsTask.cancel();
        setMapOpen(false);
        setScanOpen(false);
      };
    }, [refreshLocalHalalPrefs])
  );

  useEffect(() => {
    if (debouncedSearch.length >= 3) return;
    const epoch = ++catalogLoadEpochRef.current;
    let cancelled = false;
    void (async () => {
      const snapshot = await readHalalHubCatalogSnapshot(catalogQueryOpts(1));
      if (cancelled || !screenActiveRef.current || epoch !== catalogLoadEpochRef.current) return;
      if (snapshot) {
        setCatalogItems(dedupeHalalCompanyCards(snapshot.items));
        setCatalogMeta(snapshot.meta ?? null);
        setLastSyncedAt(snapshot.syncedAt);
        setSyncFromCache(true);
        setCatalogLoading(false);
        setCatalogErr(null);
        void loadCatalog({ page: 1, forceNetwork: true, silent: true });
        return;
      }
      await loadCatalog({ page: 1, forceNetwork: false, silent: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [instCertFilter, instCategoryFilter, debouncedSearch, loadCatalog, catalogQueryOpts]);

  /** Каталог: 1-бет көрінгеннен кейін келесі беттер фонда толтырылады (күтусіз скролл). */
  useEffect(() => {
    if (debouncedSearch.length >= 3) return;
    if (catalogLoading) return;
    if (!catalogMeta?.totalPages || catalogPage >= catalogMeta.totalPages) return;
    if (catalogItems.length >= MAX_SEARCH_ACCUM) return;
    const next = catalogPage + 1;
    void loadCatalog({ page: next, append: true, forceNetwork: true, silent: true });
  }, [
    debouncedSearch,
    catalogLoading,
    catalogMeta?.totalPages,
    catalogPage,
    catalogItems.length,
    loadCatalog,
  ]);

  const onToggleFavorite = useCallback(async (card: HalalDamuCompanyCard) => {
    const next = await toggleHalalFavorite({
      id: card.id,
      title: card.title,
      savedAt: new Date().toISOString(),
    });
    setFavorites(next);
  }, []);

  const onPullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await invalidateHalalDamuAllCaches();
      setCatalogPage(1);
      await loadCatalog({ page: 1, forceNetwork: true });
      const q = debouncedSearch.trim();
      if (q.length >= 3) {
        setSearchLoading(true);
        setSearchErr(null);
        const { items, error, meta } = await searchHalalDamuCompanies(q, {
          certificateStatus: instCertFilter.trim() || undefined,
          categoryType: instCategoryFilter.trim() || undefined,
          page: 1,
          perPage: COMPANY_SEARCH_FIRST_PAGE,
          ...HALAL_LIST_FETCH_OPTS,
        });
        if (error) setSearchErr(kk.features.halalHubNetworkErr);
        setSearchItems(items);
        setSearchMeta(meta ?? null);
        setSearchPage(1);
        setSearchLoading(false);
      }
    } finally {
      setRefreshing(false);
    }
  }, [loadCatalog, debouncedSearch, instCertFilter, instCategoryFilter]);

  useEffect(() => {
    setSearchPage(1);
  }, [debouncedSearch, instCertFilter, instCategoryFilter]);

  useEffect(() => {
    const q = debouncedSearch.trim();
    if (q.length < 3) {
      setSearchItems([]);
      setSearchErr(null);
      setSearchLoading(false);
      setSearchMeta(null);
      return;
    }
    if (searchPage === 1) {
      const instant = filterHalalCompaniesInstant(catalogItems, q, {
        ...companyInstantFilterOpts,
        limit: INSTANT_HALAL_SEARCH_LIMIT,
      });
      if (instant.length > 0) setSearchItems(instant);
    }
    let cancelled = false;
    const task = runAfterInteractions(() => {
      if (cancelled || !screenActiveRef.current) return;
      void (async () => {
      setSearchLoading(true);
      setSearchErr(null);
      const { items, error, meta } = await searchHalalDamuCompanies(q, {
        certificateStatus: instCertFilter.trim() || undefined,
        categoryType: instCategoryFilter.trim() || undefined,
        page: searchPage,
        perPage: searchPage === 1 ? COMPANY_SEARCH_FIRST_PAGE : COMPANY_SEARCH_PER_PAGE,
        ...HALAL_LIST_FETCH_OPTS,
      });
      if (cancelled || !screenActiveRef.current) return;
      if (error) setSearchErr(kk.features.halalHubNetworkErr);
      if (!error && searchPage === 1) void recordLookupHistory(q, "text");
      setSearchMeta(meta ?? null);
      setSearchItems((prev) => {
        const pageItems = items.slice(
          0,
          searchPage === 1 ? COMPANY_SEARCH_FIRST_PAGE : COMPANY_SEARCH_PER_PAGE
        );
        const merged =
          searchPage === 1
            ? mergeHalalCompanyLists(pageItems, prev)
            : mergeHalalCompanyLists(prev, pageItems);
        const deduped = dedupeHalalCompanyCards(merged);
        return deduped.length > MAX_SEARCH_ACCUM ? deduped.slice(0, MAX_SEARCH_ACCUM) : deduped;
      });
      setSearchLoading(false);
      })();
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [debouncedSearch, instCertFilter, instCategoryFilter, searchPage, recordLookupHistory, catalogItems, companyInstantFilterOpts]);

  useEffect(() => {
    if (detailId == null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      setDetail(null);
      const { card, error } = await fetchHalalDamuCompanyById(detailId);
      if (cancelled || !screenActiveRef.current) return;
      if (error || !card) {
        setDetailLoading(false);
        Alert.alert(kk.common.error, kk.features.halalHubNetworkErr);
        setDetailId(null);
        return;
      }
      setDetail(card);
      setDetailLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  const openExternal = (u: string) => {
    void Linking.openURL(u);
  };

  const openCompanyProductsFromDetail = useCallback(async (d: HalalDamuCompanyCard) => {
    const id = d.id;
    const title = d.title;
    setDetailId(null);
    setMainTab("verify");
    setCompanyBrowse({ id, title, items: [], loading: true, error: null });
    const { items, error } = await fetchHalalDamuProductsByCompany(id, { ...productQueryOpts, perPage: 80 });
    setCompanyBrowse((prev) =>
      prev && prev.id === id
        ? {
            ...prev,
            items,
            loading: false,
            error: error ? kk.features.halalHubNetworkErr : null,
          }
        : prev
    );
  }, [productQueryOpts]);

  const renderCertStatus = useCallback(
    (status: string | null | undefined) => {
      if (!status?.trim()) return null;
      return <HalalCertBadge status={status} colors={colors} isDark={isDark} compact />;
    },
    [colors, isDark]
  );

  const shareCompanyDetail = useCallback(async () => {
    if (!detail) return;
    const lines: string[] = [detail.title];
    if (detail.legalName?.trim()) lines.push(detail.legalName);
    if (detail.address?.trim()) lines.push(detail.address);
    for (const p of detail.phones) {
      if (p.trim()) lines.push(p);
    }
    if (detail.phone?.trim() && !detail.phones.some((x) => x.trim() === detail.phone!.trim())) {
      lines.push(detail.phone.trim());
    }
    if (detail.website?.trim()) lines.push(detail.website.trim());
    try {
      await Share.share({ message: lines.join("\n"), title: detail.title });
    } catch {
      /* пайдаланушы бөлісуді болдырмады */
    }
  }, [detail]);

  const copyCompanyAddress = useCallback(async () => {
    if (!detail?.address?.trim()) return;
    await Clipboard.setStringAsync(detail.address.trim());
  }, [detail]);

  const renderCheckProduct = (p: HalalDamuProductItem) => (
    <HalalProductResultCard
      key={`p-${p.id}-${p.barcode ?? p.title}`}
      kind="product"
      colors={colors}
      isDark={isDark}
      title={p.title}
      barcode={p.barcode}
      certificateStatus={p.certificateStatus}
      verificationStatus={p.verificationStatus}
      producerCertificateStatus={p.producerCertificateStatus}
      subtitle={
        p.fromRaqatSeed
          ? p.ingredients
            ? p.ingredients.length > 72
              ? `${p.ingredients.slice(0, 72)}…`
              : p.ingredients
            : kk.features.halalProductSeedLabel
          : p.fromCertifiedProducer
            ? kk.features.halalProductProducerFallbackLabel
            : undefined
      }
      onPress={p.companyId ? () => setDetailId(p.companyId!) : undefined}
      onCopyBarcode={p.barcode ? () => void Clipboard.setStringAsync(p.barcode!) : undefined}
    />
  );

  const renderCheckAdditive = (a: HalalDamuAdditiveItem) => (
    <HalalProductResultCard
      key={`a-${a.id}-${a.title}`}
      kind="additive"
      colors={colors}
      isDark={isDark}
      title={a.title}
      description={a.description}
      onPress={() => setAdditiveDetail(a)}
    />
  );

  const renderSearchCard = (c: HalalDamuCompanyCard) => (
    <OfficialFeedCard
      key={`s-${c.id}`}
      item={halalCompanyToFeedItem(c)}
      colors={colors}
      onPress={() => setDetailId(c.id)}
      accessibilityLabel={c.title}
    />
  );

  return (
    <>
      <ScreenFitScrollView
        style={styles.root}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onPullRefresh()}
            tintColor={colors.accent}
            colors={Platform.OS === "android" ? [colors.accent] : undefined}
            title={Platform.OS === "ios" ? kk.features.halalPullRefreshHint : undefined}
          />
        }
        top={14}
        bottom={24 + insets.bottom}
      >
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

      <HalalSegmentedTabs
        tabs={[
          { id: "institutions" as const, label: kk.features.halalTabInstitutions },
          { id: "verify" as const, label: kk.features.halalTabVerify },
          { id: "map" as const, label: kk.features.halalTabMap },
        ]}
        value={mainTab}
        onChange={onMainTabChange}
        colors={colors}
      />

      {mainTab === "institutions" ? (
        <>
          <HalalNearbyBlock
            colors={colors}
            catalogItems={catalogItems}
            certificateStatusFilter={instCertFilter}
            categoryTypeFilter={instCategoryFilter}
            onCategoryTypeFilterChange={setInstCategoryFilter}
            productStatusFilter={goodsProductStatusFilter}
            onProductStatusFilterChange={setGoodsProductStatusFilter}
            productStatusChips={goodsProductStatusChips}
            onOpenCompany={(id) => setDetailId(id)}
            onLookupKindChange={setNearbyLookupKind}
            onOpenProductLookup={(q) => {
              focusVerifyCheck();
              setGoodsQuick(q);
              void lookupHalalRegistry(q, { useMainBusy: false });
            }}
          />

          {favorites.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{kk.features.halalFavoritesTitle}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
                {favorites.map((f) => (
                  <Pressable
                    key={`fav-${f.id}`}
                    onPress={() => setDetailId(f.id)}
                    style={({ pressed }) => [
                      styles.favChip,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={f.title}
                  >
                    <MaterialIcons name="star" size={18} color={colors.accent} />
                    <Text style={[styles.favChipTxt, { color: colors.text }]} numberOfLines={2}>
                      {f.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {nearbyLookupKind !== "product" ? (
            <>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>{kk.features.halalHubSearchPlaceholder}</Text>
          <Text style={[styles.hint, { color: colors.muted, marginBottom: 8 }]}>{kk.features.halalInstitutionSearchScopeHint}</Text>
          <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <MaterialIcons name="search" size={22} color={colors.muted} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={kk.features.halalHubSearchPlaceholder}
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel={kk.features.halalHubSearchPlaceholder}
            />
            {searchText.trim().length > 0 ? (
              <Pressable
                onPress={() => setSearchText("")}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={kk.features.halalHubClearSearch}
                style={({ pressed }) => [{ padding: 4, opacity: pressed ? 0.7 : 1 }]}
              >
                <MaterialIcons name="close" size={22} color={colors.muted} />
              </Pressable>
            ) : null}
            {searchLoading ? <RaqatOrnamentSpinner size={22} /> : null}
          </View>
          {debouncedSearch.length > 0 && debouncedSearch.length < 3 ? (
            <Text style={[styles.hint, { color: colors.muted }]}>{kk.features.halalHubSearchMinHint}</Text>
          ) : null}
          {lookupHistory.length > 0 ? (
            <View style={styles.historyBlock}>
              <View style={styles.historyHead}>
                <Text style={[styles.historyTitle, { color: colors.muted }]}>{kk.features.halalHistoryTitle}</Text>
                <Pressable
                  onPress={() => void clearHalalLookupHistory().then(() => setLookupHistory([]))}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalHistoryClear}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.historyClearTxt, { color: colors.accent }]}>{kk.features.halalHistoryClear}</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
                {lookupHistory.map((h) => (
                  <Pressable
                    key={`${h.at}-${h.query}`}
                    onPress={() => {
                      if (h.kind === "barcode") {
                        const cached = findHalalScanResult(scanResults, h.query);
                        if (cached) {
                          restoreScanSnapshot(cached);
                          return;
                        }
                        setMainTab("verify");
                        setCheckInput(h.query);
                        void applyBarcodePipeline(h.query);
                        return;
                      }
                      setSearchText(h.query);
                    }}
                    style={({ pressed }) => [
                      styles.historyChip,
                      { borderColor: colors.border, backgroundColor: colors.bg },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={h.query}
                  >
                    <MaterialIcons
                      name={h.kind === "barcode" ? "qr-code-2" : "history"}
                      size={16}
                      color={colors.muted}
                    />
                    <Text style={[styles.historyChipTxt, { color: colors.text }]} numberOfLines={1}>
                      {h.query}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
          {searchErr ? (
            <Text style={[styles.errTxt, { color: colors.error }]}>{searchErr}</Text>
          ) : null}
            </>
          ) : null}

          <Pressable
            onPress={() => setInstFiltersOpen((v) => !v)}
            style={({ pressed }) => [
              styles.filterToggle,
              { borderColor: colors.border, backgroundColor: colors.card },
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ expanded: instFiltersOpen }}
            accessibilityLabel={kk.features.halalFilterSectionTitle}
          >
            <MaterialIcons name="tune" size={20} color={colors.accent} />
            <Text style={[styles.filterToggleTxt, { color: colors.text }]}>{kk.features.halalFilterSectionTitle}</Text>
            <MaterialIcons
              name={instFiltersOpen ? "expand-less" : "expand-more"}
              size={22}
              color={colors.muted}
            />
          </Pressable>
          {instFiltersOpen ? (
            <View style={[styles.filterPanel, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.filterRowLabel, { color: colors.muted }]}>{kk.features.halalFilterCertLabel}</Text>
              <HalalFilterChipRow
                chips={instCertFilterChips}
                value={instCertFilter}
                onChange={setInstCertFilter}
                colors={colors}
                accessibilityGroupLabel={kk.features.halalFilterCertLabel}
              />
              <Text style={[styles.filterRowLabel, { color: colors.muted, marginTop: 10 }]}>
                {kk.features.halalFilterCategoryLabel}
              </Text>
              <HalalFilterChipRow
                chips={instCategoryFilterChips}
                value={instCategoryFilter}
                onChange={setInstCategoryFilter}
                colors={colors}
                accessibilityGroupLabel={kk.features.halalFilterCategoryLabel}
              />
            </View>
          ) : null}

          {debouncedSearch.length >= 3 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{kk.features.halalHubSearchResults}</Text>
              {searchLoading && searchItems.length > 0 ? (
                <Text style={[styles.hint, { color: colors.muted, marginBottom: 8 }]}>
                  {kk.features.halalInstantSearchHint}
                </Text>
              ) : null}
              {searchItems.length === 0 && !searchLoading ? (
                <Text style={[styles.hint, { color: colors.muted }]}>{kk.features.halalHubEmpty}</Text>
              ) : (
                searchItems.map(renderSearchCard)
              )}
              {searchMeta?.totalPages != null && searchMeta.page != null && debouncedSearch.length >= 3 ? (
                <Text style={[styles.pageInfoTxt, { color: colors.muted }]}>
                  {kk.features.halalSearchPageInfo(searchMeta.page, searchMeta.totalPages)}
                </Text>
              ) : null}
              {debouncedSearch.length >= 3 &&
              !searchLoading &&
              searchMeta?.totalPages != null &&
              searchMeta.page != null &&
              searchMeta.page < searchMeta.totalPages &&
              searchItems.length < MAX_SEARCH_ACCUM ? (
                <Pressable
                  onPress={() => setSearchPage((p) => p + 1)}
                  style={({ pressed }) => [
                    styles.loadMoreBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalLoadMoreResults}
                >
                  <MaterialIcons name="expand-more" size={22} color={colors.accent} />
                  <Text style={[styles.loadMoreTxt, { color: colors.text }]}>{kk.features.halalLoadMoreResults}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {debouncedSearch.length < 3 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{kk.features.halalCatalogTitle}</Text>
              <Text style={[styles.hint, { color: colors.muted, marginBottom: 8 }]}>{kk.features.halalCatalogHint}</Text>
              {catalogLoading && catalogItems.length === 0 ? (
                <View style={styles.catalogLoadingBlock}>
                  <RaqatOrnamentSpinner size={40} style={{ marginVertical: 12 }} />
                  <Text style={[styles.hint, { color: colors.muted, textAlign: "center" }]}>
                    {kk.features.halalCatalogLoadingHint}
                  </Text>
                </View>
              ) : catalogErr && catalogItems.length === 0 ? (
                <View style={styles.retryBlock}>
                  <Text style={[styles.errTxt, { color: colors.error }]}>{catalogErr}</Text>
                  <Pressable
                    onPress={() => {
                      setCatalogPage(1);
                      void loadCatalog({ page: 1, forceNetwork: true });
                    }}
                    style={({ pressed }) => [styles.retryBtn, { borderColor: colors.border }, pressed && { opacity: 0.88 }]}
                    accessibilityRole="button"
                    accessibilityLabel={kk.common.retry}
                  >
                    <MaterialIcons name="refresh" size={20} color={colors.accent} />
                    <Text style={[styles.retryBtnTxt, { color: colors.accent }]}>{kk.common.retry}</Text>
                  </Pressable>
                </View>
              ) : catalogItems.length === 0 ? (
                <Text style={[styles.hint, { color: colors.muted }]}>
                  {instCategoryFilter.trim()
                    ? kk.features.halalCatalogFilterEmpty
                    : kk.features.halalHubEmpty}
                </Text>
              ) : (
                <>
                  {catalogLoading && catalogItems.length > 0 ? (
                    <Text style={[styles.hint, { color: colors.muted, marginBottom: 8 }]}>
                      {kk.features.halalInstantSearchHint}
                    </Text>
                  ) : null}
                  {catalogItems.map(renderSearchCard)}
                </>
              )}
              {catalogMeta?.totalPages != null && catalogMeta.page != null ? (
                <Text style={[styles.pageInfoTxt, { color: colors.muted }]}>
                  {kk.features.halalSearchPageInfo(catalogMeta.page, catalogMeta.totalPages)}
                </Text>
              ) : null}
              {!catalogLoading &&
              catalogMeta?.totalPages != null &&
              catalogMeta.page != null &&
              catalogMeta.page < catalogMeta.totalPages &&
              catalogItems.length < MAX_SEARCH_ACCUM ? (
                <Pressable
                  onPress={() => {
                    const next = catalogPage + 1;
                    setCatalogPage(next);
                    void loadCatalog({ page: next, append: true, forceNetwork: true });
                  }}
                  style={({ pressed }) => [
                    styles.loadMoreBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalLoadMoreResults}
                >
                  <MaterialIcons name="expand-more" size={22} color={colors.accent} />
                  <Text style={[styles.loadMoreTxt, { color: colors.text }]}>{kk.features.halalLoadMoreResults}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      ) : mainTab === "map" ? null : (
        <>
          {companyBrowse ? (
            <View style={[styles.companyBrowseCard, { borderColor: colors.border, backgroundColor: colors.accentSurface }]}>
              <View style={styles.companyBrowseHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.companyBrowseTitle, { color: colors.text }]} numberOfLines={2}>
                    {kk.features.halalCompanyProductsHeading}: {companyBrowse.title}
                  </Text>
                  {companyBrowse.loading ? (
                    <RaqatOrnamentSpinner size={28} style={{ marginTop: 10 }} />
                  ) : null}
                  {companyBrowse.error ? (
                    <Text style={[styles.errTxt, { color: colors.error, marginTop: 6 }]}>{companyBrowse.error}</Text>
                  ) : null}
                  {!companyBrowse.loading && !companyBrowse.error && companyBrowse.items.length === 0 ? (
                    <Text style={[styles.hint, { color: colors.muted, marginTop: 8 }]}>{kk.features.halalCompanyProductsEmpty}</Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => setCompanyBrowse(null)}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalCompanyProductsClear}
                  style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.75 : 1 }]}
                >
                  <MaterialIcons name="close" size={26} color={colors.text} />
                </Pressable>
              </View>
              {companyBrowse.items.map(renderCheckProduct)}
            </View>
          ) : null}

          <HalalProductsApiBanner
            colors={colors}
            probe={productsApiProbe}
            loading={productsApiProbeLoading}
            seedCount={seedProductCount}
            onOpenDocs={() => openExternal(halalDamuSiteHomeUrl())}
          />

          <HalalVerifyHub
            colors={colors}
            productStatusChips={goodsProductStatusChips}
            productStatusFilter={goodsProductStatusFilter}
            onProductStatusFilterChange={setGoodsProductStatusFilter}
            goodsQuick={goodsQuick}
            onGoodsQuickChange={setGoodsQuick}
            goodsQuickBusy={goodsQuickBusy}
            checkInput={checkInput}
            onCheckInputChange={setCheckInput}
            checkBusy={checkBusy || checkFlowPhase !== null}
            checkErr={checkErr}
            checkFlowPhase={checkFlowPhase}
            photoAnalysisText={photoAnalysisText}
            onOpenCamera={() => void openCameraForManualText()}
            onOpenBarcode={() => setScanOpen(true)}
            onRunCheck={() => void runTextHalalCheck()}
          />

          {checkSummary && checkLookupDone && !checkFlowPhase ? (
            <View
              style={[
                styles.verifySummary,
                {
                  borderColor:
                    checkSummary.tone === "ok"
                      ? "#10b981"
                      : checkSummary.tone === "bad"
                        ? colors.error
                        : checkSummary.tone === "warn"
                          ? "#f59e0b"
                          : colors.border,
                  backgroundColor:
                    checkSummary.tone === "ok"
                      ? "rgba(16,185,129,0.10)"
                      : checkSummary.tone === "bad"
                        ? "rgba(220,38,38,0.08)"
                        : checkSummary.tone === "warn"
                          ? "rgba(245,158,11,0.10)"
                          : colors.card,
                },
              ]}
              accessibilityLiveRegion="polite"
            >
              <View style={styles.verifySummaryHead}>
                <MaterialIcons
                  name={checkSummary.icon}
                  size={22}
                  color={
                    checkSummary.tone === "ok"
                      ? "#10b981"
                      : checkSummary.tone === "bad"
                        ? colors.error
                        : checkSummary.tone === "warn"
                          ? "#f59e0b"
                          : colors.accent
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.verifySummaryTitle, { color: colors.text }]}>{checkSummary.title}</Text>
                  <Text style={[styles.verifySummaryBody, { color: colors.muted }]}>{checkSummary.body}</Text>
                </View>
              </View>
              {lastCheckQuery?.trim() ? (
                <Pressable
                  onPress={() => openExternal(halalDamuRegistryWebSearchUrl(lastCheckQuery))}
                  style={({ pressed }) => [
                    styles.verifySummaryBtn,
                    { borderColor: colors.border, backgroundColor: colors.bg },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="link"
                  accessibilityLabel={kk.features.halalCheckOpenOfficial}
                >
                  <MaterialIcons name="open-in-new" size={18} color={colors.accent} />
                  <Text style={[styles.verifySummaryBtnTxt, { color: colors.accent }]}>
                    {kk.features.halalCheckOpenOfficial}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {scanResults.length > 0 ? (
            <View style={styles.historyBlock}>
              <View style={styles.historyHead}>
                <Text style={[styles.historyTitle, { color: colors.muted }]}>{kk.features.halalScanResultsTitle}</Text>
                <Pressable
                  onPress={() => void clearHalalScanResults().then(() => setScanResults([]))}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalScanResultsClear}
                  style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                >
                  <Text style={[styles.historyClearTxt, { color: colors.accent }]}>
                    {kk.features.halalScanResultsClear}
                  </Text>
                </Pressable>
              </View>
              <Text style={[styles.hint, { color: colors.muted, marginBottom: 8 }]}>{kk.features.halalScanResultsHint}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
                {scanResults.map((s) => (
                  <Pressable
                    key={`${s.at}-${s.barcode}`}
                    onPress={() => restoreScanSnapshot(s)}
                    style={({ pressed }) => [
                      styles.historyChip,
                      { borderColor: colors.border, backgroundColor: colors.bg },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={s.barcode}
                  >
                    <MaterialIcons name="qr-code-2" size={16} color={colors.accent} />
                    <Text style={[styles.historyChipTxt, { color: colors.text }]} numberOfLines={1}>
                      {s.barcode}
                    </Text>
                    <Text style={[styles.scanCacheBadge, { color: colors.muted }]}>
                      {kk.features.halalScanResultsOfflineBadge}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {(checkProducts.length > 0 || checkAdditives.length > 0 || checkCompanies.length > 0) &&
          !checkFlowPhase ? (
            <View style={styles.section}>
              {(goodsQuickBusy || checkBusy) &&
              (checkProducts.length > 0 || checkCompanies.length > 0 || checkAdditives.length > 0) ? (
                <Text style={[styles.hint, { color: colors.muted, marginBottom: 8 }]}>
                  {kk.features.halalInstantSearchHint}
                </Text>
              ) : null}
              {checkProducts.length > 0 ? (
                <>
                  <Text style={[styles.subHead, { color: colors.muted }]}>{kk.features.halalCheckProducts}</Text>
                  {checkProducts.map(renderCheckProduct)}
                </>
              ) : null}
              {checkAdditives.length > 0 ? (
                <>
                  <Text style={[styles.subHead, { color: colors.muted }]}>{kk.features.halalCheckAdditives}</Text>
                  {checkAdditives.map(renderCheckAdditive)}
                </>
              ) : null}
              {checkCompanies.length > 0 ? (
                <>
                  <Text style={[styles.subHead, { color: colors.muted }]}>{kk.features.halalCheckCompaniesShort}</Text>
                  {checkCompanies.map(renderSearchCard)}
                </>
              ) : null}
            </View>
          ) : null}

          {checkLookupDone && !checkFlowPhase && checkProducts.length + checkAdditives.length + checkCompanies.length === 0 ? (
            <View style={styles.checkEmptyBlock}>
              <Text style={[styles.hint, { color: colors.muted }]}>{kk.features.halalCheckNoData}</Text>
              {lastCheckQuery?.trim() ? (
                <Pressable
                  onPress={() => openExternal(halalDamuRegistryWebSearchUrl(lastCheckQuery))}
                  style={({ pressed }) => [
                    styles.checkOfficialBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    pressed && { opacity: 0.92 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalCheckOpenOfficial}
                >
                  <MaterialIcons name="open-in-new" size={20} color={colors.accent} />
                  <Text style={[styles.checkOfficialBtnTxt, { color: colors.accent }]}>
                    {kk.features.halalCheckOpenOfficial}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <Text style={[styles.disclaimerFoot, { color: colors.muted }]}>{kk.features.halalDamuDisclaimer}</Text>

      {/localhost|127\.0\.0\.1/i.test(siteUrl) ? (
        <Text style={[styles.devHint, { color: colors.muted }]}>{kk.features.halalLocalhostHint}</Text>
      ) : null}

      <HalalStatsBar
        colors={colors}
        totalItems={catalogMeta?.totalItems ?? catalogItems.length}
        syncedAt={lastSyncedAt}
        fromCache={syncFromCache}
        loading={catalogLoading && catalogItems.length === 0}
        onRefresh={() => void onPullRefresh()}
        onOpenSite={() => openExternal(halalDamuSiteHomeUrl())}
        placement="footer"
      />
      </ScreenFitScrollView>
      <HalalCompaniesMapModal
        visible={mapOpen}
        onClose={closeHalalMap}
        onSelectCompanyId={(id) => setDetailId(id)}
        strings={halalMapModalStrings}
        colors={colors}
      />
      <HalalBarcodeCameraModal
        visible={scanOpen}
        colors={colors}
        title={kk.features.halalScanTitle}
        hint={kk.features.halalScanHint}
        webUnavailable={kk.features.halalScanWebUnavailable}
        camPermHint={kk.features.halalScanCamPerm}
        camPermBtn={kk.features.halalScanCamPermBtn}
        closeA11y={kk.features.halalHubClose}
        onClose={() => setScanOpen(false)}
        onBarcode={(data) => void applyBarcodePipeline(data)}
      />
      <Modal
        visible={detailId != null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailId(null)}
      >
        <View style={[styles.modalRoot, { paddingTop: Platform.OS === "ios" ? 12 : 8 + insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalH, { color: colors.text }]}>{kk.features.halalHubDetailTitle}</Text>
            <Pressable
              onPress={() => setDetailId(null)}
              style={({ pressed }) => [styles.modalClose, pressed && { opacity: 0.75 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.features.halalHubClose}
            >
              <MaterialIcons name="close" size={26} color={colors.text} />
            </Pressable>
          </View>
          {detailLoading || !detail ? (
            <View style={styles.modalCenter}>
              <RaqatOrnamentSpinner size={48} />
              <Text style={[styles.hint, { color: colors.muted, marginTop: 12 }]}>{kk.features.halalHubLoading}</Text>
            </View>
          ) : (
            <ScrollView
              nestedScrollEnabled
              contentContainerStyle={{ paddingBottom: 24 + insets.bottom, paddingHorizontal: 18 }}
            >
              {detail.logoUrl ? (
                <RasterImage
                  source={{ uri: detail.logoUrl }}
                  style={styles.detailHero}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              ) : null}
              {detail.galleryUrls.filter((u) => u && u !== detail.logoUrl).length > 0 ? (
                <View style={styles.detailGalleryBlock}>
                  <Text style={[styles.detailSectionLabel, { color: colors.muted }]}>{kk.features.halalHubGallery}</Text>
                  <ScrollView
                    horizontal
                    nestedScrollEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.detailGalleryScroll}
                  >
                    {detail.galleryUrls
                      .filter((u) => u && u !== detail.logoUrl)
                      .map((uri) => (
                        <View key={uri} style={styles.galleryThumbWrap}>
                          <RasterImage
                            source={{ uri }}
                            style={styles.galleryThumb}
                            resizeMode="cover"
                            accessibilityIgnoresInvertColors
                          />
                        </View>
                      ))}
                  </ScrollView>
                </View>
              ) : null}

              <Text style={[styles.detailTitle, { color: colors.text }]}>{detail.title}</Text>

              <View style={styles.detailActionsRow}>
                <Pressable
                  onPress={() => void onToggleFavorite(detail)}
                  style={({ pressed }) => [
                    styles.detailActionBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isHalalFavorite(favorites, detail.id) ? kk.features.halalFavoritesRemove : kk.features.halalFavoritesAdd
                  }
                >
                  <MaterialIcons
                    name={isHalalFavorite(favorites, detail.id) ? "star" : "star-border"}
                    size={22}
                    color={colors.accent}
                  />
                  <Text style={[styles.detailActionTxt, { color: colors.text }]} numberOfLines={1}>
                    {isHalalFavorite(favorites, detail.id) ? kk.features.halalFavoritesRemove : kk.features.halalFavoritesAdd}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void shareCompanyDetail()}
                  style={({ pressed }) => [
                    styles.detailActionBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalHubShareCompany}
                >
                  <MaterialIcons name="share" size={20} color={colors.accent} />
                  <Text style={[styles.detailActionTxt, { color: colors.text }]} numberOfLines={1}>
                    {kk.features.halalHubShareCompany}
                  </Text>
                </Pressable>
                {detail.address?.trim() ? (
                  <Pressable
                    onPress={() => void copyCompanyAddress()}
                    style={({ pressed }) => [
                      styles.detailActionBtn,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={kk.features.halalHubCopyAddress}
                  >
                    <MaterialIcons name="content-copy" size={20} color={colors.accent} />
                    <Text style={[styles.detailActionTxt, { color: colors.text }]} numberOfLines={1}>
                      {kk.features.halalHubCopyAddress}
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => openExternal(halalDamuCompanyWebUrl(detail))}
                  style={({ pressed }) => [
                    styles.detailActionBtn,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalOpenOnSite}
                >
                  <MaterialIcons name="open-in-new" size={20} color={colors.accent} />
                  <Text style={[styles.detailActionTxt, { color: colors.text }]} numberOfLines={1}>
                    {kk.features.halalOpenOnSite}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => void openCompanyProductsFromDetail(detail)}
                style={({ pressed }) => [
                  styles.detailProductsBtn,
                  { backgroundColor: colors.accent },
                  pressed && { opacity: 0.92 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={kk.features.halalCompanyOpenProducts}
              >
                <MaterialIcons name="inventory-2" size={22} color="#fff" />
                <Text style={styles.detailProductsBtnTxt}>{kk.features.halalCompanyOpenProducts}</Text>
              </Pressable>

              <Text style={[styles.detailSectionLabel, { color: colors.muted, marginTop: 4 }]}>
                {kk.features.halalHubContactsQuick}
              </Text>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsScroll}
              >
                {detail.phones.map((p, i) => {
                  const href = halalTelDialUrl(p);
                  return href ? (
                    <Pressable
                      key={`phone-${i}-${p}`}
                      onPress={() => openExternal(href)}
                      style={({ pressed }) => [
                        styles.quickChip,
                        { borderColor: colors.border, backgroundColor: colors.card },
                        pressed && { opacity: 0.9 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${kk.features.halalHubPhone}: ${p}`}
                    >
                      <MaterialIcons name="call" size={20} color={colors.accent} />
                      <Text style={[styles.quickChipTxt, { color: colors.text }]} numberOfLines={1}>
                        {p}
                      </Text>
                    </Pressable>
                  ) : null;
                })}
                {detail.resolvedMapUrl ? (
                  <Pressable
                    onPress={() => openExternal(detail.resolvedMapUrl!)}
                    style={({ pressed }) => [
                      styles.quickChip,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={kk.features.halalHubOpenRoute}
                  >
                    <MaterialIcons name="directions" size={20} color={colors.accent} />
                    <Text style={[styles.quickChipTxt, { color: colors.text }]} numberOfLines={1}>
                      {kk.features.halalHubOpenRoute}
                    </Text>
                  </Pressable>
                ) : null}
                {detail.website ? (
                  <Pressable
                    onPress={() => openExternal(detail.website!)}
                    style={({ pressed }) => [
                      styles.quickChip,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={kk.features.halalHubWebsite}
                  >
                    <MaterialIcons name="language" size={20} color={colors.accent} />
                    <Text style={[styles.quickChipTxt, { color: colors.text }]} numberOfLines={1}>
                      {kk.features.halalHubWebsite}
                    </Text>
                  </Pressable>
                ) : null}
                {detail.extraUrls.map((ex, i) => (
                  <Pressable
                    key={`extra-${i}-${ex.url}`}
                    onPress={() => openExternal(ex.url)}
                    style={({ pressed }) => [
                      styles.quickChip,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={halalExtraLinkChipLabel(ex.kind)}
                  >
                    <MaterialCommunityIcons name={HALAL_LINK_MCI[ex.kind]} size={20} color={colors.accent} />
                    <Text style={[styles.quickChipTxt, { color: colors.text }]} numberOfLines={1}>
                      {halalExtraLinkChipLabel(ex.kind)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {detail.description ? (
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailK, { color: colors.muted }]}>{kk.features.halalHubDescription}</Text>
                  <Text style={[styles.detailV, { color: colors.text }]} selectable>
                    {detail.description}
                  </Text>
                </View>
              ) : null}

              {detail.address ? (
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailK, { color: colors.muted }]}>{kk.features.halalHubAddress}</Text>
                  <Text style={[styles.detailV, { color: colors.text }]} selectable>
                    {detail.address}
                  </Text>
                </View>
              ) : null}

              {(detail.certificateStatus || detail.certNumber || detail.certIssuedAt || detail.certExpiresAt) ? (
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailK, { color: colors.muted }]}>{kk.features.halalHubCert}</Text>
                  {detail.certificateStatus ? (
                    <HalalCertBadge
                      status={detail.certificateStatus}
                      colors={colors}
                      isDark={isDark}
                    />
                  ) : null}
                  {detail.certNumber ? (
                    <Text style={[styles.detailV, { color: colors.text, marginTop: detail.certificateStatus ? 6 : 0 }]}>
                      {kk.features.halalHubCertNumber}: {detail.certNumber}
                    </Text>
                  ) : null}
                  {detail.certIssuedAt ? (
                    <Text style={[styles.detailV, { color: colors.text, marginTop: 4 }]}>
                      {kk.features.halalHubCertIssued}: {detail.certIssuedAt}
                    </Text>
                  ) : null}
                  {detail.certExpiresAt ? (
                    <Text style={[styles.detailV, { color: colors.text, marginTop: 4 }]}>
                      {kk.features.halalHubCertExpires}: {detail.certExpiresAt}
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {detail.categoryType ? (
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailK, { color: colors.muted }]}>{kk.features.halalHubCategory}</Text>
                  <Text style={[styles.detailV, { color: colors.text }]}>
                    {labelForHalalInstitutionCategory(detail.categoryType)}
                  </Text>
                </View>
              ) : null}
              {detail.updatedAt ? (
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailK, { color: colors.muted }]}>{kk.features.halalHubUpdatedAt}</Text>
                  <Text style={[styles.detailV, { color: colors.text }]}>{detail.updatedAt}</Text>
                </View>
              ) : null}
              {detail.legalName ? (
                <View style={styles.detailBlock}>
                  <Text style={[styles.detailK, { color: colors.muted }]}>{kk.features.halalHubLegalName}</Text>
                  <Text style={[styles.detailV, { color: colors.text }]}>{detail.legalName}</Text>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </Modal>

      <Modal
        visible={additiveDetail != null}
        animationType="fade"
        transparent
        onRequestClose={() => setAdditiveDetail(null)}
      >
        <View style={[styles.additiveModalRoot, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <View style={[styles.additiveModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.additiveModalTitle, { color: colors.text }]}>{additiveDetail?.title}</Text>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ paddingBottom: 8 }}>
              <Text style={[styles.additiveModalBody, { color: colors.text }]}>
                {additiveDetail?.description?.trim() ? additiveDetail.description : kk.features.halalAdditiveNoDesc}
              </Text>
            </ScrollView>
            <Pressable
              onPress={() => setAdditiveDetail(null)}
              style={({ pressed }) => [styles.additiveModalClose, { backgroundColor: colors.accent }, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel={kk.features.halalHubClose}
            >
              <Text style={styles.additiveModalCloseTxt}>{kk.features.halalHubClose}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    syncBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
    },
    syncBannerFooter: {
      marginTop: 20,
      marginBottom: 4,
    },
    syncBannerTextCol: {
      flex: 1,
      minWidth: 0,
    },
    syncBannerTitle: {
      fontSize: 14,
      fontWeight: "900",
    },
    syncBannerSub: {
      fontSize: 12,
      lineHeight: 17,
      marginTop: 3,
    },
    noteCard: {
      borderRadius: 14,
      padding: 14,
      marginBottom: 16,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    noteText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.muted,
    },
    tabRow: {
      flexDirection: "row",
      gap: 8,
      padding: 4,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 14,
    },
    tabChip: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 6,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    tabChipTxt: {
      fontSize: 13,
      textAlign: "center",
      lineHeight: 17,
    },
    mapOpenRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 16,
    },
    mapOpenTxt: {
      flex: 1,
      fontSize: 16,
      fontWeight: "800",
    },
    checkBtnRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 12,
    },
    checkBtn: {
      flex: 1,
      minHeight: 72,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 10,
      paddingVertical: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    checkBtnTxt: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
    checkMultiline: {
      minHeight: 88,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 10 : 8,
      fontSize: 15,
      textAlignVertical: "top",
      marginBottom: 10,
    },
    checkRunBtn: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 14,
      marginBottom: 8,
    },
    checkRunTxt: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
    scanFlowBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 12,
    },
    scanFlowBannerTxt: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      lineHeight: 20,
    },
    checkEmptyBlock: {
      marginTop: 4,
      marginBottom: 12,
      gap: 10,
    },
    verifySummary: {
      marginTop: 2,
      marginBottom: 12,
      padding: 12,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 10,
    },
    verifySummaryHead: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
    },
    verifySummaryTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: "900",
    },
    verifySummaryBody: {
      marginTop: 2,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "600",
    },
    verifySummaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    verifySummaryBtnTxt: {
      fontSize: 13,
      fontWeight: "800",
    },
    checkOfficialBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    checkOfficialBtnTxt: {
      fontSize: 15,
      fontWeight: "800",
    },
    checkRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 8,
    },
    subHead: {
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginTop: 6,
      marginBottom: 6,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    inputWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === "ios" ? 10 : 6,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingVertical: 4,
      minHeight: 40,
    },
    hint: {
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 10,
    },
    errTxt: {
      fontSize: 13,
      marginBottom: 8,
    },
    photoVisionBlock: {
      marginTop: 14,
      marginBottom: 6,
      padding: 14,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
    },
    photoVisionBody: {
      fontSize: 14,
      lineHeight: 21,
      marginTop: 8,
    },
    section: {
      marginTop: 18,
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 10,
    },
    rowCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 8,
    },
    rowCardPressed: {
      opacity: 0.92,
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: "700",
    },
    rowSub: {
      fontSize: 12,
      marginTop: 2,
    },
    searchCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 10,
    },
    thumb: {
      width: 52,
      height: 52,
      borderRadius: 10,
    },
    thumbPlaceholder: {
      alignItems: "center",
      justifyContent: "center",
    },
    searchBody: {
      flex: 1,
      minWidth: 0,
    },
    devHint: {
      marginTop: 10,
      fontSize: 12,
      lineHeight: 18,
      textAlign: "center",
      paddingHorizontal: 8,
    },
    retryBlock: {
      marginVertical: 8,
      gap: 10,
    },
    catalogLoadingBlock: {
      alignItems: "center",
      marginVertical: 8,
      gap: 4,
      paddingHorizontal: 12,
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: colors.card,
    },
    retryBtnTxt: {
      fontSize: 15,
      fontWeight: "800",
    },
    detailActionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 14,
    },
    detailActionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    detailActionTxt: {
      fontSize: 14,
      fontWeight: "700",
      maxWidth: 160,
    },
    detailProductsBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 6,
    },
    detailProductsBtnTxt: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "900",
    },
    filterToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: 4,
      marginBottom: 6,
    },
    filterToggleTxt: {
      flex: 1,
      fontSize: 14,
      fontWeight: "800",
    },
    filterPanel: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      padding: 14,
      marginTop: 0,
      marginBottom: 12,
    },
    disclaimerFoot: {
      fontSize: 11,
      lineHeight: 15,
      textAlign: "center",
      marginTop: 8,
      paddingHorizontal: 4,
    },
    filterSectionLabel: {
      fontSize: 15,
      fontWeight: "900",
      marginBottom: 10,
    },
    filterRowLabel: {
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 6,
    },
    filterChipScroll: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
    },
    filterChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
    },
    filterChipTxt: {
      fontSize: 12,
      fontWeight: "700",
    },
    favChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: 200,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    favChipTxt: {
      flexShrink: 1,
      fontSize: 13,
      fontWeight: "700",
    },
    historyBlock: {
      marginTop: 8,
      marginBottom: 4,
    },
    historyHead: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    historyTitle: {
      fontSize: 12,
      fontWeight: "800",
    },
    historyClearTxt: {
      fontSize: 12,
      fontWeight: "700",
    },
    historyChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: 180,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    historyChipTxt: {
      flexShrink: 1,
      fontSize: 13,
      fontWeight: "600",
    },
    scanCacheBadge: {
      fontSize: 10,
      fontWeight: "700",
      marginLeft: 4,
      textTransform: "uppercase",
    },
    pageInfoTxt: {
      fontSize: 12,
      marginTop: 8,
      marginBottom: 4,
    },
    loadMoreBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: 6,
      marginBottom: 4,
    },
    loadMoreTxt: {
      fontSize: 14,
      fontWeight: "800",
    },
    companyBrowseCard: {
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 12,
      marginBottom: 14,
    },
    companyBrowseHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    companyBrowseTitle: {
      fontSize: 15,
      fontWeight: "900",
      lineHeight: 21,
    },
    additiveModalRoot: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 24,
    },
    additiveModalCard: {
      borderRadius: 16,
      padding: 16,
      borderWidth: StyleSheet.hairlineWidth,
      maxWidth: 440,
      width: "100%",
      alignSelf: "center",
    },
    additiveModalTitle: {
      fontSize: 18,
      fontWeight: "800",
      marginBottom: 10,
    },
    additiveModalBody: {
      fontSize: 15,
      lineHeight: 22,
    },
    additiveModalClose: {
      marginTop: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 12,
    },
    additiveModalCloseTxt: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "800",
    },
    modalRoot: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    modalH: {
      fontSize: 17,
      fontWeight: "800",
      paddingLeft: 10,
      flex: 1,
    },
    modalClose: {
      padding: 10,
    },
    modalCenter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    detailHero: {
      width: "100%",
      height: 200,
      borderRadius: 14,
      marginBottom: 14,
      backgroundColor: colors.card,
    },
    detailTitle: {
      fontSize: 20,
      fontWeight: "800",
      marginBottom: 16,
    },
    detailBlock: {
      marginBottom: 14,
    },
    detailK: {
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    detailV: {
      fontSize: 15,
      lineHeight: 22,
    },
    detailGalleryBlock: {
      marginBottom: 16,
    },
    detailSectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      marginBottom: 8,
      textTransform: "uppercase",
      letterSpacing: 0.3,
    },
    detailGalleryScroll: {
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 4,
    },
    galleryThumbWrap: {
      marginRight: 10,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    galleryThumb: {
      width: 120,
      height: 90,
    },
    quickChipsScroll: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "nowrap",
      paddingBottom: 6,
      paddingRight: 4,
    },
    quickChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginRight: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      maxWidth: 260,
    },
    quickChipTxt: {
      fontSize: 14,
      fontWeight: "700",
      flexShrink: 1,
    },
    mapBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
    },
    mapBtnTxt: {
      fontSize: 15,
      fontWeight: "700",
      flex: 1,
    },
  });
}
