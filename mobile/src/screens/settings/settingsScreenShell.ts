import { StyleSheet } from "react-native";
import type { ThemeColors } from "../../theme/colors";
import { typography, uiFontStyle } from "../../theme/typography";

export function makeSettingsScreenShell(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    content: { padding: 16, paddingBottom: 36 },
    h1: {
      color: colors.text,
      ...uiFontStyle("semibold"),
      ...typography.xxl,
      marginBottom: 8,
    },
  });
}
