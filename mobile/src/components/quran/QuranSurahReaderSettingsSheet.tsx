import React from "react";
import { View, Text, Modal, Switch, ScrollView, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "../../i18n/useI18n";
import { kk } from "../../i18n/kk";
import { useKkAutoTranslator } from "../../quran/useKkAutoTranslator";
import type { ThemeColors } from "../../theme/colors";
import { QURAN_READER_ARABIC_ONLY } from "../../quran/quranReaderModePolicy";
import {
  QURAN_RECITER_OPTIONS,
  QURAN_RECITER_GROUP_ORDER,
  quranReciterGroupLabelKk,
  type QuranReciterGroup,
} from "../../config/quranReciters";
import {
  QURAN_READING_LOCALES,
  setQuranReadingLocale,
  useQuranReadingLocale,
  type QuranReadingLocale,
} from "../../quran/quranReadingLocale";
import { quranTranslationLocaleChoiceLabel } from "../../quran/quranTranslationLocaleOptions";
import {
  QURAN_TRANSLIT_SCRIPTS,
  setQuranTranslitScript,
  useQuranTranslitScript,
  type QuranTranslitScript,
} from "../../quran/quranTranslitScript";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import {
  QURAN_READING_THEMES,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import {
  QURAN_READER_RECITER_KEY,
  setQuranArabicScriptEdition,
  setQuranReaderShowArabic,
  setQuranReaderShowMeaning,
  setQuranReaderShowTranslit,
  setQuranReadingTheme,
} from "../../storage/quranReaderPrefs";
import type { QuranSurahScreenStyles } from "../../quran/quranSurahScreenStyles";

export type ReaderSettingsAccordionKey =
  | "content"
  | "readingTheme"
  | "reciter"
  | "arabicScript";

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
  arabicScriptEdition: QuranArabicScriptEditionId;
  setArabicScriptEdition: (id: QuranArabicScriptEditionId) => void;
  arabicSourcesExpanded: boolean;
  setArabicSourcesExpanded: React.Dispatch<React.SetStateAction<boolean>>;
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
    arabicScriptEdition,
    setArabicScriptEdition,
    arabicSourcesExpanded,
    setArabicSourcesExpanded,
  } = props;
  const t = useI18n();
  const { tr } = useKkAutoTranslator();
  const readingLocale = useQuranReadingLocale();
  const translitScript = useQuranTranslitScript();
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const sheetMaxH = Math.min(520, (windowHeight || winH) * 0.58);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.readerSettingsRoot}>
          <Pressable style={styles.readerSettingsBackdrop} onPress={onClose} />
          <View style={[styles.readerSettingsSheet, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}>
            <View style={styles.readerSettingsHandle} />
            <Text style={styles.readerSettingsTitle}>{t.quran.readerSettingsTitle}</Text>
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
                  <Text style={styles.readerAccordionHeaderTitle}>{t.quran.readerShowContentTitle}</Text>
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
                        ? t.quran.readerShowContentArabicOnlyHint
                        : t.quran.readerShowContentHint}
                    </Text>
                    <View style={styles.readerSettingRow}>
                      <Text style={styles.readerSettingRowLabel}>{t.quran.readerShowArabicLabel}</Text>
                      <Switch
                        value={showReaderArabic}
                        onValueChange={(v) => setReaderContentLayer("arabic", v)}
                        trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                        thumbColor={showReaderArabic ? colors.accent : colors.muted}
                        accessibilityLabel={t.quran.readerShowArabicLabel}
                      />
                    </View>
                    {!QURAN_READER_ARABIC_ONLY ? (
                      <>
                        <View style={styles.readerSettingRow}>
                          <Text style={styles.readerSettingRowLabel}>{t.quran.readerShowTranslitLabel}</Text>
                          <Switch
                            value={showReaderTranslit}
                            onValueChange={(v) => setReaderContentLayer("translit", v)}
                            trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                            thumbColor={showReaderTranslit ? colors.accent : colors.muted}
                            accessibilityLabel={t.quran.readerShowTranslitLabel}
                          />
                        </View>
                        <View style={styles.readerSettingRow}>
                          <Text style={styles.readerSettingRowLabel}>{t.quran.readerShowMeaningLabel}</Text>
                          <Switch
                            value={showReaderMeaning}
                            onValueChange={(v) => setReaderContentLayer("meaning", v)}
                            trackColor={{ false: colors.border, true: isDark ? "rgba(77,182,172,0.45)" : "rgba(21,128,61,0.35)" }}
                            thumbColor={showReaderMeaning ? colors.accent : colors.muted}
                            accessibilityLabel={t.quran.readerShowMeaningLabel}
                          />
                        </View>
                        <Text style={[styles.readerSettingsHint, { marginTop: 10 }]}>
                          {kk.settings.quranTranslationLocaleTitle}
                        </Text>
                        {QURAN_READING_LOCALES.map((id) => {
                          const sel = readingLocale === id;
                          return (
                            <Pressable
                              key={id}
                              style={({ pressed }) => [
                                styles.readerChoiceRow,
                                sel && styles.readerChoiceRowSelected,
                                pressed && { opacity: 0.88 },
                              ]}
                              onPress={() => void setQuranReadingLocale(id as QuranReadingLocale)}
                              accessibilityRole="button"
                              accessibilityState={{ selected: sel }}
                              accessibilityLabel={quranTranslationLocaleChoiceLabel(id)}
                            >
                              <MaterialIcons
                                name={sel ? "check-circle" : "radio-button-unchecked"}
                                size={22}
                                color={sel ? colors.accent : colors.muted}
                              />
                              <Text style={styles.readerChoiceLabel}>
                                {quranTranslationLocaleChoiceLabel(id)}
                              </Text>
                            </Pressable>
                          );
                        })}
                        <Text style={[styles.readerSettingsHint, { marginTop: 10 }]}>
                          {kk.settings.quranTranslitScriptTitle}
                        </Text>
                        {QURAN_TRANSLIT_SCRIPTS.map((id) => {
                          const sel = translitScript === id;
                          return (
                            <Pressable
                              key={id}
                              style={({ pressed }) => [
                                styles.readerChoiceRow,
                                sel && styles.readerChoiceRowSelected,
                                pressed && { opacity: 0.88 },
                              ]}
                              onPress={() => void setQuranTranslitScript(id as QuranTranslitScript)}
                              accessibilityRole="button"
                              accessibilityState={{ selected: sel }}
                              accessibilityLabel={kk.settings.quranTranslitScriptOption(id)}
                            >
                              <MaterialIcons
                                name={sel ? "check-circle" : "radio-button-unchecked"}
                                size={22}
                                color={sel ? colors.accent : colors.muted}
                              />
                              <Text style={styles.readerChoiceLabel}>
                                {kk.settings.quranTranslitScriptOption(id)}
                              </Text>
                            </Pressable>
                          );
                        })}
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
                      <Text style={styles.readerAccordionHeaderTitle}>{t.quran.readerReadingThemeTitle}</Text>
                      <MaterialIcons
                        name={readerSettingsAccordion === "readingTheme" ? "expand-less" : "expand-more"}
                        size={24}
                        color={colors.accent}
                      />
                    </Pressable>
                    {readerSettingsAccordion === "readingTheme" ? (
                      <View style={styles.readerAccordionPanel}>
                        <Text style={styles.readerSettingsHint}>{t.quran.readerReadingThemeHint}</Text>
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
                              accessibilityLabel={tr(theme.labelKk)}
                            >
                              <MaterialIcons
                                name={sel ? "check-circle" : "radio-button-unchecked"}
                                size={22}
                                color={sel ? colors.accent : colors.muted}
                              />
                              <Text style={styles.readerChoiceLabel}>{tr(theme.labelKk)}</Text>
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
                  <Text style={styles.readerAccordionHeaderTitle}>{t.quran.readerReciterTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "reciter" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "reciter" ? (
                  <View style={styles.readerAccordionPanel}>
                    <Text style={styles.readerSettingsHint}>{t.quran.readerReciterHint}</Text>
                    {showReciterLocaleFallbackNote ? (
                      <Text style={styles.readerSettingsHint}>{t.quran.readerReciterLocaleFallbackNote}</Text>
                    ) : null}
                    {QURAN_RECITER_GROUP_ORDER.map((group) => {
                      const items = QURAN_RECITER_OPTIONS.filter((r) => r.group === group);
                      if (!items.length) return null;
                      const groupLabel = quranReciterGroupLabelKk(group);
                      return (
                        <View key={group}>
                          <Text style={styles.readerSectionSubtitle}>{tr(groupLabel)}</Text>
                          {items.map((r) => {
                            const available = r.audioAvailable !== false;
                            const sel = reciterEdition === r.edition;
                            const label = available
                              ? tr(r.labelKk)
                              : `${tr(r.labelKk)} (${t.quran.readerReciterSoon})`;
                            return (
                              <Pressable
                                key={r.edition}
                                style={({ pressed }) => [
                                  styles.readerChoiceRow,
                                  sel && styles.readerChoiceRowSelected,
                                  !available && { opacity: 0.55 },
                                  pressed && available && { opacity: 0.88 },
                                ]}
                                onPress={() => {
                                  if (!available) return;
                                  setReciterEdition(r.edition);
                                  void AsyncStorage.setItem(QURAN_READER_RECITER_KEY, r.edition);
                                }}
                                disabled={!available}
                                accessibilityRole="button"
                                accessibilityState={{ selected: sel, disabled: !available }}
                                accessibilityLabel={
                                  available
                                    ? label
                                    : t.quran.readerReciterUnavailableA11y(tr(r.labelKk))
                                }
                              >
                                <MaterialIcons
                                  name={sel ? "check-circle" : "radio-button-unchecked"}
                                  size={22}
                                  color={sel ? colors.accent : colors.muted}
                                />
                                <Text style={styles.readerChoiceLabel}>{label}</Text>
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
                  onPress={() => toggleReaderSettingsAccordion("arabicScript")}
                  style={({ pressed }) => [styles.readerAccordionHeader, pressed && { opacity: 0.92 }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: readerSettingsAccordion === "arabicScript" }}
                >
                  <Text style={styles.readerAccordionHeaderTitle}>{t.quran.readerArabicScriptTitle}</Text>
                  <MaterialIcons
                    name={readerSettingsAccordion === "arabicScript" ? "expand-less" : "expand-more"}
                    size={24}
                    color={colors.accent}
                  />
                </Pressable>
                {readerSettingsAccordion === "arabicScript" ? (
                  <View style={styles.readerAccordionPanel}>
                <Text style={styles.readerSettingsHint}>{t.quran.readerArabicScriptHint}</Text>
                {(
                  [
                    { id: "madinah" as const, label: t.quran.readerArabicScriptMadinah },
                    { id: "turkish" as const, label: t.quran.readerArabicScriptTurkish },
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
                      ? t.quran.readerArabicScriptSourcesToggleHide
                      : t.quran.readerArabicScriptSourcesToggleShow
                  }
                >
                  <MaterialIcons
                    name={arabicSourcesExpanded ? "expand-less" : "expand-more"}
                    size={22}
                    color={colors.accent}
                  />
                  <Text style={styles.readerChoiceLabel}>
                    {arabicSourcesExpanded
                      ? t.quran.readerArabicScriptSourcesToggleHide
                      : t.quran.readerArabicScriptSourcesToggleShow}
                  </Text>
                </Pressable>
                {arabicSourcesExpanded ? (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={styles.readerSectionSubtitle}>{t.quran.readerArabicScriptSourcesTitle}</Text>
                    <Text style={styles.readerSettingsHint}>{t.quran.readerArabicScriptSourcesBody}</Text>
                  </View>
                ) : null}
                  </View>
                ) : null}
              </View>

              <Pressable
                style={({ pressed }) => [styles.readerSettingsDoneBtn, pressed && { opacity: 0.92 }]}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t.common.done}
              >
                <Text style={styles.readerSettingsDoneTxt}>{t.common.done}</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
    </Modal>
  );
}
