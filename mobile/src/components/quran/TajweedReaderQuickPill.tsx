import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";
import { kk } from "../../i18n/kk";
import { useI18n } from "../../i18n/useI18n";
import { TAJWEED_STD } from "../../content/tajweedColorPalette";
import { RaqatOrnamentSpinner } from "../RaqatOrnamentSpinner";

const RAINBOW = [
  TAJWEED_STD.madd.light,
  TAJWEED_STD.ghunnahIkhfa.light,
  TAJWEED_STD.qalqalah.light,
  TAJWEED_STD.idgham.light,
] as const;

export type TajweedReaderQuickPillVariant = "pill" | "icon";

type Props = {
  colors: ThemeColors;
  isDark: boolean;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  loading?: boolean;
  /** Мадина нұсқасы — ғана түсті тәжуид қолжетімді. */
  scriptSupportsTajweed?: boolean;
  variant?: TajweedReaderQuickPillVariant;
  onOpenLegend?: () => void;
};

function TajweedRainbowMark({ active }: { active: boolean }) {
  return (
    <View style={styles.rainbowWrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {RAINBOW.map((hex) => (
        <View
          key={hex}
          style={[
            styles.rainbowStripe,
            { backgroundColor: hex, opacity: active ? 1 : 0.42 },
          ]}
        />
      ))}
    </View>
  );
}

/** Ашық ақ pill — тәжуид түстерін қосу/өшіру (хатым, сүре, мұсаф). */
export function TajweedReaderQuickPill({
  colors,
  isDark,
  enabled,
  onToggle,
  loading = false,
  scriptSupportsTajweed = true,
  variant = "pill",
  onOpenLegend,
}: Props) {
  const t = useI18n();
  const surface = useMemo(
    () => ({
      bg: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.94)",
      bgOn: isDark ? "rgba(52, 211, 153, 0.14)" : "rgba(5, 150, 105, 0.09)",
      border: isDark ? "rgba(255,255,255,0.2)" : colors.border,
      borderOn: colors.accent,
    }),
    [colors.accent, colors.border, isDark]
  );

  const scriptBlocked = !scriptSupportsTajweed;
  const stateLabel = enabled ? t.quran.tajweedPanelOn : t.quran.tajweedPanelOff;
  const a11y = `${t.quran.tajweedModeLabel}. ${stateLabel}. ${t.quran.tajweedColorHintShort}`;

  const handlePress = () => {
    if (loading) return;
    onToggle(!enabled);
  };

  if (variant === "icon") {
    return (
      <Pressable
        oyuBackdrop={false}
        onPress={handlePress}
        onLongPress={onOpenLegend}
        delayLongPress={420}
        disabled={loading}
        hitSlop={8}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled, disabled: loading }}
        accessibilityLabel={a11y}
        style={({ pressed }) => [
          styles.iconBtn,
          {
            borderColor: enabled ? surface.borderOn : surface.border,
            backgroundColor: enabled ? surface.bgOn : surface.bg,
            opacity: pressed ? 0.86 : loading ? 0.65 : 1,
          },
        ]}
      >
        {loading ? (
          <RaqatOrnamentSpinner size={18} />
        ) : (
          <>
            <MaterialIcons name="palette" size={20} color={enabled ? colors.accent : colors.muted} />
            {enabled ? <View style={[styles.iconDot, { backgroundColor: colors.accent }]} /> : null}
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      oyuBackdrop={false}
      onPress={handlePress}
      onLongPress={onOpenLegend}
      delayLongPress={420}
      disabled={loading}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: enabled, disabled: loading }}
      accessibilityLabel={a11y}
      style={({ pressed }) => [
        styles.pill,
        {
          borderColor: enabled ? surface.borderOn : surface.border,
          backgroundColor: enabled ? surface.bgOn : surface.bg,
          opacity: pressed ? 0.86 : loading ? 0.7 : 1,
        },
      ]}
    >
      {loading ? (
        <RaqatOrnamentSpinner size={17} />
      ) : (
        <TajweedRainbowMark active={enabled} />
      )}
      <View style={styles.pillTextCol}>
        <Text style={[styles.pillTitle, { color: colors.text }]} numberOfLines={1}>
          {t.quran.tajweedModeLabel}
        </Text>
        <Text style={[styles.pillState, { color: enabled ? colors.accent : colors.muted }]} numberOfLines={1}>
          {loading ? kk.quran.tajweedLoading : stateLabel}
        </Text>
      </View>
      {scriptBlocked ? (
        <MaterialIcons name="info-outline" size={16} color={colors.muted} />
      ) : (
        <MaterialIcons
          name={enabled ? "toggle-on" : "toggle-off"}
          size={28}
          color={enabled ? colors.accent : colors.muted}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 148,
    maxWidth: "100%",
  },
  pillTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  pillTitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
  },
  pillState: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "800",
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDot: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rainbowWrap: {
    width: 14,
    height: 22,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "column",
  },
  rainbowStripe: {
    flex: 1,
    width: "100%",
  },
});
