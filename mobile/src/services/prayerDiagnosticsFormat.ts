import { Platform } from "react-native";
import { kk } from "../i18n/kk";

export type PermissionDisplayStatus = "granted" | "blocked" | "not_required" | "unknown";

export function exactAlarmRequiredOnPlatform(): boolean {
  return Platform.OS === "android" && Number(Platform.Version) >= 31;
}

export function fullScreenIntentRequiredOnPlatform(): boolean {
  return Platform.OS === "android" && Number(Platform.Version) >= 34;
}

export function formatExactAlarmPermissionStatus(value: boolean | null | undefined): PermissionDisplayStatus {
  if (!exactAlarmRequiredOnPlatform()) return "not_required";
  if (value === true) return "granted";
  if (value === false) return "blocked";
  return "unknown";
}

export function formatFullScreenIntentPermissionStatus(value: boolean | null | undefined): PermissionDisplayStatus {
  if (!fullScreenIntentRequiredOnPlatform()) return "not_required";
  if (value === true) return "granted";
  if (value === false) return "blocked";
  return "unknown";
}

export function permissionStatusLabel(status: PermissionDisplayStatus): string {
  switch (status) {
    case "granted":
      return kk.settings.prayerDiagPermissionGranted;
    case "blocked":
      return kk.settings.prayerDiagPermissionBlocked;
    case "not_required":
      return kk.settings.prayerDiagPermissionNotRequired;
    default:
      return kk.settings.prayerDiagPermissionUnknown;
  }
}

export function isExactAlarmRelatedError(lastError: string | null | undefined): boolean {
  if (!lastError) return false;
  return /exact alarm|SCHEDULE_EXACT_ALARM|USE_EXACT_ALARM|Alarms & reminders/i.test(lastError);
}

export function isFullScreenIntentRelatedError(lastError: string | null | undefined): boolean {
  if (!lastError) return false;
  return /full[- ]screen intent|full_screen_intent/i.test(lastError);
}
