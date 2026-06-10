import { StyleSheet } from "react-native";
import type { ThemeColors } from "./colors";

/** Жеке басылатын батырма/жол — тізім ішінде borderTop арқылы біріктірілмейді. */
export function makeSeparateButtonStyles(colors: ThemeColors) {
  return StyleSheet.create({
    standalone: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      gap: 10,
    },
    stack: {
      gap: 8,
      marginBottom: 4,
    },
  });
}
