import { useCallback, useEffect, useRef } from "react";
import type { ComponentRef } from "react";
import type { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import { findMushafBookPageIndexForAyah } from "./buildMushafPagesGlobal";
import { mushafBookPageOffsetForIndex } from "./mushafBookPager";
import type { MushafBookPageSlice, MushafAyahRef } from "./mushafBookTypes";

export type UseMushafBookAudioScrollOpts = {
  pages: MushafBookPageSlice[];
  playingRef: MushafAyahRef | null;
  ayahAudioIsPlaying: boolean;
  windowWidth: number;
  listRef: React.RefObject<
    ComponentRef<typeof GestureHandlerFlatList<MushafBookPageSlice>> | null
  >;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
};

/** Мұсаф кітап: ойнату басталғанда аяттың бетіне горизонталь скролл (§26.7.1). */
export function useMushafBookAudioScroll(opts: UseMushafBookAudioScrollOpts): {
  scrollToAyahPage: (ref: MushafAyahRef, animated?: boolean) => void;
} {
  const { pages, playingRef, ayahAudioIsPlaying, windowWidth, listRef, setPageIndex } = opts;
  const lastScrollRef = useRef<string | null>(null);

  const scrollToAyahPage = useCallback(
    (ref: MushafAyahRef, animated = true) => {
      if (!pages.length) return;
      const ix = findMushafBookPageIndexForAyah(pages, ref.surah, ref.ayah);
      if (ix < 0) return;
      setPageIndex(ix);
      const run = () => {
        listRef.current?.scrollToOffset({
          offset: mushafBookPageOffsetForIndex(ix, windowWidth, pages.length),
          animated,
        });
      };
      requestAnimationFrame(run);
      setTimeout(run, 120);
      setTimeout(run, 400);
    },
    [pages, windowWidth, listRef, setPageIndex]
  );

  useEffect(() => {
    if (!ayahAudioIsPlaying || !playingRef || !pages.length) {
      if (!ayahAudioIsPlaying) lastScrollRef.current = null;
      return;
    }
    const mark = `${playingRef.surah}:${playingRef.ayah}`;
    if (lastScrollRef.current === mark) return;
    lastScrollRef.current = mark;
    scrollToAyahPage(playingRef, true);
  }, [ayahAudioIsPlaying, playingRef, pages.length, scrollToAyahPage]);

  return { scrollToAyahPage };
}
