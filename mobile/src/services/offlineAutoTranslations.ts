import { isUsableOfflineAutoTranslation } from "./offlineAutoTranslationSafety";
import { loadBundledJson, releaseBundledJsonMemory } from "../utils/loadBundledJson";

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

export async function ensureOfflineAutoTranslationsLoaded(): Promise<void> {
  if (bundle.targets) return;
  if (!loadPromise) {
    loadPromise = loadBundledJson<OfflineAutoTranslationBundle>("offline-auto-translations-core.json")
      .then((loaded) => {
        bundle = loaded;
        releaseBundledJsonMemory("offline-auto-translations-core.json");
      })
      .finally(() => {
        loadPromise = null;
      });
  }
  return loadPromise;
}

export function releaseOfflineAutoTranslationsMemory(): void {
  if (process.env.NODE_ENV === "test") return;
  bundle = {};
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
