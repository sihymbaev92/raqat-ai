import { Platform } from "react-native";
import { localeContentPackIds } from "../config/localeContentPacks";
import type { AppLocale } from "../i18n/runtime";
import {
  getCurrentLocale,
  invalidateOfflineLocaleTreeCache,
  reapplyCurrentLocale,
} from "../i18n/runtime";
import {
  areOfflineAutoTranslationsReady,
  ensureOfflineAutoTranslationsCoreLoaded,
  ensureOfflineAutoTranslationsLoaded,
} from "./offlineAutoTranslations";
import { releaseBundledQuranReaderMemory } from "./bundledQuranReader";
import { releaseBundledQuranTranslationsMemory } from "./quranOfflineTranslations";
import { canDownloadOverNetwork } from "./networkDownloadGate";
import {
  downloadContentPack,
  isContentPackReady,
  loadContentPackPrefs,
} from "../storage/contentPackDownloadPrefs";

let localeDownloadInflight: Promise<void> | null = null;
let localeDownloadTarget: AppLocale | null = null;

async function refreshQuranCachesAfterLocalePacks(locale: AppLocale): Promise<void> {
  /** Prefetch жасамау — келесі Quran ашылғанда lazy load (RAM). */
  releaseBundledQuranReaderMemory({ keepSurahList: true });
  if (locale !== "kk" && locale !== "ar") {
    releaseBundledQuranTranslationsMemory();
  }
}

async function refreshUiLocaleAfterI18nPack(locale: AppLocale): Promise<void> {
  if (locale === "kk") return;
  try {
    const offline = await import("./offlineAutoTranslations");
    const target = locale as import("./offlineAutoTranslations").OfflineAutoTranslateTarget;
    offline.seedApkOfflineTranslationsSync();
    await offline.ensureOfflineAutoTranslationsLoaded(target);
    if (!offline.hasOfflineAutoTranslationLocale(target)) return;
    offline.pruneOfflineAutoTranslationsToLocale(target);
    invalidateOfflineLocaleTreeCache(locale);
    if (getCurrentLocale() === locale) {
      reapplyCurrentLocale();
    }
    const coreMerged = await offline.ensureOfflineAutoTranslationsCoreLoaded(target).catch(() => false);
    if (coreMerged && getCurrentLocale() === locale) {
      invalidateOfflineLocaleTreeCache(locale);
      reapplyCurrentLocale();
    }
  } catch {
    /* LOCALE_PATCHES fallback */
  }
}

/**
 * UI сөздігін жүктеу (тіл ауыстыру / hydrate).
 * Мобильді дерекпен де рұқсат — тіл таңдау пайдаланушы әрекеті.
 */
export async function ensureI18nOfflineDictionary(locale: AppLocale): Promise<boolean> {
  if (locale === "kk" || Platform.OS === "web") {
    await ensureOfflineAutoTranslationsLoaded().catch(() => {});
    return areOfflineAutoTranslationsReady() || locale === "kk";
  }

  const target = locale as import("./offlineAutoTranslations").OfflineAutoTranslateTarget;
  await ensureOfflineAutoTranslationsLoaded(target).catch(() => {});
  if (areOfflineAutoTranslationsReady()) {
    invalidateOfflineLocaleTreeCache(locale);
    /** Core (~30MB) — тіл таңдағанда күту: әйтпесе UI қазақша қалады. */
    const coreMerged = await Promise.race([
      ensureOfflineAutoTranslationsCoreLoaded(target).catch(() => false),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), 15_000)),
    ]);
    if (coreMerged && getCurrentLocale() === locale) {
      invalidateOfflineLocaleTreeCache(locale);
      reapplyCurrentLocale();
    } else if (getCurrentLocale() === locale) {
      /** Slim pack жеткілікті болса да UI-ды жаңарту. */
      reapplyCurrentLocale();
      void ensureOfflineAutoTranslationsCoreLoaded(target)
        .then((merged) => {
          if (!merged || getCurrentLocale() !== locale) return;
          invalidateOfflineLocaleTreeCache(locale);
          reapplyCurrentLocale();
        })
        .catch(() => {});
    }
    return true;
  }

  try {
    if (!(await isContentPackReady("i18n-offline"))) {
      await downloadContentPack("i18n-offline", { forceAllowMobileData: true });
    }
  } catch {
    /* offline / CDN */
  }

  await ensureOfflineAutoTranslationsLoaded(target).catch(() => {});
  invalidateOfflineLocaleTreeCache(locale);
  const coreMerged = await Promise.race([
    ensureOfflineAutoTranslationsCoreLoaded(target).catch(() => false),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 15_000)),
  ]);
  if (coreMerged && getCurrentLocale() === locale) {
    invalidateOfflineLocaleTreeCache(locale);
    reapplyCurrentLocale();
  }
  return areOfflineAutoTranslationsReady();
}

/** Таңдалған тілдің аударма + транслит pack-терін жүктейді (желі бар болса). */
export async function downloadLocaleContentPacks(locale: AppLocale): Promise<void> {
  const packIds = localeContentPackIds(locale);
  for (const packId of packIds) {
    if (await isContentPackReady(packId)) continue;
    const prefs = await loadContentPackPrefs();
    const forceMobile = packId === "i18n-offline";
    const gate = await canDownloadOverNetwork(forceMobile || prefs.allowMobileData);
    if (!gate.ok) {
      if (packId === "i18n-offline") {
        /** Тіл UI үшін соңғы әрекет — force. */
        await downloadContentPack(packId, { forceAllowMobileData: true });
      }
      continue;
    }
    await downloadContentPack(packId, forceMobile ? { forceAllowMobileData: true } : undefined);
  }
  await refreshQuranCachesAfterLocalePacks(locale);
  await refreshUiLocaleAfterI18nPack(locale);
}

export function scheduleLocaleContentDownload(locale?: AppLocale): void {
  if (Platform.OS === "web") return;
  const target = locale ?? getCurrentLocale();
  if (localeDownloadInflight && localeDownloadTarget === target) return;
  localeDownloadTarget = target;
  setTimeout(() => {
    localeDownloadInflight = (async () => {
      /** Алдымен i18n UI сөздігі — Quran pack-терін күтпей. */
      if (target !== "kk") {
        await ensureI18nOfflineDictionary(target);
        if (getCurrentLocale() === target && areOfflineAutoTranslationsReady()) {
          reapplyCurrentLocale();
        }
      }
      await downloadLocaleContentPacks(target);
    })()
      .catch(() => {})
      .finally(() => {
        localeDownloadInflight = null;
      });
  }, 400);
}

/** Boot: тек сақталған тіл pack-тері (барлық pack емес). */
export async function maybeAutoDownloadLocaleContentPacksOnBoot(locale: AppLocale): Promise<void> {
  if (Platform.OS === "web") return;
  if (locale !== "kk") {
    /** Тіл сақталған болса — i18n pack міндетті (prefs-қа қарамастан). */
    await ensureI18nOfflineDictionary(locale);
    if (getCurrentLocale() === locale && areOfflineAutoTranslationsReady()) {
      reapplyCurrentLocale();
    }
  }
  const prefs = await loadContentPackPrefs();
  if (!prefs.autoDownloadOnWifi && locale === "kk") return;
  const gate = await canDownloadOverNetwork(prefs.allowMobileData || locale !== "kk");
  if (!gate.ok && locale === "kk") return;
  scheduleLocaleContentDownload(locale);
}
