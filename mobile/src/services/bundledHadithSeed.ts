import { InteractionManager } from "react-native";
import {
  loadHadithCorpus,
  resolveBundledFullCorpus,
  saveHadithCorpus,
  clearHadithCorpusStorage,
  countHadithByCollection,
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
 * Bundled native corpus is intentionally compact. Full Sahih Bukhari+Muslim stays
 * outside the app bundle as a generated/API runtime asset.
 */
const MIN_HADITHS_TO_SKIP_RESEED = 1_000;
/** Одан аз болса — дерек бүлінген немесе ескі шағын JSON (мысалы 2 жол) деп санаймыз. */
const MIN_FULL_CORPUS = 500;
/** Әр жинақтан кем дегенде осынша жол болуы керек (бір ғана кітап қалса — қайта сидинг). */
const MIN_COLLECTION_HEALTH = 500;

/** Ескі үлгі корпус (Бұхари 1 + Муслим 1 сияқты) қалса, оны толық корпус емес деп санаймыз. */
function isPlaceholderTinyCorpus(c: HadithCorpus | null): boolean {
  const n = c?.hadiths?.length ?? 0;
  if (n === 0) return true;
  if (n > 50) return false;
  const { bukhari, muslim } = countHadithByCollection(c);
  return bukhari <= 2 && muslim <= 2 && n <= 5;
}

/** Тек Сахих әл-Бұхари / Сахих Муслим (сунан және т.б. JSON қосса да көрсетілмейді) */
function sahihOnly(rows: SahihHadithEntry[]): SahihHadithEntry[] {
  return rows.filter((h) => hadithCollectionBucket(h) != null);
}

function pickBundledCorpus(fromDb: HadithCorpus): HadithCorpus | null {
  if (!Array.isArray(fromDb.hadiths) || fromDb.hadiths.length === 0) return null;
  const filtered: HadithCorpus = {
    ...fromDb,
    hadiths: sahihOnly(fromDb.hadiths ?? []),
  };
  return filtered.hadiths.length > 0 ? filtered : null;
}

/** Бандл схема нұсқасы: 5 — en/ru/tr аудармалары қосылды. Ескі (4) сидинг қайта жазылады. */
const BUNDLE_SCHEMA_VERSION = 5;

async function seedBundledHadithIfNeededImpl(): Promise<boolean> {
  let existing = await loadHadithCorpus();
  let n = existing?.hadiths?.length ?? 0;

  /** Жаңа бандл нұсқасы (аудармалармен) — ескі сидингті тазалап қайта толтыру. */
  if (existing && (existing.version ?? 0) < BUNDLE_SCHEMA_VERSION) {
    await clearHadithCorpusStorage();
    existing = await loadHadithCorpus();
    n = existing?.hadiths?.length ?? 0;
  }

  /** AsyncStorage-та тек 2 жолдық үлгі қалған — тазалап толық бандлмен қайта толтыру */
  if (existing && isPlaceholderTinyCorpus(existing)) {
    await clearHadithCorpusStorage();
    existing = await loadHadithCorpus();
    n = existing?.hadiths?.length ?? 0;
  }

  /** Бір жинақ толық жүктелмеген (мысалы тек Бұхари немесе Муслим бос) — қайта жазу керек */
  if (existing && n >= MIN_FULL_CORPUS) {
    const { muslim, bukhari } = countHadithByCollection(existing);
    const missingMuslim = bukhari >= 500 && muslim < MIN_COLLECTION_HEALTH;
    const missingBukhari = muslim >= 500 && bukhari < MIN_COLLECTION_HEALTH;
    if (missingMuslim || missingBukhari) {
      await clearHadithCorpusStorage();
      existing = await loadHadithCorpus();
      n = existing?.hadiths?.length ?? 0;
    }
  }

  if (existing && n >= MIN_HADITHS_TO_SKIP_RESEED) {
    const { muslim, bukhari } = countHadithByCollection(existing);
    if (muslim >= MIN_COLLECTION_HEALTH && bukhari >= MIN_COLLECTION_HEALTH) return false;
    await clearHadithCorpusStorage();
    existing = await loadHadithCorpus();
    n = existing?.hadiths?.length ?? 0;
  }

  if (n >= MIN_HADITHS_TO_SKIP_RESEED) return false;

  await runWhenHeavyWorkAllowed();
  await yieldToUi();
  const fromDb = await resolveBundledFullCorpus();
  if (!fromDb) return false;
  const hadithBundle = pickBundledCorpus(fromDb);

  if (!hadithBundle?.hadiths?.length) return false;

  const bundleN = hadithBundle.hadiths.length;
  /** Орташа корпус: бандл үлкенірек емес болса да, бір жинақ бос болса қайта толтыру керек. */
  if (n >= MIN_FULL_CORPUS && n < MIN_HADITHS_TO_SKIP_RESEED && bundleN <= n) {
    const { muslim, bukhari } = countHadithByCollection(existing);
    if (muslim >= MIN_COLLECTION_HEALTH && bukhari >= MIN_COLLECTION_HEALTH) return false;
  }

  /** Ескі AsyncStorage жазуы сәтсіз болса, 2-жолдық seed қалған — тазалап қайта жазамыз. */
  if (n > 0 && n < MIN_FULL_CORPUS && hadithBundle.hadiths.length >= MIN_FULL_CORPUS) {
    await clearHadithCorpusStorage();
    await yieldToUi();
  }

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