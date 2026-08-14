import { InteractionManager } from "react-native";
import {
  loadHadithCorpus,
  resolveBundledFullCorpus,
  saveHadithCorpus,
  clearHadithCorpusStorage,
  hadithCollectionBucket,
  type HadithCorpus,
  type SahihHadithEntry,
} from "../storage/hadithCorpus";
import { runWhenHeavyWorkAllowed } from "../utils/uiDefer";

let hadithSeedInFlight: Promise<boolean> | null = null;

function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Bundled corpus = trusted sahih set with locale texts (kk + ar + fawaz/HadeethEnc).
 * Full Bukhari/Muslim dump is intentionally not shipped.
 */
const MIN_TRUSTED_SEED = 50;
/** Бандл схема: 11 — QMDB Bukhari PDF KK corpus (614). */
const BUNDLE_SCHEMA_VERSION = 12;

function yieldToUiDeferred(): Promise<void> {
  return yieldToUi();
}

function isShippableBundledRow(h: SahihHadithEntry): boolean {
  if (h.sourceOnly) return false;
  const hasBody =
    (h.arabic ?? "").trim().length > 0 ||
    (h.textKk ?? "").trim().length > 0 ||
    (h.textKy ?? "").trim().length > 0 ||
    (h.textUz ?? "").trim().length > 0;
  if (!hasBody) return false;
  if (hadithCollectionBucket(h) != null) return true;
  return Boolean(h.hadeethEncId);
}

function pickBundledCorpus(fromDb: HadithCorpus): HadithCorpus | null {
  if (!Array.isArray(fromDb.hadiths) || fromDb.hadiths.length === 0) return null;
  const filtered: HadithCorpus = {
    ...fromDb,
    version: Math.max(fromDb.version ?? 0, BUNDLE_SCHEMA_VERSION),
    hadiths: (fromDb.hadiths ?? []).filter(isShippableBundledRow),
  };
  return filtered.hadiths.length > 0 ? filtered : null;
}

function isTrustedMultilangCorpus(c: HadithCorpus | null): boolean {
  const rows = c?.hadiths ?? [];
  if (rows.length < MIN_TRUSTED_SEED) return false;
  if ((c?.version ?? 0) < BUNDLE_SCHEMA_VERSION) return false;
  return rows.every(isShippableBundledRow);
}

async function seedBundledHadithIfNeededImpl(): Promise<boolean> {
  let existing = await loadHadithCorpus();

  if (existing && (existing.version ?? 0) < BUNDLE_SCHEMA_VERSION) {
    await clearHadithCorpusStorage();
    existing = await loadHadithCorpus();
  }

  if (isTrustedMultilangCorpus(existing)) return false;

  if (existing && !isTrustedMultilangCorpus(existing)) {
    await clearHadithCorpusStorage();
    existing = await loadHadithCorpus();
    if (isTrustedMultilangCorpus(existing)) return false;
  }

  await runWhenHeavyWorkAllowed();
  await yieldToUiDeferred();
  const fromDb = await resolveBundledFullCorpus();
  if (!fromDb) return false;
  const hadithBundle = pickBundledCorpus(fromDb);
  if (!hadithBundle?.hadiths?.length) return false;

  try {
    await saveHadithCorpus(hadithBundle);
    return true;
  } catch {
    /**
     * Seed AsyncStorage-қа сыймаса да, `loadHadithCorpus` бандлдан оқи алады.
     */
    return false;
  }
}

export async function seedBundledHadithIfNeeded(): Promise<boolean> {
  if (hadithSeedInFlight) return hadithSeedInFlight;
  hadithSeedInFlight = seedBundledHadithIfNeededImpl();
  try {
    return await hadithSeedInFlight;
  } finally {
    hadithSeedInFlight = null;
  }
}

export function scheduleBundledHadithSeed(): void {
  InteractionManager.runAfterInteractions(() => {
    void seedBundledHadithIfNeeded();
  });
}
