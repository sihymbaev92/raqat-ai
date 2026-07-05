import { Platform } from "react-native";
import { localeContentPackIds } from "../config/localeContentPacks";
import type { AppLocale } from "../i18n/runtime";
import { applyLocale, getCurrentLocale } from "../i18n/runtime";
import { ensureOfflineAutoTranslationsLoaded } from "./offlineAutoTranslations";
import { prefetchBundledQuranReader, releaseBundledQuranReaderMemory } from "./bundledQuranReader";
import { prefetchBundledQuranTranslations, releaseBundledQuranTranslationsMemory } from "./quranOfflineTranslations";
import { canDownloadOverNetwork } from "./networkDownloadGate";
import {
  downloadContentPack,
  isContentPackReady,
  loadContentPackPrefs,
} from "../storage/contentPackDownloadPrefs";

let localeDownloadInflight: Promise<void> | null = null;
let localeDownloadTarget: AppLocale | null = null;

async function refreshQuranCachesAfterLocalePacks(locale: AppLocale): Promise<void> {
  releaseBundledQuranReaderMemory({ keepSurahList: true });
  void prefetchBundledQuranReader();
  if (locale !== "kk" && locale !== "ar") {
    releaseBundledQuranTranslationsMemory();
    void prefetchBundledQuranTranslations();
  }
}

async function refreshUiLocaleAfterI18nPack(locale: AppLocale): Promise<void> {
  if (locale === "kk") return;
  try {
    await ensureOfflineAutoTranslationsLoaded();
    applyLocale(locale);
  } catch {
    /* LOCALE_PATCHES fallback */
  }
}

/** Таңдалған тілдің аударма + транслит pack-терін жүктейді (желі бар болса). */
export async function downloadLocaleContentPacks(locale: AppLocale): Promise<void> {
  const packIds = localeContentPackIds(locale);
  for (const packId of packIds) {
    if (await isContentPackReady(packId)) continue;
    const prefs = await loadContentPackPrefs();
    const gate = await canDownloadOverNetwork(prefs.allowMobileData);
    if (!gate.ok) return;
    await downloadContentPack(packId);
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
    localeDownloadInflight = downloadLocaleContentPacks(target)
      .catch(() => {})
      .finally(() => {
        localeDownloadInflight = null;
      });
  }, 400);
}

/** Boot: тек сақталған тіл pack-тері (барлық pack емес). */
export async function maybeAutoDownloadLocaleContentPacksOnBoot(locale: AppLocale): Promise<void> {
  if (Platform.OS === "web") return;
  const prefs = await loadContentPackPrefs();
  if (!prefs.autoDownloadOnWifi) return;
  const gate = await canDownloadOverNetwork(prefs.allowMobileData);
  if (!gate.ok) return;
  scheduleLocaleContentDownload(locale);
}
