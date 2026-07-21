/**
 * Walks the live `kk` object and finds UI strings that still contain
 * Kazakh-specific letters after locale hydration.
 */
const KK_SPECIFIC = /[әғқңөұүіһӘҒҚҢӨҰҮІҺ]/;
/** Letters in Kazakh but not Kyrgyz Cyrillic (Kyrgyz keeps ө/ү/ң). */
const KK_ONLY_NOT_KY = /[әғқұһӘҒҚҰҺ]/;

/** Substrings allowed to keep Kazakh/Latin mix (brands, URLs, technical). */
export const LOCALE_LEAK_ALLOW_SUBSTRINGS = [
  "Halal Damu",
  "halaldamu",
  "RAHAT OMIR",
  "Muftyat",
  "Fatua",
  "2GIS",
  "Telegram",
  "Gmail",
  "Apple",
  "Android",
  "API",
  "PDF",
  "GPS",
  "QA",
  "E‑код",
  "E-код",
  "WhatsApp",
  "YouTube",
  "QMDB",
  "ҚМДБ",
  "KMDMB",
  "native azan",
  "Native azan",
  "http",
  "www.",
  ".kz",
  ".com",
  "штрихкод",
];

/** Paths whose leaf values are proper names / Arabic / transliteration — skip scan. */
export const LOCALE_LEAK_SKIP_PATH_PREFIXES = [
  "asma.chapters",
  "content.",
  "duas.",
  "dhikr.",
  "hadithGrade.",
  "surahListMeta.",
  "namazGuide.recitations",
  "namazGuide.wuduSteps",
  "features.traditionGuide.pillar",
  "features.hajj",
  "kmdbHub.title", // org acronym stays ҚМДБ in all locales
  "onboarding.title", // brand
  "settings.languageKk",
];

export type LocaleLeak = { path: string; value: string };

export function isAllowedLocaleLeak(value: string, path: string): boolean {
  if (!KK_SPECIFIC.test(value)) return true;
  if (LOCALE_LEAK_SKIP_PATH_PREFIXES.some((p) => path.startsWith(p))) return true;
  return LOCALE_LEAK_ALLOW_SUBSTRINGS.some((s) => value.includes(s));
}

/** Kyrgyz: allow ө/ү/ң; flag only Kazakh-only bleed (әғқұһ). */
export function isAllowedKyLocaleLeak(value: string, path: string): boolean {
  if (!KK_ONLY_NOT_KY.test(value)) return true;
  if (LOCALE_LEAK_SKIP_PATH_PREFIXES.some((p) => path.startsWith(p))) return true;
  return LOCALE_LEAK_ALLOW_SUBSTRINGS.some((s) => value.includes(s));
}

export function collectKkStringLeaves(
  obj: unknown,
  prefix = "",
  out: LocaleLeak[] = []
): LocaleLeak[] {
  if (typeof obj === "string") {
    out.push({ path: prefix, value: obj });
    return out;
  }
  if (typeof obj === "function" || obj == null || typeof obj !== "object") return out;
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => collectKkStringLeaves(item, `${prefix}[${i}]`, out));
    return out;
  }
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    collectKkStringLeaves(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

export function findKkLocaleLeaks(kkRoot: unknown): LocaleLeak[] {
  return collectKkStringLeaves(kkRoot).filter(
    ({ path, value }) => !isAllowedLocaleLeak(value, path)
  );
}

export function findKyLocaleLeaks(kkRoot: unknown): LocaleLeak[] {
  return collectKkStringLeaves(kkRoot).filter(
    ({ path, value }) => !isAllowedKyLocaleLeak(value, path)
  );
}

/** Probe formatter functions with sample args; find Kazakh-letter return values. */
export function collectKkFunctionReturnLeaks(
  kkRoot: unknown,
  prefix = "",
  out: LocaleLeak[] = []
): LocaleLeak[] {
  if (typeof kkRoot === "function") {
    const samples: unknown[][] = [[], [1], [1, 2], ["x"], ["x", 1], [1, "x"], [3, "test"], [10, 50]];
    for (const args of samples) {
      try {
        const result = (kkRoot as (...a: unknown[]) => unknown)(...args);
        if (typeof result === "string" && !isAllowedLocaleLeak(result, prefix)) {
          out.push({ path: prefix, value: result });
          break;
        }
      } catch {
        /* arity / type mismatch */
      }
    }
    return out;
  }
  if (kkRoot == null || typeof kkRoot !== "object") return out;
  if (Array.isArray(kkRoot)) {
    kkRoot.forEach((item, i) => collectKkFunctionReturnLeaks(item, `${prefix}[${i}]`, out));
    return out;
  }
  for (const [k, v] of Object.entries(kkRoot as Record<string, unknown>)) {
    collectKkFunctionReturnLeaks(v, prefix ? `${prefix}.${k}` : k, out);
  }
  return out;
}

/** Sample critical UI keys that must never stay Kazakh in Russian. */
export const CRITICAL_RU_UI_KEYS: readonly { path: string; get: (kk: Record<string, unknown>) => string }[] = [
  { path: "common.close", get: (k) => (k.common as { close: string }).close },
  { path: "features.halalTabInstitutions", get: (k) => (k.features as { halalTabInstitutions: string }).halalTabInstitutions },
  { path: "features.halalTabVerify", get: (k) => (k.features as { halalTabVerify: string }).halalTabVerify },
  { path: "features.halalTabMap", get: (k) => (k.features as { halalTabMap: string }).halalTabMap },
  { path: "features.halalHeroTagRegistry", get: (k) => (k.features as { halalHeroTagRegistry: string }).halalHeroTagRegistry },
  { path: "settings.languageSectionSub", get: (k) => (k.settings as { languageSectionSub: string }).languageSectionSub },
  { path: "kmdbHub.tileMosques", get: (k) => (k.kmdbHub as { tileMosques: string }).tileMosques },
  { path: "namazGuide.screenTitle", get: (k) => (k.namazGuide as { screenTitle: string }).screenTitle },
];

export function assertNoKazakhLetters(text: string, label: string): void {
  if (KK_SPECIFIC.test(text)) {
    throw new Error(`${label} still contains Kazakh letters: ${text.slice(0, 120)}`);
  }
}
