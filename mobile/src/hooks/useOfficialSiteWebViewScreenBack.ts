import { useCallback, useEffect, useRef } from "react";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import type { RefObject } from "react";
import type { OfficialSiteFullWebViewHandle } from "../components/OfficialSiteFullWebView";
import { useHardwareBackPress } from "../navigation/useHardwareBackPress";
import {
  resolveOfficialSiteWebBackAttempt,
  type OfficialSiteWebBackState,
} from "./officialSiteWebBackLogic";

/** SPA/WebView canGoBack «тұрып» қалса — екінші артқа экранды жабады. */
export const STUCK_BACK_ESCAPE_MS = 750;

/**
 * Android «Артқа» + iOS header back: алдымен WebView history, кейін экранды жабу.
 * Егер WebView history.back() істемей/қайталап canGoBack true қалса — келесі басу экранды жабады.
 *
 * Escape кезінде forceLeave latch: beforeRemove қайта tryWebBack() шақырып
 * preventDefault жасамасын (әйтпесе экраннан мүлде шықпайды).
 */
export function useOfficialSiteWebViewScreenBack(
  navigation: NavigationProp<ParamListBase>,
  webRef: RefObject<OfficialSiteFullWebViewHandle | null>,
  /** false болса — WebView history-ға бармай, экранды жабады (басқа табта). */
  enabled = true
) {
  const stateRef = useRef<OfficialSiteWebBackState>({ lastWebBackAt: 0, forceLeave: false });

  const tryWebBack = useCallback((): boolean => {
    const decided = resolveOfficialSiteWebBackAttempt({
      enabled,
      canGoBack: Boolean(webRef.current?.canGoBack()),
      lastWebBackAt: stateRef.current.lastWebBackAt,
      forceLeave: stateRef.current.forceLeave,
      now: Date.now(),
      escapeMs: STUCK_BACK_ESCAPE_MS,
    });
    stateRef.current = {
      lastWebBackAt: decided.lastWebBackAt,
      forceLeave: decided.forceLeave,
    };
    if (decided.consume) {
      webRef.current?.goBack();
    }
    return decided.consume;
  }, [webRef, enabled]);

  useHardwareBackPress(tryWebBack, enabled);

  useEffect(() => {
    if (!enabled) {
      stateRef.current = { lastWebBackAt: 0, forceLeave: false };
      return;
    }
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (tryWebBack()) {
        e.preventDefault();
      }
    });
    return () => {
      unsub();
      stateRef.current = { lastWebBackAt: 0, forceLeave: false };
    };
  }, [navigation, tryWebBack, enabled]);
}
