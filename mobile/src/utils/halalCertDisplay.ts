import type { ThemeColors } from "../theme/colors";

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
    ["active", "valid", "approved", "certified"].some((x) => s.includes(x)) ||
    s.includes("белсенді")
  ) {
    return "ok";
  }
  if (
    ["expired", "revoked", "cancelled", "suspended", "rejected", "inactive"].some((x) =>
      s.includes(x)
    ) ||
    s.includes("мерзімі өткен") ||
    (s.includes("өткен") && s.includes("мерзім"))
  ) {
    return "bad";
  }
  if (
    ["draft", "pending", "review"].some((x) => s.includes(x)) ||
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
  if (low === "active") return "Белсенді сертификат";
  if (low === "expired") return "Мерзімі өткен";
  if (low === "draft") return "Жоба / күтуде";
  if (low === "reference") return "Анықтама ғана";
  return s;
}
