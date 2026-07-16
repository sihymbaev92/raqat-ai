/**
 * Хатым/Мұсхаф экранынан шыққанда RAM-дағы ауыр кэштерді босату.
 * Debounce кейін шақырылады — тез қайта ашуда thrash болмасын.
 */

/** Соңғы mushaf қолдану уақыты — appMemoryRelease Құран кэшін тез тазаламасын. */
let lastMushafTouchAt = 0;

export function touchMushafAccess(): void {
  lastMushafTouchAt = Date.now();
}

export function mushafWasUsedRecently(withinMs = 8 * 60_000): boolean {
  return Date.now() - lastMushafTouchAt < withinMs;
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
  ]);
}
