import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Pressable } from "@/ui/Pressable";
import type { ThemeColors } from "../../theme/colors";

type Tab<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  tabs: Tab<T>[];
  value: T;
  onChange: (id: T) => void;
  colors: ThemeColors;
};

export function HalalSegmentedTabs<T extends string>({ tabs, value, onChange, colors }: Props<T>) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipOn,
              pressed && { opacity: 0.92 },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.txt, selected && styles.txtOn]} numberOfLines={2}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: 6,
      padding: 4,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      marginBottom: 12,
    },
    chip: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    chipOn: {
      backgroundColor: colors.accentSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.accent,
    },
    txt: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.muted,
      textAlign: "center",
    },
    txtOn: {
      color: colors.accent,
      fontWeight: "900",
    },
  });
}
