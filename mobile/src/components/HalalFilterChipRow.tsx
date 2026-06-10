import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import type { ThemeColors } from "../theme/colors";

export type HalalFilterChip = {
  value: string;
  label: string;
};

type Props = {
  chips: HalalFilterChip[];
  value: string;
  onChange: (value: string) => void;
  colors: ThemeColors;
  accessibilityGroupLabel?: string;
};

export function HalalFilterChipRow({ chips, value, onChange, colors, accessibilityGroupLabel }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityGroupLabel}
    >
      {chips.map((chip) => {
        const selected = value === chip.value;
        return (
          <Pressable
            key={chip.value || "all"}
            onPress={() => onChange(chip.value)}
            style={({ pressed }) => [
              styles.chip,
              {
                borderColor: colors.border,
                backgroundColor: selected ? colors.accentSurface : colors.bg,
              },
              pressed && { opacity: 0.9 },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={chip.label}
          >
            <Text
              style={[
                styles.chipTxt,
                { color: selected ? colors.accent : colors.text, fontWeight: selected ? "900" : "600" },
              ]}
              numberOfLines={1}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
    paddingRight: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 14 },
});
