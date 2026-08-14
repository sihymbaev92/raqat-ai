import { useCallback, useEffect, useState } from "react";
import { BackHandler, Platform } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ScreenOrientation from "expo-screen-orientation";

async function lockPortrait(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    if (Platform.OS === "android") {
      await new Promise<void>((r) => setTimeout(r, 40));
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  } catch {
    /* ignore */
  }
}

async function lockLandscape(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  } catch {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    } catch {
      /* ignore */
    }
  }
}

/** Құбыла экраны: портрет ↔ альбомдық толық көрініс. */
export function useQiblaLandscapeFullscreen() {
  const [landscape, setLandscape] = useState(false);

  const enterLandscape = useCallback(() => {
    setLandscape(true);
  }, []);

  const exitLandscape = useCallback(() => {
    setLandscape(false);
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    void (landscape ? lockLandscape() : lockPortrait());
    return () => {
      void lockPortrait();
    };
  }, [landscape]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setLandscape(false);
        void lockPortrait();
      };
    }, [])
  );

  useEffect(() => {
    if (Platform.OS !== "android" || !landscape) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      exitLandscape();
      return true;
    });
    return () => sub.remove();
  }, [exitLandscape, landscape]);

  return { landscape, enterLandscape, exitLandscape };
}

export function qiblaDialSize(args: {
  width: number;
  height: number;
  landscape: boolean;
  onlineGps: boolean;
}): number {
  const { width, height, landscape, onlineGps } = args;
  if (landscape) {
    return Math.round(Math.min(width, height) * 0.82);
  }
  const cap = onlineGps ? 300 : 260;
  return Math.min(width - 84, cap);
}
