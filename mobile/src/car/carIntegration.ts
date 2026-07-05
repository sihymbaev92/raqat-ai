/**
 * Android Auto / CarPlay — толық RAHAT OMIR hub (12+ модуль).
 * Car UI: намaz, Құran, хадис, зікір, әсма, құбыла, халal + телефon handoff.
 */
import { Platform } from "react-native";

export type CarIntegrationStatus = {
  platform: "android" | "ios" | "web";
  nativeCarHub: boolean;
  modules: string[];
  docPath: string;
};

export const CAR_HUB_MODULES = [
  "prayer",
  "quran",
  "hadith",
  "duas",
  "tasbih",
  "asma",
  "qibla",
  "halal",
  "namaz",
  "tajweed",
  "seerah",
  "tradition",
  "hajj",
  "ai",
] as const;

export function getCarIntegrationStatus(): CarIntegrationStatus {
  return {
    platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web",
    nativeCarHub: Platform.OS === "android" || Platform.OS === "ios",
    modules: [...CAR_HUB_MODULES],
    docPath: "docs/mobile/CAR_QURAN_ANDROID_AUTO_CARPLAY.md",
  };
}

export function initCarQuranIntegration(): void {
  if (Platform.OS === "web") return;
}
