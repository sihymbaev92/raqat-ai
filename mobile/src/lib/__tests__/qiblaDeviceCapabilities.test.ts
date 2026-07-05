import { Platform } from "react-native";
import {
  isTasbihBlePlatformSupported,
  mapTasbihBleError,
  probeQiblaArAvailability,
  probeQiblaCompassAvailable,
} from "../qiblaDeviceCapabilities";

jest.mock("expo-camera", () => ({
  CameraView: {
    isAvailableAsync: jest.fn(async () => true),
  },
}));

jest.mock("expo-sensors", () => ({
  Magnetometer: {
    isAvailableAsync: jest.fn(async () => true),
  },
}));

describe("qiblaDeviceCapabilities", () => {
  const origOs = Platform.OS;

  afterEach(() => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: origOs });
  });

  it("detects web AR when camera API reports hardware", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
    await expect(probeQiblaArAvailability()).resolves.toBe("supported");
  });

  it("treats native mobile as AR-capable by default", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    await expect(probeQiblaArAvailability()).resolves.toBe("supported");
  });

  it("checks magnetometer on native", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    await expect(probeQiblaCompassAvailable()).resolves.toBe(true);
  });

  it("maps BLE error codes", () => {
    expect(mapTasbihBleError("bluetooth-permission-denied")).toBe("permission");
    expect(mapTasbihBleError("connect-failed")).toBe("connect");
    expect(mapTasbihBleError(null)).toBe(null);
  });

  it("flags BLE only on android/ios", () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    expect(isTasbihBlePlatformSupported()).toBe(true);
    Object.defineProperty(Platform, "OS", { configurable: true, value: "web" });
    expect(isTasbihBlePlatformSupported()).toBe(false);
  });
});
