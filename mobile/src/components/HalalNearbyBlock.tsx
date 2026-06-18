import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { locationIcons } from "../theme/appIcons";
import * as Location from "expo-location";
import type { HalalDamuCompanyCard, HalalDamuProductItem } from "../api/halalDamuWp";
import {
  fetchHalalDamuCompaniesNearby,
  searchHalalDamuCompanies,
} from "../api/halalDamuWp";
import { resolveHalalProductBrowse, resolveHalalProductSearch } from "../utils/halalProductSearch";
import {
  listHalalProductsSeedBrowse,
  searchHalalProductsSeed,
} from "../services/halalProductsSeedKz";
import { HalalProductResultCard } from "./halal/HalalProductResultCard";
import { HalalFilterChipRow, type HalalFilterChip } from "./HalalFilterChipRow";
import type { ThemeColors } from "../theme/colors";
import { kk } from "../i18n/kk";
import { OfficialFeedCard } from "./OfficialFeedCard";
import { halalCompanyToFeedItem } from "../utils/officialFeedMappers";
import { RaqatOrnamentSpinner } from "./RaqatOrnamentSpinner";
import { halalInstitutionCategoryFilterChips } from "../utils/halalCategoryLabels";
import {
  filterHalalCompaniesWithinRadius,
  formatHalalDistanceKm,
  type HalalCompanyWithDistance,
} from "../utils/halalGeoFilter";
import {
  filterHalalCompaniesNearbyInstant,
  INSTANT_HALAL_SEARCH_LIMIT,
  mergeHalalNearbyCompanyLists,
  NEARBY_API_PER_PAGE,
  NEARBY_INSTITUTIONS_MAX,
} from "../utils/halalInstantSearch";
import { searchNearbyMosques } from "../data/mosques2gisCatalog";
import { mosqueDetailForMosque } from "../data/mosqueDetailsEnrichment";
import { formatMosqueDistanceKm, type Mosque2GisWithDistance } from "../utils/mosqueGeoFilter";
import * as Linking from "expo-linking";

const NEARBY_FETCH_OPTS = {
  perPage: NEARBY_API_PER_PAGE,
  skipMediaEnrich: true as const,
};

const RADIUS_OPTIONS_KM = [5, 10] as const;
const NEARBY_RENDER_LIMIT = 30;

type NearbyLookupKind = "institution" | "product" | "mosque";

const PRODUCT_SEARCH_DEBOUNCE_MS = 260;
const LAST_KNOWN_LOCATION_MAX_AGE_MS = 5 * 60_000;

type Props = {
  colors: ThemeColors;
  /** Жүктелген каталог — GPS алғаннан кейін API күтпей алғашқы 10. */
  catalogItems?: HalalDamuCompanyCard[];
  certificateStatusFilter?: string;
  categoryTypeFilter?: string;
  onCategoryTypeFilterChange?: (value: string) => void;
  productStatusFilter?: string;
  onProductStatusFilterChange?: (value: string) => void;
  productStatusChips?: HalalFilterChip[];
  onOpenCompany: (id: number) => void;
  onOpenProductLookup?: (query: string) => void;
  onLookupKindChange?: (kind: NearbyLookupKind) => void;
};

function filterCompaniesByQuery(rows: HalalCompanyWithDistance[], query: string): HalalCompanyWithDistance[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((c) => {
    const title = c.title.toLowerCase();
    const addr = (c.address ?? "").toLowerCase();
    const legal = (c.legalName ?? "").toLowerCase();
    return title.includes(q) || addr.includes(q) || legal.includes(q);
  });
}

function filterProductsByQuery(rows: HalalDamuProductItem[], query: string): HalalDamuProductItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((p) => {
    const title = p.title.toLowerCase();
    const bc = (p.barcode ?? "").toLowerCase();
    return title.includes(q) || bc.includes(q);
  });
}

