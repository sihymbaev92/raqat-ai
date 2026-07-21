import { surahEnglishName } from "../data/surahEnglishName";

/** Қазақша сүре атаулары (114). API латын атамасын көрсетпеу үшін. */
export const SURAH_TITLES_KK: readonly string[] = [
  "Әл-Фатиха",
  "Әл-Бақара",
  "Әли Имран",
  "Ән-Ниса",
  "Әл-Мәида",
  "Әл-Әнғам",
  "Әл-Ағраф",
  "Әл-Әнфал",
  "Әт-Тәубә",
  "Юнус",
  "Һуд",
  "Юсуф",
  "Әр-Рағыд",
  "Ибраһим",
  "Әл-Хижр",
  "Ән-Нахл",
  "Әл-Исра",
  "Әл-Кәһф",
  "Мәриям",
  "Таһа",
  "Әл-Әнбия",
  "Әл-Хаж",
  "Әл-Мүминун",
  "Ән-Нур",
  "Әл-Фурқан",
  "Әш-Шұғара",
  "Ән-Нәміл",
  "Әл-Қасас",
  "Әл-Анкабут",
  "Әр-Рум",
  "Лұқман",
  "Әс-Сәжде",
  "Әл-Ахзаб",
  "Сәбә",
  "Фатыр",
  "Ясин",
  "Әс-Саффат",
  "Сад",
  "Әз-Зүмәр",
  "Ғафыр",
  "Фуссиләт",
  "Әш-Шура",
  "Әз-Зухруф",
  "Әд-Духан",
  "Әл-Жәсия",
  "Әл-Әхқаф",
  "Мұхаммед",
  "Әл-Фатх",
  "Әл-Хужурат",
  "Қаф",
  "Әз-Зарият",
  "Әт-Тур",
  "Ән-Нәжм",
  "Әл-Қамар",
  "Әр-Рахман",
  "Әл-Уақиға",
  "Әл-Һадид",
  "Әл-Мүжадала",
  "Әл-Хашр",
  "Әл-Мүмтәхина",
  "Әс-Саф",
  "Әл-Жұма",
  "Әл-Мұнафиқун",
  "Әт-Тағабун",
  "Әт-Талақ",
  "Әт-Тахрим",
  "Әл-Мүлік",
  "Әл-Қалам",
  "Әл-Һаққа",
  "Әл-Мағаридж",
  "Нұх",
  "Әл-Жын",
  "Әл-Мүзәммил",
  "Әл-Мүддәссир",
  "Әл-Қиямет",
  "Әл-Инсан",
  "Әл-Мурсалат",
  "Ән-Нәба",
  "Ән-Назиғат",
  "Ғабаса",
  "Әт-Тәкуир",
  "Әл-Инфитар",
  "Әл-Мутаффифин",
  "Әл-Иншиқақ",
  "Әл-Буруж",
  "Әт-Тариқ",
  "Әл-Ағла",
  "Әл-Ғашия",
  "Әл-Фәжр",
  "Әл-Балад",
  "Әш-Шәмс",
  "Әл-Ләйл",
  "Әд-Духа",
  "Әш-Шарх",
  "Әт-Тин",
  "Әл-Алақ",
  "Әл-Қадір",
  "Әл-Бәйина",
  "Әз-Зилзәлә",
  "Әл-Ғадият",
  "Әл-Қариға",
  "Әт-Тәкәсур",
  "Әл-Ғасыр",
  "Әл-Хумаза",
  "Әл-Фил",
  "Қурайш",
  "Әл-Мәғун",
  "Әл-Кәусар",
  "Әл-Кафирун",
  "Ән-Насыр",
  "Әл-Мәсәд",
  "Әл-Ықылас",
  "Әл-Фалақ",
  "Ән-Нас",
];

const CYR = /[а-яёәіңғүұқөһА-ЯЁӘІҢҒҮҰҚӨҺ]/;

/** «Сүре 12» сияқты уақытша плейсхолдер — толық қазақша атауға ауыстырамыз. */
function isSurahPlaceholderKk(s: string): boolean {
  return /^Сүре\s*\d+$/u.test((s || "").trim());
}

/** Тізімде көрсетілетін сүре атауы: латын/бос → SURAH_TITLES_KK; платформадан келген кирилл атауды сақтаймыз. */
export function surahDisplayTitle(surahNumber: number, englishName: string): string {
  const t = (englishName || "").trim();
  const i = surahNumber - 1;
  const kk = i >= 0 && i < SURAH_TITLES_KK.length ? SURAH_TITLES_KK[i] : null;

  if (isSurahPlaceholderKk(t) && kk) return kk;
  if (t && CYR.test(t) && !isSurahPlaceholderKk(t)) return t;
  if (kk) return kk;
  return `Сүре ${surahNumber}`;
}

/**
 * Ағымдағы UI тіліне сәйкес сүре атауы.
 * en — English name; ar — арабша (берілсе); басқа — қазақша атауды tr() арқылы.
 */
export function surahTitleForLocale(
  surahNumber: number,
  locale: string,
  opts?: {
    englishName?: string;
    arabicName?: string;
    tr?: (text: string) => string;
  }
): string {
  if (locale === "en") {
    const en = (opts?.englishName || "").trim() || surahEnglishName(surahNumber);
    if (en) return en;
  }
  if (locale === "ar") {
    const ar = (opts?.arabicName || "").trim();
    if (ar) return ar;
  }
  const kkTitle = surahDisplayTitle(surahNumber, opts?.englishName ?? "");
  if (opts?.tr) return opts.tr(kkTitle);
  if (locale !== "kk") {
    const en = (opts?.englishName || "").trim() || surahEnglishName(surahNumber);
    return en || `${surahNumber}`;
  }
  return kkTitle;
}
