import type { NavigationState } from "@react-navigation/native";

/**
 * Battery үшін барлық Main табта емес, тек Home-дегі құбыла виджеті және толық Qibla экраны көрінгенде жүреді.
 */
export function shouldRunQiblaMotionSensors(
  state: NavigationState | undefined,
  rootReady: boolean
): boolean {
  if (!rootReady || !state) {
    return false;
  }
  const r = state.routes[state.index];
  if (r.name === "Qibla") {
    return true;
  }
  if (r.name === "Main") {
    const nested = r.state as NavigationState | undefined;
    const active = nested?.routes?.[nested.index ?? 0];
    return active?.name === "Home";
  }
  return false;
}
