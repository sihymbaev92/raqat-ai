import offlineAutoTranslationsApk from "../../assets/bundled/offline-auto-translations-apk.json";
import { isUsableOfflineAutoTranslation } from "./offlineAutoTranslationSafety";
import { releaseBundledJsonMemory, tryLoadBundledJson } from "../utils/loadBundledJson";

export type OfflineAutoTranslateTarget =
  | "ru"
  | "en"
  | "ky"
  | "uz"
  | "tr"
  | "ar";

type OfflineAutoTranslationBundle = {
  version?: number;
  sourceLocale?: "kk";
  generatedAt?: string;
  targets?: Partial<Record<OfflineAutoTranslateTarget, Record<string, string>>>;
};

let bundle: OfflineAutoTranslationBundle = {};
let loadPromise: Promise<void> | null = null;
let coreLoadPromise: Promise<boolean> | null = null;
/** Қай тілге қысқартылғанын есте ұстау — басқа тілге ауысса қайта жүктеу керек. */
let retainedLocale: OfflineAutoTranslateTarget | null = null;

function mergeTargets(
  base: OfflineAutoTranslationBundle,
  extra: OfflineAutoTranslationBundle | null
): OfflineAutoTranslationBundle {
  if (!extra?.targets) return base;
  const targets: OfflineAutoTranslationBundle["targets"] = { ...(base.targets ?? {}) };
  for (const [loc, map] of Object.entries(extra.targets)) {
    if (!map) continue;
    const key = loc as OfflineAutoTranslateTarget;
    targets[key] = { ...(targets[key] ?? {}), ...map };
  }
  return {
    version: extra.version ?? base.version,
    sourceLocale: base.sourceLocale ?? extra.sourceLocale,
    generatedAt: extra.generatedAt ?? base.generatedAt,
    targets,
  };
}

/** APK slim pack — sync seed (async CDN/tryLoad-қа тәуелді емес). */
function cloneApkInlineBundle(): OfflineAutoTranslationBundle {
  const apk = offlineAutoTranslationsApk as OfflineAutoTranslationBundle;
  if (!apk?.targets || Object.keys(apk.targets).length === 0) return {};
  return mergeTargets({}, apk);
}

function seedApkBundleSync(): boolean {
  const seeded = cloneApkInlineBundle();
  if (!seeded.targets || Object.keys(seeded.targets).length === 0) return false;
  bundle = seeded;
  retainedLocale = null;
  return true;
}

export function seedApkOfflineTranslationsSync(): boolean {
  return seedApkBundleSync();
}

/** Модуль жүктелгенде бірден — hydrate/setLocale алдында сөздік дайын. */
seedApkBundleSync();

function loadBundleFromAsset(): OfflineAutoTranslationBundle {
  if (!bundle.targets) {
    seedApkBundleSync();
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
 * Көптілді сөздіктен тек белсенді тілді қалдыру.
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

function mergeCoreIntoBundle(full: OfflineAutoTranslationBundle): boolean {
  if (!full?.targets || Object.keys(full.targets).length === 0) return false;
  if (retainedLocale) {
    const map = full.targets[retainedLocale];
    if (!map || Object.keys(map).length === 0) return false;
    const prev = bundle.targets?.[retainedLocale] ?? {};
    bundle = {
      version: full.version ?? bundle.version,
      sourceLocale: bundle.sourceLocale ?? full.sourceLocale,
      generatedAt: full.generatedAt ?? bundle.generatedAt,
      targets: { [retainedLocale]: { ...prev, ...map } },
    };
    return true;
  }
  const before = Object.keys(bundle.targets ?? {}).length;
  bundle = mergeTargets(bundle, full);
  retainedLocale = null;
  return Object.keys(bundle.targets ?? {}).length >= before;
}

/**
 * CDN core (~30MB) — UI chrome үшін міндетті емес.
 * APK slim pack жеткілікті; core тек `tr()`/контент тереңдігін кеңейтеді.
 */
export async function ensureOfflineAutoTranslationsCoreLoaded(
  preferred?: OfflineAutoTranslateTarget
): Promise<boolean> {
  if (preferred && retainedLocale && retainedLocale !== preferred && !bundle.targets?.[preferred]) {
    return false;
  }
  if (!coreLoadPromise) {
    coreLoadPromise = (async () => {
      const full = await tryLoadBundledJson<OfflineAutoTranslationBundle>(
        "offline-auto-translations-core.json"
      );
      if (!full) return false;
      const merged = mergeCoreIntoBundle(full);
      releaseBundledJsonMemory("offline-auto-translations-core.json");
      if (preferred && retainedLocale === preferred && bundle.targets?.[preferred]) {
        pruneOfflineAutoTranslationsToLocale(preferred);
      }
      return merged;
    })().finally(() => {
      coreLoadPromise = null;
    });
  }
  return coreLoadPromise;
}

export async function ensureOfflineAutoTranslationsLoaded(
  preferred?: OfflineAutoTranslateTarget
): Promise<void> {
  /** Басқа тілге қысқартылған болса — APK inline-ды sync қалпына келтіру. */
  if (preferred && retainedLocale && retainedLocale !== preferred && !bundle.targets?.[preferred]) {
    seedApkBundleSync();
  } else if (!areOfflineAutoTranslationsReady()) {
    seedApkBundleSync();
  } else if (preferred && !bundle.targets?.[preferred]) {
    seedApkBundleSync();
  }

  if (preferred && bundle.targets?.[preferred]) {
    /** Мұнда prune ІСТЕМЕЙМІЗ — applyLocale алдында caller өзі қысқартады. */
    void ensureOfflineAutoTranslationsCoreLoaded(preferred);
    return;
  }

  if (areOfflineAutoTranslationsReady() && !preferred) {
    void ensureOfflineAutoTranslationsCoreLoaded();
    return;
  }

  /** Sync seed сәтсіз болса ғана async fallback (тест/edge). */
  if (!loadPromise) {
    loadPromise = (async () => {
      const apk = await tryLoadBundledJson<OfflineAutoTranslationBundle>(
        "offline-auto-translations-apk.json"
      );
      if (apk?.targets && Object.keys(apk.targets).length > 0) {
        bundle = mergeTargets(bundle, apk);
        retainedLocale = null;
        releaseBundledJsonMemory("offline-auto-translations-apk.json");
      }
      void ensureOfflineAutoTranslationsCoreLoaded(preferred);
    })().finally(() => {
      loadPromise = null;
    });
  }
  await loadPromise;
}

/**
 * RAM босату. Locale ≠ kk болғанда шақырмаңыз — `tr()` осы `bundle`-ға тәуелді.
 */
export function releaseOfflineAutoTranslationsMemory(): void {
  if (process.env.NODE_ENV === "test") return;
  bundle = {};
  retainedLocale = null;
  loadPromise = null;
  coreLoadPromise = null;
  releaseBundledJsonMemory("offline-auto-translations-apk.json");
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
