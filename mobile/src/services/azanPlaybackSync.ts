import { Platform } from "react-native";
import {
  getNativeAzanPlaybackStatus,
  type AzanPlaybackStatus,
} from "./prayerFullScreenAzan";
import {
  getPreviewAzanDuaPlaybackStatus,
  getPreviewAzanPlaybackStatus,
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
