import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { tajweedLetterAudioSource } from "../content/tajweedLetterAudio";

let active: Audio.Sound | null = null;
let activeResolve: (() => void) | null = null;

async function ensureAudioMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
    shouldDuckAndroid: true,
    playThroughEarpieceAndroid: false,
    interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
    interruptionModeIOS: InterruptionModeIOS.DuckOthers,
  });
}

export async function stopTajweedLetterAudio(): Promise<void> {
  const s = active;
  const resolve = activeResolve;
  active = null;
  activeResolve = null;
  resolve?.();
  if (!s) return;
  try {
    await s.stopAsync();
  } catch {
    /* already stopped */
  }
  try {
    await s.unloadAsync();
  } catch {
    /* ignore */
  }
}

/**
 * Bundled әріп атауы (arabic-online.ru harfNameSound) — тек атау.
 * @returns true — ойналды; false — модуль жоқ / қате (TTS fallback керек).
 */
export async function playTajweedLetterAudio(ar: string): Promise<boolean> {
  const source = tajweedLetterAudioSource(ar);
  if (source == null) return false;

  await stopTajweedLetterAudio();
  await ensureAudioMode();

  try {
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: 1,
      /** Сәл баяу — махраж анығырақ естіледі */
      rate: 0.92,
      shouldCorrectPitch: true,
    });
    active = sound;
    await new Promise<void>((resolve, reject) => {
      activeResolve = resolve;
      sound.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded) return;
        if (st.didJustFinish) {
          if (activeResolve === resolve) activeResolve = null;
          resolve();
          return;
        }
        if ("error" in st && st.error) {
          if (activeResolve === resolve) activeResolve = null;
          reject(new Error(String(st.error)));
        }
      });
    });
    if (active === sound) {
      active = null;
      try {
        await sound.unloadAsync();
      } catch {
        /* ignore */
      }
    }
    return true;
  } catch {
    await stopTajweedLetterAudio();
    return false;
  }
}
