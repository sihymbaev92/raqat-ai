import { bundledJsonRemoteUrl } from "../config/bundledJsonBase";

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

export async function ensureOfflineAutoTranslationsLoaded(): Promise<void> {
  if (bundle.targets) return;
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
      bundle = (await response.json()) as OfflineAutoTranslationBundle;
    } catch {
      bundle = {};
    } finally {
      if (timer) clearTimeout(timer);
    }
  })();

  try {
    await loadPromise;
  } finally {
    loadPromise = null;
  }
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
  return out || null;
}

export function hasOfflineAutoTranslation(
  text: string,
  target: OfflineAutoTranslateTarget
): boolean {
  return getOfflineAutoTranslation(text, target) != null;
}
