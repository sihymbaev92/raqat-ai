import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { AppLocale } from "../i18n/runtime";

/** Оқылу (транскрипция) жазуы: қазақ кирилл немесе латын. */
export const QURAN_TRANSLIT_SCRIPTS = ["kk", "latin"] as const;
export type QuranTranslitScript = (typeof QURAN_TRANSLIT_SCRIPTS)[number];

const QURAN_TRANSLIT_SCRIPT_KEY = "quran_translit_script_v1";
/** Бір рет: қазақ UI-да латынға «жабысып» қалған оқылуды кириллге қайтару. */
const QURAN_TRANSLIT_KK_CYRILLIC_RESTORE_KEY = "quran_translit_kk_cyrillic_restore_v1";

const listeners = new Set<() => void>();
let cached: QuranTranslitScript = "kk";

export function normalizeQuranTranslitScript(raw: string | null | undefined): QuranTranslitScript {
  return raw === "latin" ? "latin" : "kk";
}

export function defaultQuranTranslitScriptForUi(uiLocale: AppLocale): QuranTranslitScript {
  /** Non-kk UI must never surface Kazakh Cyrillic translit by default. */
  return uiLocale === "kk" ? "kk" : "latin";
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
  /** Non-kk UI: force latin in memory only — do not overwrite user's kk preference in storage. */
  if (uiLocale !== "kk") {
    cached = "latin";
    emitQuranTranslitScriptChange();
    return cached;
  }
  try {
    const restored = await AsyncStorage.getItem(QURAN_TRANSLIT_KK_CYRILLIC_RESTORE_KEY);
    if (restored !== "1") {
      cached = "kk";
      await AsyncStorage.setItem(QURAN_TRANSLIT_SCRIPT_KEY, "kk");
      await AsyncStorage.setItem(QURAN_TRANSLIT_KK_CYRILLIC_RESTORE_KEY, "1");
      emitQuranTranslitScriptChange();
      return cached;
    }
  } catch {
    /* */
  }
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
    /** Пайдаланушы таңдауы — бір реттік restore қайта жаппасын. */
    await AsyncStorage.setItem(QURAN_TRANSLIT_KK_CYRILLIC_RESTORE_KEY, "1");
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
