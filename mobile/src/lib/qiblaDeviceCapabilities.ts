import { Platform } from "react-native";
import { CameraView } from "expo-camera";
import { Magnetometer } from "expo-sensors";

/** AR камера режимі қолжетімділігі. */
export type QiblaArAvailability = "supported" | "web" | "no_hardware";

/** Алдыңғы камера AR — барлық телефonda жоқ; web — бөлек тексеру. */
export async function probeQiblaArAvailability(): Promise<QiblaArAvailability> {
  if (Platform.OS === "web") {
    try {
      const ok = await CameraView.isAvailableAsync();
      return ok ? "supported" : "no_hardware";
    } catch {
      return "no_hardware";
    }
  }
  if (Platform.OS === "android" || Platform.OS === "ios") {
    return "supported";
  }
  return "no_hardware";
}

/** Компас/магнитометр бар ма (web — DeviceOrientation). */
export async function probeQiblaCompassAvailable(): Promise<boolean> {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" && typeof window.DeviceOrientationEvent !== "undefined";
  }
  try {
    return await Magnetometer.isAvailableAsync();
  } catch {
    return true;
  }
}

export function isTasbihBlePlatformSupported(): boolean {
  return Platform.OS === "android" || Platform.OS === "ios";
}

export function mapTasbihBleError(code: string | null | undefined): "permission" | "connect" | null {
  if (!code) return null;
  if (code === "bluetooth-permission-denied") return "permission";
  if (code === "scan-failed" || code === "connect-failed") return "connect";
  return "connect";
}
