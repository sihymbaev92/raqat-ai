import type { NavigationState } from "@react-navigation/native";

/**
 * App.tsx: NavigationContainer onStateChange / onReady — дауыспен global FAB көрінуін есептеу үшін.
 */
let _rootState: NavigationState | undefined;
let _ready = false;
const _listeners = new Set<() => void>();

export function setRootNavReady(ready: boolean, state?: NavigationState | undefined) {
  _ready = ready;
  if (state !== undefined) {
    _rootState = state;
  }
  _listeners.forEach((l) => l());
}

export function setRootNavState(state: NavigationState | undefined) {
  _rootState = state;
  _listeners.forEach((l) => l());
}

export function getRootNavState(): NavigationState | undefined {
  return _rootState;
}

export function getRootNavReady(): boolean {
  return _ready;
}

export function subscribeRootNavState(callback: () => void): () => void {
  _listeners.add(callback);
  return () => {
    _listeners.delete(callback);
  };
}
