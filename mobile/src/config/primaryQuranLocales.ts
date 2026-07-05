import type { AppLocale } from "../i18n/runtime";
import type { QuranTranslationField, QuranTranslationLocale } from "../services/quranTranslationEditions";

/** Негізгі 5 тіл: kk — bundled/platform, қалғаны — offline bundle + API edition. */
export const PRIMARY_QURAN_APP_LOCALES = ["kk", "ru", "en", "ky", "uz"] as const satisfies readonly AppLocale[];

export type PrimaryQuranAppLocale = (typeof PRIMARY_QURAN_APP_LOCALES)[number];

/** Құран мағына мәтіні bundled/API арқылы жүктелетін тілдер (kk емес). */
export const PRIMARY_QURAN_TRANSLATION_LOCALES = ["ru", "en", "ky", "uz"] as const satisfies readonly QuranTranslationLocale[];

export type PrimaryQuranTranslationLocale = (typeof PRIMARY_QURAN_TRANSLATION_LOCALES)[number];

export const QURAN_TRANSLATION_EDITION_BY_LOCALE: Record<PrimaryQuranTranslationLocale, string> = {
  ru: "ru.kuliev",
  en: "en.sahih",
  ky: "quranenc:kyrgyz_hakimov",
  uz: "uz.sodik",
};

export const QURAN_TRANSLATION_FIELD_BY_LOCALE: Record<PrimaryQuranTranslationLocale, QuranTranslationField> = {
  ru: "textRu",
  en: "textEn",
  ky: "textKy",
  uz: "textUz",
};

export function isPrimaryQuranAppLocale(locale: string): locale is PrimaryQuranAppLocale {
  return (PRIMARY_QURAN_APP_LOCALES as readonly string[]).includes(locale);
}

export function isPrimaryQuranTranslationLocale(locale: string): locale is PrimaryQuranTranslationLocale {
  return (PRIMARY_QURAN_TRANSLATION_LOCALES as readonly string[]).includes(locale);
}
