import type { ComponentRef } from "react";
import type { ScrollView } from "react-native";
import type { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import type { FlashListRef } from "@shopify/flash-list";
import type { MushafContinuousArabicHandle } from "../components/quran/MushafContinuousArabicBlock";
import type { CachedAyah } from "../storage/quranSurahCache";
import { findMushafPageIndexForAyah, type MushafSurahPageSlice } from "./buildMushafPagesForSurah";

export type QuranSurahAyahScrollTargets = {
  mushafPageMode: boolean;
  mushafScrollMode: boolean;
  mushafPages: MushafSurahPageSlice[];
  mushafPageWidth: number;
  horizontalListRef: React.RefObject<
    ComponentRef<typeof GestureHandlerFlatList<MushafSurahPageSlice>> | null
  >;
  mushafScrollRef: React.RefObject<ScrollView | null>;
  mushafContinuousRef: React.RefObject<MushafContinuousArabicHandle | null>;
  listRef: React.RefObject<FlashListRef<CachedAyah> | null>;
  ayahScrollTops: Record<number, number>;
  fallbackMushafScrollY?: (ayahInSurah: number) => number | undefined;
};

export type ScrollQuranSurahToAyahOpts = QuranSurahAyahScrollTargets & {
  targetAyah: number;
  ayahs: CachedAyah[];
  animated?: boolean;
  viewOffset?: number;
};

/** QuranSurah: аятқа скролл (мұсаф scroll/stack, pager, FlashList). */
export function scrollQuranSurahToAyah(opts: ScrollQuranSurahToAyahOpts): void {
  const {
    targetAyah,
    ayahs,
    mushafPageMode,
    mushafScrollMode,
    mushafPages,
    mushafPageWidth,
    horizontalListRef,
    mushafScrollRef,
    mushafContinuousRef,
    listRef,
    ayahScrollTops,
    fallbackMushafScrollY,
  } = opts;
  const viewOffset = opts.viewOffset ?? 88;
  const animated = opts.animated !== false;
  const idx = ayahs.findIndex((a) => a.numberInSurah === targetAyah);
  if (idx < 0) return;

  if (mushafPageMode && mushafPages.length) {
    const pageIdx = findMushafPageIndexForAyah(mushafPages, targetAyah);
    try {
      horizontalListRef.current?.scrollToIndex({ index: pageIdx, animated });
    } catch {
      horizontalListRef.current?.scrollToOffset({
        offset: Math.max(0, pageIdx * mushafPageWidth),
        animated,
      });
    }
    return;
  }

  if (mushafScrollMode) {
    const scrollEl = mushafScrollRef.current;
    const measuredY = ayahScrollTops[targetAyah];
    if (scrollEl && measuredY != null && Number.isFinite(measuredY)) {
      scrollEl.scrollTo({ y: Math.max(0, measuredY - viewOffset), animated });
      return;
    }
    mushafContinuousRef.current?.scrollToAyah(targetAyah, { animated, viewOffset });
    if (scrollEl) {
      const fb = fallbackMushafScrollY?.(targetAyah);
      if (fb != null && Number.isFinite(fb)) {
        scrollEl.scrollTo({ y: Math.max(0, fb - viewOffset * 0.25), animated });
      }
    }
    return;
  }

  listRef.current?.scrollToIndex({ index: idx, viewPosition: 0.12 });
}

export const QURAN_SURAH_AYAH_SCROLL_RETRY_MS = [0, 180, 520, 900, 1500, 2400, 3200] as const;

export function scheduleScrollQuranSurahToAyah(
  opts: ScrollQuranSurahToAyahOpts,
  delaysMs: readonly number[] = QURAN_SURAH_AYAH_SCROLL_RETRY_MS
): () => void {
  const timers = delaysMs.map((ms) => setTimeout(() => scrollQuranSurahToAyah(opts), ms));
  return () => timers.forEach(clearTimeout);
}
