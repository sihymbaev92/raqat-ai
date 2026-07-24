/**
 * Хатым/Мұсхаф экранынан шыққанда RAM-дағы ауыр кэштерді босату.
 * Ұзақ idle кейін — қысқа навигация thrash болмасын (жылдам қайта ашу).
 */

/** Соңғы mushaf қолдану уақыты — appMemoryRelease Құран кэшін тез тазаламасын. */
let lastMushafTouchAt = 0;
/** Экран фокуста (немесе фонға кетіп те) — оқып отырғанда кэшті сақтау. */
let mushafScreenFocused = false;
let scheduledReleaseTimer: ReturnType<typeof setTimeout> | null = null;
let scheduledOnReleased: (() => void) | null = null;
/** Фокус қайта келгенде ескі release.then(cb) stub беттерді өшірмесін. */
let mushafReleaseGeneration = 0;
/** Іске қосылған release (await) — mid-flight cancel кезінде UI reload керек. */
let releaseInFlightGeneration: number | null = null;
let pendingUiReloadAfterInterruptedRelease = false;

/** Қысқа навигацияда кэш сақталады; ұзақ idle (~45с) кейін босатылады. */
export const MUSHAF_MEMORY_RELEASE_DELAY_MS = 45_000;

export function touchMushafAccess(): void {
  lastMushafTouchAt = Date.now();
  if (releaseInFlightGeneration != null) {
    pendingUiReloadAfterInterruptedRelease = true;
  }
  cancelScheduledMushafMemoryRelease();
}

/** Хатым экраны focus/blur — ұзақ оқу кезінде appMemoryRelease кэшті өшірмесін. */
export function setMushafScreenFocused(focused: boolean): void {
  mushafScreenFocused = focused;
  if (focused) touchMushafAccess();
}

export function isMushafScreenFocused(): boolean {
  return mushafScreenFocused;
}

/** Фокусқа қайту: mid-flight release үзілсе true — loadKey bump керек. */
export function takeMushafNeedsReloadAfterInterruptedRelease(): boolean {
  const v = pendingUiReloadAfterInterruptedRelease;
  pendingUiReloadAfterInterruptedRelease = false;
  return v;
}

/** Фонға кеткенде Құран кэшін ұзақ ұстамау — keep терезесі. Фокуста болса әрқашан keep. */
export function mushafWasUsedRecently(withinMs = 2 * 60_000): boolean {
  if (mushafScreenFocused) return true;
  return lastMushafTouchAt > 0 && Date.now() - lastMushafTouchAt < withinMs;
}

export function cancelScheduledMushafMemoryRelease(): void {
  mushafReleaseGeneration += 1;
  if (scheduledReleaseTimer) {
    clearTimeout(scheduledReleaseTimer);
    scheduledReleaseTimer = null;
  }
  scheduledOnReleased = null;
}

export type ScheduleMushafReleaseOpts = {
  delayMs?: number;
  /** Тек кэш шынымен босатылғанда — React state-ті stub-қа түсіру үшін. */
  onReleased?: () => void;
};

/** Экран blur — ұзақ кідіріспен босату (қайта кіру thrash-ын болдырмау). */
export function scheduleReleaseMushafScreenMemory(
  delayMsOrOpts: number | ScheduleMushafReleaseOpts = MUSHAF_MEMORY_RELEASE_DELAY_MS,
): void {
  const opts: ScheduleMushafReleaseOpts =
    typeof delayMsOrOpts === "number" ? { delayMs: delayMsOrOpts } : delayMsOrOpts;
  const delayMs = opts.delayMs ?? MUSHAF_MEMORY_RELEASE_DELAY_MS;
  cancelScheduledMushafMemoryRelease();
  const generation = mushafReleaseGeneration;
  scheduledOnReleased = opts.onReleased ?? null;
  scheduledReleaseTimer = setTimeout(() => {
    scheduledReleaseTimer = null;
    if (generation !== mushafReleaseGeneration) return;
    const cb = scheduledOnReleased;
    scheduledOnReleased = null;
    releaseInFlightGeneration = generation;
    void releaseMushafScreenMemory()
      .then(() => {
        if (generation !== mushafReleaseGeneration) {
          pendingUiReloadAfterInterruptedRelease = true;
          return;
        }
        try {
          cb?.();
        } catch {
          /* */
        }
      })
      .finally(() => {
        if (releaseInFlightGeneration === generation) {
          releaseInFlightGeneration = null;
        }
      });
  }, delayMs);
}

export async function releaseMushafScreenMemory(): Promise<void> {
  const safe = async (label: string, fn: () => void | Promise<void>): Promise<void> => {
    try {
      await fn();
    } catch (e) {
      if (process.env.NODE_ENV === "test") return;
      if (__DEV__) console.warn(`[mushafMemoryRelease:${label}]`, e);
    }
  };

  await Promise.allSettled([
    safe("mushafPages", async () => {
      const { clearMushafPagesGlobalCache } = await import("./buildMushafPagesGlobal");
      clearMushafPagesGlobalCache();
    }),
    safe("quranReader", async () => {
      const { releaseBundledQuranReaderMemory } = await import("../services/bundledQuranReader");
      releaseBundledQuranReaderMemory({ keepSurahList: true });
    }),
    safe("quranTranslations", async () => {
      const { releaseBundledQuranTranslationsMemory } = await import(
        "../services/quranOfflineTranslations"
      );
      releaseBundledQuranTranslationsMemory();
    }),
    safe("quranTajweed", async () => {
      const { releaseBundledQuranTajweedMemory } = await import("../services/bundledQuranTajweed");
      await releaseBundledQuranTajweedMemory();
    }),
    safe("qcf4Fonts", async () => {
      const { clearQcf4FontLoaderCache } = await import("./qcf4FontLoader");
      clearQcf4FontLoaderCache();
    }),
    safe("qcf4ColrFonts", async () => {
      const { clearQcf4ColrFontLoaderCache } = await import("./qcf4ColrFontLoader");
      clearQcf4ColrFontLoaderCache();
    }),
    safe("qcf4Pages", async () => {
      const { clearQcf4PageCache } = await import("./loadQcf4Page");
      clearQcf4PageCache();
    }),
    safe("mushafAyahMap", async () => {
      const { clearMushafAyahMapCache } = await import("./mushafAyahMap");
      clearMushafAyahMapCache();
    }),
    safe("audioSegments", async () => {
      const { clearQuranComAudioSegmentsCache } = await import("../services/quranComAudioSegments");
      clearQuranComAudioSegmentsCache();
    }),
    safe("hatimPreload", async () => {
      const { resetHatimOfflinePreloadCache } = await import("./hatimBookPolicy");
      resetHatimOfflinePreloadCache();
    }),
  ]);
}
