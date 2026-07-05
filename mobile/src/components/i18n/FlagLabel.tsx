import React from "react";
import { Platform, StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

type Props = {
  flag: string;
  label: string;
  style?: TextStyle;
  flagStyle?: TextStyle;
  numberOfLines?: number;
} & Pick<TextProps, "accessibilityLabel">;

/** Мәтін алдында emoji жалау (тіл / кари тобы). */
export function FlagLabel({ flag, label, style, flagStyle, numberOfLines, accessibilityLabel }: Props) {
  const trimmed = flag.trim();
  if (!trimmed) {
    return (
      <Text style={style} numberOfLines={numberOfLines} accessibilityLabel={accessibilityLabel ?? label}>
        {label}
      </Text>
    );
  }
  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={[styles.flag, flagStyle]}>{trimmed} </Text>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  flag: Platform.select({
    android: { fontSize: 18, lineHeight: 22 },
    default: { fontSize: 16 },
  }) as TextStyle,
});
