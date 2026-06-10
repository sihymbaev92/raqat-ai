import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { BackHandler, Platform } from "react-native";

/**
 * Android жүйелік «артқа» түймесін экрандағы кастом артқа әрекетімен байлайды.
 * `onBackPress` true қайтарса — әдепкі навигация тоқтатылады.
 */
export function useHardwareBackPress(onBackPress: () => boolean, enabled = true) {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "web" || !enabled) return;
      const sub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => sub.remove();
    }, [enabled, onBackPress])
  );
}
