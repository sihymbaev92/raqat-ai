import { useAppLocale } from "./runtime";
import { useKkAutoTranslator } from "../quran/useKkAutoTranslator";

/** Тіл ауыскanda компонентті қайта render ettirup, мәтінді аударады. */
export function useLocalizedText() {
  useAppLocale();
  const { tr } = useKkAutoTranslator();
  return tr;
}
