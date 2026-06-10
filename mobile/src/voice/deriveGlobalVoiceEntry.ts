import type { NavigationState } from "@react-navigation/native";

/**
 * - Main (барлық табтар): микрофон тек жоғарғы header оң жақта — төменгі FAB жоқ.
 * - Qibla, MoreStack, т.б.: төменгі FAB + safe area.
 */
export function deriveGlobalVoiceEntryLayout(
  state: NavigationState | undefined,
  rootReady: boolean
): { showGlobalFab: boolean; bottomInset: number } {
  if (!rootReady) {
    return { showGlobalFab: false, bottomInset: 16 };
  }
  if (!state) {
    return { showGlobalFab: true, bottomInset: 16 };
  }
  const r = state.routes[state.index];
  if (r.name === "Main") {
    return { showGlobalFab: false, bottomInset: 0 };
  }
  return { showGlobalFab: true, bottomInset: 16 };
}

/**
 * Магнитометр/бағыт — тек нави дайын, state бар кезде; суық іске қосуды қиындатпау үшін !rootReady → false.
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
