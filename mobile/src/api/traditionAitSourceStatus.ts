import type { TraditionAitSourceSnapshot } from "./traditionAitSources";

/** UI үшін қысқа мәртебе жолы */
export function traditionAitSourceStatusLine(
  src: TraditionAitSourceSnapshot,
  labels: {
    ok: (n: number) => string;
    notConfigured: string;
    network: string;
    empty: string;
    error: string;
  }
): string {
  if (src.error === "not_configured") return labels.notConfigured;
  if (!src.ok) {
    if (src.error === "network") return labels.network;
    return labels.error;
  }
  if (src.snippets.length === 0) {
    if (src.error === "no_snippets") return labels.empty;
    return labels.empty;
  }
  return labels.ok(src.snippets.length);
}
