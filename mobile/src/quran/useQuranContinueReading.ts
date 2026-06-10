import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  getQuranLastReadEnabled,
  loadQuranLastReadState,
  syncQuranLastReadWithServerBidirectional,
} from "../storage/quranLastRead";
import { loadQuranReadingStreak } from "../storage/quranReadingStreak";

export type QuranContinueReadPoint = { surah: number; ayah: number };

export function useQuranContinueReading(): {
  continueRead: QuranContinueReadPoint | null;
  streakDays: number;
  refresh: () => void;
} {
  const [continueRead, setContinueRead] = useState<QuranContinueReadPoint | null>(null);
  const [streakDays, setStreakDays] = useState(0);

  const refresh = useCallback(() => {
    let alive = true;
    void (async () => {
      await syncQuranLastReadWithServerBidirectional();
      if (!alive) return;
      try {
        const [enabled, st, streak] = await Promise.all([
          getQuranLastReadEnabled(),
          loadQuranLastReadState(),
          loadQuranReadingStreak(),
        ]);
        if (!alive) return;
        setStreakDays(streak.current);
        const g = st.global;
        if (!enabled || !g || g.surah < 1 || g.surah > 114 || g.ayah < 1) {
          setContinueRead(null);
          return;
        }
        setContinueRead({ surah: g.surah, ayah: g.ayah });
      } catch {
        if (alive) {
          setContinueRead(null);
          setStreakDays(0);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useFocusEffect(refresh);

  return { continueRead, streakDays, refresh };
}
