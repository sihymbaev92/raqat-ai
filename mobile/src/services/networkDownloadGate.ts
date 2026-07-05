import * as Network from "expo-network";

export type NetworkDownloadGate = { ok: true } | { ok: false; reason: string };

function networkTypeLabel(type: Network.NetworkStateType | undefined): string {
  switch (type) {
    case Network.NetworkStateType.CELLULAR:
      return "mobile";
    case Network.NetworkStateType.WIFI:
      return "wifi";
    case Network.NetworkStateType.ETHERNET:
      return "ethernet";
    case Network.NetworkStateType.NONE:
      return "offline";
    default:
      return "network";
  }
}

/** Wi‑Fi, Ethernet немесе мобильді (3G/4G/5G → CELLULAR) арқылы жүктеуге рұқсат. */
export function isAllowedDownloadNetworkType(
  type: Network.NetworkStateType | undefined,
  allowMobileData: boolean
): boolean {
  if (type === Network.NetworkStateType.WIFI || type === Network.NetworkStateType.ETHERNET) {
    return true;
  }
  if (allowMobileData && type === Network.NetworkStateType.CELLULAR) {
    return true;
  }
  return false;
}

export async function canDownloadOverNetwork(allowMobileData: boolean): Promise<NetworkDownloadGate> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (!state.isConnected || state.type === Network.NetworkStateType.NONE) {
      return { ok: false, reason: "network offline" };
    }
    if (isAllowedDownloadNetworkType(state.type, allowMobileData)) {
      return { ok: true };
    }
    if (!allowMobileData) {
      return {
        ok: false,
        reason: `waiting for Wi‑Fi (on ${networkTypeLabel(state.type)})`,
      };
    }
    return { ok: false, reason: "network unavailable" };
  } catch {
    return allowMobileData ? { ok: true } : { ok: false, reason: "network unavailable" };
  }
}
