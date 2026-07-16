import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useHardwareBackPress } from "./useHardwareBackPress";

/** @internal test / legacy alias */
export function popMoreStackScreen(navigation: NavigationProp<ParamListBase>): boolean {
  return popMoreStackOnly(navigation);
}

function popMoreStackOnly(navigation: NavigationProp<ParamListBase>): boolean {
  const state = navigation.getState();
  const canPopInnerStack = (state.index ?? 0) > 0;
  if (canPopInnerStack) {
    navigation.goBack();
    return true;
  }
  return false;
}

/**
 * MoreStack экрандарында Android «артқа»: тек ішкі stack-ті жабады.
 * MoreStack → Dashboard сияқты сыртқы pop root bridge арқылы орындалады.
 */
export function useMoreStackHardwareBack(navigation: NavigationProp<ParamListBase>) {
  const handleBack = useCallback((): boolean => popMoreStackOnly(navigation), [navigation]);
  useHardwareBackPress(handleBack, true);
}

/** MoreStack.Navigator `screenListeners` — барлық экранға бірдей Android артқа. */
export function moreStackScreenBackListeners({
  navigation,
}: {
  navigation: NavigationProp<ParamListBase>;
}) {
  let sub: { remove: () => void } | undefined;
  return {
    focus: () => {
      if (Platform.OS !== "android") return;
      sub = BackHandler.addEventListener("hardwareBackPress", () => popMoreStackOnly(navigation));
    },
    blur: () => {
      sub?.remove();
      sub = undefined;
    },
  };
}
