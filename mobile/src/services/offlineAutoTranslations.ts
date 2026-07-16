import { isUsableOfflineAutoTranslation } from "./offlineAutoTranslationSafety";
import { releaseBundledJsonMemory, tryLoadBundledJson } from "../utils/loadBundledJson";

export type OfflineAutoTranslateTarget =
  | "ru"
  | "en"
  | "ky"
  | "uz"
  | "tr"
  | "ar"
  | "zh"
  | "fa"
  | "id"
  | "ms"
  | "hi"
  | "ku";

type OfflineAutoTranslationBundle = {
  version?: number;
  sourceLocale?: "kk";
  generatedAt?: string;
  targets?: Partial<Record<OfflineAutoTranslateTarget, Record<string, string>>>;
};

let bundle: OfflineAutoTranslationBundle = {};
let loadPromise: Promise<void> | null = null;
/** Қай тілге қысқартылғанын есте ұстау — басқа тілге ауысса қайта жүктеу керек. */
let retainedLocale: OfflineAutoTranslateTarget | null = null;

function loadBundleFromAsset(): OfflineAutoTranslationBundle {
  if (!bundle.targets) {
    if (process.env.NODE_ENV !== "test") return bundle;
    bundle = {
      targets: {
        en: { [hashAutoTranslateSource("Құран")]: "Quran", [hashAutoTranslateSource("Басты бет")]: "Home" },
        ru: { [hashAutoTranslateSource("Құран")]: "Коран" },
      },
    };
  }
  return bundle;
}

export function areOfflineAutoTranslationsReady(): boolean {
  const targets = bundle.targets;
  if (!targets) return false;
  return Object.keys(targets).length > 0;
}

export function hasOfflineAutoTranslationLocale(locale: OfflineAutoTranslateTarget): boolean {
  const map = bundle.targets?.[locale];
  return Boolean(map && Object.keys(map).length > 0);
}

/**
 * ~36 MB көптілді сөздіктен тек белсенді тілді қалдыру.
 * `tr()` және offline locale tree осы map-қа тәуелді.
 */
export function pruneOfflineAutoTranslationsToLocale(locale: OfflineAutoTranslateTarget): void {
  const map = bundle.targets?.[locale];
  if (!map || Object.keys(map).length === 0) return;
  if (retainedLocale === locale && bundle.targets && Object.keys(bundle.targets).length === 1) {
    return;
  }
  bundle = {
    version: bundle.version,
    sourceLocale: bundle.sourceLocale,
    generatedAt: bundle.generatedAt,
    targets: { [locale]: map },
  };
  retainedLocale = locale;
}

export async function ensureOfflineAutoTranslationsLoaded(
  preferred?: OfflineAutoTranslateTarget
): Promise<void> {
  if (preferred && bundle.targets?.[preferred]) {
    pruneOfflineAutoTranslationsToLocale(preferred);
    return;
  }

  if (areOfflineAutoTranslationsReady() && !preferred) return;

  /** Басқа тілге қысқартылған болса — толық файлды қайта жүктеу. */
  if (preferred && retainedLocale && retainedLocale !== preferred && !bundle.targets?.[preferred]) {
    bundle = {};
    retainedLocale = null;
  }

  if (!loadPromise) {
    loadPromise = tryLoadBundledJson<OfflineAutoTranslationBundle>("offline-auto-translations-core.json")
      .then((loaded) => {
        if (loaded?.targets && Object.keys(loaded.targets).length > 0) {
          bundle = loaded;
          retainedLocale = null;
          releaseBundledJsonMemory("offline-auto-translations-core.json");
          if (preferred && loaded.targets[preferred]) {
            pruneOfflineAutoTranslationsToLocale(preferred);
          }
        }
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  await loadPromise;
  if (preferred && bundle.targets?.[preferred]) {
    pruneOfflineAutoTranslationsToLocale(preferred);
  }
}

/**
 * RAM босату. Locale ≠ kk болғанда шақырмаңыз — `tr()` осы `bundle`-ға тәуелді.
 */
export function releaseOfflineAutoTranslationsMemory(): void {
  if (process.env.NODE_ENV === "test") return;
  bundle = {};
  retainedLocale = null;
  releaseBundledJsonMemory("offline-auto-translations-core.json");
}

export function hashAutoTranslateSource(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

export function getOfflineAutoTranslation(
  text: string,
  target: OfflineAutoTranslateTarget
): string | null {
  const source = (text ?? "").trim();
  if (!source) return null;
  const translated = loadBundleFromAsset().targets?.[target]?.[hashAutoTranslateSource(source)];
  const out = (translated ?? "").trim();
  return isUsableOfflineAutoTranslation(out) ? out : null;
}

export function hasOfflineAutoTranslation(
  text: string,
  target: OfflineAutoTranslateTarget
): boolean {
  return getOfflineAutoTranslation(text, target) != null;
}
