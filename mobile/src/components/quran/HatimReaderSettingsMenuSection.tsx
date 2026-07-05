import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { useI18n } from "../../i18n/useI18n";
import type { MushafDensityId } from "../../config/mushafConfig";
import type { QuranArabicFontPresetId } from "../../config/quranArabicFontPresets";
import { QURAN_ARABIC_FONT_PRESETS } from "../../config/quranArabicFontPresets";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import {
  QURAN_READING_THEMES,
  type QuranReadingThemeId,
} from "../../theme/quranComReadingTheme";
import type { HatimAudioPlayUntil } from "../../storage/hatimPrefs";

export type HatimReaderSettingsSnapshot = {
  readingThemeId: QuranReadingThemeId;
  arabicFontPreset: QuranArabicFontPresetId;
  mushafTextScale: number;
  mushafTextScaleLocked?: boolean;
  mushafDensity: MushafDensityId;
  showReaderArabic: boolean;
  showReaderTranslit: boolean;
  showReaderMeaning: boolean;
  showTajweedColors: boolean;
  arabicScriptEdition: QuranArabicScriptEditionId;
  playUntil: HatimAudioPlayUntil;
};

export type HatimReaderSettingsHandlers = {
  onReadingTheme: (id: QuranReadingThemeId) => void;
  onArabicFontPreset: (id: QuranArabicFontPresetId) => void;
  onMushafTextScale: (scale: number) => void;
  onMushafDensity: (id: MushafDensityId) => void;
  onShowReaderArabic: (v: boolean) => void;
  onShowReaderTranslit: (v: boolean) => void;
  onShowReaderMeaning: (v: boolean) => void;
  onShowTajweedColors: (v: boolean) => void;
  onArabicScriptEdition: (id: QuranArabicScriptEditionId) => void;
  onPlayUntil: (scope: HatimAudioPlayUntil) => void;
  onOpenFullHatimSettings: () => void;
};

type Props = {
  colors: ThemeColors;
  values: HatimReaderSettingsSnapshot;
  handlers: HatimReaderSettingsHandlers;
};

function playUntilLabel(scope: HatimAudioPlayUntil): string {
  if (scope === "juz") return kk.hatim.settingsPlayUntilJuz;
  if (scope === "surah") return kk.hatim.settingsPlayUntilSurah;
  return kk.hatim.settingsPlayUntilAyah;
}

function CompactChip<T extends string>({
  label,
  value,
  selected,
  disabled,
  colors,
  onPress,
}: {
  label: string;
  value: T;
  selected: boolean;
  disabled?: boolean;
  colors: ThemeColors;
  onPress: (value: T) => void;
}) {
  return (
    <Pressable
      oyuBackdrop={false}
      disabled={disabled}
      onPress={() => onPress(value)}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentSurface : colors.bg,
          opacity: disabled ? 0.45 : pressed ? 0.86 : 1,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? colors.accent : colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Хатым аят мәзірі — оқу темасы + баспа стилі (шрифт). */
export function HatimReaderSettingsMenuSection({ colors, values, handlers }: Props) {
  useI18n();
  return (
    <View style={styles.panel}>
      <View style={styles.flatGroup}>
        <Text style={[styles.flatTitle, { color: colors.text }]}>{kk.hatim.contextMenuReaderTitle}</Text>
        <Text style={[styles.inlineLabel, { color: colors.muted }]}>{kk.hatim.contextMenuGroupTheme}</Text>
        <View style={styles.chipRow}>
          {QURAN_READING_THEMES.map((theme) => (
            <CompactChip
              key={theme.id}
              colors={colors}
              label={theme.labelKk}
              value={theme.id}
              selected={values.readingThemeId === theme.id}
              onPress={handlers.onReadingTheme}
            />
          ))}
        </View>
        <Text style={[styles.inlineLabel, { color: colors.muted }]}>{kk.quran.readerArabicFontTitle}</Text>
        <View style={styles.chipRow}>
          {QURAN_ARABIC_FONT_PRESETS.map((preset) => (
            <CompactChip
              key={preset.id}
              colors={colors}
              label={preset.labelKk}
              value={preset.id}
              selected={values.arabicFontPreset === preset.id}
              onPress={handlers.onArabicFontPreset}
            />
          ))}
        </View>
        <Text style={[styles.inlineLabel, { color: colors.muted }]}>{kk.hatim.settingsPlayUntil}</Text>
        <View style={styles.chipRow}>
          {(["juz", "surah", "ayah"] as const).map((scope) => (
            <CompactChip
              key={scope}
              colors={colors}
              label={playUntilLabel(scope)}
              value={scope}
              selected={values.playUntil === scope}
              onPress={handlers.onPlayUntil}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 10,
  },
  flatGroup: {
    gap: 7,
  },
  flatTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
  },
  inlineLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.25,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    minHeight: 32,
    maxWidth: "100%",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },
});
