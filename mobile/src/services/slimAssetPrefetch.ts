import { Platform } from "react-native";
import * as Network from "expo-network";
import type { BundledJsonName } from "../utils/bundledJsonTypes";

/** Boot prefetch: тек кішкентай JSON, RAM-ға жүктемей disk cache ғана. */
const PREFETCH_JSON: BundledJsonName[] = ["surah-list-api.json"];

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

  const { prefetchBundledJsonToDisk } = await import("../utils/loadBundledJson");
  for (const name of PREFETCH_JSON) {
    try {
      await prefetchBundledJsonToDisk(name);
    } catch {
      /* optional background prefetch */
    }
  }
}
