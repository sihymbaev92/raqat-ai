import { Platform } from "react-native";
import {
  finishAzanDelivery,
  getNativeAzanPlaybackStatus,
  type AzanPlaybackStatus,
} from "./prayerFullScreenAzan";
import {
  getPreviewAzanDuaPlaybackStatus,
  getPreviewAzanPlaybackStatus,
  stopPreviewPrayerNotifSound,
} from "../utils/previewPrayerNotifSound";

function useNativeAzanPlayback(): boolean {
  return Platform.OS === "android" || Platform.OS === "ios";
}

export async function readAzanPlaybackStatus(
  useNativeAzan: boolean
): Promise<AzanPlaybackStatus | null> {
  if (useNativeAzanPlayback() && useNativeAzan) {
    return getNativeAzanPlaybackStatus();
  }
  return getPreviewAzanPlaybackStatus();
}

export async function readAzanDuaPlaybackStatus(
  useNativeAzan = false
): Promise<AzanPlaybackStatus | null> {
  if (useNativeAzanPlayback() && useNativeAzan) {
    const status = await getNativeAzanPlaybackStatus();
    if (status?.isDua || status?.fullyFinished) return status;
    if (status?.completed && !status.isPlaying) return status;
  }
  return getPreviewAzanDuaPlaybackStatus();
}

/** Тек preview (намaz баптау/уақыт toggle) — scheduled azan delivery-ді өшірмейді. */
export async function stopPreviewAzanPlaybackOnly(): Promise<void> {
  await stopPreviewPrayerNotifSound();
}

/** Preview + scheduled azan — барлық ойнатуды тоқтату. */
export async function stopAllAzanPlayback(): Promise<void> {
  finishAzanDelivery();
  await stopPreviewPrayerNotifSound();
}
