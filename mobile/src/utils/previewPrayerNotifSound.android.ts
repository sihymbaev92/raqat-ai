import type { PrayerNotifSoundId } from "../storage/prefs";
import {
  getNativeAzanPlaybackStatus,
  playNativePrayerAzanAudio,
  playNativePrayerAzanDuaAudio,
  stopNativePrayerAzanAudio,
} from "../services/prayerFullScreenAzan";

export function canPreviewPrayerNotifSound(id: PrayerNotifSoundId): boolean {
  return id !== "off";
}

export function peekAzanDuaFullyFinished(): boolean {
  return false;
}

export function consumeAzanDuaFullyFinished(): boolean {
  return false;
}

export async function stopPreviewPrayerNotifSound(): Promise<void> {
  stopNativePrayerAzanAudio();
}

export async function getPreviewAzanPlaybackStatus(): Promise<{
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  completed?: boolean;
  isDua?: boolean;
  fullyFinished?: boolean;
} | null> {
  const status = await getNativeAzanPlaybackStatus();
  if (!status) return null;
  if (status.isDua) return null;
  return status;
}

export async function getPreviewAzanDuaPlaybackStatus(): Promise<{
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  completed?: boolean;
  isDua?: boolean;
  fullyFinished?: boolean;
} | null> {
  const status = await getNativeAzanPlaybackStatus();
  if (!status) return null;
  if (status.fullyFinished) {
    return {
      positionMs: status.positionMs,
      durationMs: status.durationMs,
      isPlaying: false,
      completed: true,
      isDua: false,
      fullyFinished: true,
    };
  }
  if (!status.isDua) return null;
  return status;
}

export async function playAzanDuaAudio(): Promise<void> {
  playNativePrayerAzanDuaAudio();
}

/** Android-та MP3-ті Metro asset ретінде қайталамай, res/raw ішіндегі native audio-ны қолданамыз. */
export async function previewPrayerNotifSound(id: PrayerNotifSoundId): Promise<void> {
  if (!canPreviewPrayerNotifSound(id)) return;
  stopNativePrayerAzanAudio();
  playNativePrayerAzanAudio(id);
}
