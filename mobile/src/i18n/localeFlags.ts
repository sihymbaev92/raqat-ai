import type { QuranReciterGroup } from "../config/quranReciters";
import type { AppLocale } from "./runtime";

/** Тіл / аудио тобына сәйкес emoji жалау (Unicode regional indicator). */
export const APP_LOCALE_FLAG: Record<AppLocale, string> = {
  kk: "🇰🇿",
  ru: "🇷🇺",
  en: "🇬🇧",
  ky: "🇰🇬",
  uz: "🇺🇿",
  tr: "🇹🇷",
  ar: "🇸🇦",
  zh: "🇨🇳",
  fa: "🇮🇷",
  id: "🇮🇩",
  ms: "🇲🇾",
  hi: "🇮🇳",
  ku: "",
};

export function appLocaleFlag(locale: AppLocale): string {
  return APP_LOCALE_FLAG[locale] ?? "";
}

export function quranReciterGroupFlag(group: QuranReciterGroup): string {
  return appLocaleFlag(group);
}

export function formatFlagLabel(flag: string, label: string): string {
  const f = flag.trim();
  return f ? `${f} ${label}` : label;
}

export function formatAppLocaleLabel(locale: AppLocale, label: string): string {
  return formatFlagLabel(appLocaleFlag(locale), label);
}

export function formatQuranReciterGroupLabel(group: QuranReciterGroup, label: string): string {
  return formatFlagLabel(quranReciterGroupFlag(group), label);
}
