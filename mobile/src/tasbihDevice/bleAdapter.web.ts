import type { TasbihBleAdapter } from "./bleAdapter";

export function createWebTasbihBleAdapter(): TasbihBleAdapter {
  return {
    isSupported: () => false,
    async startScan() {
      /* web: no BLE */
    },
    stopScan() {},
    async connect() {
      throw new Error("BLE unsupported on web");
    },
    async disconnect() {},
    async discoverNotifiableCharacteristics() {
      return [];
    },
    async monitorCharacteristic() {},
    connectedDeviceId: () => null,
  };
}