function mosqueTelDialUrl(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function mosqueConfidenceLabel(confidence: "verified" | "partial" | "map_only" | undefined): string {
  switch (confidence) {
    case "verified":
      return "Расталған дерек";
    case "partial":
      return "Жартылай расталған";
    case "map_only":
    default:
      return "Карта дерегі ғана";
  }
}

export function HalalNearbyBlock({
  colors,
  catalogItems = [],
  certificateStatusFilter,
  categoryTypeFilter = "",
  onCategoryTypeFilterChange,
  productStatusFilter = "",
  onProductStatusFilterChange,
  productStatusChips = [],
  onOpenCompany,
  onOpenProductLookup,
  onLookupKindChange,
}: Props) {
  const searchInputRef = useRef<TextInput>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lookupKind, setLookupKind] = useState<NearbyLookupKind>("institution");
  const [institutionRows, setInstitutionRows] = useState<HalalCompanyWithDistance[]>([]);
  const [productRows, setProductRows] = useState<HalalDamuProductItem[]>([]);
  const [mosqueRows, setMosqueRows] = useState<Mosque2GisWithDistance[]>([]);
  const [searchText, setSearchText] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(RADIUS_OPTIONS_KM[0]);
  const [productFromProducers, setProductFromProducers] = useState(false);
  const [productFromSeed, setProductFromSeed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState<Mosque2GisWithDistance | null>(null);

  const lookupKindChips = useMemo(
    () => [
      { value: "institution" as const, label: kk.features.halalNearbyLookupInstitution },
      { value: "product" as const, label: kk.features.halalNearbyLookupProduct },
      { value: "mosque" as const, label: kk.features.halalNearbyLookupMosque },
    ],
    []
  );

  const categoryChips = useMemo(() => halalInstitutionCategoryFilterChips(), []);

  const dismissKeyboard = useCallback(() => {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const displayedInstitutions = useMemo(
    () => filterCompaniesByQuery(institutionRows, searchText).slice(0, NEARBY_RENDER_LIMIT),
    [institutionRows, searchText]
  );

  const displayedProducts = useMemo(
    () => filterProductsByQuery(productRows, searchText).slice(0, NEARBY_RENDER_LIMIT),
    [productRows, searchText]
  );

  const displayedMosques = useMemo(
    () => {
      const q = searchText.trim().toLowerCase();
      if (!q) return mosqueRows.slice(0, NEARBY_RENDER_LIMIT);
      return mosqueRows.filter((m) => {
        const name = m.name.toLowerCase();
        const addr = (m.address ?? "").toLowerCase();
        const region = (m.regionName ?? "").toLowerCase();
        return name.includes(q) || addr.includes(q) || region.includes(q);
      }).slice(0, NEARBY_RENDER_LIMIT);
    },
    [mosqueRows, searchText]
  );

  const selectedMosqueDetail = useMemo(
    () => (selectedMosque ? mosqueDetailForMosque(selectedMosque) : null),
    [selectedMosque]
  );
  const selectedMosqueLinks = useMemo(() => {
    if (!selectedMosqueDetail) return [];
    const seen = new Set<string>();
    return [selectedMosqueDetail.website, ...(selectedMosqueDetail.socialUrls ?? [])].filter((url): url is string => {
      const key = url?.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedMosqueDetail]);

  const loadNearby = useCallback(async () => {
    dismissKeyboard();
    setBusy(true);
    setErr(null);
    const q = searchText.trim();

    try {
      if (lookupKind === "product") {
        const status = productStatusFilter.trim() || undefined;
        const productOpts = {
          perPage: INSTANT_HALAL_SEARCH_LIMIT,
          status,
        };
        const seedPreview =
          q.length >= 2
            ? searchHalalProductsSeed(q, INSTANT_HALAL_SEARCH_LIMIT)
            : listHalalProductsSeedBrowse(INSTANT_HALAL_SEARCH_LIMIT);
        const seedRows = status
          ? seedPreview.filter((p) => (p.certificateStatus ?? "").toLowerCase() === status.toLowerCase())
          : seedPreview;
        if (seedRows.length > 0) {
          setProductRows(seedRows);
          setProductFromProducers(false);
          setProductFromSeed(true);
          setInstitutionRows([]);
          setMosqueRows([]);
          setLoadedOnce(true);
        }
        const { items, fromProducers, fromSeed, error } =
          q.length >= 2
            ? await resolveHalalProductSearch(q, catalogItems, productOpts)
            : await resolveHalalProductBrowse(catalogItems, productOpts);
        if (error) setErr(kk.features.halalHubNetworkErr);
        setProductRows(items);
        setProductFromProducers(fromProducers);
        setProductFromSeed(fromSeed === true);
        setInstitutionRows([]);
        setMosqueRows([]);
        setLoadedOnce(true);
        if (!error && items.length === 0) {
          setErr(q.length >= 2 ? kk.features.halalNearbyFilterEmpty : kk.features.halalNearbyProductEmpty);
        }
        return;
      }

      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setErr(kk.features.halalNearbyPermDenied);
        setInstitutionRows([]);
        setProductRows([]);
        setMosqueRows([]);
        setLoadedOnce(false);
        return;
      }
      const cachedPos = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_LOCATION_MAX_AGE_MS,
        requiredAccuracy: 5000,
      });
      const pos =
        cachedPos ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));
      const { latitude, longitude } = pos.coords;
      const radiusM = radiusKm * 1000;
      const cert = certificateStatusFilter?.trim() || undefined;
      const cat = categoryTypeFilter.trim() || undefined;

      if (lookupKind === "mosque") {
        const rows = searchNearbyMosques(latitude, longitude, radiusM, q, NEARBY_INSTITUTIONS_MAX);
        setMosqueRows(rows);
        setInstitutionRows([]);
        setProductRows([]);
        setLoadedOnce(true);
        if (rows.length === 0) {
          setErr(q.length > 0 ? kk.features.halalNearbyFilterEmpty : kk.features.halalNearbyMosqueEmpty);
        }
        return;
      }

      const filterOpts = {
        certificateStatus: cert,
        categoryType: cat,
      };

      let previewRows: HalalCompanyWithDistance[] = [];
      if (catalogItems.length > 0) {
        previewRows = filterHalalCompaniesNearbyInstant(
          catalogItems,
          latitude,
          longitude,
          radiusM,
          q,
          { ...filterOpts, limit: INSTANT_HALAL_SEARCH_LIMIT }
        );
        if (previewRows.length > 0) {
          setInstitutionRows(previewRows);
          setProductRows([]);
          setMosqueRows([]);
          setLoadedOnce(true);
          setErr(null);
          setBusy(false);
          setLoadingMore(true);
        }
      }

      const catalogFull =
        catalogItems.length > 0
          ? filterHalalCompaniesNearbyInstant(catalogItems, latitude, longitude, radiusM, q, {
              ...filterOpts,
              limit: NEARBY_INSTITUTIONS_MAX,
            })
          : [];

      if (catalogFull.length > previewRows.length) {
        setInstitutionRows(mergeHalalNearbyCompanyLists(previewRows, catalogFull));
        setLoadingMore(true);
      }

      const companyOpts = {
        lat: latitude,
        lon: longitude,
        radius: radiusM,
        certificateStatus: cert,
        categoryType: cat,
        ...NEARBY_FETCH_OPTS,
      };

      const { items: rows, error } =
        q.length >= 3
          ? await searchHalalDamuCompanies(q, companyOpts)
          : await fetchHalalDamuCompaniesNearby(latitude, longitude, radiusKm, {
              certificateStatus: cert,
              categoryType: cat,
              ...NEARBY_FETCH_OPTS,
            });

      const within = filterHalalCompaniesWithinRadius(rows, latitude, longitude, radiusM);
      const textFiltered =
        q.length > 0 && q.length < 3 ? filterCompaniesByQuery(within, q) : within;

      const merged = mergeHalalNearbyCompanyLists(previewRows, catalogFull, textFiltered);
      setInstitutionRows(merged);
      setProductRows([]);
      setMosqueRows([]);
      setLoadedOnce(true);
      setLoadingMore(false);
      if (merged.length === 0) {
        setErr(
          error
            ? kk.features.halalHubNetworkErr
            : q.length > 0
              ? kk.features.halalNearbyFilterEmpty
              : kk.features.halalNearbyEmpty
        );
      } else {
        setErr(null);
      }
    } catch {
      setErr(kk.features.halalHubNetworkErr);
      setInstitutionRows([]);
      setProductRows([]);
      setMosqueRows([]);
      setLoadedOnce(false);
      setLoadingMore(false);
    } finally {
      setBusy(false);
      setLoadingMore(false);
    }
  }, [
    radiusKm,
    certificateStatusFilter,
    categoryTypeFilter,
    searchText,
    lookupKind,
    dismissKeyboard,
    catalogItems,
    productStatusFilter,
  ]);

  useEffect(() => {
    onLookupKindChange?.(lookupKind);
  }, [lookupKind, onLookupKindChange]);

  useEffect(() => {
    if (lookupKind !== "product") return;
    const q = searchText.trim();
    if (q.length >= 2) {
      const t = setTimeout(() => {
        void loadNearby();
      }, PRODUCT_SEARCH_DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    void loadNearby();
  }, [lookupKind, searchText, loadNearby, productStatusFilter]);

  const blockTitle =
    lookupKind === "product"
      ? kk.features.halalNearbyProductTitle
      : lookupKind === "mosque"
        ? kk.features.halalNearbyMosqueTitle
        : kk.features.halalNearbyTitle;

  const blockHint =
    lookupKind === "product"
      ? kk.features.halalNearbyProductHint
      : lookupKind === "mosque"
        ? kk.features.halalNearbyMosqueHint
        : kk.features.halalNearbyHint;

  const searchPlaceholder =
    lookupKind === "product"
      ? kk.features.halalNearbyProductSearchPlaceholder
      : lookupKind === "mosque"
        ? kk.features.halalNearbyMosqueSearchPlaceholder
        : kk.features.halalNearbySearchPlaceholder;

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.head}>
        {lookupKind === "mosque" ? (
          <MaterialCommunityIcons name="mosque" size={22} color={colors.accent} />
        ) : (
          lookupKind === "product" ? (
            <MaterialIcons name="inventory-2" size={22} color={colors.accent} />
          ) : (
            <MaterialCommunityIcons name={locationIcons.cityPin} size={22} color={colors.accent} />
          )
        )}
        <View style={styles.headText}>
          <Text style={[styles.title, { color: colors.text }]}>{blockTitle}</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>{blockHint}</Text>
        </View>
      </View>

      <Text style={[styles.filterLabel, { color: colors.muted }]}>{kk.features.halalNearbyLookupLabel}</Text>
      <View style={styles.lookupKindRow} accessibilityRole="radiogroup">
        {lookupKindChips.map((chip) => {
          const selected = lookupKind === chip.value;
          return (
            <Pressable
              key={chip.value}
              onPress={() => {
                dismissKeyboard();
                setLookupKind(chip.value);
                setSelectedMosque(null);
                setErr(null);
                setProductRows([]);
                setProductFromProducers(false);
                setLoadedOnce(false);
              }}
              style={({ pressed }) => [
                styles.lookupKindChip,
                {
                  borderColor: selected ? colors.accent : colors.border,
                  backgroundColor: selected ? colors.accentSurface : colors.bg,
                },
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={chip.label}
            >
              <Text
                style={[
                  styles.lookupKindTxt,
                  { color: selected ? colors.accent : colors.text, fontWeight: selected ? "800" : "600" },
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {lookupKind === "product" && onProductStatusFilterChange && productStatusChips.length > 0 ? (
        <>
          <Text style={[styles.filterLabel, { color: colors.muted, marginTop: 10 }]}>
            {kk.features.halalProductStatusLabel}
          </Text>
          <HalalFilterChipRow
            chips={productStatusChips}
            value={productStatusFilter}
            onChange={onProductStatusFilterChange}
            colors={colors}
            accessibilityGroupLabel={kk.features.halalProductStatusLabel}
          />
        </>
      ) : null}

      {lookupKind === "institution" && onCategoryTypeFilterChange ? (
        <>
          <Text style={[styles.filterLabel, { color: colors.muted, marginTop: 10 }]}>
            {kk.features.halalNearbyCategoryLabel}
          </Text>
          <HalalFilterChipRow
            chips={categoryChips}
            value={categoryTypeFilter}
            onChange={onCategoryTypeFilterChange}
            colors={colors}
            accessibilityGroupLabel={kk.features.halalFilterCategoryLabel}
          />
        </>
      ) : null}

      <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.bg }]}>
        {lookupKind === "product" ? (
          <MaterialIcons name="search" size={20} color={colors.muted} />
        ) : (
          <MaterialCommunityIcons name={locationIcons.cityPin} size={20} color={colors.muted} />
        )}
        <TextInput
          ref={searchInputRef}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          blurOnSubmit
          onSubmitEditing={() => void loadNearby()}
          accessibilityLabel={searchPlaceholder}
        />
        {searchText.trim().length > 0 ? (
          <Pressable
            onPress={() => setSearchText("")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={kk.features.halalHubClearSearch}
            style={({ pressed }) => [{ padding: 4, opacity: pressed ? 0.7 : 1 }]}
          >
            <MaterialIcons name="close" size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {lookupKind === "institution" || lookupKind === "mosque" ? (
        <View style={styles.actionRow}>
          <View style={styles.radiusGroup} accessibilityRole="radiogroup">
            {RADIUS_OPTIONS_KM.map((km) => {
              const selected = radiusKm === km;
              return (
                <Pressable
                  key={km}
                  onPress={() => {
                    dismissKeyboard();
                    setRadiusKm(km);
                  }}
                  style={({ pressed }) => [
                    styles.radiusChip,
                    {
                      borderColor: selected ? colors.accent : colors.border,
                      backgroundColor: selected ? colors.accentSurface : colors.bg,
                    },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={kk.features.halalNearbyRadiusKm(km)}
                >
                  <Text
                    style={[
                      styles.radiusChipTxt,
                      { color: selected ? colors.accent : colors.muted, fontWeight: selected ? "800" : "600" },
                    ]}
                  >
                    {km}
                  </Text>
                </Pressable>
              );
            })}
            <Text style={[styles.radiusUnit, { color: colors.muted }]}>км</Text>
          </View>

          <Pressable
            onPress={() => void loadNearby()}
            disabled={busy}
            style={({ pressed }) => [
              styles.loadBtn,
              { backgroundColor: colors.accent },
              pressed && !busy && { opacity: 0.92 },
              busy && { opacity: 0.65 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${kk.features.halalNearbyLoadBtn}, ${radiusKm} км`}
          >
            {busy ? (
              <RaqatOrnamentSpinner size={20} />
            ) : (
              <>
                <MaterialIcons name="my-location" size={18} color="#fff" />
                <Text style={styles.loadBtnTxt}>{kk.features.halalNearbyLoadBtn}</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => void loadNearby()}
          disabled={busy}
          style={({ pressed }) => [
            styles.loadBtnFull,
            { backgroundColor: colors.accent },
            pressed && !busy && { opacity: 0.92 },
            busy && { opacity: 0.65 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={kk.features.halalNearbyLoadBtn}
        >
          {busy ? (
            <RaqatOrnamentSpinner size={20} />
          ) : (
            <>
              <MaterialIcons name="search" size={18} color="#fff" />
              <Text style={styles.loadBtnTxt}>{kk.features.halalNearbyLoadBtn}</Text>
            </>
          )}
        </Pressable>
      )}

      {err ? <Text style={[styles.err, { color: colors.error }]}>{err}</Text> : null}

      {loadingMore && lookupKind === "institution" && displayedInstitutions.length > 0 ? (
        <View style={styles.loadingMoreRow}>
          <RaqatOrnamentSpinner size={18} />
          <Text style={[styles.loadingMoreTxt, { color: colors.muted }]}>
            {kk.features.halalNearbyLoadingMore}
          </Text>
        </View>
      ) : null}

      {lookupKind === "institution" && displayedInstitutions.length > 0 ? (
        <View style={styles.list}>
          {displayedInstitutions.map((c) => {
            const feed = halalCompanyToFeedItem(c);
            return (
              <View key={`near-${c.id}`} style={styles.nearCardWrap}>
                <OfficialFeedCard
                  item={{
                    ...feed,
                    subtitle: [feed.subtitle, formatHalalDistanceKm(c.distanceM)].filter(Boolean).join(" · "),
                  }}
                  colors={colors}
                  onPress={() => {
                    dismissKeyboard();
                    onOpenCompany(c.id);
                  }}
                  accessibilityLabel={`${c.title}, ${formatHalalDistanceKm(c.distanceM)}`}
                />
              </View>
            );
          })}
        </View>
      ) : null}

      {lookupKind === "product" && productFromSeed && displayedProducts.length > 0 ? (
        <Text style={[styles.producerHint, { color: colors.muted }]}>
          {kk.features.halalProductSeedHint}
        </Text>
      ) : null}
      {lookupKind === "product" && productFromProducers && displayedProducts.length > 0 ? (
        <Text style={[styles.producerHint, { color: colors.muted }]}>
          {kk.features.halalProductProducerFallbackHint}
        </Text>
      ) : null}

      {lookupKind === "product" && busy && !loadedOnce ? (
        <View style={styles.loadingMoreRow}>
          <RaqatOrnamentSpinner size={22} />
          <Text style={[styles.loadingMoreTxt, { color: colors.muted }]}>{kk.features.halalHubLoading}</Text>
        </View>
      ) : null}

      {lookupKind === "product" && displayedProducts.length > 0 ? (
        <View style={styles.list}>
          {displayedProducts.map((p) => (
            <HalalProductResultCard
              key={`near-prod-${p.id}-${p.barcode ?? p.title}`}
              kind="product"
              colors={colors}
              isDark={false}
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
              onPress={() => {
                dismissKeyboard();
                if (p.companyId) {
                  onOpenCompany(p.companyId);
                  return;
                }
                if (onOpenProductLookup) onOpenProductLookup(p.title);
              }}
            />
          ))}
        </View>
      ) : null}

      {lookupKind === "mosque" && displayedMosques.length > 0 ? (
        <View style={styles.list}>
          {displayedMosques.map((m) => (
            <Pressable
              key={`near-mosque-${m.id}`}
              onPress={() => {
                dismissKeyboard();
                setSelectedMosque(m);
              }}
              style={({ pressed }) => [styles.miniRow, pressed && { opacity: 0.92 }]}
              accessibilityRole="button"
              accessibilityLabel={`${m.name}, ${formatMosqueDistanceKm(m.distanceM)}`}
            >
              <MaterialCommunityIcons name="mosque" size={22} color={colors.accent} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={2}>
                  {m.name}
                </Text>
                <Text style={[styles.miniSub, { color: colors.muted }]} numberOfLines={2}>
                  {[m.address, m.regionName, formatMosqueDistanceKm(m.distanceM)].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {loadedOnce &&
      lookupKind === "institution" &&
      institutionRows.length > 0 &&
      displayedInstitutions.length === 0 ? (
        <Text style={[styles.err, { color: colors.muted }]}>{kk.features.halalNearbyFilterEmpty}</Text>
      ) : null}

      {loadedOnce &&
      lookupKind === "mosque" &&
      mosqueRows.length > 0 &&
      displayedMosques.length === 0 ? (
        <Text style={[styles.err, { color: colors.muted }]}>{kk.features.halalNearbyFilterEmpty}</Text>
      ) : null}

      <Modal
        visible={selectedMosque != null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMosque(null)}
      >
        <View style={styles.mosqueModalRoot}>
          <Pressable style={styles.mosqueModalBackdrop} onPress={() => setSelectedMosque(null)} />
          <View style={[styles.mosqueSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ScrollView contentContainerStyle={styles.mosqueSheetContent} showsVerticalScrollIndicator={false}>
              <View style={[styles.mosqueHero, { backgroundColor: colors.accentSurface }]}>
                {selectedMosqueDetail?.photoUrl ? (
                  <Image source={{ uri: selectedMosqueDetail.photoUrl }} style={styles.mosqueHeroImage} resizeMode="cover" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="mosque" size={56} color={colors.accent} />
                    <Text style={[styles.mosqueHeroTxt, { color: colors.accent }]}>
                      {kk.features.halalNearbyMosqueFallbackTitle}
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.mosqueTitleRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.mosqueTitle, { color: colors.text }]}>{selectedMosque?.name}</Text>
                  <Text style={[styles.mosqueSub, { color: colors.muted }]}>
                    {[selectedMosque?.regionName, selectedMosque ? formatMosqueDistanceKm(selectedMosque.distanceM) : ""]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <View style={styles.mosqueStatusRow}>
                    <View style={[styles.mosqueStatusChip, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                      <MaterialIcons
                        name={selectedMosqueDetail?.confidence === "verified" ? "verified" : "info-outline"}
                        size={14}
                        color={colors.accent}
                      />
                      <Text style={[styles.mosqueStatusText, { color: colors.accent }]}>
                        {mosqueConfidenceLabel(selectedMosqueDetail?.confidence)}
                      </Text>
                    </View>
                    {selectedMosqueDetail?.verifiedAt ? (
                      <Text style={[styles.mosqueVerifiedAt, { color: colors.muted }]}>
                        {selectedMosqueDetail.verifiedAt}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <Pressable
                  onPress={() => setSelectedMosque(null)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={kk.common.close}
                  style={({ pressed }) => [styles.mosqueCloseBtn, pressed && { opacity: 0.75 }]}
                >
                  <MaterialIcons name="close" size={22} color={colors.muted} />
                </Pressable>
              </View>

              <View style={styles.mosqueInfoList}>
                <View style={styles.mosqueInfoRow}>
                  <MaterialIcons name="place" size={20} color={colors.accent} />
                  <View style={styles.mosqueInfoTextCol}>
                    <Text style={[styles.mosqueInfoLabel, { color: colors.muted }]}>{kk.features.halalHubAddress}</Text>
                    <Text style={[styles.mosqueInfoValue, { color: colors.text }]}>
                      {selectedMosque?.address || kk.features.halalNearbyMosqueAddressMissing}
                    </Text>
                  </View>
                </View>
                <View style={styles.mosqueInfoRow}>
                  <MaterialIcons name="person" size={20} color={colors.accent} />
                  <View style={styles.mosqueInfoTextCol}>
                    <Text style={[styles.mosqueInfoLabel, { color: colors.muted }]}>
                      {kk.features.halalNearbyMosqueImamLabel}
                    </Text>
                    <Text style={[styles.mosqueInfoValue, { color: colors.text }]}>
                      {selectedMosqueDetail?.imamName
                        ? [
                            selectedMosqueDetail.imamName,
                            selectedMosqueDetail.imamRole ? `(${selectedMosqueDetail.imamRole})` : "",
                          ]
                            .filter(Boolean)
                            .join(" ")
                        : kk.features.halalNearbyMosqueOpenDataMissing}
                    </Text>
                    {selectedMosqueDetail?.note ? (
                      <Text style={[styles.mosqueInfoNote, { color: colors.muted }]}>
                        {selectedMosqueDetail.note}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.mosqueInfoRow}>
                  <MaterialIcons name="phone" size={20} color={colors.accent} />
                  <View style={styles.mosqueInfoTextCol}>
                    <Text style={[styles.mosqueInfoLabel, { color: colors.muted }]}>{kk.features.halalHubPhone}</Text>
                    {selectedMosqueDetail?.phone ? (
                      <Pressable
                        onPress={() => {
                          const url = mosqueTelDialUrl(selectedMosqueDetail.phone ?? "");
                          if (url) void Linking.openURL(url);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={kk.features.halalNearbyMosqueCallA11y(selectedMosqueDetail.phone)}
                        style={({ pressed }) => [styles.mosquePhoneBtn, pressed && { opacity: 0.82 }]}
                      >
                        <Text style={[styles.mosqueInfoValue, { color: colors.accent }]}>
                          {selectedMosqueDetail.phone}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text style={[styles.mosqueInfoValue, { color: colors.text }]}>
                        {kk.features.halalNearbyMosqueOpenDataMissing}
                      </Text>
                    )}
                  </View>
                </View>
                {selectedMosqueLinks.length > 0 ? (
                  <View style={styles.mosqueInfoRow}>
                    <MaterialIcons name="language" size={20} color={colors.accent} />
                    <View style={styles.mosqueInfoTextCol}>
                      <Text style={[styles.mosqueInfoLabel, { color: colors.muted }]}>
                        {kk.features.halalNearbyMosqueWebsiteLabel}
                      </Text>
                      <View style={styles.mosqueSourceList}>
                        {selectedMosqueLinks.map((url) => (
                          <Pressable
                            key={url}
                            onPress={() => void Linking.openURL(url)}
                            accessibilityRole="link"
                            accessibilityLabel={url}
                            style={({ pressed }) => [
                              styles.mosqueSourceChip,
                              { borderColor: colors.border, backgroundColor: colors.bg },
                              pressed && { opacity: 0.84 },
                            ]}
                          >
                            <MaterialIcons name="open-in-new" size={15} color={colors.accent} />
                            <Text style={[styles.mosqueSourceText, { color: colors.accent }]} numberOfLines={2}>
                              {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : null}
                {selectedMosqueDetail?.scheduleText ? (
                  <View style={styles.mosqueInfoRow}>
                    <MaterialIcons name="schedule" size={20} color={colors.accent} />
                    <View style={styles.mosqueInfoTextCol}>
                      <Text style={[styles.mosqueInfoLabel, { color: colors.muted }]}>
                        {kk.features.halalNearbyMosqueScheduleLabel}
                      </Text>
                      <Text style={[styles.mosqueInfoValue, { color: colors.text }]}>
                        {selectedMosqueDetail.scheduleText}
                      </Text>
                    </View>
                  </View>
                ) : null}
                <View style={styles.mosqueInfoRow}>
                  <MaterialIcons name="info-outline" size={20} color={colors.accent} />
                  <View style={styles.mosqueInfoTextCol}>
                    <Text style={[styles.mosqueInfoLabel, { color: colors.muted }]}>{kk.features.halalHubDescription}</Text>
                    <Text style={[styles.mosqueInfoValue, { color: colors.text }]}>
                      {selectedMosqueDetail?.info ??
                        kk.features.halalNearbyMosqueInfoFallback}
                    </Text>
                  </View>
                </View>
                {selectedMosqueDetail?.sources.length ? (
                  <View style={styles.mosqueInfoRow}>
                    <MaterialIcons name="verified" size={20} color={colors.accent} />
                    <View style={styles.mosqueInfoTextCol}>
                      <Text style={[styles.mosqueInfoLabel, { color: colors.muted }]}>
                        {kk.features.halalNearbyMosqueSourceLabel}
                      </Text>
                      <View style={styles.mosqueSourceList}>
                        {selectedMosqueDetail.sources.map((source) => (
                          <Pressable
                            key={source.url}
                            onPress={() => void Linking.openURL(source.url)}
                            accessibilityRole="link"
                            accessibilityLabel={source.title}
                            style={({ pressed }) => [styles.mosqueSourceChip, { borderColor: colors.border, backgroundColor: colors.bg }, pressed && { opacity: 0.84 }]}
                          >
                            <MaterialIcons name="open-in-new" size={15} color={colors.accent} />
                            <Text style={[styles.mosqueSourceText, { color: colors.accent }]} numberOfLines={2}>
                              {source.title}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.mosqueActionRow}>
                <Pressable
                  onPress={() => {
                    if (selectedMosque?.mapUrl) void Linking.openURL(selectedMosque.mapUrl);
                  }}
                  style={({ pressed }) => [
                    styles.mosquePrimaryBtn,
                    { backgroundColor: colors.accent },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalHubOpenRoute}
                >
                  <MaterialIcons name="directions" size={20} color="#fff" />
                  <Text style={styles.mosquePrimaryBtnTxt}>{kk.features.halalHubOpenRoute}</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (selectedMosque?.mapUrl) void Linking.openURL(selectedMosque.mapUrl);
                  }}
                  style={({ pressed }) => [
                    styles.mosqueSecondaryBtn,
                    { borderColor: colors.border, backgroundColor: colors.bg },
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={kk.features.halalNearbyMosqueOpen2GisA11y}
                >
                  <MaterialIcons name="open-in-new" size={20} color={colors.accent} />
                  <Text style={[styles.mosqueSecondaryBtnTxt, { color: colors.accent }]}>2GIS</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 14 },
  head: { flexDirection: "row", alignItems: "flex-start" },
  headText: { flex: 1, marginLeft: 10 },
  title: { fontSize: 16, fontWeight: "800" },
  hint: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  filterLabel: { fontSize: 12, fontWeight: "700", marginTop: 12, marginBottom: 6 },
  lookupKindRow: { flexDirection: "row", gap: 8 },
  lookupKindChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  lookupKindTxt: { fontSize: 13, textAlign: "center" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    minHeight: 36,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  radiusGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  radiusChip: {
    minWidth: 36,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  radiusChipTxt: { fontSize: 14 },
  radiusUnit: { fontSize: 13, fontWeight: "700", marginLeft: 2 },
  loadBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 40,
  },
  loadBtnFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 40,
    marginTop: 10,
  },
  loadBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  err: { marginTop: 10, fontSize: 13 },
  loadingMoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  loadingMoreTxt: { fontSize: 12, fontWeight: "600" },
  list: { marginTop: 12, gap: 4 },
  nearCardWrap: { marginBottom: 0 },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  titleDistRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  miniTitle: { fontSize: 15, fontWeight: "700" },
  distTxt: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  miniSub: { fontSize: 12, marginTop: 2 },
  producerHint: { fontSize: 11, fontWeight: "600", marginTop: 4, marginBottom: 2, lineHeight: 15 },
  mosqueModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  mosqueModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  mosqueSheet: {
    maxHeight: "88%",
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 18,
  },
  mosqueSheetContent: {
    padding: 14,
    paddingBottom: 18,
  },
  mosqueHero: {
    minHeight: 132,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    gap: 6,
    overflow: "hidden",
  },
  mosqueHeroImage: {
    width: "100%",
    height: 132,
  },
  mosqueHeroTxt: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  mosqueTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  mosqueTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "900",
  },
  mosqueSub: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  mosqueStatusRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  mosqueStatusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mosqueStatusText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "900",
  },
  mosqueVerifiedAt: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
  },
  mosqueCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  mosqueInfoList: {
    marginTop: 14,
    gap: 10,
  },
  mosqueInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  mosqueInfoTextCol: {
    flex: 1,
    minWidth: 0,
  },
  mosqueInfoLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mosqueInfoValue: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  mosqueInfoNote: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  mosquePhoneBtn: {
    alignSelf: "flex-start",
  },
  mosqueSourceList: {
    marginTop: 6,
    gap: 6,
  },
  mosqueSourceChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  mosqueSourceText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  mosqueActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  mosquePrimaryBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
  },
  mosquePrimaryBtnTxt: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  mosqueSecondaryBtn: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
  },
  mosqueSecondaryBtnTxt: {
    fontSize: 14,
    fontWeight: "900",
  },
});
