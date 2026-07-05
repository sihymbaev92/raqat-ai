/**
 * Қолданба фонға кеткенде немесе экрандардан шыққанда RAM-дағы ауыр кэштерді босату.
 */
export async function releaseAppHeavyMemory(): Promise<void> {
  await Promise.allSettled([
    import("../utils/loadBundledJson").then((m) => m.releaseBundledJsonMemory()),
    import("../services/offlineAutoTranslations").then((m) => m.releaseOfflineAutoTranslationsMemory()),
    import("../services/bundledQuranReader").then((m) =>
      m.releaseBundledQuranReaderMemory({ keepSurahList: true })
    ),
    import("../services/quranOfflineTranslations").then((m) => m.releaseBundledQuranTranslationsMemory()),
    import("../storage/hadithCorpus").then((m) => m.releaseHadithCorpusMemoryCache()),
    import("../quran/qcf4FontLoader").then((m) => m.clearQcf4FontLoaderCache()),
    import("../quran/loadQcf4Page").then((m) => m.clearQcf4PageCache()),
    import("../quran/buildMushafPagesGlobal").then((m) => m.clearMushafPagesGlobalCache()),
    import("../quran/mushafAyahMap").then((m) => m.clearMushafAyahMapCache()),
    import("../services/quranComAudioSegments").then((m) => m.clearQuranComAudioSegmentsCache()),
    import("../services/halalProductsSeedKz").then((m) => m.releaseHalalProductsSeedMemory()),
    import("../api/halalDamuWp").then((m) => m.releaseHalalDamuMemoryCache()),
  ]);
}
