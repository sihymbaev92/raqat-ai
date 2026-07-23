import type { ThemeColors } from "../theme/colors";
import { getCurrentLocale } from "../i18n/runtime";
import {
  getOfflineAutoTranslation,
  type OfflineAutoTranslateTarget,
} from "../services/offlineAutoTranslations";

export type HalalCertTone = "ok" | "warn" | "bad" | "neutral";

export type HalalCertBadgePalette = {
  text: string;
  bg: string;
  border: string;
  dot: string;
};

export function halalCertTone(status: string | null | undefined): HalalCertTone {
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return "neutral";
  if (
    ["active", "valid", "approved", "certified", "halal"].some((x) => s.includes(x)) ||
    s.includes("белсенді")
  ) {
    return "ok";
  }
  if (
    ["expired", "revoked", "cancelled", "suspended", "rejected", "inactive", "haram"].some((x) =>
      s.includes(x)
    ) ||
    s.includes("мерзімі өткен") ||
    (s.includes("өткен") && s.includes("мерзім")) ||
    s.includes("харам")
  ) {
    return "bad";
  }
  if (
    ["draft", "pending", "review", "doubtful", "mushkil"].some((x) => s.includes(x)) ||
    s.includes("жоба") ||
    s.includes("күтуде")
  ) {
    return "warn";
  }
  return "neutral";
}

/** halaldamu.kz стилі: жасыл / сары / қызыл жүйелі бейдж түстері. */
export function halalCertBadgeColors(tone: HalalCertTone, isDark: boolean): HalalCertBadgePalette {
  switch (tone) {
    case "ok":
      return isDark
        ? {
            text: "#6ee7b7",
            bg: "rgba(16, 185, 129, 0.18)",
            border: "rgba(52, 211, 153, 0.45)",
            dot: "#34d399",
          }
        : {
            text: "#047857",
            bg: "#ecfdf5",
            border: "#6ee7b7",
            dot: "#10b981",
          };
    case "warn":
      return isDark
        ? {
            text: "#fcd34d",
            bg: "rgba(245, 158, 11, 0.16)",
            border: "rgba(251, 191, 36, 0.4)",
            dot: "#fbbf24",
          }
        : {
            text: "#92400e",
            bg: "#fffbeb",
            border: "#fcd34d",
            dot: "#f59e0b",
          };
    case "bad":
      return isDark
        ? {
            text: "#fca5a5",
            bg: "rgba(239, 68, 68, 0.14)",
            border: "rgba(248, 113, 113, 0.4)",
            dot: "#f87171",
          }
        : {
            text: "#b91c1c",
            bg: "#fef2f2",
            border: "#fecaca",
            dot: "#ef4444",
          };
    default:
      return isDark
        ? {
            text: "#94a3b8",
            bg: "rgba(148, 163, 184, 0.12)",
            border: "rgba(148, 163, 184, 0.28)",
            dot: "#94a3b8",
          }
        : {
            text: "#475569",
            bg: "#f8fafc",
            border: "#e2e8f0",
            dot: "#64748b",
          };
  }
}

export function halalCertColor(tone: HalalCertTone, colors: ThemeColors): string {
  return halalCertBadgeColors(tone, false).text;
}

export function halalCertLabelKk(status: string | null | undefined): string {
  const s = (status ?? "").trim();
  if (!s) return "";
  const low = s.toLowerCase();
  const kkLabel =
    low === "active"
      ? "Белсенді сертификат"
      : low === "expired"
        ? "Мерзімі өткен"
        : low === "draft"
          ? "Жоба / күтуде"
          : low === "reference"
            ? "Анықтама ғана"
            : s;
  const locale = getCurrentLocale();
  if (locale === "kk") return kkLabel;
  if (locale === "ru") {
    if (low === "active") return "Активный сертификат";
    if (low === "expired") return "Срок истёк";
    if (low === "draft") return "Черновик / ожидание";
    if (low === "reference") return "Только справочно";
    return s;
  }
  if (locale === "en" || locale === "tr" || locale === "uz" || locale === "ar") {
    if (low === "active") return locale === "tr" ? "Aktif sertifika" : locale === "uz" ? "Faol sertifikat" : locale === "ar" ? "شهادة سارية" : "Active certificate";
    if (low === "expired") return locale === "tr" ? "Süresi dolmuş" : locale === "uz" ? "Muddati tugagan" : locale === "ar" ? "منتهية" : "Expired";
    if (low === "draft") return locale === "tr" ? "Taslak / bekliyor" : locale === "uz" ? "Qoralama / kutilmoqda" : locale === "ar" ? "مسودة / قيد الانتظار" : "Draft / pending";
    if (low === "reference") return locale === "tr" ? "Yalnızca referans" : locale === "uz" ? "Faqat ma’lumot" : locale === "ar" ? "للمرجع فقط" : "Reference only";
  }
  if (locale === "ky") {
    if (low === "active") return "Активдүү сертификат";
    if (low === "expired") return "Мөөнөтү өткөн";
    if (low === "draft") return "Долбоор / күтүүдө";
    if (low === "reference") return "Маалымат гана";
  }
  const offline = getOfflineAutoTranslation(kkLabel, locale as OfflineAutoTranslateTarget);
  if (offline) return offline;
  /** Never leak Kazakh labels under non-kk. */
  if (low === "active") return "Active certificate";
  if (low === "expired") return "Expired";
  if (low === "draft") return "Draft / pending";
  if (low === "reference") return "Reference only";
  return s;
}
