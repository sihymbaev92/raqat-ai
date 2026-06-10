import React, { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MoreStackParamList } from "../../navigation/types";
import { navigateToHatim } from "../../navigation/navigateToMoreStack";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { MUSHAF_DENSITY_ORDER } from "../../config/mushafConfig";
import {
  QURAN_ARABIC_FONT_PRESETS,
} from "../../config/quranArabicFontPresets";
import {
  QURAN_RECITER_GROUP_ORDER,
  QURAN_RECITER_OPTIONS,
  type QuranReciterGroup,
} from "../../config/quranReciters";
import {
  MUSHAF_TEXT_SCALE_MAX,
  MUSHAF_TEXT_SCALE_MIN,
  MUSHAF_TEXT_SCALE_STEP,
} from "../../quran/mushafTextScale";
import {
  loadQuranReaderPrefs,
  setAyahMarkerStyle,
  setMushafDensity,
  setQuranArabicFontPreset,
  setQuranArabicScriptEdition,
  setQuranMushafTextScale,
  setQuranReaderAllowRotation,
  setQuranReaderNavMode,
  setQuranReciterEdition,
  setQuranReadingTheme,
  setQuranTajweedColorsEnabled,
  type AyahMarkerStyleId,
  type MushafDensityId,
  type QuranReaderNavMode,
  type QuranReaderPrefsSnapshot,
} from "../../storage/quranReaderPrefs";
import {
  QURAN_READING_THEMES,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import {
  clearQuranLastReadPositions,
  setQuranLastReadEnabled,
} from "../../storage/quranLastRead";
import { SettingsSection, SettingsCard, SettingsRow, makeSettingsStyles } from "./settingsUi";
import {
  SettingsAccordion,
  SettingsBoolRow,
  SettingsChipGroup,
  SettingsChoiceRow,
  SettingsScaleStepper,
} from "./settingsFormUi";

type Props = { colors: ThemeColors };

export function SettingsQuranHub({ colors }: Props) {
  const styles = makeSettingsStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const [prefs, setPrefs] = useState<QuranReaderPrefsSnapshot | null>(null);

  const reload = useCallback(async () => {
    setPrefs(await loadQuranReaderPrefs());
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  if (!prefs) return null;

  const patch = (partial: Partial<QuranReaderPrefsSnapshot>) => {
    setPrefs((p) => (p ? { ...p, ...partial } : p));
  };

  const mushafPct = Math.round(prefs.mushafTextScale * 100);

  return (
    <>
      <SettingsSection
        colors={colors}
        title={kk.settings.quranSectionReading}
        subtitle={kk.settings.quranSectionReadingSub}
      >
        <SettingsCard colors={colors}>
          <SettingsBoolRow
            colors={colors}
            label={kk.settings.quranReadLastPos}
            hint={kk.settings.quranReadLastPosHint}
            value={prefs.lastRead}
            onChange={(v) => {
              patch({ lastRead: v });
              void setQuranLastReadEnabled(v);
            }}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        colors={colors}
        title={kk.settings.quranSectionMushaf}
        subtitle={kk.settings.quranSectionMushafSub}
      >
        <Text style={[styles.label, { marginBottom: 6 }]}>{kk.quran.readerReadingThemeTitle}</Text>
        <SettingsChipGroup
          colors={colors}
          options={QURAN_READING_THEMES.map((t) => t.id)}
          value={prefs.readingTheme}
          onChange={(id: QuranReadingThemeId) => {
            patch({ readingTheme: id });
            void setQuranReadingTheme(id);
          }}
          labelFor={(id) => QURAN_READING_THEMES.find((t) => t.id === id)?.labelKk ?? id}
        />
        <Text style={[styles.hint, { marginBottom: 10 }]}>{kk.quran.readerReadingThemeHint}</Text>
        <Text style={[styles.label, { marginBottom: 6 }]}>{kk.settings.quranMushafDensityTitle}</Text>
        <SettingsChipGroup
          colors={colors}
          options={MUSHAF_DENSITY_ORDER}
          value={prefs.density}
          onChange={(id: MushafDensityId) => {
            patch({ density: id });
            void setMushafDensity(id);
          }}
          labelFor={(id) => kk.settings.quranMushafDensityOption(id)}
        />
        <Text style={[styles.label, { marginTop: 10, marginBottom: 6 }]}>{kk.quran.readerNavTitle}</Text>
        <SettingsChipGroup
          colors={colors}
          options={["scroll", "page"] as const}
          value={prefs.navMode}
          onChange={(id: QuranReaderNavMode) => {
            patch({ navMode: id });
            void setQuranReaderNavMode(id);
          }}
          labelFor={(id) =>
            id === "scroll" ? kk.settings.quranReaderNavScrollShort : kk.settings.quranReaderNavPageShort
          }
        />
        <Text style={[styles.label, { marginTop: 10, marginBottom: 6 }]}>{kk.quran.readerAyahMarkerStyleTitle}</Text>
        <SettingsChipGroup
          colors={colors}
          options={["ring_svg", "classic"] as const}
          value={prefs.marker}
          onChange={(id: AyahMarkerStyleId) => {
            patch({ marker: id });
            void setAyahMarkerStyle(id);
          }}
          labelFor={(id) =>
            id === "ring_svg" ? kk.settings.quranReaderMarkerRing : kk.settings.quranReaderMarkerClassic
          }
        />
        <Text style={[styles.label, { marginTop: 10, marginBottom: 6 }]}>{kk.quran.readerMushafScaleTitle}</Text>
        <SettingsScaleStepper
          colors={colors}
          valuePct={mushafPct}
          decreaseDisabled={prefs.mushafTextScale <= MUSHAF_TEXT_SCALE_MIN + 1e-6}
          increaseDisabled={prefs.mushafTextScale >= MUSHAF_TEXT_SCALE_MAX - 1e-6}
          decreaseA11y={kk.quran.readerMushafScaleSmallerA11y}
          increaseA11y={kk.quran.readerMushafScaleLargerA11y}
          valueA11y={kk.quran.readerMushafScaleValueA11y(mushafPct)}
          onDecrease={() => {
            const next = prefs.mushafTextScale - MUSHAF_TEXT_SCALE_STEP;
            patch({ mushafTextScale: next });
            void setQuranMushafTextScale(next);
          }}
          onIncrease={() => {
            const next = prefs.mushafTextScale + MUSHAF_TEXT_SCALE_STEP;
            patch({ mushafTextScale: next });
            void setQuranMushafTextScale(next);
          }}
        />
        <View style={{ marginTop: 8 }}>
          <SettingsBoolRow
            colors={colors}
            label={kk.settings.quranAllowRotation}
            hint={kk.settings.quranAllowRotationHint}
            value={prefs.allowRotation}
            onChange={(v) => {
              patch({ allowRotation: v });
              void setQuranReaderAllowRotation(v);
            }}
          />
        </View>
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.quranSectionArabic} subtitle={kk.settings.quranSectionArabicSub}>
        <SettingsAccordion colors={colors} title={kk.quran.readerArabicScriptTitle} defaultOpen>
          <Text style={styles.hint}>{kk.quran.readerArabicScriptHint}</Text>
          {(
            [
              { id: "madinah" as const, label: kk.quran.readerArabicScriptMadinah },
              { id: "turkish" as const, label: kk.quran.readerArabicScriptTurkish },
            ] as const
          ).map((opt) => (
            <SettingsChoiceRow
              key={opt.id}
              colors={colors}
              label={opt.label}
              selected={prefs.arabicScript === opt.id}
              onPress={() => {
                patch({ arabicScript: opt.id });
                void setQuranArabicScriptEdition(opt.id);
              }}
            />
          ))}
        </SettingsAccordion>
        <SettingsAccordion colors={colors} title={kk.quran.readerArabicFontTitle}>
          <Text style={styles.hint}>{kk.quran.readerArabicFontHint}</Text>
          {QURAN_ARABIC_FONT_PRESETS.map((p) => (
            <SettingsChoiceRow
              key={p.id}
              colors={colors}
              label={p.labelKk}
              selected={prefs.arabicFont === p.id}
              onPress={() => {
                patch({ arabicFont: p.id });
                void setQuranArabicFontPreset(p.id);
              }}
            />
          ))}
        </SettingsAccordion>
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.quranSectionAudio} subtitle={kk.settings.quranSectionAudioSub}>
        <SettingsAccordion colors={colors} title={kk.quran.readerReciterTitle}>
          <Text style={styles.hint}>{kk.quran.readerReciterHint}</Text>
          {QURAN_RECITER_GROUP_ORDER.map((group) => {
            const items = QURAN_RECITER_OPTIONS.filter((r) => r.group === group);
            if (!items.length) return null;
            const groupLabel: Record<QuranReciterGroup, string> = {
              kk: kk.quran.readerReciterGroupKk,
              ru: kk.quran.readerReciterGroupRu,
              ar: kk.quran.readerReciterGroupAr,
            };
            return (
              <View key={group}>
                <Text style={[styles.label, { marginTop: 8, fontSize: 13, color: colors.muted }]}>
                  {groupLabel[group]}
                </Text>
                {items.map((r) => (
                  <SettingsChoiceRow
                    key={r.edition}
                    colors={colors}
                    label={r.labelKk}
                    selected={prefs.reciterEdition === r.edition}
                    onPress={() => {
                      patch({ reciterEdition: r.edition });
                      void setQuranReciterEdition(r.edition);
                    }}
                  />
                ))}
              </View>
            );
          })}
        </SettingsAccordion>
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.quranSectionTajweed} subtitle={kk.settings.quranSectionTajweedSub}>
        <SettingsCard colors={colors}>
          <SettingsBoolRow
            colors={colors}
            label={kk.quran.tajweedModeLabel}
            hint={kk.quran.tajweedModeHint}
            value={prefs.tajweedColors}
            onChange={(v) => {
              patch({ tajweedColors: v });
              void setQuranTajweedColorsEnabled(v);
            }}
          />
        </SettingsCard>
        <SettingsRow
          colors={colors}
          label={kk.quran.tajweedOpenGuide}
          onPress={() => navigation.navigate("TajweedGuide")}
        />
      </SettingsSection>

      <SettingsSection colors={colors} title={kk.settings.quranSectionShortcuts} subtitle={kk.settings.quranSectionShortcutsSub}>
        <SettingsCard colors={colors}>
          <SettingsRow colors={colors} label={kk.settings.openQuranList} onPress={() => navigation.navigate("QuranList")} />
          <SettingsRow colors={colors} label={kk.features.hatimTitle} onPress={() => navigateToHatim(navigation)} />
          <SettingsRow
            colors={colors}
            label={kk.settings.quranReadClear}
            onPress={() => void clearQuranLastReadPositions()}
          />
        </SettingsCard>
        <Text style={styles.hint}>{kk.settings.quranReadClearHint}</Text>
        <Text style={styles.hint}>{kk.settings.quranReaderInSurahNote}</Text>
      </SettingsSection>
    </>
  );
}
