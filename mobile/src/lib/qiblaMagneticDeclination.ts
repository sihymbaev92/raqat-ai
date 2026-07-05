import { Platform } from "react-native";
import { magneticDeclinationEastDeg } from "./qiblaDeclinationApprox";
import { canUseNativeDeviceHeading } from "./qiblaNativeDeviceHeading";

type PrayerWidgetDeclModule = {
  getMagneticDeclinationEastDeg?: (lat: number, lng: number) => Promise<number>;
};

const PrayerWidget = require("react-native").NativeModules.PrayerWidget as PrayerWidgetDeclModule | undefined;

/** Android: WMM (GeomagneticField); басқа платформалар: IDW approximate. */
export async function resolveMagneticDeclinationEastDeg(lat: number, lng: number): Promise<number> {
  if (Platform.OS === "android" && canUseNativeDeviceHeading()) {
    try {
      const decl = await PrayerWidget?.getMagneticDeclinationEastDeg?.(lat, lng);
      if (typeof decl === "number" && Number.isFinite(decl)) {
        return decl;
      }
    } catch {
      /* approximate fallback */
    }
  }
  return magneticDeclinationEastDeg(lat, lng);
}

export function magneticDeclinationEastDegSync(lat: number, lng: number): number {
  return magneticDeclinationEastDeg(lat, lng);
}
