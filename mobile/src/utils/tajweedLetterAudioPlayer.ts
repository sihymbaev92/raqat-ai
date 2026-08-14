import { Audio, InterruptionModeAndroid, InterruptionModeIOS, type AVPlaybackSource } from "expo-av";
import { tajweedLetterAudioSource } from "../content/tajweedLetterAudio";
import { playTajweedEveryAyahWordAudio } from "../services/tajweedExampleAyahAudio";
import {
  isEveryAyahTajweedExampleAudio,
  tajweedGuideExampleAudio,
} from "../services/tajweedGuideDataset";

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
 * @returns true — ойналды; false — модуль жоқ / қате (TTS fallback керек).
 */
export async function playTajweedMp3Source(
  source: AVPlaybackSource | undefined,
  opts: { playbackRate?: number } = {}
): Promise<boolean> {
  if (source == null) return false;

  const playbackRate = opts.playbackRate ?? 0.92;

  await stopTajweedLetterAudio();
  await ensureAudioMode();

  try {
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: 1,
      rate: playbackRate,
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

/** EveryAyah / Quran.com — аят ішіндегі сөз уақыт белгісі бойынша ойнату. */
export async function playTajweedMp3Segment(
  source: AVPlaybackSource,
  opts: { startMs: number; endMs: number; playbackRate?: number }
): Promise<boolean> {
  const playbackRate = opts.playbackRate ?? 1;
  const startMs = Math.max(0, Math.floor(opts.startMs));
  const endMs = Math.max(0, Math.floor(opts.endMs));
  const hasEnd = endMs > startMs;

  await stopTajweedLetterAudio();
  await ensureAudioMode();

  try {
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: false,
      volume: 1,
      rate: playbackRate,
      shouldCorrectPitch: true,
      progressUpdateIntervalMillis: 50,
    });
    active = sound;

    if (startMs > 0) {
      await sound.setPositionAsync(startMs);
    }
    await sound.playAsync();

    await new Promise<void>((resolve, reject) => {
      activeResolve = resolve;
      sound.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded) return;
        const pos = st.positionMillis ?? 0;
        if (hasEnd && pos >= endMs - 40) {
          if (activeResolve === resolve) activeResolve = null;
          resolve();
          return;
        }
        if (!hasEnd && st.didJustFinish) {
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
        await sound.stopAsync();
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

/** Bundled әріп атауы (arabic-online.ru harfNameSound). */
export async function playTajweedLetterAudio(ar: string): Promise<boolean> {
  return playTajweedMp3Source(tajweedLetterAudioSource(ar));
}

/** Мысал сөз — JSON: harakat клип → EveryAyah сөз → bundled MP3. */
export async function playTajweedExampleAudio(exampleAr: string): Promise<boolean> {
  const guideAudio = tajweedGuideExampleAudio(exampleAr);

  if (guideAudio && "file" in guideAudio && guideAudio.file) {
    const { tajweedExampleAudioSource } = await import("../content/tajweedExampleAudio");
    const played = await playTajweedMp3Source(tajweedExampleAudioSource(exampleAr), {
      playbackRate: 0.92,
    });
    if (played) return true;
  }

  if (isEveryAyahTajweedExampleAudio(guideAudio)) {
    const ok = await playTajweedEveryAyahWordAudio(guideAudio);
    if (ok) return true;
  }

  const { tajweedExampleAudioSource } = await import("../content/tajweedExampleAudio");
  return playTajweedMp3Source(tajweedExampleAudioSource(exampleAr), { playbackRate: 0.92 });
}
