import { bundledJsonRemoteUrl } from "../config/bundledJsonBase";
import { isUsableOfflineAutoTranslation } from "./offlineAutoTranslationSafety";

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

const FETCH_JSON_MS = 12_000;

export function areOfflineAutoTranslationsReady(): boolean {
  const targets = bundle.targets;
  if (!targets) return false;
  return Object.keys(targets).length > 0;
}

export function hasOfflineAutoTranslationLocale(locale: OfflineAutoTranslateTarget): boolean {
  const map = bundle.targets?.[locale];
  return Boolean(map && Object.keys(map).length > 0);
}

export function pruneOfflineAutoTranslationsToLocale(locale: OfflineAutoTranslateTarget): void {
  const map = bundle.targets?.[locale];
  if (!map || Object.keys(map).length === 0) return;
  bundle = {
    version: bundle.version,
    sourceLocale: bundle.sourceLocale,
    generatedAt: bundle.generatedAt,
    targets: { [locale]: map },
  };
}

export async function ensureOfflineAutoTranslationsLoaded(
  preferred?: OfflineAutoTranslateTarget
): Promise<void> {
  if (preferred && bundle.targets?.[preferred]) {
    pruneOfflineAutoTranslationsToLocale(preferred);
    return;
  }
  if (areOfflineAutoTranslationsReady() && !preferred) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl
      ? setTimeout(() => {
          ctrl.abort();
        }, FETCH_JSON_MS)
      : null;
    try {
      const response = await fetch(bundledJsonRemoteUrl("offline-auto-translations-core.json"), {
        cache: "force-cache",
        signal: ctrl?.signal,
      });
      if (!response.ok) return;
      const loaded = (await response.json()) as OfflineAutoTranslationBundle;
      if (loaded?.targets && Object.keys(loaded.targets).length > 0) {
        bundle = loaded;
        if (preferred && loaded.targets[preferred]) {
          pruneOfflineAutoTranslationsToLocale(preferred);
        }
      }
    } catch {
      /* keep empty */
    } finally {
      if (timer) clearTimeout(timer);
    }
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
  if (preferred && bundle.targets?.[preferred]) {
    pruneOfflineAutoTranslationsToLocale(preferred);
  }
}

export function releaseOfflineAutoTranslationsMemory(): void {
  bundle = {};
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
  const translated = bundle.targets?.[target]?.[hashAutoTranslateSource(source)];
  const out = (translated ?? "").trim();
  return isUsableOfflineAutoTranslation(out) ? out : null;
}

export function hasOfflineAutoTranslation(
  text: string,
  target: OfflineAutoTranslateTarget
): boolean {
  return getOfflineAutoTranslation(text, target) != null;
}
