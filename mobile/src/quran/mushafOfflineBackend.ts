import { canDownloadOverNetwork } from "../services/networkDownloadGate";
import { isQcf4FontPackCached } from "../services/quranFontCache";

/** QCF4 мұсаф: CDN JSON + 47 TTF кэште болса және желі бар. */
export async function canRenderQcf4MushafOnline(): Promise<boolean> {
  const [net, fonts] = await Promise.all([
    canDownloadOverNetwork(true),
    isQcf4FontPackCached(),
  ]);
  return net.ok && fonts;
}
