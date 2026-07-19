import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppLocale } from "../../i18n/runtime";
import {
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Location from "expo-location";
import * as Linking from "expo-linking";
import { Pressable } from "@/ui/Pressable";
import { mosqueCatalogCount, searchNearbyMosquesAsync } from "../../data/mosques2gisCatalog";
import { mosqueDetailForMosque } from "../../data/mosqueDetailsEnrichment";
import { kk } from "../../i18n/kk";
import type { ThemeColors } from "../../theme/colors";
import { NEARBY_INSTITUTIONS_MAX } from "../../utils/halalInstantSearch";
import { formatMosqueDistanceKm, type Mosque2GisWithDistance } from "../../utils/mosqueGeoFilter";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { runWhenHeavyWorkAllowed } from "../../utils/uiDefer";

const RADIUS_OPTIONS_KM = [5, 10] as const;
const RENDER_LIMIT = 40;
const LAST_KNOWN_LOCATION_MAX_AGE_MS = 5 * 60_000;

type Props = {
  active: boolean;
  colors: ThemeColors;
};

function mosqueTelDialUrl(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function mosqueConfidenceLabel(confidence: "verified" | "partial" | "map_only" | undefined): string {
  switch (confidence) {
    case "verified":
      return kk.features.mosqueConfidenceVerified;
    case "partial":
      return kk.features.mosqueConfidencePartial;
    case "map_only":
    default:
      return kk.features.mosqueConfidenceMapOnly;
  }
}

export function NearbyMosquesPanel({ active, colors }: Props) {
  useAppLocale();
  const searchInputRef = useRef<TextInput>(null);
  const loadGenRef = useRef(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mosqueRows, setMosqueRows] = useState<Mosque2GisWithDistance[]>([]);
  const [searchText, setSearchText] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(RADIUS_OPTIONS_KM[0]);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState<Mosque2GisWithDistance | null>(null);

  const displayedMosques = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    const rows = q
      ? mosqueRows.filter((m) => {
          const name = m.name.toLowerCase();
          const addr = (m.address ?? "").toLowerCase();
          const region = (m.regionName ?? "").toLowerCase();
          return name.includes(q) || addr.includes(q) || region.includes(q);
        })
      : mosqueRows;
    return rows.slice(0, RENDER_LIMIT);
  }, [mosqueRows, searchText]);

  const selectedMosqueDetail = useMemo(
    () => (selectedMosque ? mosqueDetailForMosque(selectedMosque) : null),
    [selectedMosque]
  );

  const selectedMosqueLinks = useMemo(() => {
    if (!selectedMosqueDetail) return [];
    return [selectedMosqueDetail.website, ...(selectedMosqueDetail.socialUrls ?? [])].filter((url): url is string => {
      const t = (url ?? "").trim();
      return t.length > 0;
    });
  }, [selectedMosqueDetail]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    searchInputRef.current?.blur();
  }, []);

  const loadNearby = useCallback(async () => {
    dismissKeyboard();
    const gen = ++loadGenRef.current;
    setBusy(true);
    setErr(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (gen !== loadGenRef.current) return;
      if (perm.status !== "granted") {
        setErr(kk.features.halalNearbyPermDenied);
        setMosqueRows([]);
        setLoadedOnce(false);
        return;
      }
      const cachedPos = await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_LOCATION_MAX_AGE_MS,
        requiredAccuracy: 8000,
      });
      if (gen !== loadGenRef.current) return;
      let latitude: number;
      let longitude: number;
      if (cachedPos) {
        latitude = cachedPos.coords.latitude;
        longitude = cachedPos.coords.longitude;
        // Алдымен соңғы координатамен тізімді көрсет — GPS күтпейді.
        const quickRows = await searchNearbyMosquesAsync(
          latitude,
          longitude,
          radiusKm * 1000,
          "",
          NEARBY_INSTITUTIONS_MAX
        );
        if (gen !== loadGenRef.current) return;
        if (mosqueCatalogCount() === 0) {
          setErr(kk.features.halalNearbyMosqueCatalogMissing);
          setMosqueRows([]);
          setLoadedOnce(false);
          return;
        }
        setMosqueRows(quickRows);
        setLoadedOnce(true);
        setBusy(false);
        if (quickRows.length === 0) setErr(kk.features.halalNearbyMosqueEmpty);
      }
      const pos =
        cachedPos ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));
      if (gen !== loadGenRef.current) return;
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
      const radiusM = radiusKm * 1000;
      const rows = await searchNearbyMosquesAsync(latitude, longitude, radiusM, "", NEARBY_INSTITUTIONS_MAX);
      if (gen !== loadGenRef.current) return;
      if (mosqueCatalogCount() === 0) {
        setErr(kk.features.halalNearbyMosqueCatalogMissing);
        setMosqueRows([]);
        setLoadedOnce(false);
        return;
      }
      setMosqueRows(rows);
      setLoadedOnce(true);
      setErr(rows.length === 0 ? kk.features.halalNearbyMosqueEmpty : null);
    } catch {
      if (gen !== loadGenRef.current) return;
      setErr(kk.features.halalHubNetworkErr);
      setMosqueRows([]);
      setLoadedOnce(false);
    } finally {
      if (gen === loadGenRef.current) setBusy(false);
    }
  }, [dismissKeyboard, radiusKm]);

  useEffect(() => {
    if (!active) return;
    void runWhenHeavyWorkAllowed().then(() => loadNearby());
  }, [active, radiusKm, loadNearby]);

  const renderMosqueRow = useCallback(
    ({ item }: { item: Mosque2GisWithDistance }) => (
      <Pressable
        onPress={() => {
          dismissKeyboard();
          setSelectedMosque(item);
        }}
        style={({ pressed }) => [styles.miniRow, pressed && { opacity: 0.92 }]}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${formatMosqueDistanceKm(item.distanceM)}`}
      >
        <MaterialCommunityIcons name="mosque" size={22} color={colors.accent} style={{ marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.miniSub, { color: colors.muted }]} numberOfLines={2}>
            {[item.address, item.regionName, formatMosqueDistanceKm(item.distanceM)].filter(Boolean).join(" · ")}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
      </Pressable>
    ),
    [colors.accent, colors.muted, colors.text, dismissKeyboard]
  );

  const mosqueKeyExtractor = useCallback((item: Mosque2GisWithDistance) => `kmdb-mosque-${item.id}`, []);

  const listHeader = useMemo(
    () => (
      <>
        <View style={[styles.headCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headRow}>
            <MaterialCommunityIcons name="mosque" size={24} color={colors.accent} />
            <View style={styles.headText}>
              <Text style={[styles.title, { color: colors.text }]}>{kk.features.halalNearbyMosqueTitle}</Text>
              <Text style={[styles.hint, { color: colors.muted }]}>{kk.features.halalNearbyMosqueHint}</Text>
            </View>
          </View>

          <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.bg }]}>
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              ref={searchInputRef}
              value={searchText}
              onChangeText={setSearchText}
              placeholder={kk.features.halalNearbyMosqueSearchPlaceholder}
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { color: colors.text }]}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => void loadNearby()}
              accessibilityLabel={kk.features.halalNearbyMosqueSearchPlaceholder}
            />
            {searchText.trim().length > 0 ? (
              <Pressable
                onPress={() => setSearchText("")}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={kk.features.halalHubClearSearch}
              >
                <MaterialIcons name="close" size={20} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

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
              <Text style={[styles.radiusUnit, { color: colors.muted }]}>{kk.common.distanceKmUnit}</Text>
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
              accessibilityLabel={kk.features.halalNearbyLoadBtn}
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

          {err ? <Text style={[styles.err, { color: colors.error }]}>{err}</Text> : null}
          {loadedOnce && mosqueRows.length > 0 ? (
            <Text style={[styles.sourceLine, { color: colors.muted }]}>
              {kk.features.halalNearbyMosqueSource(mosqueRows.length)}
            </Text>
          ) : null}
        </View>

        {loadedOnce && mosqueRows.length > 0 && displayedMosques.length === 0 ? (
          <Text style={[styles.err, { color: colors.muted }]}>{kk.features.halalNearbyFilterEmpty}</Text>
        ) : null}
      </>
    ),
    [
      busy,
      colors,
      dismissKeyboard,
      displayedMosques.length,
      err,
      loadNearby,
      loadedOnce,
      mosqueRows.length,
      radiusKm,
      searchText,
    ]
  );

  return (
    <>
      <FlatList
        style={styles.root}
        contentContainerStyle={styles.content}
        data={displayedMosques}
        keyExtractor={mosqueKeyExtractor}
        renderItem={renderMosqueRow}
        ListHeaderComponent={listHeader}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        ListEmptyComponent={
          loadedOnce && mosqueRows.length === 0 && !busy ? (
            <Text style={[styles.err, { color: colors.muted }]}>{kk.features.halalNearbyMosqueEmpty}</Text>
          ) : null
        }
      />

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
                  <Image
                    source={{ uri: selectedMosqueDetail.photoUrl }}
                    style={styles.mosqueHeroImage}
                    resizeMode="cover"
                  />
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
                  </View>
                </View>
                <Pressable
                  onPress={() => setSelectedMosque(null)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={kk.common.close}
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
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 12, paddingBottom: 24, gap: 12 },
  headCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, padding: 14 },
  headRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  headText: { flex: 1 },
  title: { fontSize: 16, fontWeight: "900" },
  hint: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Platform.OS === "ios" ? 8 : 4,
    minHeight: 36,
  },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  radiusGroup: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  radiusChip: {
    minWidth: 36,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
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
  loadBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  err: { marginTop: 10, fontSize: 13 },
  sourceLine: { marginTop: 8, fontSize: 11, fontWeight: "700" },
  listCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  miniRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  miniTitle: { fontSize: 15, fontWeight: "800" },
  miniSub: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  mosqueModalRoot: { flex: 1, justifyContent: "flex-end" },
  mosqueModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
  mosqueSheet: {
    maxHeight: "88%",
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  mosqueSheetContent: { padding: 14, paddingBottom: 18 },
  mosqueHero: {
    minHeight: 132,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    gap: 6,
    overflow: "hidden",
  },
  mosqueHeroImage: { width: "100%", height: 132 },
  mosqueHeroTxt: { fontSize: 13, fontWeight: "900", letterSpacing: 0.8, textTransform: "uppercase" },
  mosqueTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  mosqueTitle: { fontSize: 20, lineHeight: 26, fontWeight: "900" },
  mosqueSub: { marginTop: 4, fontSize: 13, lineHeight: 18, fontWeight: "600" },
  mosqueStatusRow: { marginTop: 8, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  mosqueStatusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mosqueStatusText: { fontSize: 11, fontWeight: "800" },
  mosqueInfoList: { marginTop: 14, gap: 12 },
  mosqueInfoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  mosqueInfoTextCol: { flex: 1, gap: 2 },
  mosqueInfoLabel: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 },
  mosqueInfoValue: { fontSize: 14, lineHeight: 20, fontWeight: "600" },
  mosqueActionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  mosquePrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  mosquePrimaryBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "900" },
  mosqueSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mosqueSecondaryBtnTxt: { fontSize: 14, fontWeight: "800" },
});
