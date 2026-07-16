import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ScreenOrientation from "expo-screen-orientation";
import { runAfterInteractions } from "../utils/uiDefer";
import {
  getQuranReaderAllowRotation,
  setQuranReaderAllowRotation,
} from "../storage/quranReaderPrefs";

async function applyOrientationLock(allowRotation: boolean): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    if (allowRotation) {
      await ScreenOrientation.unlockAsync();
      return;
    }
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    if (Platform.OS === "android") {
      await new Promise<void>((r) => setTimeout(r, 40));
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  } catch {
    /* ignore */
  }
}

async function lockPortraitAgain(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    if (Platform.OS === "android") {
      await new Promise<void>((r) => setTimeout(r, 60));
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Құран/хатым оқу экраны: телефон auto-rotate қосулы болса портрет↔альбом.
 * Шыққанда қайта портретке бекітеді.
 */
export function useQuranReaderOrientation(enabled = true) {
  const [allowRotation, setAllowRotation] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || Platform.OS === "web") return undefined;
      let cancelled = false;
      const interactionHandle = runAfterInteractions(() => {
        void (async () => {
          const allow = await getQuranReaderAllowRotation();
          if (cancelled) return;
          setAllowRotation(allow);
          await applyOrientationLock(allow);
        })();
      });
      return () => {
        cancelled = true;
        interactionHandle?.cancel?.();
        void lockPortraitAgain();
      };
    }, [enabled])
  );

  const toggleAllowRotation = useCallback(async () => {
    const next = !allowRotation;
    setAllowRotation(next);
    await setQuranReaderAllowRotation(next);
    await new Promise<void>((resolve) => {
      runAfterInteractions(() => resolve());
    });
    await applyOrientationLock(next);
  }, [allowRotation]);

  return { allowRotation, toggleAllowRotation };
}
