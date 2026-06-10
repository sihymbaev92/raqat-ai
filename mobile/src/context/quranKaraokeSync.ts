import { useSyncExternalStore } from "react";

type KaraokeSnapshot = {
  wordIndex: number;
  durationMs: number;
  version: number;
};

type Listener = () => void;

let snapshot: KaraokeSnapshot = { wordIndex: 0, durationMs: 0, version: 0 };
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function setQuranKaraokePlayback(wordIndex: number, durationMs: number) {
  if (snapshot.wordIndex === wordIndex && snapshot.durationMs === durationMs) {
    return;
  }
  snapshot = { wordIndex, durationMs, version: snapshot.version + 1 };
  emit();
}

export function resetQuranKaraokePlayback() {
  if (snapshot.wordIndex === 0 && snapshot.durationMs === 0) return;
  snapshot = { wordIndex: 0, durationMs: 0, version: snapshot.version + 1 };
  emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): KaraokeSnapshot {
  return snapshot;
}

/** Тек audioFocus аятындағы AyahArabicKaraokeText жаңартылады — экран қатып қалмайды. */
export function useQuranKaraokeWordIndex(enabled: boolean): number {
  return useSyncExternalStore(
    subscribe,
    () => (enabled ? getSnapshot().wordIndex : 0),
    () => 0
  );
}

export function useQuranKaraokeDurationMs(enabled: boolean): number {
  return useSyncExternalStore(
    subscribe,
    () => (enabled ? getSnapshot().durationMs : 0),
    () => 0
  );
}
