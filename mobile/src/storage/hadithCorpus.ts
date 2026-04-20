import AsyncStorage from "@react-native-async-storage/async-storage";

/** Толық корпусты әр экран ашқанда AsyncStorage-тен қайта оқып алмау үшін (мыңдаған жол — қатып қалу) */
let memoryCorpus: HadithCorpus | null = null;

/** Ескі бір кілт (шамамен 6 МБ-тан асқанда сәтсіз) */
const LEGACY_KEY = "raqat_hadith_corpus_v1";

const META_KEY = "raqat_hadith_meta_v2";
const CHUNK_PREFIX = "raqat_hadith_chunk_v2_";

/**
 * Әр бөліктің шамамен өлшемі (JSON жол таңбалары).
 * Android AsyncStorage SQLite жолын оқу кезінде CursorWindow ~2 МБ шегі бар; араб+қазақ UTF-8
 * бір таңбаға 2–4 байт болуы мүмкін — 950k таңба жиынтықта 2 МБ-тан асып, хадистер толық
 * жүктелмей немесе сақтау/оқу сәтсіз болуы мүмкін.
 * Толық корпус сақтау сенімділігі үшін бөліктерді аздап кішірек бөлеміз.
 */
const TARGET_CHUNK_CHARS = 280_000;

/** Metro бандлдағы толық Бұхари+Муслим JSON (AsyncStorage сәтсіз болғанда да қолжетімді) */
let bundledFullCorpusCache: HadithCorpus | null | undefined;

let bundledLoadPromise: Promise<HadithCorpus | null> | null = null;

/**
 * Бандл JSON (~мыңдаған жол) — синхронды require() JS ағын ұзақ блоктайды.
 * import() + кадр үзілімі парсті келесі тікелей кезекке ығыстырады; кэш қайта қолданылады.
 */
export async function resolveBundledFullCorpus(): Promise<HadithCorpus | null> {
  if (bundledFullCorpusCache !== undefined) return bundledFullCorpusCache;
  if (!bundledLoadPromise) {
    bundledLoadPromise = (async () => {
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      try {
        const mod = await import("../../assets/bundled/hadith-from-db.json");
        const m = mod as { default?: HadithCorpus };
        bundledFullCorpusCache = m.default ?? (mod as unknown as HadithCorpus);
      } catch {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          bundledFullCorpusCache = require("../../assets/bundled/hadith-from-db.json") as HadithCorpus;
        } catch {
          bundledFullCorpusCache = null;
        }
      }
      return bundledFullCorpusCache ?? null;
    })();
  }
  return bundledLoadPromise;
}

/** Кэш толық жүктелгеннен кейін ғана; әйтпесе null */
export function getBundledFullHadithCorpus(): HadithCorpus | null {
  return bundledFullCorpusCache !== undefined ? bundledFullCorpusCache : null;
}

export type SahihHadithEntry = {
  id: string;
  /** Дерекқордағы hadith.id (scripts/hadith_corpus_sync.py экспортында) */
  dbId?: number;
  collection: "bukhari" | "muslim" | "other";
  collectionNameKk: string;
  bookTitleKk: string;
  reference: string;
  arabic: string;
  textKk: string;
  /** Офлайн бандл / синк: fawaz CDN толтырған орысша */
  textRu?: string;
  /** Офлайн бандл / синк: fawaz CDN толтырған ағылшынша (Sahih International стилі) */
  textEn?: string;
  narratorKk: string;
  /** Экспортта grade болса сақталады */
  grade?: string;
  /** Кітап ішінде қайта келген жол (is_repeated=1) — әдепкі тізімде жасырылады */
  isRepeated?: boolean;
  /** Бірінші кездесу hadith.id (қайталану болса) */
  originalDbId?: number;
};

export type HadithCorpusMeta = {
  origin: string;
  evidenceKk: string;
  recordedAt: string;
  licenseHint?: string;
};

export type HadithCorpus = {
  version: number;
  provenance: HadithCorpusMeta;
  hadiths: SahihHadithEntry[];
};

/** Тізім бөлу / санау — API немесе экспорттағы өзге жазылулар мен id префикстері */
export function hadithCollectionBucket(
  h: Pick<SahihHadithEntry, "id" | "collection">
): "bukhari" | "muslim" | null {
  const c = String(h.collection ?? "").toLowerCase().trim();
  if (c === "muslim" || c === "sahih muslim" || c === "sahih_muslim") return "muslim";
  if (c === "bukhari" || c === "sahih al-bukhari" || c === "sahih_bukhari") return "bukhari";
  const id = (h.id ?? "").toLowerCase();
  if (id.startsWith("muslim-") || id.startsWith("muslim_")) return "muslim";
  if (id.startsWith("bukhari-") || id.startsWith("bukhari_")) return "bukhari";
  if (id.includes("muslim")) return "muslim";
  if (id.includes("bukhari")) return "bukhari";
  return null;
}

type StoredMeta = {
  v: 2;
  version: number;
  provenance: HadithCorpusMeta;
  nChunks: number;
  total: number;
};

async function listHadithChunkKeys(): Promise<string[]> {
  const keys = await AsyncStorage.getAllKeys();
  return keys.filter((k) => k.startsWith(CHUNK_PREFIX));
}

