/**
 * HLS master → ең жоғары RESOLUTION variant (абсолют URL).
 * Expo/ExoPlayer ABR көбіне 360p/480p таңдайды — Қағба FHD үшін тікелей бекітеміз.
 */

export type HlsVariantPick = {
  url: string;
  width: number;
  height: number;
  bandwidth: number;
};

function parseMasterVariants(masterText: string, masterUrl: string): HlsVariantPick[] {
  const lines = masterText.trim().split(/\r?\n/);
  const out: HlsVariantPick[] = [];
  for (let i = 0; i < lines.length; i++) {
    const info = lines[i] ?? "";
    if (!info.includes("EXT-X-STREAM-INF")) continue;
    const res = /RESOLUTION=(\d+)x(\d+)/i.exec(info);
    const bw = /BANDWIDTH=(\d+)/i.exec(info);
    const next = (lines[i + 1] ?? "").trim();
    if (!res || !next || next.startsWith("#")) continue;
    try {
      out.push({
        url: new URL(next, masterUrl).href,
        width: Number(res[1]),
        height: Number(res[2]),
        bandwidth: bw ? Number(bw[1]) : 0,
      });
    } catch {
      /* bad path */
    }
  }
  return out;
}

/** Master playlist-тан ең үлкен кадрды таңдайды; variant жоқ болса master өзін қайтарады. */
export async function resolveHighestQualityHlsUrl(
  masterOrMediaUrl: string,
  timeoutMs = 12_000
): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(masterOrMediaUrl, {
      method: "GET",
      signal: ctrl.signal,
      headers: {
        Accept: "application/vnd.apple.mpegurl,application/x-mpegURL,*/*",
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
      redirect: "follow",
    });
    if (!res.ok) return masterOrMediaUrl;
    const text = await res.text();
    const variants = parseMasterVariants(text, res.url || masterOrMediaUrl);
    if (!variants.length) return res.url || masterOrMediaUrl;
    variants.sort((a, b) => b.width * b.height - a.width * a.height || b.bandwidth - a.bandwidth);
    return variants[0]!.url;
  } catch {
    return masterOrMediaUrl;
  } finally {
    clearTimeout(timer);
  }
}

/** Тест / диагностика. */
export function pickHighestHlsVariantFromMaster(masterText: string, masterUrl: string): HlsVariantPick | null {
  const variants = parseMasterVariants(masterText, masterUrl);
  if (!variants.length) return null;
  variants.sort((a, b) => b.width * b.height - a.width * a.height || b.bandwidth - a.bandwidth);
  return variants[0] ?? null;
}
