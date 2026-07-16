import { Platform } from "react-native";
import { canDownloadOverNetwork } from "../services/networkDownloadGate";
import { isQcf4FontPackCached } from "../services/quranFontCache";
import { hatimBookUsesBundledTextHafsOffline } from "./hatimBookPolicy";
import { hasAnyQcf4PageInWebIndexedDb } from "./webHatimIndexedDb";

/** QCF4 мұсаф: CDN JSON + 47 TTF кэште болса және желі бар. */
export async function canRenderQcf4MushafOnline(): Promise<boolean> {
  const [net, fonts] = await Promise.all([
    canDownloadOverNetwork(true),
    isQcf4FontPackCached(),
  ]);
  return net.ok && fonts;
}

function isWebOffline(): boolean {
  if (Platform.OS !== "web" || typeof navigator === "undefined") return false;
  return navigator.onLine === false;
}

/**
 * Хатым офлайн: QCF4 қаріптері жоқ/жүктелмесе bundled Unicode (text-hafs).
 * Web: офлайн кезде text-hafs; native: кэш/желі жоқ болса text-hafs.
 */
export async function shouldHatimUseTextHafsOffline(): Promise<boolean> {
  if (hatimBookUsesBundledTextHafsOffline()) return true;
  if (Platform.OS === "web") {
    if (isWebOffline()) {
      const hasIdb = await hasAnyQcf4PageInWebIndexedDb();
      return !hasIdb;
    }
    return false;
  }
  if (await isQcf4FontPackCached()) return false;
  const net = await canDownloadOverNetwork(true);
  return !net.ok;
}
