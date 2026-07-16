import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppLocale } from "../../i18n/runtime";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import { useFocusEffect } from "@react-navigation/native";
import type { EdgeInsets } from "react-native-safe-area-context";
import type {
  HalalDamuAdditiveItem,
  HalalDamuCompanyCard,
  HalalDamuProductItem,
} from "../../api/halalDamuWp";
import {
  fetchHalalDamuCompaniesCatalog,
  fetchHalalDamuProductsByBarcode,
  halalDamuRegistryWebSearchUrl,
  halalDamuSiteHomeUrl,
  searchHalalDamuAdditives,
  searchHalalDamuProducts,
} from "../../api/halalDamuWp";
import { HalalBarcodeCameraModal } from "../HalalBarcodeCameraModal";
import { HalalProductResultCard } from "./HalalProductResultCard";
import { HalalProductsApiBanner } from "./HalalProductsApiBanner";
import { HalalVerifyHub, type HalalCheckFlowPhase } from "./HalalVerifyHub";
import { HALAL_PHOTO_ANALYZE_MS, resolveAiTimeoutMs } from "../../config/aiRequestPolicy";
import { getRaqatApiBase, hydrateRaqatApiBaseOverride } from "../../config/raqatApiBase";
import { kk } from "../../i18n/kk";
import { HALAL_HUB_LIST_OPTS, prefetchHalalDamuHub, readHalalHubCatalogSnapshot } from "../../services/halalHubBootstrap";
import { fetchPlatformAiAnalyzeImage } from "../../services/platformApiClient";
import { getHalalProductsSeedCount, mergeHalalProductItems, prefetchHalalProductsSeedIndex, searchHalalProductsSeed, lookupHalalProductsSeedByBarcode } from "../../services/halalProductsSeedKz";
import { probeHalalProductsApi, type HalalProductsApiProbe } from "../../services/halalProductsApiProbe";
import { getValidAccessToken } from "../../storage/authTokens";
import {
  clearHalalScanResults,
  loadHalalScanResults,
  pushHalalScanResult,
  type HalalScanResultSnapshot,
} from "../../storage/halalScanResults";
import { pushHalalLookupHistory } from "../../storage/halalLocalPrefs";
import type { ThemeColors } from "../../theme/colors";
import { formatAiApiError } from "../../utils/formatAiApiError";
import { isHollowAiServerReply } from "../../utils/explainEmptyAiResponse";
import {
  INSTANT_HALAL_SEARCH_LIMIT,
} from "../../utils/halalInstantSearch";
import {
  buildHalalLookupCacheKey,
  readHalalLookupCache,
  writeHalalLookupCache,
} from "../../utils/halalLookupCache";
import { resolveHalalProductSearch } from "../../utils/halalProductSearch";
import { parseHalalVisionMachineLines } from "../../utils/halalVisionMachineLines";
import {
  buildHalalCheckSummary,
  fastSeedProductsForQuery,
  goodsProductStatusChips,
  HALAL_VERIFY_DEBOUNCE_MS,
  HALAL_VISION_CLIENT_PROMPT,
} from "../../utils/halalVerifyHelpers";
import { resolveImagePickerBase64 } from "../../utils/resolveImagePickerBase64";
import { runAfterInteractions } from "../../utils/uiDefer";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  insets: EdgeInsets;
};

