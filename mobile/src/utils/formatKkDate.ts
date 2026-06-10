import { toHijri } from "hijri-converter";
import type { AppLocale } from "../i18n/runtime";

/**
 * Бүгінгі күн (григориан) — kk-KZ немесе қысқа қазақ ай атаулары.
 */
const KK_MONTHS = [
  "қаңтар",
  "ақпан",
  "наурыз",
  "сәуір",
  "мамыр",
  "маусым",
  "шілде",
  "тамыз",
  "қыркүйек",
  "қазан",
  "қараша",
  "желтоқсан",
] as const;

const GREGORIAN_MONTHS: Record<"kk" | "ru" | "en" | "ky", readonly string[]> = {
  kk: KK_MONTHS,
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  ky: [
    "январь",
    "февраль",
    "март",
    "апрель",
    "май",
    "июнь",
    "июль",
    "август",
    "сентябрь",
    "октябрь",
    "ноябрь",
    "декабрь",
  ],
};

function supportedDateLocale(locale?: AppLocale): "kk" | "ru" | "en" | "ky" {
  return locale === "ru" || locale === "en" || locale === "ky" ? locale : "kk";
}

function intlLocale(locale: "kk" | "ru" | "en" | "ky"): string {
  switch (locale) {
    case "ru":
      return "ru-RU";
    case "en":
      return "en-US";
    case "ky":
      return "ky-KG";
    default:
      return "kk-KZ";
  }
}

export function formatKkGregorianDate(d: Date, locale?: AppLocale): string {
  const loc = supportedDateLocale(locale);
  try {
    const s = d.toLocaleDateString(intlLocale(loc), { day: "numeric", month: "long", year: "numeric" });
    if (s && !s.toLowerCase().includes("invalid")) {
      return s;
    }
  } catch {
    /* Hermes / ескі жинақ */
  }
  const day = d.getDate();
  const m = d.getMonth();
  const y = d.getFullYear();
  const month = GREGORIAN_MONTHS[loc][m] ?? "";
  return `${day} ${month} ${y}`;
}

/** Хижра ай атаулары (қысқа) — 1=мухаррам */
const HIJRI_MONTHS_KK = [
  "мухаррам",
  "сафар",
  "рабиʿ I",
  "рабиʿ II",
  "жұмадә I",
  "жұмадә II",
  "раджаб",
  "шаʿбан",
  "рамазан",
  "шәуәл",
  "зул-қаʿда",
  "зул-хижжа",
] as const;

const HIJRI_MONTHS: Record<"kk" | "ru" | "en" | "ky", readonly string[]> = {
  kk: HIJRI_MONTHS_KK,
  ru: [
    "мухаррам",
    "сафар",
    "раби I",
    "раби II",
    "джумада I",
    "джумада II",
    "раджаб",
    "шаабан",
    "рамадан",
    "шавваль",
    "зуль-каада",
    "зуль-хиджа",
  ],
  en: [
    "Muharram",
    "Safar",
    "Rabi I",
    "Rabi II",
    "Jumada I",
    "Jumada II",
    "Rajab",
    "Shaaban",
    "Ramadan",
    "Shawwal",
    "Dhu al-Qadah",
    "Dhu al-Hijjah",
  ],
  ky: [
    "мухаррам",
    "сафар",
    "раби I",
    "раби II",
    "жумада I",
    "жумада II",
    "ражаб",
    "шаабан",
    "рамазан",
    "шавваль",
    "зул-каада",
    "зул-хижжа",
  ],
};

const HIJRI_YEAR_SUFFIX: Record<"kk" | "ru" | "en" | "ky", string> = {
  kk: "х.ж.",
  ru: "г. х.",
  en: "AH",
  ky: "х.ж.",
};

/** Шапка үшін — formatKkHijriUmmAlQura «х.ж.» қосады; мұнда жоқ. */
function formatDashboardGregorian(d: Date, locale?: AppLocale): string {
  const loc = supportedDateLocale(locale);
  const day = d.getDate();
  const m = d.getMonth();
  const y = d.getFullYear();
  return `${day} ${GREGORIAN_MONTHS[loc][m] ?? ""} ${y}`.trim();
}

function formatDashboardHijri(d: Date, locale?: AppLocale): string {
  const loc = supportedDateLocale(locale);
  const h = toHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const month = HIJRI_MONTHS[loc][h.hm - 1] ?? `${h.hm}`;
  return `${h.hd} ${month} ${h.hy}`;
}

/**
 * Үмм әл-Қыра (hijri-converter) + қазақ тілінде ай атауы.
 * «х.ж.» = хижра жылнамасы
 */
export function formatKkHijriUmmAlQura(d: Date, locale?: AppLocale): string {
  const loc = supportedDateLocale(locale);
  const h = toHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const month = HIJRI_MONTHS[loc][h.hm - 1] ?? `${h.hm}`;
  return `${h.hd} ${month} ${h.hy} ${HIJRI_YEAR_SUFFIX[loc]}`;
}

/** Апталық жол үшін: күн + ай (жылсыз). */
export function formatKkHijriDayMonth(d: Date, locale?: AppLocale): string {
  const loc = supportedDateLocale(locale);
  const h = toHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const month = HIJRI_MONTHS[loc][h.hm - 1] ?? `${h.hm}`;
  return `${h.hd} ${month}`;
}

/** Қысқа григориан: «2 мам.» стилі. */
export function formatKkGregorianShort(d: Date, locale?: AppLocale): string {
  const loc = supportedDateLocale(locale);
  try {
    const s = d.toLocaleDateString(intlLocale(loc), { day: "numeric", month: "short" });
    if (s && !s.toLowerCase().includes("invalid")) return s;
  } catch {
    /* Hermes */
  }
  const day = d.getDate();
  const m = d.getMonth();
  return `${day} ${GREGORIAN_MONTHS[loc][m] ?? ""}`;
}

/**
 * Григориан тех. жол: «15 05 2026» — екі таңбалы күн, екі таңбалы ай, жыл.
 * Намаз кестесімен бір локальды күнге сәйкес көрсету үшін.
 */
export function formatGregorianTechYmd(d: Date): string {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${String(day).padStart(2, "0")} ${String(m).padStart(2, "0")} ${y}`;
}

/**
 * Басты бет шапкасы: григориан + хижра (екі жол).
 * Мысалы: «24 мамыр 2026» / «7 зул-хижжа 1447»
 */
export function formatDashboardHeaderDateLines(d: Date, locale?: AppLocale): { gregorian: string; hijri: string } {
  return {
    gregorian: formatDashboardGregorian(d, locale),
    hijri: formatDashboardHijri(d, locale),
  };
}

/** @deprecated formatDashboardHeaderDateLines қолданыңыз */
export function formatDashboardHeaderDateLine(d: Date, locale?: AppLocale): string {
  const { gregorian, hijri } = formatDashboardHeaderDateLines(d, locale);
  return `${gregorian}\n${hijri}`;
}
