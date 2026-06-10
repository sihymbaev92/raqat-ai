import { useEffect, useRef } from "react";
import type { ComponentRef } from "react";
import type { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import type { FlashListRef } from "@shopify/flash-list";
import type { CachedAyah } from "../storage/quranSurahCache";
import type { MushafContinuousArabicHandle } from "../components/quran/MushafContinuousArabicBlock";
import { findMushafPageIndexForAyah, type MushafSurahPageSlice } from "./buildMushafPagesForSurah";

export type UseAyahPlaybackScrollOpts = {
  surahNumber: number;
  ayahs: CachedAyah[];
  playingAyahInSurah: number | null;
  ayahAudioIsPlaying: boolean;
  mushafLayout: boolean;
  mushafPageMode: boolean;
  mushafScrollMode: boolean;
  mushafPages: MushafSurahPageSlice[];
  mushafPageWidth: number;
  listRef: React.RefObject<FlashListRef<CachedAyah> | null>;
  horizontalListRef: React.RefObject<
    ComponentRef<typeof GestureHandlerFlatList<MushafSurahPageSlice>> | null
  >;
  mushafContinuousRef: React.RefObject<MushafContinuousArabicHandle | null>;
};

/** Ойнату басталғанда аятқа скролл — QuranSurahScreen hook split (freeze P0). */
export function useAyahPlaybackScroll(opts: UseAyahPlaybackScrollOpts): void {
  const lastAudioScrollRef = useRef<{ surah: number; ayah: number } | null>(null);

  const {
    surahNumber,
    ayahs,
    playingAyahInSurah,
    ayahAudioIsPlaying,
    mushafLayout,
    mushafPageMode,
    mushafScrollMode,
    mushafPages,
    mushafPageWidth,
    listRef,
    horizontalListRef,
    mushafContinuousRef,
  } = opts;

  useEffect(() => {
    lastAudioScrollRef.current = null;
  }, [surahNumber]);

  useEffect(() => {
    if (!ayahAudioIsPlaying || playingAyahInSurah == null || !ayahs.length) {
      if (!ayahAudioIsPlaying) lastAudioScrollRef.current = null;
      return;
    }
    const prev = lastAudioScrollRef.current;
    if (prev && prev.surah === surahNumber && prev.ayah === playingAyahInSurah) return;
    lastAudioScrollRef.current = { surah: surahNumber, ayah: playingAyahInSurah };
    const idx = ayahs.findIndex((a) => a.numberInSurah === playingAyahInSurah);
    if (idx < 0) return;

    const isHorizontalPager = Boolean(mushafLayout && mushafPageMode && mushafPages.length);
    const pageIdx = isHorizontalPager ? findMushafPageIndexForAyah(mushafPages, playingAyahInSurah) : 0;

    const runScrollToIndex = () => {
      try {
        if (isHorizontalPager) {
          horizontalListRef.current?.scrollToIndex({
            index: pageIdx,
            animated: true,
            viewPosition: 0.45,
          });
        } else if (mushafScrollMode) {
          mushafContinuousRef.current?.scrollToAyah(playingAyahInSurah, {
            animated: true,
            viewOffset: 96,
          });
        } else {
          listRef.current?.scrollToIndex({
            index: idx,
            animated: true,
            viewPosition: 0.35,
          });
        }
      } catch {
        /* scrollToIndex сәтсіз */
      }
    };

    const runScrollToPageOffset = () => {
      if (!isHorizontalPager) return;
      try {
        const off = Math.max(0, pageIdx * mushafPageWidth);
        horizontalListRef.current?.scrollToOffset({ offset: off, animated: true });
      } catch {
        /* scrollToOffset сәтсіз */
      }
    };

    let rafId = 0;
    let t1: ReturnType<typeof setTimeout> | undefined;
    let t2: ReturnType<typeof setTimeout> | undefined;
    let t3: ReturnType<typeof setTimeout> | undefined;

    rafId = requestAnimationFrame(() => {
      runScrollToIndex();
      t1 = setTimeout(runScrollToIndex, 160);
      t2 = setTimeout(runScrollToIndex, 400);
      if (isHorizontalPager) {
        t3 = setTimeout(runScrollToPageOffset, 520);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [
    ayahAudioIsPlaying,
    playingAyahInSurah,
    ayahs,
    surahNumber,
    mushafLayout,
    mushafPageMode,
    mushafScrollMode,
    mushafPages,
    mushafPageWidth,
    listRef,
    horizontalListRef,
    mushafContinuousRef,
  ]);
}
