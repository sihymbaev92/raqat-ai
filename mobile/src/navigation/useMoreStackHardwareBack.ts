import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useHardwareBackPress } from "./useHardwareBackPress";

/** @internal test / legacy alias */
export function popMoreStackScreen(navigation: NavigationProp<ParamListBase>): boolean {
  return popMoreStackOnly(navigation);
}

function popMoreStackOnly(navigation: NavigationProp<ParamListBase>): boolean {
  try {
    if (typeof navigation.isFocused === "function" && !navigation.isFocused()) {
      return false;
    }
  } catch {
    return false;
  }
  const state = navigation.getState();
  const canPopInnerStack = (state?.index ?? 0) > 0;
  if (!canPopInnerStack) return false;
  try {
    if (typeof navigation.canGoBack === "function" && !navigation.canGoBack()) {
      return false;
    }
    navigation.goBack();
    return true;
  } catch {
    /** Dead navigator after locale remount — never swallow back. */
    return false;
  }
}

/**
 * MoreStack экрандарында Android «артқа»: тек ішкі stack-ті жабады.
 * MoreStack → Dashboard сияқты сыртқы pop root bridge арқылы орындалады.
 */
export function useMoreStackHardwareBack(navigation: NavigationProp<ParamListBase>) {
  const handleBack = useCallback((): boolean => popMoreStackOnly(navigation), [navigation]);
  useHardwareBackPress(handleBack, true);
}

/**
 * Module-level subscription — locale remounts often skip blur, which leaked
 * per-closure BackHandlers that swallowed hardware back app-wide.
 */
let moreStackBackSub: { remove: () => void } | undefined;

function removeMoreStackBackSub() {
  moreStackBackSub?.remove();
  moreStackBackSub = undefined;
}

/** MoreStack.Navigator `screenListeners` — барлық экранға бірдей Android артқа. */
export function moreStackScreenBackListeners({
  navigation,
}: {
  navigation: NavigationProp<ParamListBase>;
}) {
  return {
    focus: () => {
      if (Platform.OS !== "android") return;
      removeMoreStackBackSub();
      moreStackBackSub = BackHandler.addEventListener("hardwareBackPress", () =>
        popMoreStackOnly(navigation)
      );
    },
    blur: () => {
      removeMoreStackBackSub();
    },
  };
}
