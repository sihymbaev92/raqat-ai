import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../theme/colors";
import { countryFlagEmoji } from "../utils/countryFlagEmoji";
import type { AppLocaleOption } from "../i18n/runtime";

type Props = {
  option: AppLocaleOption;
  colors: ThemeColors;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  showChevron?: boolean;
  compact?: boolean;
};

/** Тіл таңдау қатары: ел жалауы + ана тіл атауы. */
export function AppLocaleOptionRow({
  option,
  colors,
  onPress,
  style,
  showChevron = true,
  compact = false,
}: Props) {
  const flag = countryFlagEmoji(option.flagIso);
  const styles = compact ? compactStyles : rowStyles;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { borderColor: colors.border, backgroundColor: colors.card }, style, pressed && { opacity: 0.92 }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${flag ? `${flag} ` : ""}${option.nativeLabel}`}
    >
      {flag ? (
        <Text style={styles.flag} accessibilityElementsHidden>
          {flag}
        </Text>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: colors.text }]}>{option.nativeLabel}</Text>
        {option.subtitle ? (
          <Text style={[styles.sub, { color: colors.muted }]}>{option.subtitle}</Text>
        ) : null}
      </View>
      {showChevron ? (
        <MaterialCommunityIcons name="chevron-right" size={compact ? 22 : 24} color={colors.muted} />
      ) : null}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  flag: {
    fontSize: 32,
    lineHeight: 36,
    width: 40,
    textAlign: "center",
  },
  textWrap: { flex: 1, minWidth: 0 },
  label: { fontSize: 18, fontWeight: "800" },
  sub: { fontSize: 13, marginTop: 2, fontWeight: "600" },
});

const compactStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  flag: {
    fontSize: 26,
    lineHeight: 30,
    width: 34,
    textAlign: "center",
  },
  textWrap: { flex: 1, minWidth: 0 },
  label: { fontSize: 17, fontWeight: "800" },
  sub: { fontSize: 12, marginTop: 2, fontWeight: "600" },
});