async function loadHadithCorpusFromStorage(): Promise<HadithCorpus | null> {
  try {
    const metaRaw = await AsyncStorage.getItem(META_KEY);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw) as StoredMeta;
      if (meta.v !== 2 || !meta.nChunks) {
        await clearHadithCorpusStorage();
        return null;
      }
      const keys = Array.from({ length: meta.nChunks }, (_, i) => `${CHUNK_PREFIX}${i}`);
      const pairs = await AsyncStorage.multiGet(keys);
      const hadiths: SahihHadithEntry[] = [];
      let missingChunk = false;
      for (const [, raw] of pairs) {
        if (!raw) {
          missingChunk = true;
          continue;
        }
        try {
          const part = JSON.parse(raw) as SahihHadithEntry[];
          if (Array.isArray(part)) hadiths.push(...part);
        } catch {
          missingChunk = true;
        }
        // Әр бөліктен кейін UI жібіту (мыңдаған жол JSON.parse)
        await new Promise<void>((r) => setImmediate(r));
        await new Promise<void>((r) => setImmediate(r));
        await new Promise<void>((r) => {
          requestAnimationFrame(() => r());
        });
      }
      /** META алдында жазылған ескі сақтау немесе жартылай жазу: бөліктер жетіспейді немесе total сәйкес емес */
      const totalMismatch = hadiths.length !== meta.total;
      if (missingChunk || totalMismatch || hadiths.length === 0) {
        await clearHadithCorpusStorage();
        return null;
      }
      return {
        version: meta.version,
        provenance: meta.provenance,
        hadiths,
      };
    }

    const legacy = await AsyncStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const j = JSON.parse(legacy) as HadithCorpus;
      if (Array.isArray(j?.hadiths)) {
        const orphanKeys = await listHadithChunkKeys();
        if (orphanKeys.length) await AsyncStorage.multiRemove(orphanKeys);
        return j;
      }
    }
    /** META жоқ, бірақ v2 бөліктері қалған — жартылай жазудан қалған қалдық */
    const orphanKeys = await listHadithChunkKeys();
    if (orphanKeys.length) await AsyncStorage.multiRemove(orphanKeys);
    return null;
  } catch {
    return null;
  }
}

/** @param force true — кэшті елемей дискіден қайта оқу (сирек: мәжбүрлі жаңарту) */
export async function loadHadithCorpus(opts?: { force?: boolean }): Promise<HadithCorpus | null> {
  if (!opts?.force && memoryCorpus?.hadiths?.length) {
    const bundled = await resolveBundledFullCorpus();
    const nb = bundled?.hadiths?.length ?? 0;
    const nm = memoryCorpus.hadiths.length;
    if (nb > 0 && nm < nb) {
      memoryCorpus = bundled;
      return bundled;
    }
    return memoryCorpus;
  }
  const stored = await loadHadithCorpusFromStorage();
  const bundled = await resolveBundledFullCorpus();
  const ns = stored?.hadiths?.length ?? 0;
  const nb = bundled?.hadiths?.length ?? 0;
  let c: HadithCorpus | null = null;
  if (nb > ns) c = bundled;
  else if (stored?.hadiths?.length) c = stored;
  else c = bundled ?? null;
  memoryCorpus = c;
  return c;
}

export function invalidateHadithCorpusMemoryCache(): void {
  memoryCorpus = null;
}

export async function saveHadithCorpus(c: HadithCorpus): Promise<void> {
  const { hadiths, version, provenance } = c;
  const chunks: SahihHadithEntry[][] = [];
  let current: SahihHadithEntry[] = [];
  for (const h of hadiths) {
    const next = current.length === 0 ? [h] : [...current, h];
    const s = JSON.stringify(next);
    if (s.length > TARGET_CHUNK_CHARS && current.length > 0) {
      chunks.push(current);
      current = [h];
    } else if (s.length > TARGET_CHUNK_CHARS && current.length === 0) {
      chunks.push([h]);
      current = [];
    } else {
      current = next;
    }
  }
  if (current.length) chunks.push(current);

  const oldChunkKeys = await listHadithChunkKeys();
  const meta: StoredMeta = {
    v: 2,
    version,
    provenance,
    nChunks: chunks.length,
    total: hadiths.length,
  };
  /**
   * Бұрын META бірінші жазылған — қолданба үзілсе «meta бар, бөліктер жоқ/жартылай» күйі қалатын.
   * Алдымен барлық бөліктерді жазамыз, артық кілттерді жоямыз, META-ны соңында — толық жиынтай дайын болған соң ғана көрсетіледі.
   */
  for (let i = 0; i < chunks.length; i++) {
    await AsyncStorage.setItem(`${CHUNK_PREFIX}${i}`, JSON.stringify(chunks[i]));
  }
  const newKeys = new Set(chunks.map((_, i) => `${CHUNK_PREFIX}${i}`));
  const toRemove = oldChunkKeys.filter((k) => !newKeys.has(k));
  if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  await AsyncStorage.removeItem(LEGACY_KEY);
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  memoryCorpus = c;
}

export function findHadith(corpus: HadithCorpus, id: string): SahihHadithEntry | undefined {
  return corpus.hadiths.find((h) => h.id === id);
}

export function countHadithByCollection(c: HadithCorpus | null): {
  bukhari: number;
  muslim: number;
  other: number;
} {
  if (!c?.hadiths?.length) return { bukhari: 0, muslim: 0, other: 0 };
  let bukhari = 0;
  let muslim = 0;
  let other = 0;
  for (const h of c.hadiths) {
    const b = hadithCollectionBucket(h);
    if (b === "bukhari") bukhari++;
    else if (b === "muslim") muslim++;
    else other++;
  }
  return { bukhari, muslim, other };
}

/** Кіші/бүлінген корпус үшін қайта сидинг (мета + chunk кілттерін жояды). */
export async function clearHadithCorpusStorage(): Promise<void> {
  const keys = await listHadithChunkKeys();
  const toRemove = [...keys, META_KEY, LEGACY_KEY];
  if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
  memoryCorpus = null;
}
