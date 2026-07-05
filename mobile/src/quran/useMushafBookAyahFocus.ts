import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentRef } from "react";
import type { FlatList as GestureHandlerFlatList } from "react-native-gesture-handler";
import { findMushafBookPageIndexForAyah } from "./buildMushafPagesGlobal";
import { mushafBookPageOffsetForIndex } from "./mushafBookPager";
import type { MushafAyahRef, MushafBookPageSlice } from "./mushafBookTypes";
import { loadHatimResume } from "../storage/hatimProgress";

const FOCUS_HIGHLIGHT_MS = 5200;

export type UseMushafBookAyahFocusOpts = {
  continuousMushaf?: boolean;
  focusSurah?: number;
  focusAyah?: number;
  initialPage?: number;
  pages: MushafBookPageSlice[];
  loading: boolean;
  pagerLayoutWidth: number;
  listRef: React.RefObject<
    ComponentRef<typeof GestureHandlerFlatList<MushafBookPageSlice>> | null
  >;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
};

/** Хатым mushaf: аятқа автофокус (бет + highlight), resume жүктеу. */
export function useMushafBookAyahFocus(opts: UseMushafBookAyahFocusOpts): {
  resumeHighlight: MushafAyahRef | null;
  setResumeHighlight: React.Dispatch<React.SetStateAction<MushafAyahRef | null>>;
  scrollToAyahPage: (ref: MushafAyahRef, animated?: boolean) => void;
  readingTargetAyah: MushafAyahRef | null;
} {
  const {
    continuousMushaf,
    focusSurah,
    focusAyah,
    initialPage,
    pages,
    loading,
    pagerLayoutWidth,
    listRef,
    setPageIndex,
  } = opts;

  const [resumeHighlight, setResumeHighlight] = useState<MushafAyahRef | null>(() =>
    focusSurah != null && focusAyah != null ? { surah: focusSurah, ayah: focusAyah } : null
  );
  const [readingTargetAyah, setReadingTargetAyah] = useState<MushafAyahRef | null>(() =>
    focusSurah != null && focusAyah != null ? { surah: focusSurah, ayah: focusAyah } : null
  );
  const bootFocusRef = useRef(focusSurah != null && focusAyah != null);
  const lastRevealKeyRef = useRef("");

  const scrollToAyahPage = useCallback(
    (ref: MushafAyahRef, animated = true) => {
      if (!pages.length) return;
      const ix = findMushafBookPageIndexForAyah(pages, ref.surah, ref.ayah);
      if (ix < 0) return;
      setPageIndex(ix);
      const run = () => {
        listRef.current?.scrollToOffset({
          offset: mushafBookPageOffsetForIndex(ix, pagerLayoutWidth, pages.length),
          animated,
        });
      };
      requestAnimationFrame(run);
      setTimeout(run, 120);
      setTimeout(run, 420);
      setTimeout(run, 900);
    },
    [listRef, pages, pagerLayoutWidth, setPageIndex]
  );

  const revealAyahFocus = useCallback(
    (ref: MushafAyahRef) => {
      const mark = `${ref.surah}:${ref.ayah}`;
      if (lastRevealKeyRef.current === mark) return;
      lastRevealKeyRef.current = mark;
      setResumeHighlight(ref);
      setReadingTargetAyah(ref);
      scrollToAyahPage(ref, false);
      const t1 = setTimeout(() => scrollToAyahPage(ref, false), 280);
      const t2 = setTimeout(() => scrollToAyahPage(ref, false), 720);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    },
    [scrollToAyahPage]
  );

  useEffect(() => {
    if (!continuousMushaf || bootFocusRef.current || loading || !pages.length) return;
    if (focusSurah != null || focusAyah != null || initialPage != null) {
      bootFocusRef.current = true;
      return;
    }
    bootFocusRef.current = true;
    let alive = true;
    void (async () => {
      const resume = await loadHatimResume();
      if (!alive || !resume) return;
      revealAyahFocus(resume);
    })();
    return () => {
      alive = false;
    };
  }, [
    continuousMushaf,
    focusAyah,
    focusSurah,
    initialPage,
    loading,
    pages.length,
    revealAyahFocus,
  ]);

  useEffect(() => {
    if (focusSurah == null || focusAyah == null || loading || !pages.length) return;
    revealAyahFocus({ surah: focusSurah, ayah: focusAyah });
  }, [focusAyah, focusSurah, loading, pages.length, revealAyahFocus]);

  useEffect(() => {
    if (!resumeHighlight) return;
    const t = setTimeout(() => {
      setResumeHighlight(null);
      setReadingTargetAyah(null);
    }, FOCUS_HIGHLIGHT_MS);
    return () => clearTimeout(t);
  }, [resumeHighlight?.surah, resumeHighlight?.ayah]);

  return {
    resumeHighlight,
    setResumeHighlight,
    scrollToAyahPage,
    readingTargetAyah,
  };
}
