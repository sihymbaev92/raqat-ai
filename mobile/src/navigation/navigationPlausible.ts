import type { NavigationState, PartialState } from "@react-navigation/native";
import { getPathFromState } from "@react-navigation/native";
import { appDeepLinking } from "./linking";
import { trackPlausiblePageview } from "../services/plausible";

export function trackNavigationPlausible(
  state: NavigationState | PartialState<NavigationState> | undefined
): void {
  if (!state) return;
  try {
    const path = getPathFromState(state, appDeepLinking.config);
    const trimmed = (path || "").replace(/^\/+/, "");
    trackPlausiblePageview(trimmed ? `/${trimmed}` : "/");
  } catch {
    /* deep link state сәйкес емес болса — елемейміз */
  }
}
