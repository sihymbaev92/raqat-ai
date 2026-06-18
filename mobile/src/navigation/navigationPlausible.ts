import type { NavigationState, PartialState } from "@react-navigation/native";
import { getPathFromState } from "@react-navigation/native";
import { appDeepLinking } from "./linking";
import { trackPlausiblePageview } from "../services/plausible";
import { trackUsagePageview } from "../services/usageAnalytics";

export function trackNavigationPlausible(
  state: NavigationState | PartialState<NavigationState> | undefined
): void {
  if (!state) return;
  try {
    const path = getPathFromState(state, appDeepLinking.config);
    const trimmed = (path || "").replace(/^\/+/, "");
    const normalized = trimmed ? `/${trimmed}` : "/";
    trackPlausiblePageview(normalized);
    trackUsagePageview(normalized);
  } catch {
    /* deep link state сәйкес емес болса — елемейміз */
  }
}
