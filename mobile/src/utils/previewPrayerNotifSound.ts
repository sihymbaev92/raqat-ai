import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import type { PrayerNotifSoundId } from "../storage/prefs";

let active: Audio.Sound | null = null;
let activeDua: Audio.Sound | null = null;
let activeFadeTimer: ReturnType<typeof setInterval> | null = null;

const FADE_IN_DURATION_MS = 4_000;
const FADE_IN_STEPS = 16;
const FADE_IN_START_VOLUME = 0.55;

const BUNDLED_AZAN = require("../../assets/sounds/prayer_azan_user_01.mp3");
const BUNDLED_AZAN_DUA = require("../../assets/sounds/prayer_azan_dua_01.mp3");

export type AzanPlaybackStatus = {
  positionMs: number;
  durationMs: number;
  isPlaying: boolean;
  completed?: boolean;
  fullyFinished?: boolean;
};

let duaFullyFinished = false;

export function consumeAzanDuaFullyFinished(): boolean {
  if (!duaFullyFinished) return false;
  duaFullyFinished = false;
  return true;
}

export function peekAzanDuaFullyFinished(): boolean {
  return duaFullyFinished;
}

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
  duaFullyFinished = false;
  if (activeDua) {
    const dua = activeDua;
    activeDua = null;
    try {
      await dua.stopAsync();
    } catch {
      /* */
    }
    try {
      await dua.unloadAsync();
    } catch {
      /* */
    }
  }
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

export async function getPreviewAzanPlaybackStatus(): Promise<AzanPlaybackStatus | null> {
  const sound = active;
  if (!sound) return null;
  try {
    const st = await sound.getStatusAsync();
    if (!st.isLoaded) return null;
    return {
      positionMs: Math.max(0, Math.trunc(st.positionMillis ?? 0)),
      durationMs: Math.max(0, Math.trunc(st.durationMillis ?? 0)),
      isPlaying: st.isPlaying === true,
    };
  } catch {
    return null;
  }
}

export async function getPreviewAzanDuaPlaybackStatus(): Promise<AzanPlaybackStatus | null> {
  const sound = activeDua;
  if (!sound) return null;
  try {
    const st = await sound.getStatusAsync();
    if (!st.isLoaded) return null;
    return {
      positionMs: Math.max(0, Math.trunc(st.positionMillis ?? 0)),
      durationMs: Math.max(0, Math.trunc(st.durationMillis ?? 0)),
      isPlaying: st.isPlaying === true,
    };
  } catch {
    return null;
  }
}

export async function playAzanDuaAudio(): Promise<void> {
  if (activeDua) return;
  duaFullyFinished = false;
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
  const { sound } = await Audio.Sound.createAsync(BUNDLED_AZAN_DUA, {
    shouldPlay: true,
    volume: 1,
  });
  activeDua = sound;
  sound.setOnPlaybackStatusUpdate((st) => {
    if (st.isLoaded && st.didJustFinish) {
      duaFullyFinished = true;
      void sound.unloadAsync();
      if (activeDua === sound) activeDua = null;
    }
  });
}

/** Жинақтағы жалғыз azan MP3 дыбысын бір рет ойнату. */
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

  const { sound } = await Audio.Sound.createAsync(BUNDLED_AZAN, {
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
