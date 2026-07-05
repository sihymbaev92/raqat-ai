import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, type Characteristic, type Device } from "react-native-ble-plx";
import type { TasbihBleAdapter } from "./bleAdapter";

function decodeBase64Value(value: string | null | undefined): Uint8Array {
  if (!value) return new Uint8Array(0);
  const atobFn = (globalThis as { atob?: (s: string) => string }).atob;
  if (!atobFn) return new Uint8Array(0);
  const bin = atobFn(value);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function ensureAndroidBlePermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  if (Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      granted["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED &&
      granted["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  const loc = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return loc === PermissionsAndroid.RESULTS.GRANTED;
}

export function createNativeTasbihBleAdapter(): TasbihBleAdapter {
  const manager = new BleManager();
  let scanning = false;
  let connected: Device | null = null;
  const subscriptions: Array<{ remove: () => void }> = [];

  return {
    isSupported: () => Platform.OS === "android" || Platform.OS === "ios",
    async startScan(onDevice) {
      const ok = await ensureAndroidBlePermissions();
      if (!ok) throw new Error("bluetooth-permission-denied");
      if (scanning) return;
      scanning = true;
      manager.startDeviceScan(null, { allowDuplicates: false }, (err, device) => {
        if (err || !device) return;
        onDevice({
          id: device.id,
          name: device.name ?? device.localName ?? "",
          rssi: device.rssi,
          serviceUuids: device.serviceUUIDs,
        });
      });
    },
    stopScan() {
      if (!scanning) return;
      scanning = false;
      manager.stopDeviceScan();
    },
    async connect(deviceId) {
      this.stopScan();
      for (const sub of subscriptions) sub.remove();
      subscriptions.length = 0;
      if (connected) {
        try {
          await connected.cancelConnection();
        } catch {
          /* ignore */
        }
        connected = null;
      }
      const device = await manager.connectToDevice(deviceId, { timeout: 12000 });
      connected = await device.discoverAllServicesAndCharacteristics();
    },
    async disconnect() {
      for (const sub of subscriptions) sub.remove();
      subscriptions.length = 0;
      if (connected) {
        try {
          await connected.cancelConnection();
        } catch {
          /* ignore */
        }
        connected = null;
      }
    },
    async discoverNotifiableCharacteristics() {
      if (!connected) return [];
      const services = await connected.services();
      const out: Array<{ serviceUuid: string; characteristicUuid: string }> = [];
      for (const service of services) {
        const chars: Characteristic[] = await service.characteristics();
        for (const ch of chars) {
          if (ch.isNotifiable || ch.isIndicatable) {
            out.push({
              serviceUuid: service.uuid.toLowerCase(),
              characteristicUuid: ch.uuid.toLowerCase(),
            });
          }
        }
      }
      return out;
    },
    async monitorCharacteristic(serviceUuid, characteristicUuid, onPayload) {
      if (!connected) return;
      const sub = connected.monitorCharacteristicForService(
        serviceUuid,
        characteristicUuid,
        (err, ch) => {
          if (err || !ch?.value) return;
          onPayload(decodeBase64Value(ch.value));
        }
      );
      subscriptions.push(sub);
    },
    connectedDeviceId() {
      return connected?.id ?? null;
    },
  };
}
