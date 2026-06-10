import { kk } from "../i18n/kk";
import { formatAiApiError } from "./formatAiApiError";

/** Сервер «жауап» қайтарды, бірақ ішінде нақты түсіндіру жоқ (Gemini өшік / ескі API). */
export function isHollowAiServerReply(text: string): boolean {
  const t = (text || "").trim().toLowerCase();
  if (!t) return true;
  if (t.includes("бос емес") && t.includes("минут")) return true;
  if (t.includes("ai сервері") && (t.includes("бос") || t.includes("кейін"))) return true;
  if (t.includes("сервер ai") && t.includes("жауап бермеді")) return true;
  if (t.includes("gemini") && (t.includes("кілті") || t.includes("api_key") || t.includes("квота"))) {
    return true;
  }
  if (t.includes("raqat_islamic_kb_enabled") || t.includes("gemini_api_key")) return true;
  if (t.includes("ai уақытша жауап бере алмады")) return true;
  if (t.includes("сыртқы іздеу") && t.includes("қолжетімсіз")) return true;
  if (
    (t.includes("табылмады") || t.includes("берілмеді") || t.includes("бере алмады")) &&
    (t.includes("қолжетімсіз") || t.includes("дерекқор"))
  ) {
    return true;
  }
  const hollowKk = kk.aiChat.hollowServerReply.trim().toLowerCase();
  if (hollowKk.length > 24 && t.includes(hollowKk.slice(0, 24))) return true;
  return false;
}

/** Қате/уақытша жауап — дереккөздерді көрсетпейміз. */
export function isAiUserFacingErrorText(text: string): boolean {
  const t = (text || "").trim();
  if (!t) return true;
  if (isHollowAiServerReply(t)) return true;
  if (t === kk.aiChat.errorGeminiBusy.trim()) return true;
  return false;
}

/** Пайдаланушыға: әкімшілік VPS нұсқауы емес, қысқа қайта сұрау мәтіні. */
export function explainHollowAiServerReply(): string {
  return kk.aiChat.errorGeminiBusy;
}

/** Сервер ok:true болса да уақытша қате мәтін қайтаруы мүмкін (ескі кэш). */
export function normalizeAiServerReplyText(
  text: string,
  res?: { ok?: boolean; error?: string; detail?: unknown }
): string {
  const t = (text || "").trim();
  if (!t) return "";
  if (res?.ok === false || res?.error === "gemini_busy") return "";
  if (isHollowAiServerReply(t)) return explainHollowAiServerReply();
  return t;
}

/** AI жауабы бос болғанда (немесе fetch қатесі) пайдаланушыға түсінікті мәтін. */
export function explainEmptyAiResponse(
  res: {
    ok?: boolean;
    text?: string;
    error?: string;
    detail?: unknown;
    status?: number;
  },
  opts: { mode: "quick" | "full" }
): string {
  const errLine = (res.error ?? "").trim();
  if (errLine) return errLine;

  const st = res.status;
  if (st === 429) return kk.aiChat.errorRateLimit;
  if (st === 503) return kk.aiChat.errorServer;
  if (res.detail === "parse_error") return kk.aiChat.errorParse;

  const d = res.detail;
  const detailStr =
    typeof d === "string"
      ? d
      : d && typeof d === "object" && "message" in d
        ? String((d as { message?: unknown }).message ?? "")
        : "";
  const low = `${detailStr}`.toLowerCase();
  if (low.includes("aborterror") || low.includes("signal is aborted") || low.includes("aborted")) {
    return kk.aiChat.errorTimeout;
  }
  if (st && st >= 400) {
    return formatAiApiError(st, res);
  }
  if (detailStr && !st) {
    return kk.aiChat.errorNetwork;
  }
  return opts.mode === "full" ? kk.aiChat.detailUnavailable : kk.aiChat.fallbackNoAnswer;
}
