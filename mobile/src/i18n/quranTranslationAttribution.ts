import type { AppLocale } from "./runtime";

/** Құран мағына аудармасының дереккөз жолы (хатым аударма sheet). */
export function quranTranslationAttributionForLocale(locale: AppLocale): string {
  switch (locale) {
    case "kk":
      return "Мағына: Ерлан Алимулы аудармасы";
    case "ru":
      return "Перевод смысла: Эльмир Кулиев";
    case "en":
      return "Meaning: Sahih International";
    case "ky":
      return "Meaning: Hakimov (КМДБ)";
    case "uz":
      return "Meaning: Sodik (QMDB)";
    default:
      return "Meaning: Erlan Alimuly (Kazakh translation)";
  }
}
