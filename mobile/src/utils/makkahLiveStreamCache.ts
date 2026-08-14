import { MAKKAH_LIVE_HLS_SOURCES } from "../config/makkahLiveYoutube";
import { resolveHighestQualityHlsUrl } from "./makkahLiveHlsResolve";

/** Тікелей chunklist URL қысқа мерзімде жарамсыз болуы мүмкін — жад кэші. */
const TTL_MS = 4 * 60_000;

type Entry = { resolved: string; at: number };

const mem = new Map<string, Entry>();

export function peekMakkahLiveResolved(masterUrl: string): string | null {
  const hit = mem.get(masterUrl);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    mem.delete(masterUrl);
    return null;
  }
  return hit.resolved;
}

export function storeMakkahLiveResolved(masterUrl: string, resolvedUrl: string): void {
  mem.set(masterUrl, { resolved: resolvedUrl, at: Date.now() });
}

/** Қажылық экранында алдын ала шешу — «Қағба онлайн» тез ашылуы үшін. */
export async function prefetchMakkahLivePrimaryStream(): Promise<void> {
  const master = MAKKAH_LIVE_HLS_SOURCES[0];
  if (!master || peekMakkahLiveResolved(master)) return;
  try {
    const resolved = await resolveHighestQualityHlsUrl(master, 8000);
    storeMakkahLiveResolved(master, resolved);
  } catch {
    /* */
  }
}
