import React from "react";
import { View, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type Props = {
  iconColor: string;
  /** Құбыла/жолдар: 18; шапка: 24 */
  iconSize?: number;
};

/** Артқа көрсеткісі (шапка және жолдар). */
export function BackOrnamentLead({ iconColor, iconSize = 18 }: Props) {
  return (
    <View style={styles.row} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <MaterialIcons name="arrow-back" size={iconSize} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
