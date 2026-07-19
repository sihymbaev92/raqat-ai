import { appLocaleFlag, formatFlagLabel } from "../i18n/localeFlags";
import type { QuranReadingLocale } from "./quranReadingLocale";
import { QURAN_READING_LOCALES } from "./quranReadingLocale";

/** Аудармашы / басылым қысқа атауы (таңдау тізімінде). */
export const QURAN_TRANSLATION_TRANSLATOR_NAME: Record<QuranReadingLocale, string> = {
  kk: "Ерлан Алимулы",
  ru: "Эльмир Кулиев",
  en: "Sahih International",
  tr: "Diyanet Vakfı",
  ky: "Шамсуддин Хакимов",
  uz: "Мухаммад Содик",
};

export function quranTranslationTranslatorName(locale: QuranReadingLocale): string {
  return QURAN_TRANSLATION_TRANSLATOR_NAME[locale];
}

/** Мысалы: «🇰🇿 Ерлан Алимулы». */
export function quranTranslationLocaleChoiceLabel(locale: QuranReadingLocale): string {
  return formatFlagLabel(appLocaleFlag(locale), quranTranslationTranslatorName(locale));
}

export function quranTranslationLocaleChoiceOptions(): Array<{
  id: QuranReadingLocale;
  label: string;
}> {
  return QURAN_READING_LOCALES.map((id) => ({
    id,
    label: quranTranslationLocaleChoiceLabel(id),
  }));
}
