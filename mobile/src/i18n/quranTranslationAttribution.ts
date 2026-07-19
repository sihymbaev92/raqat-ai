import type { QuranReadingLocale } from "../quran/quranReadingLocale";

/** Құран мағына аудармасының дереккөз жолы (хатым аударма sheet). */
export function quranTranslationAttributionForLocale(locale: QuranReadingLocale | "ar"): string {
  switch (locale) {
    case "kk":
      return "Мағына: Ерлан Алимулы аудармасы";
    case "ru":
      return "Перевод смысла: Эльмир Кулиев";
    case "en":
      return "Meaning: Sahih International";
    case "tr":
      return "Anlam: Diyanet Vakfı";
    case "ky":
      return "Meaning: Hakimov (КМДБ)";
    case "uz":
      return "Meaning: Sodik (QMDB)";
    default:
      return "Meaning: Erlan Alimuly (Kazakh translation)";
  }
}
