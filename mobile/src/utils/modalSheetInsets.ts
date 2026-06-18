import { Platform } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";

/** Bottom sheet / modal card padding above home indicator or 3-button nav. */
export function modalSheetBottomPadding(insets: EdgeInsets): number {
  const base = Platform.OS === "ios" ? 16 : 12;
  return Math.max(insets.bottom, base);
}
