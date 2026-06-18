import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import type { PrayerNotifSoundId } from "../storage/prefs";

let active: Audio.Sound | null = null;
let activeFadeTimer: ReturnType<typeof setInterval> | null = null;

const FADE_IN_DURATION_MS = 4_000;
const FADE_IN_STEPS = 16;
const FADE_IN_START_VOLUME = 0.55;

const BUNDLED: Record<Exclude<PrayerNotifSoundId, "off">, number> = {
  adhan_haramain: require("../../assets/sounds/prayer_azan_user_01.mp3"),
  adhan_madina_clear: require("../../assets/sounds/prayer_azan_user_02.mp3"),
  adhan_makkah_live: require("../../assets/sounds/prayer_azan_user_03.mp3"),
  adhan_soft_cc0: require("../../assets/sounds/prayer_azan_user_04.mp3"),
  adhan_takbir_high: require("../../assets/sounds/prayer_azan_user_05.mp3"),
};

export function canPreviewPrayerNotifSound(id: PrayerNotifSoundId): boolean {
  return id !== "off";
}

function clearFadeTimer(): void {
  if (!activeFadeTimer) return;
  clearInterval(activeFadeTimer);
  activeFadeTimer = null;
}

export async function stopPreviewPrayerNotifSound(): Promise<void> {
  clearFadeTimer();
  if (!active) return;
  const s = active;
  active = null;
  try {
    await s.stopAsync();
  } catch {
    /* */
  }
  try {
    await s.unloadAsync();
  } catch {
    /* */
  }
}

/** Жинақтағы намаз хабарлама MP3 дыбысын бір рет ойнату (таңдауды өзгертпейді). */
export async function previewPrayerNotifSound(id: PrayerNotifSoundId): Promise<void> {
  if (!canPreviewPrayerNotifSound(id)) return;

  await stopPreviewPrayerNotifSound();

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
    });
  } catch {
    /* */
  }

  const src = BUNDLED[id as Exclude<PrayerNotifSoundId, "off">];
  const { sound } = await Audio.Sound.createAsync(src, {
    shouldPlay: true,
    volume: FADE_IN_START_VOLUME,
  });
  active = sound;
  let step = 0;
  activeFadeTimer = setInterval(() => {
    if (active !== sound) {
      clearFadeTimer();
      return;
    }
    step += 1;
    const progress = Math.min(1, step / FADE_IN_STEPS);
    const nextVolume = FADE_IN_START_VOLUME + (1 - FADE_IN_START_VOLUME) * progress;
    void sound.setVolumeAsync(nextVolume).catch(() => {
      clearFadeTimer();
    });
    if (progress >= 1) clearFadeTimer();
  }, FADE_IN_DURATION_MS / FADE_IN_STEPS);
  sound.setOnPlaybackStatusUpdate((st) => {
    if (st.isLoaded && st.didJustFinish) {
      clearFadeTimer();
      void sound.unloadAsync();
      if (active === sound) active = null;
    }
  });
}
