/**
 * Араб әліпбиі әріп атаулары — қысқа KK жолдар автоаудармада бұзылады,
 * сондықтан UI үшін қолмен берілген атаулар.
 */
import type { AppLocale } from "../i18n/runtime";

/** Қазақша → орысша (таджвид / учебник стиль). */
export const TAJWEED_LETTER_NAME_RU: Record<string, string> = {
  алиф: "алиф",
  бә: "ба",
  тә: "та",
  сә: "са",
  жим: "джим",
  хә: "ха",
  хо: "хо",
  дәл: "даль",
  зәл: "заль",
  ро: "ра",
  зә: "зай",
  син: "син",
  шин: "шин",
  сод: "сад",
  дод: "дад",
  то: "та",
  зо: "за",
  "'айн": "айн",
  ғойн: "гайн",
  фә: "фа",
  қоф: "каф",
  кәф: "кяф",
  ләм: "лям",
  мим: "мим",
  нун: "нун",
  уау: "вав",
  һә: "ха",
  йә: "йа",
};

export const TAJWEED_LETTER_NAME_EN: Record<string, string> = {
  алиф: "alif",
  бә: "ba",
  тә: "ta",
  сә: "tha",
  жим: "jim",
  хә: "ha",
  хо: "kha",
  дәл: "dal",
  зәл: "dhal",
  ро: "ra",
  зә: "zay",
  син: "sin",
  шин: "shin",
  сод: "sad",
  дод: "dad",
  то: "ta",
  зо: "za",
  "'айн": "ayn",
  ғойн: "ghayn",
  фә: "fa",
  қоф: "qaf",
  кәф: "kaf",
  ләм: "lam",
  мим: "mim",
  нун: "nun",
  уау: "waw",
  һә: "ha",
  йә: "ya",
};

export function tajweedLetterDisplayName(
  nameKk: string,
  locale: AppLocale,
  tr: (text: string) => string
): string {
  const key = (nameKk ?? "").trim();
  if (!key || locale === "kk") return nameKk;
  if (locale === "ru" && TAJWEED_LETTER_NAME_RU[key]) return TAJWEED_LETTER_NAME_RU[key]!;
  if (locale === "en" && TAJWEED_LETTER_NAME_EN[key]) return TAJWEED_LETTER_NAME_EN[key]!;
  const translated = tr(key);
  if (translated && translated !== "…") return translated;
  return TAJWEED_LETTER_NAME_RU[key] ?? TAJWEED_LETTER_NAME_EN[key] ?? "…";
}
