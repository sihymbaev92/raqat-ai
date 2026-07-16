import { Platform } from "react-native";
import * as Network from "expo-network";
import type { BundledJsonName } from "../utils/bundledJsonTypes";

/** Boot prefetch: кішкентай JSON + great-words (RAM-ға жүктемей disk cache ғана). */
const PREFETCH_JSON: BundledJsonName[] = ["surah-list-api.json", "great-words-catalog.json"];

/** Wi‑Fi: slim APK CDN asset-терін алдын ала FileSystem-ге жазу (RAM-ға толтырмай). */
export async function prefetchSlimBundledAssetsOnWifi(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const net = await Network.getNetworkStateAsync();
    if (!net.isConnected) return;
    const onWifi =
      net.type === Network.NetworkStateType.WIFI ||
      net.type === Network.NetworkStateType.ETHERNET;
    if (!onWifi) return;
  } catch {
    return;
  }

  const { loadBundledJson } = await import("../utils/loadBundledJson");
  for (const name of PREFETCH_JSON) {
    try {
      if (name === "great-words-catalog.json") {
        const { ensureGreatWordsCatalogLoaded } = await import("../content/greatWordsCatalog");
        await ensureGreatWordsCatalogLoaded();
      } else {
        await loadBundledJson(name);
      }
    } catch {
      /* optional background prefetch */
    }
  }
}
