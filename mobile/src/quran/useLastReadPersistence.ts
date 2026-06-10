import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  getQuranLastReadEnabled,
  loadQuranLastReadState,
  scheduleQuranLastReadSave,
  saveQuranLastReadNow,
} from "../storage/quranLastRead";

export type UseLastReadPersistenceOpts = {
  surahNumber: number;
  initialAyahParam?: number;
  footerAnchorAyahRef: React.MutableRefObject<number>;
};

export type UseLastReadPersistenceResult = {
  /** undefined — күтуде; null — скролл жоқ; number — аятқа скролл */
  scrollTargetAyah: number | null | undefined;
  setScrollTargetAyah: React.Dispatch<React.SetStateAction<number | null | undefined>>;
  resumeHighlightAyah: number | null;
  setResumeHighlightAyah: React.Dispatch<React.SetStateAction<number | null>>;
  scheduleLastReadSave: (ayahInSurah: number) => void;
  /** Mushaf scroll/pager — 700 ms throttle */
  scheduleLastReadSaveThrottled: (ayahInSurah: number) => void;
};

/** Соңғы оқу нүктесі: жүктеу, дебаунс сақтау, blur flush — QuranSurahScreen hook split. */
export function useLastReadPersistence(opts: UseLastReadPersistenceOpts): UseLastReadPersistenceResult {
  const { surahNumber, initialAyahParam, footerAnchorAyahRef } = opts;
  const [scrollTargetAyah, setScrollTargetAyah] = useState<number | null | undefined>(undefined);
  const [resumeHighlightAyah, setResumeHighlightAyah] = useState<number | null>(null);
  const throttledSaveAtRef = useRef(0);

  useEffect(() => {
    setScrollTargetAyah(undefined);
    let alive = true;
    void (async () => {
      if (initialAyahParam != null) {
        if (alive) setScrollTargetAyah(initialAyahParam);
        return;
      }
      const enabled = await getQuranLastReadEnabled();
      if (!alive) return;
      if (!enabled) {
        setScrollTargetAyah(null);
        return;
      }
      const st = await loadQuranLastReadState();
      if (!alive) return;
      const key = String(surahNumber);
      const fromMap = st.bySurah[key];
      let ayah: number | null = typeof fromMap === "number" ? fromMap : null;
      if (ayah == null && st.global?.surah === surahNumber) ayah = st.global.ayah;
      if (alive) setScrollTargetAyah(ayah != null && ayah > 0 ? ayah : null);
    })();
    return () => {
      alive = false;
    };
  }, [surahNumber, initialAyahParam]);

  useEffect(() => {
    if (resumeHighlightAyah == null) return;
    const t = setTimeout(() => setResumeHighlightAyah(null), 4200);
    return () => clearTimeout(t);
  }, [resumeHighlightAyah]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        void saveQuranLastReadNow(surahNumber, footerAnchorAyahRef.current);
      };
    }, [surahNumber, footerAnchorAyahRef])
  );

  const scheduleLastReadSave = useCallback(
    (ayahInSurah: number) => {
      scheduleQuranLastReadSave(surahNumber, ayahInSurah);
    },
    [surahNumber]
  );

  const scheduleLastReadSaveThrottled = useCallback(
    (ayahInSurah: number) => {
      const now = Date.now();
      if (now - throttledSaveAtRef.current <= 700) return;
      throttledSaveAtRef.current = now;
      scheduleQuranLastReadSave(surahNumber, ayahInSurah);
    },
    [surahNumber]
  );

  return {
    scrollTargetAyah,
    setScrollTargetAyah,
    resumeHighlightAyah,
    setResumeHighlightAyah,
    scheduleLastReadSave,
    scheduleLastReadSaveThrottled,
  };
}
