import type { NavigationState } from "@react-navigation/native";

/**
 * - Басты бет (Main → Home): жоғарғы header-дағы микрофон — бұрыштағы дубль жоқ.
 * - Main басқа экрандар: төменгі таб жолағы жоқ, стандарт safe area жеткілікті.
 * - Qibla, MoreStack, т.б.: толық экран, тек safe area.
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
  if (r.name === "Main" && r.state && "index" in r.state && "routes" in r.state) {
    const t = r.state;
    const idx = typeof t.index === "number" ? t.index : 0;
    const cur = t.routes[idx];
    if (cur?.name === "Home") {
      return { showGlobalFab: false, bottomInset: 0 };
    }
    return { showGlobalFab: true, bottomInset: 16 };
  }
  return { showGlobalFab: true, bottomInset: 16 };
}

/**
 * Магнитометр/бағыт — тек нави дайын, state бар кезде; суық іске қосуды қиындатпау үшін !rootReady → false.
 * Басты бет (Main→Home) немесе Qibla экранында ғана true.
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
  if (r.name === "Main" && r.state && "index" in r.state && "routes" in r.state) {
    const t = r.state;
    const idx = typeof t.index === "number" ? t.index : 0;
    const cur = t.routes[idx];
    if (cur?.name === "Home") {
      return true;
    }
  }
  return false;
}
