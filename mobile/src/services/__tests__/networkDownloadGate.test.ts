import * as Network from "expo-network";
import { isAllowedDownloadNetworkType } from "../networkDownloadGate";

describe("networkDownloadGate", () => {
  it("allows Wi-Fi and Ethernet always", () => {
    expect(isAllowedDownloadNetworkType(Network.NetworkStateType.WIFI, false)).toBe(true);
    expect(isAllowedDownloadNetworkType(Network.NetworkStateType.ETHERNET, false)).toBe(true);
  });

  it("allows 3G/4G/5G (CELLULAR) when mobile data enabled", () => {
    expect(isAllowedDownloadNetworkType(Network.NetworkStateType.CELLULAR, true)).toBe(true);
    expect(isAllowedDownloadNetworkType(Network.NetworkStateType.CELLULAR, false)).toBe(false);
  });
});
