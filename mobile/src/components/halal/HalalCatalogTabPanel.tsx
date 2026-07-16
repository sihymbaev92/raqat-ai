import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppLocale } from "../../i18n/runtime";
import { StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { Pressable } from "@/ui/Pressable";
import type { HalalDamuCompanyCard } from "../../api/halalDamuWp";
import {
  enrichHalalCompanyCardsFromBulkCache,
  enrichHalalCompanyCardsWithMedia,
  fetchHalalDamuCompaniesNearby,
  halalCompanyDisplayImageUrl,
} from "../../api/halalDamuWp";
import { kk } from "../../i18n/kk";
import {
  getHalalHubInstantCatalog,
  prefetchHalalDamuHub,
  readHalalHubCatalogSnapshot,
} from "../../services/halalHubBootstrap";
import type { ThemeColors } from "../../theme/colors";
import {
  extractLocalCityTokens,
  filterHalalCompaniesLocal,
  isHalalCatalogEstablishment,
} from "../../utils/halalCompanyLocalFilter";
import { type HalalCompanyWithDistance } from "../../utils/halalGeoFilter";
import { findNearestKzCityPreset } from "../../constants/kzCities";
import { dedupeHalalCompanyCards, filterHalalCompaniesInstant } from "../../utils/halalInstantSearch";
import { ensureHalalCompaniesSnapshotLoaded } from "../../services/halalCompaniesSnapshot";
import { halalCatalogPageSize } from "../../utils/halalPerformanceProfile";
import { runWhenHeavyWorkAllowed } from "../../utils/uiDefer";
import { useAppTheme } from "../../theme/ThemeContext";
import { HalalFilterChipRow } from "../HalalFilterChipRow";
import { HalalCompanyDetailSheet } from "./HalalCompanyDetailSheet";
import { HalalCompanySearchList } from "./HalalCompanySearchList";

type Props = {
  active: boolean;
  colors: ThemeColors;
};

/** Жақын жергілікті мекемелер — 5 км әдепкі, 10/15 км кеңейту. */
const LOCAL_RADIUS_OPTIONS_KM = [5, 10, 15] as const;
const DEFAULT_LOCAL_RADIUS_KM = LOCAL_RADIUS_OPTIONS_KM[0];

function mergeCompanyList(
  base: HalalDamuCompanyCard[],
  patch: HalalDamuCompanyCard[]
): HalalDamuCompanyCard[] {
  if (!patch.length) return base;
  const byId = new Map(patch.map((c) => [c.id, c]));
  return base.map((c) => {
    const rich = byId.get(c.id);
    if (!rich) return c;
    return {
      ...c,
      logoUrl: c.logoUrl ?? rich.logoUrl,
      thumbnailUrl: c.thumbnailUrl ?? rich.thumbnailUrl,
      galleryUrls: c.galleryUrls.length ? c.galleryUrls : rich.galleryUrls,
      mapLink: c.mapLink ?? rich.mapLink,
      resolvedMapUrl: c.resolvedMapUrl ?? rich.resolvedMapUrl,
      phone: c.phone ?? rich.phone,
      phones: c.phones.length ? c.phones : rich.phones,
      website: c.website ?? rich.website,
      address: c.address ?? rich.address,
      description: c.description ?? rich.description,
      extraUrls: c.extraUrls.length ? c.extraUrls : rich.extraUrls,
      lat: c.lat ?? rich.lat,
      lon: c.lon ?? rich.lon,
    };
  });
}

export function HalalCatalogTabPanel({ active, colors }: Props) {
  useAppLocale();
  const { isDark } = useAppTheme();
  const [catalogItems, setCatalogItems] = useState<HalalDamuCompanyCard[]>(() =>
    enrichHalalCompanyCardsFromBulkCache(getHalalHubInstantCatalog())
  );
  const [searchText, setSearchText] = useState("");
  const [visibleCount, setVisibleCount] = useState(() => halalCatalogPageSize());
  const [selectedCompany, setSelectedCompany] = useState<HalalDamuCompanyCard | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_LOCAL_RADIUS_KM);
  const [centerLat, setCenterLat] = useState<number | null>(null);
  const [centerLon, setCenterLon] = useState<number | null>(null);
  const [cityTokens, setCityTokens] = useState<string[]>([]);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);

  const pageSize = halalCatalogPageSize();

  const refreshCatalog = useCallback(async () => {
    void prefetchHalalDamuHub();
    await ensureHalalCompaniesSnapshotLoaded().catch(() => null);
    const snap = await readHalalHubCatalogSnapshot();
    const bundled = enrichHalalCompanyCardsFromBulkCache(getHalalHubInstantCatalog());
    let items = snap?.items?.length ? snap.items : bundled;
    items = enrichHalalCompanyCardsFromBulkCache(items);
    if (items.length > 0) setCatalogItems(items);
  }, []);

  useEffect(() => {
    if (!active) return;
    // Snapshot фонға — GPS-ті күттірмейді.
    void ensureHalalCompaniesSnapshotLoaded().then(() => {
      const instant = enrichHalalCompanyCardsFromBulkCache(getHalalHubInstantCatalog());
      if (instant.length > 0) setCatalogItems(instant);
    });
    let cancelled = false;
    void runWhenHeavyWorkAllowed().then(() => {
      if (!cancelled) void refreshCatalog();
    });
    return () => {
      cancelled = true;
    };
  }, [active, refreshCatalog]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let gen = 0;
    setLocationBusy(true);

    const mergeNearbyApi = (lat: number, lon: number) => {
      void fetchHalalDamuCompaniesNearby(lat, lon, radiusKm, {
        perPage: 80,
        skipMediaEnrich: true,
      }).then((nearby) => {
        if (cancelled || nearby.items.length === 0) return;
        setCatalogItems((prev) =>
          dedupeHalalCompanyCards([
            ...nearby.items,
            ...enrichHalalCompanyCardsFromBulkCache(prev),
          ])
        );
      });
    };

    const applyCoords = (lat: number, lon: number, opts?: { clearBusy?: boolean }) => {
      if (cancelled) return;
      setCenterLat(lat);
      setCenterLon(lon);
      const nearest = findNearestKzCityPreset(lat, lon);
      if (nearest && nearest.distanceM <= 40_000) {
        setLocationLabel(nearest.label);
        setCityTokens((prev) => {
          const next = new Set(prev);
          next.add(nearest.label.toLowerCase());
          next.add(nearest.city.toLowerCase());
          return [...next];
        });
      }
      setCatalogItems((prev) => {
        const enriched = enrichHalalCompanyCardsFromBulkCache(
          prev.length ? prev : getHalalHubInstantCatalog()
        );
        return enriched.length ? enriched : prev;
      });
      // API нәтижесін астына қосу — бірінші тізімді күттірмейді.
      mergeNearbyApi(lat, lon);
      if (opts?.clearBusy) setLocationBusy(false);
    };

    void (async () => {
      const myGen = ++gen;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (cancelled || myGen !== gen) return;
        if (perm.status !== "granted") {
          setLocationDenied(true);
          setLocationBusy(false);
          return;
        }
        setLocationDenied(false);

        const last = await Location.getLastKnownPositionAsync({
          maxAge: 5 * 60_000,
          requiredAccuracy: 8000,
        });
        if (cancelled || myGen !== gen) return;
        if (last?.coords) {
          applyCoords(last.coords.latitude, last.coords.longitude, { clearBusy: true });
        }

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled || myGen !== gen) return;
        applyCoords(pos.coords.latitude, pos.coords.longitude, { clearBusy: true });

        try {
          const geo = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (cancelled || myGen !== gen) return;
          const tokens = extractLocalCityTokens(geo);
          if (tokens.length) {
            setCityTokens((prev) => [...new Set([...prev, ...tokens])]);
          }
          const label = geo[0]?.city ?? geo[0]?.subregion ?? geo[0]?.region ?? null;
          if (label) setLocationLabel(label);
        } catch {
          /* nearest city label жеткілікті */
        }
      } catch {
        if (!cancelled) setLocationDenied(true);
      } finally {
        if (!cancelled) setLocationBusy(false);
      }
    })();

    return () => {
      cancelled = true;
      gen += 1;
    };
  }, [active, radiusKm]);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [searchText, pageSize, radiusKm, centerLat, centerLon, cityTokens]);

  const localEstablishments = useMemo((): HalalCompanyWithDistance[] => {
    const base = catalogItems.filter(isHalalCatalogEstablishment);
    return filterHalalCompaniesLocal(base, {
      centerLat,
      centerLon,
      radiusKm,
      cityTokens,
    });
  }, [catalogItems, centerLat, centerLon, radiusKm, cityTokens]);

  const filteredCatalog = useMemo((): HalalCompanyWithDistance[] => {
    const q = searchText.trim();
    const pool = localEstablishments;
    if (q.length >= 3) {
      const ids = new Set(filterHalalCompaniesInstant(pool, q, { limit: 500 }).map((c) => c.id));
      return pool.filter((c) => ids.has(c.id));
    }
    return pool;
  }, [localEstablishments, searchText]);

  const visibleItems = useMemo(
    () => filteredCatalog.slice(0, visibleCount),
    [filteredCatalog, visibleCount]
  );

  useEffect(() => {
    if (!active) return;
    const slice = filteredCatalog.slice(0, visibleCount);
    const need = slice.filter((c) => !halalCompanyDisplayImageUrl(c));
    if (need.length === 0) return;
    let cancelled = false;
    void enrichHalalCompanyCardsWithMedia(need).then((enriched) => {
      if (cancelled || enriched.length === 0) return;
      setCatalogItems((prev) => mergeCompanyList(prev, enriched));
    });
    return () => {
      cancelled = true;
    };
  }, [active, visibleCount, searchText, filteredCatalog]);

  const openCompany = useCallback(
    (id: number) => {
      const card =
        catalogItems.find((c) => c.id === id) ?? filteredCatalog.find((c) => c.id === id) ?? null;
      if (card) setSelectedCompany(card);
    },
    [catalogItems, filteredCatalog]
  );

  const radiusChips = useMemo(
    () =>
      LOCAL_RADIUS_OPTIONS_KM.map((km) => ({
        value: String(km),
        label: kk.features.halalNearbyRadiusKm(km),
      })),
    []
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <Text style={[styles.localTitle, { color: colors.text }]}>{kk.features.halalCatalogLocalTitle}</Text>
        <Text style={[styles.localHint, { color: colors.muted }]}>
          {locationLabel
            ? kk.features.halalCatalogLocalHintNamed(locationLabel)
            : kk.features.halalCatalogLocalHint}
        </Text>
        {locationDenied ? (
          <Text style={[styles.locationWarn, { color: colors.error }]}>{kk.features.halalNearbyPermDenied}</Text>
        ) : null}
        {locationBusy ? (
          <Text style={[styles.locationWarn, { color: colors.muted }]}>
            {filteredCatalog.length > 0
              ? kk.features.halalCatalogLocatingMore
              : kk.features.halalHubLoading}
          </Text>
        ) : null}
        <HalalFilterChipRow
          chips={radiusChips}
          value={String(radiusKm)}
          onChange={(v) => setRadiusKm(Number(v) || DEFAULT_LOCAL_RADIUS_KM)}
          colors={colors}
          accessibilityGroupLabel={kk.features.halalCatalogRadiusLabel}
        />
        <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.bg }]}>
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={kk.features.halalNearbySearchPlaceholder}
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <MaterialIcons name="close" size={20} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>
        {searchText.trim().length > 0 && searchText.trim().length < 3 ? (
          <Text style={[styles.searchHint, { color: colors.muted }]}>{kk.features.halalHubSearchMinHint}</Text>
        ) : null}
        <Text style={[styles.resultsMeta, { color: colors.muted }]}>
          {searchText.trim().length >= 3
            ? kk.features.halalHubSearchResults
            : kk.features.halalCatalogLocalListTitle}{" "}
          · {filteredCatalog.length}
        </Text>
        {!locationBusy && !locationDenied && filteredCatalog.length === 0 ? (
          <Text style={[styles.searchHint, { color: colors.muted }]}>{kk.features.halalNearbyEmpty}</Text>
        ) : null}
      </View>
    ),
    [
      colors,
      searchText,
      filteredCatalog.length,
      locationLabel,
      locationDenied,
      locationBusy,
      centerLat,
      radiusKm,
      radiusChips,
    ]
  );

  return (
    <>
      <HalalCompanySearchList
        colors={colors}
        items={visibleItems}
        onOpenCompany={openCompany}
        logoThumbSize={72}
        onEndReached={() => {
          if (visibleCount < filteredCatalog.length) {
            setVisibleCount((n) => Math.min(n + pageSize, filteredCatalog.length));
          }
        }}
        ListHeaderComponent={listHeader}
      />
      <HalalCompanyDetailSheet
        visible={selectedCompany != null}
        company={selectedCompany}
        colors={colors}
        isDark={isDark}
        onClose={() => setSelectedCompany(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  localTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  localHint: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  locationWarn: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
    minHeight: 36,
  },
  searchHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  resultsMeta: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 8,
  },
});
