import AsyncStorage from "@react-native-async-storage/async-storage";
import { pickBestDriver, universalNotifyDriver } from "./drivers";
import { createTasbihBleAdapter, type BleAdapterDevice } from "./bleAdapter";
import { parseCounterNotifyPayload } from "./parseCounterPayload";
import type {
  TasbihBleDeviceSummary,
  TasbihDeviceConnectionState,
  TasbihDeviceCounterEvent,
} from "./types";
import { TASBIH_DEVICE_PREFS_KEY } from "./types";

type Listener = (event: TasbihDeviceCounterEvent) => void;
type StateListener = (state: TasbihDeviceConnectionState, device: TasbihBleDeviceSummary | null) => void;

export class TasbihBleHub {
  private adapter = createTasbihBleAdapter();
  private state: TasbihDeviceConnectionState = this.adapter.isSupported() ? "idle" : "unsupported";
  private device: TasbihBleDeviceSummary | null = null;
  private counterListeners = new Set<Listener>();
  private stateListeners = new Set<StateListener>();
  private seen = new Map<string, TasbihBleDeviceSummary>();

  isSupported(): boolean {
    return this.adapter.isSupported();
  }

  getState(): TasbihDeviceConnectionState {
    return this.state;
  }

  getDevice(): TasbihBleDeviceSummary | null {
    return this.device;
  }

  getDiscoveredDevices(): TasbihBleDeviceSummary[] {
    return [...this.seen.values()].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999));
  }

  onCounter(listener: Listener): () => void {
    this.counterListeners.add(listener);
    return () => this.counterListeners.delete(listener);
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private setState(next: TasbihDeviceConnectionState, dev: TasbihBleDeviceSummary | null = this.device) {
    this.state = next;
    this.device = dev;
    for (const l of this.stateListeners) l(next, dev);
  }

  private emitCounter(event: TasbihDeviceCounterEvent) {
    for (const l of this.counterListeners) l(event);
  }

  async startScan(): Promise<void> {
    if (!this.adapter.isSupported()) {
      this.setState("unsupported", null);
      return;
    }
    this.seen.clear();
    this.setState("scanning", null);
    await this.adapter.startScan((raw: BleAdapterDevice) => {
      const driver = pickBestDriver(raw);
      const summary: TasbihBleDeviceSummary = {
        id: raw.id,
        name: raw.name?.trim() || "BLE тәспі",
        rssi: raw.rssi,
        driverHint: driver.labelKk,
      };
      this.seen.set(raw.id, summary);
      for (const l of this.stateListeners) l(this.state, this.device);
    });
  }

  stopScan(): void {
    this.adapter.stopScan();
    if (this.state === "scanning") this.setState("idle", null);
  }

  async connect(deviceId: string): Promise<void> {
    const summary = this.seen.get(deviceId);
    if (!summary) throw new Error("device-not-found");
    this.setState("connecting", summary);
    try {
      await this.adapter.connect(deviceId);
      const raw = { name: summary.name, serviceUuids: null as string[] | null };
      const driver = pickBestDriver(raw);

      const emitFromPayload = (driverId: string, bytes: Uint8Array) => {
        const parsed = parseCounterNotifyPayload(bytes);
        if (!parsed) return;
        this.emitCounter({
          ...parsed,
          source: "ble",
          deviceId,
          driverId,
        });
      };

      if (driver.id === universalNotifyDriver.id) {
        const chars = await this.adapter.discoverNotifiableCharacteristics();
        for (const { serviceUuid, characteristicUuid } of chars) {
          await this.adapter.monitorCharacteristic(serviceUuid, characteristicUuid, (bytes) =>
            emitFromPayload(universalNotifyDriver.id, bytes)
          );
        }
      } else {
        await driver.subscribe({
          deviceId,
          monitorCharacteristic: async (serviceUuid, characteristicUuid, onPayload) => {
            await this.adapter.monitorCharacteristic(serviceUuid, characteristicUuid, (bytes) =>
              onPayload(bytes)
            );
          },
          emitCounter: (partial) => {
            this.emitCounter({
              ...partial,
              source: "ble",
              deviceId,
            });
          },
        });
      }

      await AsyncStorage.setItem(TASBIH_DEVICE_PREFS_KEY, JSON.stringify({ id: deviceId, name: summary.name }));
      this.setState("connected", summary);
    } catch {
      this.setState("error", summary);
      throw new Error("connect-failed");
    }
  }

  async disconnect(): Promise<void> {
    await this.adapter.disconnect();
    await AsyncStorage.removeItem(TASBIH_DEVICE_PREFS_KEY);
    this.setState("idle", null);
  }

  async reconnectSaved(): Promise<boolean> {
    if (!this.adapter.isSupported()) return false;
    try {
      const raw = await AsyncStorage.getItem(TASBIH_DEVICE_PREFS_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw) as { id?: string; name?: string };
      if (!saved.id) return false;
      this.seen.set(saved.id, {
        id: saved.id,
        name: saved.name ?? "BLE тәспі",
        rssi: null,
      });
      await this.connect(saved.id);
      return true;
    } catch {
      return false;
    }
  }
}

let singleton: TasbihBleHub | null = null;

export function getTasbihBleHub(): TasbihBleHub {
  if (!singleton) singleton = new TasbihBleHub();
  return singleton;
}

/** Jest reset */
export function resetTasbihBleHubForTests(): void {
  singleton = null;
}
