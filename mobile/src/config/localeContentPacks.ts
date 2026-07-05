import type { ContentPackId } from "./contentPackManifest";
import type { AppLocale } from "../i18n/runtime";

/**
 * Орнату/onboarding тіл таңдауында автомат жүктелетін pack-тер.
 * Хатым Arabic (uthmani + surah list) әрқашан APK-та.
 * Тәжуид, барлық тіл аудармалары, аудио/қаріп — клиент Settings-тен өзі.
 */
export function localeContentPackIds(locale: AppLocale): ContentPackId[] {
  switch (locale) {
    case "kk":
      return ["quran-kk", "quran-translit"];
    case "ar":
      return ["i18n-offline", "quran-translit"];
    default:
      return ["i18n-offline", "quran-translations", "quran-translit"];
  }
}
