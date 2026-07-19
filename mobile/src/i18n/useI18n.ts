import { useAppLocale, useLocaleRevision } from "./runtime";
import { kk } from "./kk";

/**
 * Тіл ауысқанда және pack reapply кезінде қайта render.
 * `kk` импортын тікелей қолданатын жерде міндетті осы hook немесе `useAppLocale`+`useLocaleRevision`.
 */
export function useI18n(): typeof kk {
  useAppLocale();
  useLocaleRevision();
  return kk;
}
