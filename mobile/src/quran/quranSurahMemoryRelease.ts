/**
 * Сүре оқу экранынан шыққанда Құран map-тарын бірден емес —
 * қысқа навигацияда қайта жүктемеу үшін debounce.
 */
import { releaseBundledQuranReaderMemory } from "../services/bundledQuranReader";
import { releaseBundledQuranTranslationsMemory } from "../services/quranOfflineTranslations";

export const QURAN_SURAH_MEMORY_RELEASE_DELAY_MS = 45_000;

let scheduledTimer: ReturnType<typeof setTimeout> | null = null;
let releaseGeneration = 0;

export function cancelScheduledQuranSurahMemoryRelease(): void {
  releaseGeneration += 1;
  if (scheduledTimer) {
    clearTimeout(scheduledTimer);
    scheduledTimer = null;
  }
}

export function scheduleReleaseQuranSurahMemory(
  delayMs = QURAN_SURAH_MEMORY_RELEASE_DELAY_MS,
): void {
  cancelScheduledQuranSurahMemoryRelease();
  const generation = releaseGeneration;
  scheduledTimer = setTimeout(() => {
    scheduledTimer = null;
    if (generation !== releaseGeneration) return;
    try {
      releaseBundledQuranReaderMemory({ keepSurahList: true });
      releaseBundledQuranTranslationsMemory();
      void import("../services/bundledQuranTajweed").then((m) => m.releaseBundledQuranTajweedMemory());
    } catch {
      /* */
    }
  }, delayMs);
}
