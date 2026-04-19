import { kk } from "../i18n/kk";

/** AI / халал API жауабын пайдаланушыға оқитын мәтінге айналдырады (parse_error т.б.). */
export function formatAiApiError(status: number | undefined, res: { detail?: unknown }): string {
  const d = res.detail;
  if (d === "parse_error") return kk.aiChat.errorParse;
  if (typeof d === "string") return d;
  if (d && typeof d === "object" && "message" in d) {
    return String((d as { message?: string }).message ?? kk.aiChat.error);
  }
  if (Array.isArray(d) && d[0] && typeof d[0] === "object" && "msg" in d[0]) {
    return String((d[0] as { msg?: string }).msg ?? kk.aiChat.error);
  }
  if (status === 401 || status === 403) return kk.aiChat.errorAuth;
  if (status === 503) return kk.aiChat.errorServer;
  return kk.aiChat.error;
}
