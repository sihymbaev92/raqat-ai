import React from "react";
import { View, Text, Modal, Switch, ScrollView, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";
import { kk } from "../../i18n/kk";
import type { ThemeColors } from "../../theme/colors";
import { QURAN_READER_ARABIC_ONLY } from "../../quran/quranReaderModePolicy";
import {
  QURAN_RECITER_OPTIONS,
  QURAN_RECITER_GROUP_ORDER,
  quranReciterGroupLabelKk,
  type QuranReciterGroup,
} from "../../config/quranReciters";
import {
  QURAN_ARABIC_FONT_PRESETS,
  type QuranArabicFontPresetId,
} from "../../config/quranArabicFontPresets";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import {
  QURAN_READING_THEMES,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import {
  clampMushafTextScale,
  MUSHAF_TEXT_SCALE_MAX,
  MUSHAF_TEXT_SCALE_MIN,
  MUSHAF_TEXT_SCALE_STEP,
} from "../../quran/mushafTextScale";
import type { MushafDensityId } from "../../config/mushafConfig";
import {
  QURAN_READER_RECITER_KEY,
  QURAN_READER_ARABIC_FONT_KEY,
  QURAN_READER_MUSHAF_TEXT_SCALE_KEY,
  setAyahMarkerStyle,
  setMushafDensity,
  setQuranReaderNavMode,
  setQuranArabicScriptEdition,
  setQuranReaderShowArabic,
  setQuranReaderShowMeaning,
  setQuranReaderShowTranslit,
  setQuranReadingTheme,
  type AyahMarkerStyleId,
  type QuranReaderNavMode,
} from "../../storage/quranReaderPrefs";
import type { QuranSurahScreenStyles } from "../../quran/quranSurahScreenStyles";

export type ReaderSettingsAccordionKey =
  | "content"
  | "readingTheme"
  | "reciter"
  | "arabicFont"
  | "arabicScript"
  | "nav"
  | "density"
  | "ayahMarker"
  | "pageEdition"
  | "scale"
  | "tajweed";

export type QuranSurahReaderSettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
  styles: QuranSurahScreenStyles;
  colors: ThemeColors;
  isDark: boolean;
  mushafLayout: boolean;
  windowHeight: number;
  readerSettingsAccordion: ReaderSettingsAccordionKey | null;
  toggleReaderSettingsAccordion: (key: ReaderSettingsAccordionKey) => void;
  showReaderArabic: boolean;
  showReaderTranslit: boolean;
  showReaderMeaning: boolean;
  setReaderContentLayer: (layer: "arabic" | "translit" | "meaning", value: boolean) => void;
  readingThemeId: QuranReadingThemeId;
  setReadingThemeId: (id: QuranReadingThemeId) => void;
  showReciterLocaleFallbackNote: boolean;
  reciterEdition: string;
  setReciterEdition: (edition: string) => void;
  arabicFontPreset: QuranArabicFontPresetId;
  setArabicFontPreset: (id: QuranArabicFontPresetId) => void;
  arabicScriptEdition: QuranArabicScriptEditionId;
  setArabicScriptEdition: (id: QuranArabicScriptEditionId) => void;
  arabicSourcesExpanded: boolean;
  setArabicSourcesExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  effectiveReaderNavMode: QuranReaderNavMode;
  setReaderNavMode: (mode: QuranReaderNavMode) => void;
  mushafDensity: MushafDensityId;
  setMushafDensityState: (d: MushafDensityId) => void;
  ayahMarkerStyleId: AyahMarkerStyleId;
  setAyahMarkerStyleIdState: (id: AyahMarkerStyleId) => void;
  mushafTextScale: number;
  setMushafTextScale: (n: number) => void;
  showTajweedColors: boolean;
  onToggleTajweedColors: (next: boolean) => void | Promise<void>;
  tajweedLoading: boolean;
  onOpenTajweedLegend: () => void;
};

export function QuranSurahReaderSettingsSheet(props: QuranSurahReaderSettingsSheetProps) {
  const {
    visible,
    onClose,
    styles,
    colors,
    isDark,
    mushafLayout,
    windowHeight,
    readerSettingsAccordion,
    toggleReaderSettingsAccordion,
    showReaderArabic,
    showReaderTranslit,
    showReaderMeaning,
    setReaderContentLayer,
    readingThemeId,
    setReadingThemeId,
    showReciterLocaleFallbackNote,
    reciterEdition,
    setReciterEdition,
    arabicFontPreset,
    setArabicFontPreset,
    arabicScriptEdition,
    setArabicScriptEdition,
    arabicSourcesExpanded,
    setArabicSourcesExpanded,
    effectiveReaderNavMode,
    setReaderNavMode,
    mushafDensity,
    setMushafDensityState,
    ayahMarkerStyleId,
    setAyahMarkerStyleIdState,
    mushafTextScale,
    setMushafTextScale,
    showTajweedColors,
    onToggleTajweedColors,
    tajweedLoading,
    onOpenTajweedLegend,
  } = props;
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const sheetMaxH = Math.min(520, (windowHeight || winH) * 0.58);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.readerSettingsRoot}>
          <Pressable style={styles.readerSettingsBackdrop} onPress={onClose} />
          <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
            <View style={styles.readerSettingsHandle} />
            <Text style={styles.readerSettingsTitle}>{kk.quran.readerSettingsTitle}</Text>
            <ScrollView
              style={{ maxHeight: sheetMaxH }}
              contentContainerStyle={styles.readerSettingsScrollPad}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <View style={[styles.readerAccordionWrap, styles.readerAccordionWrapFirst]}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("content")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "content" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerShowContentTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "content" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "content" ? (
                  <View style={styles.readerAccordionPanel}>
                    <Text style={styles.readerSettingsHint}>
                      {QURAN_READER_ARABIC_ONLY
                        ? kk.quran.readerShowContentArabicOnlyHint
                        : kk.quran.readerShowContentHint}
                    </Text>
                    <View style={styles.readerSettingRow}>
                      <Text style={styles.readerSettingRowLabel}>{kk.quran.readerShowArabicLabel}</Text>
                      <Switch
                        value={showReaderArabic}
                        onValueChange={(v) => setReaderContentLayer("arabic", v)}
                        trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                        thumbColor={showReaderArabic ? colors.accent : colors.muted}
                        accessibilityLabel={kk.quran.readerShowArabicLabel}
                      />
                    </View>
                    {!QURAN_READER_ARABIC_ONLY ? (
                      <>
                        <View style={styles.readerSettingRow}>
                          <Text style={styles.readerSettingRowLabel}>{kk.quran.readerShowTranslitLabel}</Text>
                          <Switch
                            value={showReaderTranslit}
                            onValueChange={(v) => setReaderContentLayer("translit", v)}
                            trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                            thumbColor={showReaderTranslit ? colors.accent : colors.muted}
                            accessibilityLabel={kk.quran.readerShowTranslitLabel}
                          />
                        </View>
                        <View style={styles.readerSettingRow}>
                          <Text style={styles.readerSettingRowLabel}>{kk.quran.readerShowMeaningLabel}</Text>
                          <Switch
                            value={showReaderMeaning}
                            onValueChange={(v) => setReaderContentLayer("meaning", v)}
                            trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                            thumbColor={showReaderMeaning ? colors.accent : colors.muted}
                            accessibilityLabel={kk.quran.readerShowMeaningLabel}
                          />
                        </View>
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                    <Pressable
                      onPress={() => toggleReaderSettingsAccordion("readingTheme")}
                      style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: readerSettingsAccordion === "readingTheme" }}
                    >
                      <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerReadingThemeTitle}</Text>
                      <MaterialIcons
                        name={readerSettingsAccordion === "readingTheme" ? "expand-less" : "expand-more"}
                        size={24}
                        color={colors.accent}
                      />
                    </Pressable>
                    {readerSettingsAccordion === "readingTheme" ? (
                      <View style={styles.readerAccordionPanel}>
                        <Text style={styles.readerSettingsHint}>{kk.quran.readerReadingThemeHint}</Text>
                        {QURAN_READING_THEMES.map((theme) => {
                          const sel = readingThemeId === theme.id;
                          return (
                            <Pressable
                              key={theme.id}
                              style={({ pressed }) => [
                                styles.readerChoiceRow,
                                sel && styles.readerChoiceRowSelected,
                                pressed && { opacity: 0.88 },
                              ]}
                              onPress={() => {
                                setReadingThemeId(theme.id);
                                void setQuranReadingTheme(theme.id);
                              }}
                              accessibilityRole="button"
                              accessibilityState={{ selected: sel }}
                              accessibilityLabel={theme.labelKk}
                            >
                              <MaterialIcons
                                name={sel ? "check-circle" : "radio-button-unchecked"}
                                size={22}
                                color={sel ? colors.accent : colors.muted}
                              />
                              <Text style={styles.readerChoiceLabel}>{theme.labelKk}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                </View>
              ) : null}

              <View style={styles.readerAccordionWrap}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("reciter")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "reciter" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerReciterTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "reciter" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "reciter" ? (
                  <View style={styles.readerAccordionPanel}>
                    <Text style={styles.readerSettingsHint}>{kk.quran.readerReciterHint}</Text>
                    {showReciterLocaleFallbackNote ? (
                      <Text style={styles.readerSettingsHint}>{kk.quran.readerReciterLocaleFallbackNote}</Text>
                    ) : null}
                    {QURAN_RECITER_GROUP_ORDER.map((group) => {
                      const items = QURAN_RECITER_OPTIONS.filter((r) => r.group === group);
                      if (!items.length) return null;
                      const groupLabel = quranReciterGroupLabelKk(group);
                      return (
                        <View key={group}>
                          <Text style={styles.readerSectionSubtitle}>{groupLabel}</Text>
                          {items.map((r) => {
                            const sel = reciterEdition === r.edition;
                            return (
                              <Pressable
                                key={r.edition}
                                style={({ pressed }) => [
                                  styles.readerChoiceRow,
                                  sel && styles.readerChoiceRowSelected,
                                  pressed && { opacity: 0.88 },
                                ]}
                                onPress={() => {
                                  setReciterEdition(r.edition);
                                  void AsyncStorage.setItem(QURAN_READER_RECITER_KEY, r.edition);
                                }}
                                accessibilityRole="button"
                                accessibilityState={{ selected: sel }}
                                accessibilityLabel={r.labelKk}
                              >
                                <MaterialIcons
                                  name={sel ? "check-circle" : "radio-button-unchecked"}
                                  size={22}
                                  color={sel ? colors.accent : colors.muted}
                                />
                                <Text style={styles.readerChoiceLabel}>{r.labelKk}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <View style={styles.readerAccordionWrap}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("arabicFont")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "arabicFont" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerArabicFontTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "arabicFont" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "arabicFont" ? (
                  <View style={styles.readerAccordionPanel}>
                <Text style={styles.readerSettingsHint}>{kk.quran.readerArabicFontHint}</Text>
                {QURAN_ARABIC_FONT_PRESETS.map((p) => {
                  const sel = arabicFontPreset === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      style={({ pressed }) => [
                        styles.readerChoiceRow,
                        sel && styles.readerChoiceRowSelected,
                        pressed && { opacity: 0.88 },
                      ]}
                      onPress={() => {
                        setArabicFontPreset(p.id);
                        void AsyncStorage.setItem(QURAN_READER_ARABIC_FONT_KEY, p.id);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      accessibilityLabel={p.labelKk}
                    >
                      <MaterialIcons
                        name={sel ? "check-circle" : "radio-button-unchecked"}
                        size={22}
                        color={sel ? colors.accent : colors.muted}
                      />
                      <Text style={styles.readerChoiceLabel}>{p.labelKk}</Text>
                    </Pressable>
                  );
                })}
                  </View>
                ) : null}
              </View>

              <View style={styles.readerAccordionWrap}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("arabicScript")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "arabicScript" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerArabicScriptTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "arabicScript" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "arabicScript" ? (
                  <View style={styles.readerAccordionPanel}>
                <Text style={styles.readerSettingsHint}>{kk.quran.readerArabicScriptHint}</Text>
                {(
                  [
                    { id: "madinah" as const, label: kk.quran.readerArabicScriptMadinah },
                    { id: "turkish" as const, label: kk.quran.readerArabicScriptTurkish },
                  ] as const
                ).map((opt) => {
                  const sel = arabicScriptEdition === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      style={({ pressed }) => [
                        styles.readerChoiceRow,
                        sel && styles.readerChoiceRowSelected,
                        pressed && { opacity: 0.88 },
                      ]}
                      onPress={() => {
                        setArabicScriptEdition(opt.id);
                        void setQuranArabicScriptEdition(opt.id);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      accessibilityLabel={opt.label}
                    >
                      <MaterialIcons
                        name={sel ? "check-circle" : "radio-button-unchecked"}
                        size={22}
                        color={sel ? colors.accent : colors.muted}
                      />
                      <Text style={styles.readerChoiceLabel}>{opt.label}</Text>
                    </Pressable>
                  );
                })}
                <Pressable
                  style={({ pressed }) => [
                    styles.readerChoiceRow,
                    pressed && { opacity: 0.88 },
                    { marginTop: 4 },
                  ]}
                  onPress={() => setArabicSourcesExpanded((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: arabicSourcesExpanded }}
                  accessibilityLabel={
                    arabicSourcesExpanded
                      ? kk.quran.readerArabicScriptSourcesToggleHide
                      : kk.quran.readerArabicScriptSourcesToggleShow
                  }
                >
                  <MaterialIcons
                    name={arabicSourcesExpanded ? "expand-less" : "expand-more"}
                    size={22}
                    color={colors.accent}
                  />
                  <Text style={styles.readerChoiceLabel}>
                    {arabicSourcesExpanded
                      ? kk.quran.readerArabicScriptSourcesToggleHide
                      : kk.quran.readerArabicScriptSourcesToggleShow}
                  </Text>
                </Pressable>
                {arabicSourcesExpanded ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.readerSectionSubtitle}>{kk.quran.readerArabicScriptSourcesTitle}</Text>
                    <Text style={styles.readerSettingsHint}>{kk.quran.readerArabicScriptSourcesBody}</Text>
                  </View>
                ) : null}
                  </View>
                ) : null}
              </View>

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("nav")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "nav" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerNavTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "nav" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "nav" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerNavModesHint}</Text>
                  {(["scroll", "page"] as const).map((mode) => {
                    const sel = effectiveReaderNavMode === mode;
                    return (
                      <Pressable
                        key={mode}
                        style={({ pressed }) => [
                          styles.readerChoiceRow,
                          sel && styles.readerChoiceRowSelected,
                          pressed && { opacity: 0.88 },
                        ]}
                        onPress={() => {
                          setReaderNavMode(mode);
                          void setQuranReaderNavMode(mode);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: sel }}
                        accessibilityLabel={mode === "scroll" ? kk.quran.readerNavScroll : kk.quran.readerNavPage}
                      >
                        <MaterialIcons
                          name={sel ? "check-circle" : "radio-button-unchecked"}
                          size={22}
                          color={sel ? colors.accent : colors.muted}
                        />
                        <Text style={styles.readerChoiceLabel}>
                          {mode === "scroll" ? kk.quran.readerNavScroll : kk.quran.readerNavPage}
                        </Text>
                      </Pressable>
                    );
                  })}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("density")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "density" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerMushafDensityTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "density" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "density" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerMushafDensityHint}</Text>
                  {(["tight", "medium", "comfort"] as const).map((d) => {
                    const sel = mushafDensity === d;
                    const labelKk =
                      d === "tight"
                        ? kk.quran.readerMushafDensityTight
                        : d === "comfort"
                          ? kk.quran.readerMushafDensityComfort
                          : kk.quran.readerMushafDensityMedium;
                    return (
                      <Pressable
                        key={d}
                        style={({ pressed }) => [
                          styles.readerChoiceRow,
                          sel && styles.readerChoiceRowSelected,
                          pressed && { opacity: 0.88 },
                        ]}
                        onPress={() => {
                          setMushafDensityState(d);
                          void setMushafDensity(d);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: sel }}
                        accessibilityLabel={labelKk}
                      >
                        <MaterialIcons
                          name={sel ? "check-circle" : "radio-button-unchecked"}
                          size={22}
                          color={sel ? colors.accent : colors.muted}
                        />
                        <Text style={styles.readerChoiceLabel}>{labelKk}</Text>
                      </Pressable>
                    );
                  })}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("ayahMarker")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "ayahMarker" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerAyahMarkerStyleTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "ayahMarker" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "ayahMarker" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerAyahMarkerStyleHint}</Text>
                  {(["ring_svg", "classic"] as const).map((sid) => {
                    const sel = ayahMarkerStyleId === sid;
                    const labelKk =
                      sid === "ring_svg" ? kk.quran.readerAyahMarkerRingSvg : kk.quran.readerAyahMarkerClassic;
                    return (
                      <Pressable
                        key={sid}
                        style={({ pressed }) => [
                          styles.readerChoiceRow,
                          sel && styles.readerChoiceRowSelected,
                          pressed && { opacity: 0.88 },
                        ]}
                        onPress={() => {
                          setAyahMarkerStyleIdState(sid);
                          void setAyahMarkerStyle(sid);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: sel }}
                        accessibilityLabel={labelKk}
                      >
                        <MaterialIcons
                          name={sel ? "check-circle" : "radio-button-unchecked"}
                          size={22}
                          color={sel ? colors.accent : colors.muted}
                        />
                        <Text style={styles.readerChoiceLabel}>{labelKk}</Text>
                      </Pressable>
                    );
                  })}
                    </View>
                  ) : null}
                </View>
              ) : null}

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("pageEdition")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "pageEdition" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerMushafPageEditionTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "pageEdition" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "pageEdition" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerMushafPageEditionHint}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {mushafLayout ? (
                <View style={styles.readerAccordionWrap}>
                  <Pressable
                    onPress={() => toggleReaderSettingsAccordion("scale")}
                    style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: readerSettingsAccordion === "scale" }}
                  >
                    <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.readerMushafScaleTitle}</Text>
                    <MaterialIcons
                      name={readerSettingsAccordion === "scale" ? "expand-less" : "expand-more"}
                      size={24}
                      color={colors.accent}
                    />
                  </Pressable>
                  {readerSettingsAccordion === "scale" ? (
                    <View style={styles.readerAccordionPanel}>
                  <Text style={styles.readerSettingsHint}>{kk.quran.readerMushafScaleHint}</Text>
                  <View style={styles.readerMushafScaleRow}>
                    <Pressable
                      style={({ pressed }) => [styles.readerMushafScaleBtn, pressed && { opacity: 0.88 }]}
                      onPress={() => {
                        const next = clampMushafTextScale(mushafTextScale - MUSHAF_TEXT_SCALE_STEP);
                        setMushafTextScale(next);
                        void AsyncStorage.setItem(QURAN_READER_MUSHAF_TEXT_SCALE_KEY, String(next));
                      }}
                      disabled={mushafTextScale <= MUSHAF_TEXT_SCALE_MIN + 1e-6}
                      accessibilityRole="button"
                      accessibilityLabel={kk.quran.readerMushafScaleSmallerA11y}
                    >
                      <MaterialIcons name="remove" size={22} color={colors.accent} />
                    </Pressable>
                    <Text
                      style={styles.readerMushafScaleValue}
                      accessibilityRole="text"
                      accessibilityLabel={kk.quran.readerMushafScaleValueA11y(
                        Math.round(mushafTextScale * 100)
                      )}
                    >
                      {Math.round(mushafTextScale * 100)}%
                    </Text>
                    <Pressable
                      style={({ pressed }) => [styles.readerMushafScaleBtn, pressed && { opacity: 0.88 }]}
                      onPress={() => {
                        const next = clampMushafTextScale(mushafTextScale + MUSHAF_TEXT_SCALE_STEP);
                        setMushafTextScale(next);
                        void AsyncStorage.setItem(QURAN_READER_MUSHAF_TEXT_SCALE_KEY, String(next));
                      }}
                      disabled={mushafTextScale >= MUSHAF_TEXT_SCALE_MAX - 1e-6}
                      accessibilityRole="button"
                      accessibilityLabel={kk.quran.readerMushafScaleLargerA11y}
                    >
                      <MaterialIcons name="add" size={22} color={colors.accent} />
                    </Pressable>
                  </View>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <View style={[styles.readerAccordionWrap, styles.readerSettingRowAfterContent]}>
                <Pressable
                  onPress={() => toggleReaderSettingsAccordion("tajweed")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "tajweed" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{kk.quran.tajweedModeLabel}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "tajweed" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "tajweed" ? (
                  <View style={styles.readerAccordionPanel}>
                    <View style={styles.readerSettingRow}>
                      <Text style={styles.readerSettingRowLabel}>{kk.quran.tajweedModeLabel}</Text>
                      <Switch
                        value={showTajweedColors}
                        onValueChange={(v) => void onToggleTajweedColors(v)}
                        trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                        thumbColor={showTajweedColors ? colors.accent : colors.muted}
                        accessibilityLabel={kk.quran.tajweedModeLabel}
                      />
                    </View>
              <Text style={styles.readerSettingsHint}>{kk.quran.tajweedModeHint}</Text>
              <Text style={styles.readerTajweedExplainShort}>{kk.quran.tajweedColorHintShort}</Text>
              <Text style={styles.readerTajweedExplainShort}>{kk.quran.readerTajweedExplainShort}</Text>
              {tajweedLoading ? (
                <View style={styles.readerSettingsLoading}>
                  <RaqatOrnamentSpinner size={20} />
                  <Text style={styles.readerSettingsLoadingTxt}>{kk.quran.tajweedLoading}</Text>
                </View>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.readerLegendBtn, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  onClose();
                  onOpenTajweedLegend();
                }}
                accessibilityRole="button"
                accessibilityLabel={kk.quran.readerOpenLegend}
              >
                <MaterialIcons name="palette" size={22} color={colors.accent} />
                <Text style={styles.readerLegendBtnTxt}>{kk.quran.readerOpenLegend}</Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.muted} />
              </Pressable>
                  </View>
                ) : null}
              </View>
              <Pressable
                style={({ pressed }) => [styles.readerSettingsDoneBtn, pressed && { opacity: 0.92 }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={kk.common.done}
              >
                <Text style={styles.readerSettingsDoneTxt}>{kk.common.done}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
    </Modal>
  );
}
