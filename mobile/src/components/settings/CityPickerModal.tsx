import React, { useCallback, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SectionList,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pressable } from "@/ui/Pressable";
import { KZ_CITY_PRESETS_LIST, type KzCityPreset } from "../../constants/kzCityPresetsList";
import { cityLabelForLocale } from "../../constants/kzCities";
import { getSavedCities, type SavedCity } from "../../storage/prefs";
import { kk } from "../../i18n/kk";
import { useAppLocale } from "../../i18n/runtime";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import type { ThemeColors } from "../../theme/colors";
import { modalSafeAreaInsets } from "../../theme/modalSafeArea";

type Props = {
  visible: boolean;
  colors: ThemeColors;
  selectedCity: string;
  selectedCountry: string;
  onClose: () => void;
  onSelect: (city: string, country: string, label: string) => void;
};

export function CityPickerModal({
  visible,
  colors,
  selectedCity,
  selectedCountry,
  onClose,
  onSelect,
}: Props) {
  const locale = useAppLocale();
  const { tr } = useKkAutoTranslator();
  const insets = useSafeAreaInsets();
  const modalInsets = modalSafeAreaInsets(insets);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<SavedCity[]>([]);

  const labelFor = useCallback(
    (p: Pick<KzCityPreset, "city" | "label">) =>
      cityLabelForLocale(p.city || p.label, locale, { tr }),
    [locale, tr]
  );

  React.useEffect(() => {
    if (!visible) {
      setQuery("");
      return;
    }
    void getSavedCities().then(setSaved);
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KZ_CITY_PRESETS_LIST;
    return KZ_CITY_PRESETS_LIST.filter((p) => {
      const localized = labelFor(p).toLowerCase();
      return (
        localized.includes(q) ||
        p.label.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    });
  }, [labelFor, query]);

  const savedPresets = useMemo(() => {
    return saved
      .map((s) => {
        const p = KZ_CITY_PRESETS_LIST.find(
          (x) => x.city === s.city && x.country === s.country
        );
        return p ?? { city: s.city, country: s.country, label: s.city, lat: 0, lon: 0 };
      })
      .filter((p, i, arr) => arr.findIndex((x) => x.city === p.city) === i);
  }, [saved]);

  const sections = useMemo(() => {
    const out: { title: string; data: KzCityPreset[] }[] = [];
    if (!query.trim() && savedPresets.length > 0) {
      out.push({ title: kk.settings.cityPickerRecent, data: savedPresets });
    }
    out.push({ title: kk.prayer.presets, data: filtered });
    return out;
  }, [filtered, query, savedPresets, locale]);

  if (!visible) return null;

  const renderItem = ({ item }: { item: KzCityPreset }) => {
    const sel = item.city === selectedCity && item.country === selectedCountry;
    const label = labelFor(item);
    return (
      <Pressable
        style={({ pressed }) => [
          styles.item,
          { borderBottomColor: colors.border },
          sel && { backgroundColor: colors.accentSurface },
          pressed && { opacity: 0.9 },
        ]}
        onPress={() => {
          onSelect(item.city, item.country, label);
          onClose();
        }}
      >
        <Text style={[styles.itemTxt, { color: colors.text }]}>{label}</Text>
        {sel ? <Text style={{ color: colors.accent }}>✓</Text> : null}
      </Pressable>
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: modalInsets.top + 8 }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}>
            <Text style={[styles.closeTxt, { color: colors.accent }]}>{kk.common.cancel}</Text>
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>{kk.settings.cityPickerTitle}</Text>
          <View style={{ width: 72 }} />
        </View>
        <TextInput
          style={[
            styles.search,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
          ]}
          placeholder={kk.settings.cityPickerSearch}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.city}-${index}`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: modalInsets.bottom + 24 }}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={[styles.sectionLabel, { color: colors.muted, backgroundColor: colors.bg }]}>
              {title}
            </Text>
          )}
          renderItem={renderItem}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  closeBtn: { padding: 8, minWidth: 72 },
  closeTxt: { fontSize: 16, fontWeight: "700" },
  title: { fontSize: 17, fontWeight: "800", flex: 1, textAlign: "center" },
  search: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginHorizontal: 16,
    marginBottom: 6,
    marginTop: 8,
    letterSpacing: 0.3,
    paddingVertical: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemTxt: { fontSize: 16, fontWeight: "600", flex: 1 },
});
