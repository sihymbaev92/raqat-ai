import type { TasbihBleDriver } from "../types";
import {
  NORDIC_UART_SERVICE,
  NORDIC_UART_TX,
  RAQAT_TASBIH_COUNT_NOTIFY,
  RAQAT_TASBIH_SERVICE,
  TASBIH_NAME_HINT,
} from "../protocolRaqat";
import { parseCounterNotifyPayload } from "../parseCounterPayload";

function scoreName(name: string): number {
  return TASBIH_NAME_HINT.test(name) ? 40 : 0;
}

function wireNotifyDriver(
  id: string,
  labelKk: string,
  serviceUuid: string,
  characteristicUuid: string,
  extraScore = 0
): TasbihBleDriver {
  const su = serviceUuid.toLowerCase();
  const cu = characteristicUuid.toLowerCase();
  return {
    id,
    labelKk,
    serviceUuids: [su],
    matchDevice: ({ name, serviceUuids }) => {
      let score = scoreName(name) + extraScore;
      if (serviceUuids?.some((u) => u.toLowerCase() === su)) score += 80;
      return score;
    },
    subscribe: async ({ monitorCharacteristic, emitCounter }) => {
      await monitorCharacteristic(su, cu, (bytes) => {
        const parsed = parseCounterNotifyPayload(bytes);
        if (!parsed) return;
        emitCounter({ ...parsed, driverId: id });
      });
    },
  };
}

/** RAQAT-certified OEM profile. */
export const raqatOpenDriver = wireNotifyDriver(
  "raqat-open-v1",
  "RAQAT Open Tасbih",
  RAQAT_TASBIH_SERVICE,
  RAQAT_TASBIH_COUNT_NOTIFY,
  100
);

/** Nordic UART TX — common in generic BLE counter rings. */
export const nordicUartDriver = wireNotifyDriver(
  "nordic-uart-v1",
  "Nordic UART санағыш",
  NORDIC_UART_SERVICE,
  NORDIC_UART_TX,
  30
);

/**
 * Universal fallback: subscribe to every notifiable characteristic and parse
 * payloads heuristically — covers many unnamed OEM firmwares.
 */
export const universalNotifyDriver: TasbihBleDriver = {
  id: "universal-notify-v1",
  labelKk: "Универсалды (авто)",
  matchDevice: ({ name }) => scoreName(name) + 5,
  subscribe: async ({ monitorCharacteristic, emitCounter }) => {
    // Actual service/char list is injected by hub via repeated monitorCharacteristic calls.
    // Hub calls subscribe with pre-bound monitors — see tasbihBleHub.
    void monitorCharacteristic;
    void emitCounter;
  },
};

export const TASBIH_BLE_DRIVERS: TasbihBleDriver[] = [
  raqatOpenDriver,
  nordicUartDriver,
  universalNotifyDriver,
];

export function pickBestDriver(device: {
  name: string;
  serviceUuids?: string[] | null;
}): TasbihBleDriver {
  let best = universalNotifyDriver;
  let bestScore = -1;
  for (const driver of TASBIH_BLE_DRIVERS) {
    if (driver.id === universalNotifyDriver.id) continue;
    const score = driver.matchDevice(device);
    if (score > bestScore) {
      bestScore = score;
      best = driver;
    }
  }
  if (bestScore <= 0) return universalNotifyDriver;
  return best;
}
