import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { AppLocale } from "../i18n/runtime";

/** Оқылу (транскрипция) жазуы: қазақ кирилл немесе латын. */
export const QURAN_TRANSLIT_SCRIPTS = ["kk", "latin"] as const;
export type QuranTranslitScript = (typeof QURAN_TRANSLIT_SCRIPTS)[number];

const QURAN_TRANSLIT_SCRIPT_KEY = "quran_translit_script_v1";

const listeners = new Set<() => void>();
let cached: QuranTranslitScript = "kk";

export function normalizeQuranTranslitScript(raw: string | null | undefined): QuranTranslitScript {
  return raw === "latin" ? "latin" : "kk";
}

export function defaultQuranTranslitScriptForUi(uiLocale: AppLocale): QuranTranslitScript {
  return uiLocale === "en" || uiLocale === "tr" ? "latin" : "kk";
}

function emitQuranTranslitScriptChange(): void {
  for (const listener of listeners) listener();
}

export function getQuranTranslitScript(): QuranTranslitScript {
  return cached;
}

export async function hydrateQuranTranslitScript(): Promise<QuranTranslitScript> {
  try {
    const raw = await AsyncStorage.getItem(QURAN_TRANSLIT_SCRIPT_KEY);
    cached = normalizeQuranTranslitScript(raw);
  } catch {
    cached = "kk";
  }
  emitQuranTranslitScriptChange();
  return cached;
}

export async function ensureDefaultQuranTranslitScript(uiLocale: AppLocale): Promise<QuranTranslitScript> {
  try {
    const existing = await AsyncStorage.getItem(QURAN_TRANSLIT_SCRIPT_KEY);
    if (existing != null && existing.trim() !== "") {
      cached = normalizeQuranTranslitScript(existing);
      emitQuranTranslitScriptChange();
      return cached;
    }
  } catch {
    /* */
  }
  const next = defaultQuranTranslitScriptForUi(uiLocale);
  cached = next;
  try {
    await AsyncStorage.setItem(QURAN_TRANSLIT_SCRIPT_KEY, next);
  } catch {
    /* */
  }
  emitQuranTranslitScriptChange();
  return next;
}

export async function setQuranTranslitScript(next: QuranTranslitScript): Promise<void> {
  cached = next;
  try {
    await AsyncStorage.setItem(QURAN_TRANSLIT_SCRIPT_KEY, next);
  } catch {
    /* */
  }
  emitQuranTranslitScriptChange();
}

function subscribeQuranTranslitScript(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useQuranTranslitScript(): QuranTranslitScript {
  return useSyncExternalStore(subscribeQuranTranslitScript, getQuranTranslitScript, getQuranTranslitScript);
}
