import { useAppLocale } from "./runtime";
import { kk } from "./kk";

/** Тіл ауыскanda компонентті қайта render ettirup, kk.* мәтіндерін жаңартады. */
export function useI18n(): typeof kk {
  useAppLocale();
  return kk;
}
