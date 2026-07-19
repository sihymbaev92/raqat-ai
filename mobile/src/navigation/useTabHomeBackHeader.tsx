import * as React from "react";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { ThemeColors } from "../theme/colors";
import { useHardwareBackPress } from "./useHardwareBackPress";

/**
 * Экрандық Android «артқа»: history болса ғана артқа қайтады.
 * Көрінетін ← батырмасы жоқ (экран шектеуі) — тек жүйелік артқа.
 */
export function useTabHomeBackHeader(navigation: NavigationProp<ParamListBase>, colors: ThemeColors) {
  void colors;
  const goBackOnly = React.useCallback((): boolean => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
    return false;
  }, [navigation]);

  useHardwareBackPress(goBackOnly, true);
}

type TabHomeBackButtonProps = {
  navigation: NavigationProp<ParamListBase>;
  colors: ThemeColors;
};

/** Көрінетін артқа батырмасы өшірілген — экран шектеуі. */
export function TabHomeBackButton(_props: TabHomeBackButtonProps) {
  return null;
}
