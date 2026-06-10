import { useCallback, useEffect, useRef, useState } from "react";
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import { surahAyahToGlobalOneBased } from "../data/quranAyahCounts";
import { resetQuranKaraokePlayback, setQuranKaraokePlayback } from "../context/quranKaraokeSync";
import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import { fetchQuranComAyahAudioSegments } from "../services/quranComAudioSegments";
import {
  quranAyahMp3Url,
  quranReciterHasAudioForGlobalAyah,
  quranReciterUsesAyahAudio,
} from "../services/quranSudaisAudio";
import { displayCachedAyahArabic, type CachedAyah } from "../storage/quranSurahCache";
import {
  type AyahWordTimestampSegment,
  karaokeWordIndexFromPlaybackMs,
  karaokeWordIndexMonotonicForward,
  splitAyahArabicWords,
} from "../utils/quranAyahAudioKaraoke";

export type AyahAudioPlan = { mode: "single" | "repeat" | "juz"; queue: number[] };

export type UseAyahPlaybackOpts = {
  surahNumber: number;
  reciterEdition: string;
  arabicScriptEdition: QuranArabicScriptEditionId;
  ayahsRef: React.MutableRefObject<CachedAyah[]>;
  onAudioError?: () => void;
};

export type UseAyahPlaybackResult = {
  playingAyahInSurah: number | null;
  ayahAudioIsPlaying: boolean;
  loadingAyahAudio: number | null;
  playAyahSudais: (
    ayahInSurah: number,
    opts?: { plan?: AyahAudioPlan; forceRestart?: boolean }
  ) => Promise<void>;
  stopAyahAudio: () => Promise<void>;
};

