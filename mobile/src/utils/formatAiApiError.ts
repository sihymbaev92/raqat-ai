import { kk } from "../i18n/kk";

function stringLooksLikeNetworkFailure(s: string): "timeout" | "network" | null {
  const t = s.toLowerCase();
  if (
    t.includes("aborted") ||
    t.includes("abort") ||
    t.includes("timeout") ||
    t.startsWith("aborterror")
  ) {
    return "timeout";
  }
  if (
    t.includes("network") ||
    t.includes("network request failed") ||
    t.includes("failed to fetch") ||
    t.includes("could not connect") ||
    t.includes("connection") && t.includes("refused")
  ) {
    return "network";
  }
  return null;
}

function messageKkFromDetail(d: unknown): string | null {
  if (d && typeof d === "object" && "message_kk" in d) {
    const m = String((d as { message_kk?: unknown }).message_kk ?? "").trim();
    return m || null;
  }
  return null;
}

/** AI / халал API жауабын пайдаланушыға оқитын мәтінге айналдырады (parse_error т.б.). */
export function formatAiApiError(
  status: number | undefined,
  res: { detail?: unknown; error?: string }
): string {
  if (res.error === "gemini_busy") {
    return messageKkFromDetail(res.detail) ?? kk.aiChat.errorGeminiBusy;
  }
  const d = res.detail;
  if (d === "parse_error") return kk.aiChat.errorParse;
  if (d && typeof d === "object" && "code" in d) {
    const code = String((d as { code?: unknown }).code ?? "");
    if (code === "INVALID_AI_AUTH") return kk.aiChat.errorAuth;
  }
  if (typeof d === "string") {
    const kind = stringLooksLikeNetworkFailure(d);
    if (kind === "timeout") return kk.aiChat.errorTimeout;
    if (kind === "network") return kk.aiChat.errorNetwork;
    return d;
  }
  if (d && typeof d === "object" && "message" in d) {
    return String((d as { message?: string }).message ?? kk.aiChat.error);
  }
  if (Array.isArray(d) && d[0] && typeof d[0] === "object" && "msg" in d[0]) {
    return String((d[0] as { msg?: string }).msg ?? kk.aiChat.error);
  }
  if (status === 401 || status === 403) return kk.aiChat.errorAuth;
  if (status === 429) return kk.aiChat.errorRateLimit;
  if (status === 503) return kk.aiChat.errorServer;
  return kk.aiChat.error;
}
