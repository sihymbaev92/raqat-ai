import { useEffect, useRef } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";
import { CommonActions } from "@react-navigation/native";
import { rootNavigationRef } from "./rootNavigationRef";
import { resolveAndroidBackNavigation } from "./resolveAndroidBackNavigation";
import { kk } from "../i18n/kk";
import { useAppLocale } from "../i18n/runtime";

/**
 * Android жүйелік «артқа» — NavigationContainer fallback.
 * Экрандағы useHardwareBackPress алдымен іске қосылады (LIFO); мұнда nested/tab артқа + Home-да шығуды блоктау.
 */
export function AndroidBackNavigationBridge() {
  useAppLocale();
  const homeBackAtRef = useRef(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!rootNavigationRef.isReady()) return false;

      const state = rootNavigationRef.getRootState();

      const handled = resolveAndroidBackNavigation(state, (action) =>
        rootNavigationRef.dispatch(action)
      );
      if (handled) return true;

      if (rootNavigationRef.canGoBack()) {
        rootNavigationRef.dispatch(CommonActions.goBack());
        return true;
      }

      /** Басты бет — бір рет блок; 2 сек ішінде қайта басса — шығу. */
      const now = Date.now();
      if (now - homeBackAtRef.current < 2000) {
        homeBackAtRef.current = 0;
        BackHandler.exitApp();
        return true;
      }
      homeBackAtRef.current = now;
      ToastAndroid.show(kk.navigation.pressBackAgainToExit, ToastAndroid.SHORT);
      return true;
    });

    return () => sub.remove();
  }, []);

  return null;
}