export function HalalVerifyTabPanel({ colors, isDark, insets }: Props) {
  useAppLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const productStatusChips = useMemo(() => goodsProductStatusChips(), []);

  const [catalogItems, setCatalogItems] = useState<HalalDamuCompanyCard[]>([]);
  const catalogItemsRef = useRef(catalogItems);
  catalogItemsRef.current = catalogItems;

  const [scanOpen, setScanOpen] = useState(false);
  const [checkInput, setCheckInput] = useState("");
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkErr, setCheckErr] = useState<string | null>(null);
  const [checkProducts, setCheckProducts] = useState<HalalDamuProductItem[]>([]);
  const [checkAdditives, setCheckAdditives] = useState<HalalDamuAdditiveItem[]>([]);
  const [checkCompanies, setCheckCompanies] = useState<HalalDamuCompanyCard[]>([]);
  const [checkLookupDone, setCheckLookupDone] = useState(false);
  const [photoAnalysisText, setPhotoAnalysisText] = useState<string | null>(null);
  const [goodsQuickBusy, setGoodsQuickBusy] = useState(false);
  const [goodsQuick, setGoodsQuick] = useState("");
  const [goodsQuickDebounced, setGoodsQuickDebounced] = useState("");
  const [checkInputDebounced, setCheckInputDebounced] = useState("");
  const [additiveDetail, setAdditiveDetail] = useState<HalalDamuAdditiveItem | null>(null);
  const [productDetail, setProductDetail] = useState<HalalDamuProductItem | null>(null);
  const [goodsProductStatusFilter, setGoodsProductStatusFilter] = useState("");
  const [checkFlowPhase, setCheckFlowPhase] = useState<HalalCheckFlowPhase>(null);
  const [lastCheckQuery, setLastCheckQuery] = useState<string | null>(null);
  const [productsApiProbe, setProductsApiProbe] = useState<HalalProductsApiProbe | null>(null);
  const [productsApiProbeLoading, setProductsApiProbeLoading] = useState(false);
  const [scanResults, setScanResults] = useState<HalalScanResultSnapshot[]>([]);

  const screenActiveRef = useRef(true);
  const lookupGenerationRef = useRef(0);
  const seedProductCount = useMemo(() => getHalalProductsSeedCount(), []);

  const productQueryOpts = useMemo(
    () => ({
      status: goodsProductStatusFilter.trim() || undefined,
      perPage: INSTANT_HALAL_SEARCH_LIMIT,
    }),
    [goodsProductStatusFilter],
  );

  const barcodeQueryOpts = useMemo(
    () => ({
      perPage: INSTANT_HALAL_SEARCH_LIMIT,
    }),
    [],
  );

  const checkSummary = useMemo(
    () => buildHalalCheckSummary(checkProducts, checkAdditives, checkCompanies),
    [checkProducts, checkAdditives, checkCompanies],
  );

  const openExternal = useCallback((url: string) => {
    void Linking.openURL(url);
  }, []);

  useFocusEffect(
    useCallback(() => {
      screenActiveRef.current = true;
      void prefetchHalalDamuHub();
      prefetchHalalProductsSeedIndex();
      void readHalalHubCatalogSnapshot().then((snap) => {
        if (snap?.items.length) setCatalogItems(snap.items);
      });
      void fetchHalalDamuCompaniesCatalog({ page: 1, ...HALAL_HUB_LIST_OPTS }).then((res) => {
        if (res.items.length > 0) setCatalogItems(res.items);
      });
      void loadHalalScanResults().then(setScanResults);
      return () => {
        screenActiveRef.current = false;
      };
    }, []),
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
        setCheckProducts(cached.products);
        setCheckAdditives(cached.additives);
        setCheckCompanies([]);
        return;
      }

      if (!silentBusy) {
        if (useMainBusy) setCheckFlowPhase("registry");
        else setGoodsQuickBusy(true);
      }
      setCheckErr(null);
      setCheckLookupDone(false);
      setCheckProducts([]);
      setCheckAdditives([]);
      setCheckCompanies([]);
      const instantSeedProducts = fastSeedProductsForQuery(q, goodsProductStatusFilter);
      if (instantSeedProducts.length > 0) setCheckProducts(instantSeedProducts);
      try {
        const [prodResolved, add] = await Promise.all([
          resolveHalalProductSearch(q, catalogItemsRef.current, productQueryOpts),
          searchHalalDamuAdditives(q, { perPage: INSTANT_HALAL_SEARCH_LIMIT }),
        ]);
        if (gen !== lookupGenerationRef.current) return;
        const hasError = Boolean(prodResolved.error || add.error);
        if (hasError) setCheckErr(kk.features.halalHubNetworkErr);
        const products = mergeHalalProductItems(prodResolved.items, instantSeedProducts);
        setCheckProducts(products);
        setCheckAdditives(add.items);
        setCheckCompanies([]);
        if (!hasError) {
          writeHalalLookupCache(cacheKey, {
            products,
            additives: add.items,
            companies: [],
          });
        }
        void pushHalalLookupHistory(q, "text");
      } finally {
        if (gen !== lookupGenerationRef.current) return;
        if (!silentBusy) {
          if (useMainBusy) setCheckFlowPhase(null);
          else setGoodsQuickBusy(false);
        }
        setCheckLookupDone(true);
      }
    },
    [productQueryOpts, goodsProductStatusFilter],
  );

  const runTextHalalCheck = useCallback(async () => {
    const q = checkInput.trim();
    if (q.length < 2) {
      Alert.alert(kk.common.error, kk.features.halalCheckMin2);
      return;
    }
    setCheckBusy(true);
    setLastCheckQuery(q);
    try {
      await lookupHalalRegistry(q, { useMainBusy: true, silentBusy: true });
    } finally {
      setCheckBusy(false);
    }
  }, [checkInput, lookupHalalRegistry]);

  const applyBarcodePipeline = useCallback(
    async (raw: string, opts?: { silentBusy?: boolean }) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      setCheckInput(trimmed);
      const digits = trimmed.replace(/\D/g, "");
      setLastCheckQuery(digits || trimmed);
      setPhotoAnalysisText(null);
      setCheckLookupDone(false);
      setCheckFlowPhase("registry");
      setCheckErr(null);
      setCheckProducts([]);
      setCheckAdditives([]);
      setCheckCompanies([]);
      const instantSeedProducts = fastSeedProductsForQuery(digits || trimmed, goodsProductStatusFilter);
      if (instantSeedProducts.length > 0) setCheckProducts(instantSeedProducts);
      try {
        const [byBc, byTxt, add] = await Promise.all([
          fetchHalalDamuProductsByBarcode(digits || trimmed, barcodeQueryOpts),
          searchHalalDamuProducts(trimmed.length >= 2 ? trimmed : digits, barcodeQueryOpts),
          searchHalalDamuAdditives((digits.length >= 2 ? digits : trimmed).slice(0, 40), {
            perPage: INSTANT_HALAL_SEARCH_LIMIT,
          }),
        ]);
        let merged = mergeHalalProductItems(byBc.items, instantSeedProducts);
        merged = mergeHalalProductItems(merged, lookupHalalProductsSeedByBarcode(digits || trimmed));
        merged = mergeHalalProductItems(merged, byTxt.items);
        if (merged.length === 0 && (trimmed.length >= 2 || digits.length >= 2)) {
          merged = mergeHalalProductItems(
            merged,
            searchHalalProductsSeed(digits || trimmed, INSTANT_HALAL_SEARCH_LIMIT),
          );
        }
        if (merged.length === 0 && (trimmed.length >= 2 || digits.length >= 2)) {
          const fallback = await resolveHalalProductSearch(digits || trimmed, catalogItemsRef.current, barcodeQueryOpts);
          merged = mergeHalalProductItems(merged, fallback.items);
        }
        if ((byBc.error || byTxt.error || add.error) && merged.length === 0) {
          setCheckErr(kk.features.halalHubNetworkErr);
        }
        setCheckProducts(merged);
        setCheckAdditives(add.items);
        setCheckCompanies([]);
        void pushHalalLookupHistory(digits || trimmed, "barcode");
        const bcKey = digits || trimmed;
        if (bcKey.length >= 4) {
          const nextScan = await pushHalalScanResult({
            barcode: bcKey,
            products: merged,
            additives: add.items,
            companies: [],
          });
          setScanResults(nextScan);
        }
      } finally {
        setCheckLookupDone(true);
        setCheckFlowPhase(null);
      }
    },
    [barcodeQueryOpts, goodsProductStatusFilter],
  );

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

    setPhotoAnalysisText(null);
    setCheckErr(null);
    setCheckFlowPhase("registry");
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
  }, [applyBarcodePipeline, lookupHalalRegistry]);

  const restoreScanSnapshot = useCallback((snap: HalalScanResultSnapshot) => {
    setCheckInput(snap.barcode);
    setLastCheckQuery(snap.barcode);
    setCheckProducts(snap.products);
    setCheckAdditives(snap.additives);
    setCheckCompanies(snap.companies);
    setCheckLookupDone(true);
    setCheckErr(null);
    setPhotoAnalysisText(null);
    setCheckFlowPhase(null);
  }, []);

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
  }, [goodsQuickDebounced, lookupHalalRegistry, goodsProductStatusFilter]);

  useEffect(() => {
    if (checkInputDebounced.length < 2) return;
    if (checkFlowPhase) return;
    if (!screenActiveRef.current) return;
    const gen = ++lookupGenerationRef.current;
    void (async () => {
      await lookupHalalRegistry(checkInputDebounced, { useMainBusy: false });
      if (gen !== lookupGenerationRef.current) return;
    })();
  }, [checkInputDebounced, lookupHalalRegistry, goodsProductStatusFilter, checkFlowPhase]);

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
      onPress={() => setProductDetail(p)}
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

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.pad, { paddingBottom: 24 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <HalalProductsApiBanner
          colors={colors}
          probe={productsApiProbe}
          loading={productsApiProbeLoading}
          seedCount={seedProductCount}
          onOpenDocs={() => openExternal(halalDamuSiteHomeUrl())}
        />

        <HalalVerifyHub
          colors={colors}
          productStatusChips={productStatusChips}
          productStatusFilter={goodsProductStatusFilter}
          onProductStatusFilterChange={setGoodsProductStatusFilter}
          checkBusy={checkBusy || checkFlowPhase !== null}
          checkErr={checkErr}
          checkFlowPhase={checkFlowPhase}
          lastBarcode={lastCheckQuery}
          onOpenBarcode={() => setScanOpen(true)}
          onSubmitBarcode={(barcode) => void applyBarcodePipeline(barcode)}
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

        {(checkProducts.length > 0 || checkAdditives.length > 0) && !checkFlowPhase ? (
          <View style={styles.section}>
            {(goodsQuickBusy || checkBusy) && (checkProducts.length > 0 || checkAdditives.length > 0) ? (
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
          </View>
        ) : null}

        {checkLookupDone && !checkFlowPhase && checkProducts.length + checkAdditives.length === 0 ? (
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

        <Text style={[styles.disclaimerFoot, { color: colors.muted }]}>{kk.features.halalDamuDisclaimer}</Text>
      </ScrollView>

      <HalalBarcodeCameraModal
        visible={scanOpen}
        colors={colors}
        title={kk.features.halalScanTitle}
        hint={kk.features.halalScanHint}
        webUnavailable={kk.features.halalScanWebUnavailable}
        camPermHint={kk.features.halalScanCamPerm}
        camPermBtn={kk.features.halalScanCamPermBtn}
        photoHint={kk.features.halalCheckPhotoBody}
        capturePhotoLabel={kk.features.halalCheckPhotoBtn}
        pickGalleryLabel="Галерея"
        photoScanBusyLabel="Іздеу…"
        photoNoBarcode="Штрихкод табылмады"
        closeA11y={kk.features.halalHubClose}
        onClose={() => setScanOpen(false)}
        onBarcode={(data) => void applyBarcodePipeline(data)}
      />

      <Modal
        visible={productDetail != null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setProductDetail(null)}
      >
        <View style={[styles.additiveModalRoot, { paddingTop: Platform.OS === "ios" ? 12 : 8 + insets.top }]}>
          <View style={styles.additiveModalHeader}>
            <Text style={[styles.additiveModalTitle, { color: colors.text }]} numberOfLines={3}>
              {productDetail?.title}
            </Text>
            <Pressable
              onPress={() => setProductDetail(null)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={kk.features.halalHubClose}
              style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.75 : 1 }]}
            >
              <MaterialIcons name="close" size={26} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24 + insets.bottom }}>
            {productDetail?.barcode ? (
              <Text style={[styles.additiveModalBody, { color: colors.muted, marginBottom: 10 }]}>
                {kk.features.halalProductCopyBarcode}: {productDetail.barcode}
              </Text>
            ) : null}
            {productDetail?.certificateStatus ? (
              <Text style={[styles.additiveModalBody, { color: colors.text, marginBottom: 10 }]}>
                {kk.features.halalProductStatusHint} {productDetail.certificateStatus}
              </Text>
            ) : null}
            <Text style={[styles.additiveModalBody, { color: colors.text }]}>
              {productDetail?.ingredients?.trim()
                ? productDetail.ingredients
                : kk.features.halalProductsApiEmptyBody}
            </Text>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={additiveDetail != null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAdditiveDetail(null)}
      >
        <View style={[styles.additiveModalRoot, { paddingTop: Platform.OS === "ios" ? 12 : 8 + insets.top }]}>
          <View style={styles.additiveModalHeader}>
            <Text style={[styles.additiveModalTitle, { color: colors.text }]}>{additiveDetail?.title}</Text>
            <Pressable
              onPress={() => setAdditiveDetail(null)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={kk.features.halalHubClose}
              style={({ pressed }) => [{ padding: 6, opacity: pressed ? 0.75 : 1 }]}
            >
              <MaterialIcons name="close" size={26} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24 + insets.bottom }}>
            <Text style={[styles.additiveModalBody, { color: colors.text }]}>
              {additiveDetail?.description?.trim() ? additiveDetail.description : kk.features.halalAdditiveNoDesc}
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.bg },
    pad: { paddingHorizontal: 14, paddingTop: 10 },
    section: { marginTop: 4 },
    subHead: {
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 0.35,
      marginTop: 8,
      marginBottom: 6,
    },
    hint: { fontSize: 12, lineHeight: 17 },
    verifySummary: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 14,
      padding: 12,
      marginBottom: 12,
      gap: 10,
    },
    verifySummaryHead: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    verifySummaryTitle: { fontSize: 15, fontWeight: "900" },
    verifySummaryBody: { fontSize: 13, lineHeight: 18, marginTop: 4 },
    verifySummaryBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    verifySummaryBtnTxt: { fontSize: 13, fontWeight: "800" },
    historyBlock: { marginTop: 4, marginBottom: 8 },
    historyHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    historyTitle: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.35 },
    historyClearTxt: { fontSize: 12, fontWeight: "700" },
    filterChipScroll: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
    historyChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      maxWidth: 220,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
    },
    historyChipTxt: { flexShrink: 1, fontSize: 13, fontWeight: "700", maxWidth: 120 },
    scanCacheBadge: { fontSize: 10, fontWeight: "700" },
    checkEmptyBlock: { alignItems: "center", gap: 10, paddingVertical: 8, marginBottom: 8 },
    checkOfficialBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    checkOfficialBtnTxt: { fontSize: 14, fontWeight: "800" },
    disclaimerFoot: {
      fontSize: 11,
      lineHeight: 15,
      textAlign: "center",
      marginTop: 8,
      paddingHorizontal: 4,
    },
    additiveModalRoot: { flex: 1, backgroundColor: colors.bg },
    additiveModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    additiveModalTitle: { flex: 1, fontSize: 18, fontWeight: "900", paddingRight: 8 },
    additiveModalBody: { fontSize: 15, lineHeight: 22 },
  });
}
