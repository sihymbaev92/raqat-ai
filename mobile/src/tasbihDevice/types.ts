export type TasbihDeviceConnectionState =
  | "unsupported"
  | "idle"
  | "scanning"
  | "connecting"
  | "connected"
  | "error";

export type TasbihBleDeviceSummary = {
  id: string;
  name: string;
  rssi: number | null;
  driverHint?: string;
};

export type TasbihDeviceCounterEvent = {
  /** +1 per bead press when increment-only device */
  increment?: number;
  /** Some rings send absolute session count */
  absolute?: number;
  source: "ble" | "simulator";
  deviceId: string;
  driverId: string;
};

export type TasbihBleDriver = {
  id: string;
  labelKk: string;
  /** Scan filter service UUIDs (optional). */
  serviceUuids?: string[];
  /** Name regex for discovery ranking. */
  namePattern?: RegExp;
  matchDevice: (device: { name: string; serviceUuids?: string[] | null }) => number;
  subscribe: (ctx: TasbihBleDriverContext) => Promise<void>;
};

export type TasbihBleDriverContext = {
  deviceId: string;
  monitorCharacteristic: (
    serviceUuid: string,
    characteristicUuid: string,
    onPayload: (bytes: Uint8Array) => void
  ) => Promise<void>;
  emitCounter: (event: Omit<TasbihDeviceCounterEvent, "deviceId" | "source">) => void;
};

export const TASBIH_DEVICE_PREFS_KEY = "raqat_tasbih_ble_device_v1";
