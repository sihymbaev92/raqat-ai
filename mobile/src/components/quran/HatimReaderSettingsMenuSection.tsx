import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import type { MushafDensityId } from "../../config/mushafConfig";
import type { QuranArabicScriptEditionId } from "../../config/quranArabicScriptEdition";
import type { QuranReadingThemeId } from "../../theme/quranComReadingTheme";
import type { HatimAudioPlayUntil } from "../../storage/hatimPrefs";

export type HatimReaderSettingsSnapshot = {
  readingThemeId: QuranReadingThemeId;
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

function SettingCard({
  title,
  subtitle,
  children,
  colors,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.cardSub, { color: colors.muted }]}>{subtitle}</Text> : null}
      <View style={styles.cardBody}>{children}</View>
    </View>
  );
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

function CompactToggle({
  label,
  value,
  disabled,
  colors,
  onChange,
}: {
  label: string;
  value: boolean;
  disabled?: boolean;
  colors: ThemeColors;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      oyuBackdrop={false}
      disabled={disabled}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.toggleChip,
        {
          borderColor: value ? colors.accent : colors.border,
          backgroundColor: value ? colors.accentSurface : colors.bg,
          opacity: disabled ? 0.45 : pressed ? 0.86 : 1,
        },
      ]}
    >
      <MaterialIcons
        name={value ? "check-circle" : "radio-button-unchecked"}
        size={16}
        color={value ? colors.accent : colors.muted}
      />
      <Text style={[styles.toggleText, { color: value ? colors.accent : colors.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Хатым аят мәзірі — оқу көрінісі (толық HatimSettings қайталанбайды). */
export function HatimReaderSettingsMenuSection({ colors, values, handlers }: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.flatGroup}>
        <Text style={[styles.flatTitle, { color: colors.text }]}>{kk.hatim.contextMenuReaderTitle}</Text>
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
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
  },
  cardTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
  },
  cardSub: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 2,
  },
  cardBody: {
    gap: 7,
    marginTop: 8,
  },
  inlineLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.25,
  },
  inlineLabelStrong: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
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
  scaleRow: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scaleBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  scaleValue: {
    minWidth: 48,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  toggleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  toggleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 34,
    maxWidth: "100%",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toggleText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },
  fullSettingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
  },
  fullSettingsText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
  },
  hint: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
    marginBottom: 4,
  },
});
