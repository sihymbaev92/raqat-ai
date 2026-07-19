import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { AppLocale } from "../i18n/runtime";

/** Құран мағына аудармасы тілі — UI тілінен бөлек. */
export const QURAN_READING_LOCALES = ["kk", "ru", "en", "tr", "uz", "ky"] as const;
export type QuranReadingLocale = (typeof QURAN_READING_LOCALES)[number];

const QURAN_READING_LOCALE_KEY = "quran_reading_locale_v1";

const listeners = new Set<() => void>();
let cached: QuranReadingLocale = "kk";

export function isQuranReadingLocale(raw: string | null | undefined): raw is QuranReadingLocale {
  return (QURAN_READING_LOCALES as readonly string[]).includes((raw ?? "").trim());
}

export function normalizeQuranReadingLocale(raw: string | null | undefined): QuranReadingLocale {
  const s = (raw ?? "").trim();
  return isQuranReadingLocale(s) ? s : "kk";
}

export function defaultQuranReadingLocaleForUi(uiLocale: AppLocale): QuranReadingLocale {
  if (isQuranReadingLocale(uiLocale)) return uiLocale;
  return "kk";
}

function emitQuranReadingLocaleChange(): void {
  for (const listener of listeners) listener();
}

export function getQuranReadingLocale(): QuranReadingLocale {
  return cached;
}

export async function hydrateQuranReadingLocale(): Promise<QuranReadingLocale> {
  try {
    const raw = await AsyncStorage.getItem(QURAN_READING_LOCALE_KEY);
    cached = normalizeQuranReadingLocale(raw);
  } catch {
    cached = "kk";
  }
  emitQuranReadingLocaleChange();
  return cached;
}

/** Бірінші іске қосу: UI тіліне сәйкес (кейін Settings-тен өзгертеді). */
export async function ensureDefaultQuranReadingLocale(uiLocale: AppLocale): Promise<QuranReadingLocale> {
  try {
    const existing = await AsyncStorage.getItem(QURAN_READING_LOCALE_KEY);
    if (existing != null && existing.trim() !== "") {
      cached = normalizeQuranReadingLocale(existing);
      emitQuranReadingLocaleChange();
      return cached;
    }
  } catch {
    /* */
  }
  const next = defaultQuranReadingLocaleForUi(uiLocale);
  cached = next;
  try {
    await AsyncStorage.setItem(QURAN_READING_LOCALE_KEY, next);
  } catch {
    /* */
  }
  emitQuranReadingLocaleChange();
  return next;
}

export async function setQuranReadingLocale(next: QuranReadingLocale): Promise<void> {
  cached = next;
  try {
    await AsyncStorage.setItem(QURAN_READING_LOCALE_KEY, next);
  } catch {
    /* */
  }
  emitQuranReadingLocaleChange();
}

function subscribeQuranReadingLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useQuranReadingLocale(): QuranReadingLocale {
  return useSyncExternalStore(subscribeQuranReadingLocale, getQuranReadingLocale, getQuranReadingLocale);
}
