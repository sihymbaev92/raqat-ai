import { Platform, StatusBar } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";

export function modalSafeAreaInsets(insets: EdgeInsets): EdgeInsets {
  const androidTop = StatusBar.currentHeight ?? 24;
  const topFallback = Platform.OS === "android" ? androidTop : 12;
  /** 3-батырмалы навбар (~48dp) — контент артқаға жағаласпасын. */
  const bottomFallback = Platform.OS === "android" ? 48 : 8;

  return {
    top: Math.max(insets.top, topFallback),
    right: insets.right,
    bottom: Math.max(insets.bottom, bottomFallback),
    left: insets.left,
  };
}
