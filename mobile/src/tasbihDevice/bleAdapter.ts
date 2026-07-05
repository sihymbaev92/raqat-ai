import { Platform } from "react-native";
import type { TasbihBleDeviceSummary } from "./types";

export type BleAdapterDevice = {
  id: string;
  name: string;
  rssi: number | null;
  serviceUuids?: string[] | null;
};

export interface TasbihBleAdapter {
  isSupported(): boolean;
  startScan(onDevice: (device: BleAdapterDevice) => void): Promise<void>;
  stopScan(): void;
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  discoverNotifiableCharacteristics(): Promise<Array<{ serviceUuid: string; characteristicUuid: string }>>;
  monitorCharacteristic(
    serviceUuid: string,
    characteristicUuid: string,
    onPayload: (bytes: Uint8Array) => void
  ): Promise<void>;
  connectedDeviceId(): string | null;
}

function toSummary(d: BleAdapterDevice): TasbihBleDeviceSummary {
  return { id: d.id, name: d.name || "BLE", rssi: d.rssi };
}

export { toSummary };

export function createTasbihBleAdapter(): TasbihBleAdapter {
  if (Platform.OS === "web") {
    return require("./bleAdapter.web").createWebTasbihBleAdapter();
  }
  return require("./bleAdapter.native").createNativeTasbihBleAdapter();
}
