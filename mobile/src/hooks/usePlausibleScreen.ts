import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { trackPlausibleEvent } from "../services/plausible";

/** Фокус кезінде Plausible custom event (web + домен бапталғанда). */
export function usePlausibleScreen(screenId: string): void {
  useFocusEffect(
    useCallback(() => {
      trackPlausibleEvent("Screen View", { screen: screenId });
    }, [screenId])
  );
}
