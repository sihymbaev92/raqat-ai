import { useAppLocale } from "./runtime";
import { kk } from "./kk";

/**
 * Тіл ауыскanda компонентті қайта render ettirup, `kk` объектісіндегі аударылған мәтіндерді көрсетеді.
 * `kk` импортын тікелей қолданатын компоненттерде міндетті `useAppLocale()` немесе осы hook.
 */
export function useI18n(): typeof kk {
  useAppLocale();
  return kk;
}
