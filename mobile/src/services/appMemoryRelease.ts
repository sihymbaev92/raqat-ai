/**
 * Қолданба фонға кеткенде немесе экрандардан шыққанда RAM-дағы ауыр кэштерді босату.
 * Құран кэштері жақында mushaf қолданылған болса сақталады (қайта ашуда қатып қалмау).
 */
export async function releaseAppHeavyMemory(): Promise<void> {
  const keepQuranCaches = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mushaf = require("../quran/mushafMemoryRelease") as typeof import("../quran/mushafMemoryRelease");
      return mushaf.mushafWasUsedRecently();
    } catch {
      return false;
    }
  })();
  let locale = "kk";
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const runtime = require("../i18n/runtime") as typeof import("../i18n/runtime");
    locale = runtime.getCurrentLocale();
  } catch {
    locale = "kk";
  }

  const safe = async (label: string, fn: () => void | Promise<void>): Promise<void> => {
    try {
      await fn();
    } catch (e) {
      if (process.env.NODE_ENV === "test") return;
      if (__DEV__) console.warn(`[memoryRelease:${label}]`, e);
    }
  };

  await Promise.allSettled([
    safe("bundledJson", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../utils/loadBundledJson").releaseBundledJsonMemory();
    }),
    safe("quranReader", () => {
      if (keepQuranCaches) return;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../services/bundledQuranReader").releaseBundledQuranReaderMemory({ keepSurahList: true });
    }),
    safe("quranTranslations", () => {
      if (keepQuranCaches) return;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../services/quranOfflineTranslations").releaseBundledQuranTranslationsMemory();
    }),
    safe("quranTajweed", () => {
      if (keepQuranCaches) return;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../services/bundledQuranTajweed").releaseBundledQuranTajweedMemory();
    }),
    safe("hadith", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../storage/hadithCorpus").releaseHadithCorpusMemoryCache();
    }),
    safe("qcf4Fonts", () => {
      if (keepQuranCaches) return;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../quran/qcf4FontLoader").clearQcf4FontLoaderCache();
    }),
    safe("qcf4ColrFonts", () => {
      if (keepQuranCaches) return;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../quran/qcf4ColrFontLoader").clearQcf4ColrFontLoaderCache();
    }),
    safe("qcf4Pages", () => {
      if (keepQuranCaches) return;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../quran/loadQcf4Page").clearQcf4PageCache();
    }),
    safe("tajweedMuftyatImages", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../content/tajweedMuftyatImageCache").releaseTajweedMuftyatImageMemory();
    }),
    safe("mushafPages", () => {
      if (keepQuranCaches) return;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../quran/buildMushafPagesGlobal").clearMushafPagesGlobalCache();
    }),
    safe("mushafAyahMap", () => {
      if (keepQuranCaches) return;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../quran/mushafAyahMap").clearMushafAyahMapCache();
    }),
    safe("kkSearch", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../quran/quranKkSearchIndex").releaseQuranKkSearchIndexMemory();
    }),
    safe("audioSegments", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../services/quranComAudioSegments").clearQuranComAudioSegmentsCache();
    }),
    safe("halalSeed", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../services/halalProductsSeedKz").releaseHalalProductsSeedMemory();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../services/halalAdditivesSeedKz").releaseHalalAdditivesSeedMemory();
    }),
    safe("halalCompanies", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../services/halalCompaniesSnapshot").releaseHalalCompaniesSnapshotMemory();
    }),
    safe("halalDamu", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../api/halalDamuWp").releaseHalalDamuMemoryCache();
    }),
    safe("mosques", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../data/mosques2gisCatalog").releaseMosques2gisCatalogMemory();
    }),
    safe("greatWords", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../content/greatWordsCatalog").releaseGreatWordsCatalogMemory();
    }),
    safe("i18n", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const i18n = require("../services/offlineAutoTranslations") as typeof import("../services/offlineAutoTranslations");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const runtime = require("../i18n/runtime") as typeof import("../i18n/runtime");
      const liveLocale = runtime.getCurrentLocale();
      if (liveLocale === "kk") {
        i18n.releaseOfflineAutoTranslationsMemory();
      } else {
        i18n.seedApkOfflineTranslationsSync();
        i18n.pruneOfflineAutoTranslationsToLocale(
          liveLocale as import("../services/offlineAutoTranslations").OfflineAutoTranslateTarget
        );
      }
    }),
    safe("i18nTree", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const runtime = require("../i18n/runtime") as typeof import("../i18n/runtime");
      runtime.invalidateOfflineLocaleTreeCache();
      if (runtime.getCurrentLocale() !== "kk") {
        runtime.reapplyCurrentLocale();
      }
    }),
  ]);
}
