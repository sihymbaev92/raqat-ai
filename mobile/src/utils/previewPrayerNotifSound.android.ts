import type { PrayerNotifSoundId } from "../storage/prefs";
import {
  getNativeAzanPlaybackStatus,
  playNativePrayerAzanAudio,
  stopNativePrayerAzanAudio,
} from "../services/prayerFullScreenAzan";

export function canPreviewPrayerNotifSound(id: PrayerNotifSoundId): boolean {
  return id !== "off";
}

export async function stopPreviewPrayerNotifSound(): Promise<void> {
  stopNativePrayerAzanAudio();
}

export async function getPreviewAzanPlaybackStatus(): Promise<{
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
} | null> {
  return getNativeAzanPlaybackStatus();
}

/** Android-та MP3-ті Metro asset ретінде қайталамай, res/raw ішіндегі native audio-ны қолданамыз. */
export async function previewPrayerNotifSound(id: PrayerNotifSoundId): Promise<void> {
  if (!canPreviewPrayerNotifSound(id)) return;
  stopNativePrayerAzanAudio();
  playNativePrayerAzanAudio(id);
}
