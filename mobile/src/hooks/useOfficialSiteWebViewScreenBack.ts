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
 * Android «Артқа» + header back: алдымен WebView history, кейін экранды жабу.
 * Кіріс бетте / тұрып қалған back — бір басумен шығу (екі рет артқа жоқ).
 */
export function useOfficialSiteWebViewScreenBack(
  navigation: NavigationProp<ParamListBase>,
  webRef: RefObject<OfficialSiteFullWebViewHandle | null>,
  /** false болса — WebView history-ға бармай, экранды жабады (басқа табта). */
  enabled = true
) {
  const stateRef = useRef<OfficialSiteWebBackState>({ lastWebBackAt: 0, forceLeave: false });
  const leavingRef = useRef(false);
  const focusedRef = useRef(true);

  const leaveScreen = useCallback((): boolean => {
    if (leavingRef.current) return true;
    leavingRef.current = true;
    stateRef.current = { lastWebBackAt: 0, forceLeave: true };
    try {
      if (typeof navigation.canGoBack === "function" && !navigation.canGoBack()) {
        leavingRef.current = false;
        stateRef.current = { lastWebBackAt: 0, forceLeave: false };
        return false;
      }
      navigation.goBack();
      return true;
    } catch {
      leavingRef.current = false;
      stateRef.current = { lastWebBackAt: 0, forceLeave: false };
      return false;
    }
  }, [navigation]);

  const consumeWebBack = useCallback((): boolean => {
    const decided = resolveOfficialSiteWebBackAttempt({
      enabled: true,
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

    if (!decided.consume) {
      return false;
    }

    webRef.current?.goBack({
      onSettled: (result) => {
        if (!focusedRef.current || leavingRef.current) return;
        if (result !== "stuck") return;
        // Тек кіріс бетте тұрып қалған back — бір басумен шығу.
        if (webRef.current?.isAtEntry?.()) {
          leaveScreen();
        }
      },
    });
    return true;
  }, [webRef, leaveScreen]);

  const onHardwareBack = useCallback((): boolean => {
    if (!enabled) return false;
    if (leavingRef.current) return leaveScreen();
    if (stateRef.current.forceLeave) return leaveScreen();
    if (consumeWebBack()) return true;
    // Escape path: consumeWebBack set forceLeave without consume.
    if (stateRef.current.forceLeave) return leaveScreen();
    return leaveScreen();
  }, [enabled, consumeWebBack, leaveScreen]);

  useHardwareBackPress(onHardwareBack, enabled);

  useEffect(() => {
    if (!enabled) {
      stateRef.current = { lastWebBackAt: 0, forceLeave: false };
      leavingRef.current = false;
      return;
    }
    focusedRef.current = true;
    const unsub = navigation.addListener("beforeRemove", (e) => {
      if (leavingRef.current || stateRef.current.forceLeave) {
        return;
      }
      if (consumeWebBack()) {
        e.preventDefault();
      }
    });
    return () => {
      focusedRef.current = false;
      unsub();
      stateRef.current = { lastWebBackAt: 0, forceLeave: false };
      leavingRef.current = false;
    };
  }, [navigation, consumeWebBack, enabled]);
}
