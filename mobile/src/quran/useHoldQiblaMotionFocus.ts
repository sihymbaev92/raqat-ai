import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { holdQiblaMotionFocus } from "../voice/rootNavStateStore";

/** Басты бет / Qibla экраны фокуста компас сенсорларын ұстайды. */
export function useHoldQiblaMotionFocus(): void {
  useFocusEffect(
    useCallback(() => {
      holdQiblaMotionFocus(true);
      return () => holdQiblaMotionFocus(false);
    }, [])
  );
}
