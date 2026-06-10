import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  scheduleQuranLastReadSave,
  saveQuranLastReadNow,
} from "../storage/quranLastRead";
import type { MushafBookPageSlice } from "./mushafBookTypes";

function firstAyahOnPage(pages: MushafBookPageSlice[], pageIndex: number): { surah: number; ayah: number } | null {
  const first = pages[pageIndex]?.ayahs[0];
  if (!first || first.surahNumber < 1 || first.numberInSurah < 1) return null;
  return { surah: first.surahNumber, ayah: first.numberInSurah };
}

/** Мұсаф кітап: бет өзгергенде соңғы оқу нүктесін сақтайды (дебаунс + blur flush). */
export function useMushafBookLastReadPersistence(
  pages: MushafBookPageSlice[],
  pageIndex: number
): void {
  const anchorRef = useRef<{ surah: number; ayah: number } | null>(null);
  const throttledAtRef = useRef(0);

  const syncAnchor = useCallback(
    (ix: number) => {
      const a = firstAyahOnPage(pages, ix);
      if (a) anchorRef.current = a;
      return a;
    },
    [pages]
  );

  useEffect(() => {
    const a = syncAnchor(pageIndex);
    if (!a) return;
    const now = Date.now();
    if (now - throttledAtRef.current <= 700) return;
    throttledAtRef.current = now;
    scheduleQuranLastReadSave(a.surah, a.ayah);
  }, [pageIndex, syncAnchor]);

  useFocusEffect(
    useCallback(() => {
      syncAnchor(pageIndex);
      return () => {
        const a = anchorRef.current;
        if (a) void saveQuranLastReadNow(a.surah, a.ayah);
      };
    }, [pageIndex, syncAnchor])
  );
}
