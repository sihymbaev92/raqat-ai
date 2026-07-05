import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { Pressable } from "@/ui/Pressable";
import { searchNearbyMosques } from "../../data/mosques2gisCatalog";
import { mosqueDetailForMosque } from "../../data/mosqueDetailsEnrichment";
import { formatMosqueDistanceKm, type Mosque2GisWithDistance } from "../../utils/mosqueGeoFilter";
import { NEARBY_INSTITUTIONS_MAX } from "../../utils/halalInstantSearch";
import { kk } from "../../i18n/kk";
import type { ThemeColors } from "../../theme/colors";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";

const RADIUS_OPTIONS_KM = [5, 10] as const;
const NEARBY_RENDER_LIMIT = 30;
const LAST_KNOWN_LOCATION_MAX_AGE_MS = 5 * 60_000;

type Props = {
  colors: ThemeColors;
  autoLoad?: boolean;
};

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

/** ҚМДБ «Мешіттер» табы — 2GIS каталог (Halal Damu кодына тимейді). */
export function KmdbNearbyMosquesPanel({ colors, autoLoad = true }: Props) {
  const searchInputRef = useRef<TextInput>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mosqueRows, setMosqueRows] = useState<Mosque2GisWithDistance[]>([]);
  const [searchText, setSearchText] = useState("");
  const [radiusKm, setRadiusKm] = useState<number>(RADIUS_OPTIONS_KM[0]);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [selectedMosque, setSelectedMosque] = useState<Mosque2GisWithDistance | null>(null);

  const dismissKeyboard = useCallback(() => {
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const displayedMosques = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return mosqueRows.slice(0, NEARBY_RENDER_LIMIT);
    return mosqueRows
      .filter((m) => {
        const name = m.name.toLowerCase();
        const addr = (m.address ?? "").toLowerCase();
        const region = (m.regionName ?? "").toLowerCase();
        return name.includes(q) || addr.includes(q) || region.includes(q);
      })
      .slice(0, NEARBY_RENDER_LIMIT);
  }, [mosqueRows, searchText]);

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
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== "granted") {
        setErr(kk.features.halalNearbyPermDenied);
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
      const rows = searchNearbyMosques(latitude, longitude, radiusKm * 1000, q, NEARBY_INSTITUTIONS_MAX);
      setMosqueRows(rows);
      setLoadedOnce(true);
      if (rows.length === 0) {
        setErr(q.length > 0 ? kk.features.halalNearbyFilterEmpty : kk.features.halalNearbyMosqueEmpty);
      }
    } catch {
      setErr(kk.features.halalHubNetworkErr);
      setMosqueRows([]);
      setLoadedOnce(false);
    } finally {
      setBusy(false);
    }
  }, [dismissKeyboard, radiusKm, searchText]);

  useEffect(() => {
    if (!autoLoad) return;
    void loadNearby();
  }, [autoLoad, loadNearby]);

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.head}>
        <MaterialCommunityIcons name="mosque" size={22} color={colors.accent} />
        <View style={styles.headText}>
          <Text style={[styles.title, { color: colors.text }]}>{kk.features.halalNearbyMosqueTitle}</Text>
          <Text style={[styles.hint, { color: colors.muted }]}>{kk.features.halalNearbyMosqueHint}</Text>
        </View>
      </View>

      <View style={[styles.searchRow, { borderColor: colors.border, backgroundColor: colors.bg }]}>
        <MaterialCommunityIcons name="mosque" size={20} color={colors.muted} />
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
          blurOnSubmit
          onSubmitEditing={() => void loadNearby()}
          accessibilityLabel={kk.features.halalNearbyMosqueSearchPlaceholder}
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

      {err ? <Text style={[styles.err, { color: colors.error }]}>{err}</Text> : null}

      {displayedMosques.length > 0 ? (
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

      {loadedOnce && mosqueRows.length > 0 && displayedMosques.length === 0 ? (
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
                {selectedMosqueDetail?.phone ? (
                  <View style={styles.mosqueInfoRow}>
                    <MaterialIcons name="phone" size={20} color={colors.accent} />
                    <View style={styles.mosqueInfoTextCol}>
                      <Text style={[styles.mosqueInfoLabel, { color: colors.muted }]}>{kk.features.halalHubPhone}</Text>
                      <Pressable
                        onPress={() => {
                          const url = mosqueTelDialUrl(selectedMosqueDetail.phone ?? "");
                          if (url) void Linking.openURL(url);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={kk.features.halalNearbyMosqueCallA11y(selectedMosqueDetail.phone)}
                      >
                        <Text style={[styles.mosqueInfoValue, { color: colors.accent }]}>{selectedMosqueDetail.phone}</Text>
                      </Pressable>
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
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  radiusGroup: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
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
  loadBtnTxt: { color: "#fff", fontWeight: "800", fontSize: 14 },
  err: { marginTop: 10, fontSize: 13 },
  list: { marginTop: 12, gap: 4 },
  miniRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8 },
  miniTitle: { fontSize: 15, fontWeight: "700" },
  miniSub: { fontSize: 12, marginTop: 2 },
  mosqueModalRoot: { flex: 1, justifyContent: "flex-end" },
  mosqueModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.42)" },
  mosqueSheet: {
    maxHeight: "88%",
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
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
  mosqueCloseBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  mosqueInfoList: { marginTop: 14, gap: 10 },
  mosqueInfoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  mosqueInfoTextCol: { flex: 1, minWidth: 0 },
  mosqueInfoLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mosqueInfoValue: { marginTop: 2, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  mosqueActionRow: { flexDirection: "row", gap: 10, marginTop: 16 },
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
  mosquePrimaryBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "900" },
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
  mosqueSecondaryBtnTxt: { fontSize: 14, fontWeight: "900" },
});
