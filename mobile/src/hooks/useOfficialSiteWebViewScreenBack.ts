import { useCallback, useEffect } from "react";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { RefObject } from "react";
import type { OfficialSiteFullWebViewHandle } from "../components/OfficialSiteFullWebView";
import { useHardwareBackPress } from "../navigation/useHardwareBackPress";

/**
 * Android «Артқа» + iOS header back: алдымен WebView history, кейін экранды жабу.
 */
export function useOfficialSiteWebViewScreenBack(
  navigation: NavigationProp<ParamListBase>,
  webRef: RefObject<OfficialSiteFullWebViewHandle | null>
) {
  const tryWebBack = useCallback((): boolean => {
    if (webRef.current?.canGoBack()) {
      webRef.current.goBack();
      return true;
    }
    return false;
  }, [webRef]);

  useHardwareBackPress(tryWebBack, true);

  useEffect(() => {
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (tryWebBack()) {
        e.preventDefault();
      }
    });
    return unsub;
  }, [navigation, tryWebBack]);
}