/** Қари ойнату / пауза / repeat / juz queue — QuranSurahScreen hook split (freeze P0). */
export function useAyahPlayback(opts: UseAyahPlaybackOpts): UseAyahPlaybackResult {
  const { surahNumber, reciterEdition, arabicScriptEdition, ayahsRef, onAudioError } = opts;

  const [playingAyahInSurah, setPlayingAyahInSurah] = useState<number | null>(null);
  const [ayahAudioIsPlaying, setAyahAudioIsPlaying] = useState(false);
  const [loadingAyahAudio, setLoadingAyahAudio] = useState<number | null>(null);

  const quranSoundRef = useRef<Audio.Sound | null>(null);
  const ayahPlayStartInFlightRef = useRef(false);
  const ayahAudioProgressRef = useRef({ pos: 0, dur: 0 });
  const karaokeWordCountRef = useRef(0);
  const karaokePlainTextRef = useRef("");
  const karaokeSegmentsRef = useRef<readonly AyahWordTimestampSegment[] | null>(null);
  const karaokeSegmentRefDurRef = useRef(0);
  const lastKaraokeWordIdxRef = useRef(-1);
  const lastAyahAudioPositionMsRef = useRef(0);
  const lastAyahAudioPlayingRef = useRef(false);
  const lastAyahAudioDurationRef = useRef(0);
  const ayahAudioPlanRef = useRef<AyahAudioPlan>({ mode: "single", queue: [] });
  const playingAyahInSurahRef = useRef<number | null>(null);
  const playAyahSudaisRef = useRef<
    ((ayahInSurah: number, o?: { plan?: AyahAudioPlan; forceRestart?: boolean }) => Promise<void>) | null
  >(null);

  useEffect(() => {
    playingAyahInSurahRef.current = playingAyahInSurah;
  }, [playingAyahInSurah]);

  const flushAyahAudioProgressFromRef = useCallback(() => {
    const { pos, dur } = ayahAudioProgressRef.current;
    if (dur > 0) {
      lastAyahAudioDurationRef.current = dur;
    }
    const plain = karaokePlainTextRef.current;
    const n = karaokeWordCountRef.current;
    if (n > 0 && dur > 0) {
      let idx = karaokeWordIndexFromPlaybackMs(
        pos,
        dur,
        plain,
        karaokeSegmentsRef.current,
        karaokeSegmentRefDurRef.current
      );
      idx = karaokeWordIndexMonotonicForward(
        idx,
        lastKaraokeWordIdxRef.current,
        pos,
        lastAyahAudioPositionMsRef.current
      );
      lastAyahAudioPositionMsRef.current = pos;
      lastKaraokeWordIdxRef.current = idx;
      setQuranKaraokePlayback(idx, dur);
    }
  }, []);

  const stopAyahAudio = useCallback(async () => {
    ayahAudioProgressRef.current = { pos: 0, dur: 0 };
    karaokeWordCountRef.current = 0;
    karaokePlainTextRef.current = "";
    karaokeSegmentsRef.current = null;
    karaokeSegmentRefDurRef.current = 0;
    lastKaraokeWordIdxRef.current = -1;
    lastAyahAudioPositionMsRef.current = 0;
    lastAyahAudioPlayingRef.current = false;
    lastAyahAudioDurationRef.current = 0;
    resetQuranKaraokePlayback();
    const s = quranSoundRef.current;
    quranSoundRef.current = null;
    setPlayingAyahInSurah(null);
    setAyahAudioIsPlaying(false);
    if (!s) return;
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
  }, []);

  const playAyahSudais = useCallback(
    async (ayahInSurah: number, playOpts?: { plan?: AyahAudioPlan; forceRestart?: boolean }) => {
      const isAyahTimedAudio = quranReciterUsesAyahAudio(reciterEdition);
      if (playOpts?.plan) {
        ayahAudioPlanRef.current = isAyahTimedAudio ? playOpts.plan : { mode: "single", queue: [] };
      } else if (!playOpts?.forceRestart && playingAyahInSurah !== ayahInSurah) {
        ayahAudioPlanRef.current = { mode: "single", queue: [] };
      }

      const existing = quranSoundRef.current;
      if (!playOpts?.forceRestart && playingAyahInSurah === ayahInSurah && existing) {
        try {
          const st = await existing.getStatusAsync();
          if (st.isLoaded) {
            if (st.isPlaying) {
              await existing.pauseAsync();
              setAyahAudioIsPlaying(false);
              try {
                const p = await existing.getStatusAsync();
                if (p.isLoaded) {
                  ayahAudioProgressRef.current = {
                    pos: p.positionMillis ?? 0,
                    dur: p.durationMillis ?? 0,
                  };
                  flushAyahAudioProgressFromRef();
                }
              } catch {
                /* */
              }
              return;
            }
            await existing.playAsync();
            setAyahAudioIsPlaying(true);
            return;
          }
        } catch {
          /* жүктелген дыбыс бұзылған */
        }
        await stopAyahAudio();
      } else {
        await stopAyahAudio();
      }

      if (ayahPlayStartInFlightRef.current) return;
      ayahPlayStartInFlightRef.current = true;
      setLoadingAyahAudio(ayahInSurah);
      try {
        const globalN = surahAyahToGlobalOneBased(surahNumber, ayahInSurah);
        if (!quranReciterHasAudioForGlobalAyah(globalN, reciterEdition)) {
          ayahAudioPlanRef.current = { mode: "single", queue: [] };
          onAudioError?.();
          return;
        }
        const uri = quranAyahMp3Url(globalN, reciterEdition);
        const row = ayahsRef.current.find((a) => a.numberInSurah === ayahInSurah);
        const plainForKaraoke = isAyahTimedAudio && row ? displayCachedAyahArabic(row, arabicScriptEdition) : "";
        karaokePlainTextRef.current = plainForKaraoke;
        karaokeWordCountRef.current = splitAyahArabicWords(plainForKaraoke).length;
        karaokeSegmentsRef.current = null;
        karaokeSegmentRefDurRef.current = 0;
        if (isAyahTimedAudio && plainForKaraoke) {
          const meta = await fetchQuranComAyahAudioSegments(surahNumber, ayahInSurah, reciterEdition);
          if (meta) {
            karaokeSegmentsRef.current = meta.segments;
            karaokeSegmentRefDurRef.current = meta.referenceDurationMs;
          }
        }
        lastKaraokeWordIdxRef.current = -1;
        lastAyahAudioPositionMsRef.current = 0;
        resetQuranKaraokePlayback();
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            allowsRecordingIOS: false,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: true,
            staysActiveInBackground: false,
            playThroughEarpieceAndroid: false,
          });
        } catch {
          /* */
        }
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false, progressUpdateIntervalMillis: 40 }
        );
        quranSoundRef.current = sound;
        setPlayingAyahInSurah(ayahInSurah);
        try {
          await sound.playAsync();
          setAyahAudioIsPlaying(true);
        } catch {
          setAyahAudioIsPlaying(false);
        }
        try {
          const ist = await sound.getStatusAsync();
          if (ist.isLoaded) {
            const p0 = ist.positionMillis ?? 0;
            const d0 = ist.durationMillis ?? 0;
            ayahAudioProgressRef.current = { pos: p0, dur: d0 };
            if (d0 > 0) lastAyahAudioDurationRef.current = d0;
            flushAyahAudioProgressFromRef();
          }
        } catch {
          /* */
        }
        sound.setOnPlaybackStatusUpdate((st) => {
          if (!st.isLoaded) return;
          if (st.didJustFinish) {
            const plan = ayahAudioPlanRef.current;
            const current = playingAyahInSurahRef.current;
            if (plan.mode === "repeat" && current != null) {
              void playAyahSudaisRef.current?.(current, { forceRestart: true });
              return;
            }
            if (plan.mode === "juz" && plan.queue.length > 0) {
              const [next, ...rest] = plan.queue;
              ayahAudioPlanRef.current = { mode: "juz", queue: rest };
              void playAyahSudaisRef.current?.(next, { forceRestart: true });
              return;
            }
            ayahAudioPlanRef.current = { mode: "single", queue: [] };
            void stopAyahAudio();
            return;
          }
          const isPlaying = !!st.isPlaying;
          if (isPlaying !== lastAyahAudioPlayingRef.current) {
            lastAyahAudioPlayingRef.current = isPlaying;
            setAyahAudioIsPlaying(isPlaying);
          }
          const pos = st.positionMillis ?? 0;
          const dur = st.durationMillis ?? 0;
          ayahAudioProgressRef.current = { pos, dur };
          if (dur > 0) lastAyahAudioDurationRef.current = dur;
          if (!isPlaying) {
            flushAyahAudioProgressFromRef();
            return;
          }
          const plain = karaokePlainTextRef.current;
          const n = karaokeWordCountRef.current;
          if (n <= 0 || dur <= 0) return;
          let idx = karaokeWordIndexFromPlaybackMs(
            pos,
            dur,
            plain,
            karaokeSegmentsRef.current,
            karaokeSegmentRefDurRef.current
          );
          idx = karaokeWordIndexMonotonicForward(
            idx,
            lastKaraokeWordIdxRef.current,
            pos,
            lastAyahAudioPositionMsRef.current
          );
          lastAyahAudioPositionMsRef.current = pos;
          if (idx !== lastKaraokeWordIdxRef.current) {
            lastKaraokeWordIdxRef.current = idx;
            setQuranKaraokePlayback(idx, dur);
          }
        });
      } catch {
        onAudioError?.();
      } finally {
        setLoadingAyahAudio(null);
        ayahPlayStartInFlightRef.current = false;
      }
    },
    [
      playingAyahInSurah,
      stopAyahAudio,
      surahNumber,
      reciterEdition,
      arabicScriptEdition,
      ayahsRef,
      flushAyahAudioProgressFromRef,
      onAudioError,
    ]
  );

  playAyahSudaisRef.current = playAyahSudais;

  return {
    playingAyahInSurah,
    ayahAudioIsPlaying,
    loadingAyahAudio,
    playAyahSudais,
    stopAyahAudio,
  };
}
