import React from "react";
import { Platform } from "react-native";
import { Pressable } from "@/ui/Pressable";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { EdgeInsets } from "react-native-safe-area-context";
import type { ThemeColors } from "../../theme/colors";

const BTN = 36;

type Props = {
  colors: ThemeColors;
  onPress: () => void;
  accessibilityLabel: string;
};

/** React Navigation headerRight — оң жақ safe-area ішінде. */
export function domainSettingsHeaderRightContainerStyle(insets: EdgeInsets) {
  return {
    paddingRight: Platform.OS === "web" ? 2 : Math.max(insets.right, 0),
    paddingLeft: 0,
    marginRight: 0,
    alignItems: "flex-end" as const,
    justifyContent: "center" as const,
  };
}

export function DomainSettingsHeaderButton({ colors, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      oyuBackdrop={false}
      onPress={onPress}
      style={({ pressed }) => ({
        width: BTN,
        height: BTN,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.72 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <MaterialIcons name="settings" size={20} color={colors.text} />
    </Pressable>
  );
}
