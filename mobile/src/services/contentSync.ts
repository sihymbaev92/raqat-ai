/**
 * Құран/хадис метадерек синхроны: ETag + since (инкременттік diff).
 * AsyncStorage: etag, since; diff бойынша аяттарды сүре кэшіне қосады.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fetchMetadataChanges,
  fetchPlatformHadith,
  fetchPlatformQuranAyah,
  type MetadataChangesPayload,
} from "./platformApiClient";
import {
  loadSurahAyahsCache,
  saveSurahAyahsCache,
  type CachedAyah,
} from "../storage/quranSurahCache";

const KEY_ETAG = "raqat.content.metadata_etag";
const KEY_SINCE = "raqat.content.metadata_since_sqlite";
const KEY_HADITH_PREFIX = "raqat.platform.hadith.";

export type ContentSyncOptions = {
  timeoutMs?: number;
  /** X-Raqat-Content-Secret (Expo env) */
  contentSecret?: string;
  /** JWT scope «content» — құпия орнына */
  accessToken?: string;
};

export type ContentSyncResult = {
  /** 304 — дене жоқ */
  unchanged: boolean;
  body: MetadataChangesPayload | null;
  storedEtag: string | null;
  storedSince: string | null;
};

export type IncrementalApplyResult = {
  quranPatched: number;
  hadithStored: number;
  errors: string[];
};

export async function readContentSyncState(): Promise<{
  etag: string | null;
  since: string | null;
}> {
  const [etag, since] = await Promise.all([
    AsyncStorage.getItem(KEY_ETAG),
    AsyncStorage.getItem(KEY_SINCE),
  ]);
  return { etag, since };
}

/**
 * Бір реттік синхрон: сақталған etag → If-None-Match, сақталған since → query.
 * Жауап 200 болса etag жаңартылады; incremental_diff_available болса since сақталады.
 */
export async function runContentMetadataSync(
  apiBase: string,
  opts?: ContentSyncOptions
): Promise<ContentSyncResult> {
  const { etag, since } = await readContentSyncState();
  const bearer = opts?.accessToken?.trim();
  const body = await fetchMetadataChanges(apiBase, {
    timeoutMs: opts?.timeoutMs,
    since: since ?? undefined,
    ifNoneMatch: etag ?? undefined,
    contentSecret: opts?.contentSecret,
    authorizationBearer: bearer || undefined,
  });
  if (body === null) {
    return {
      unchanged: true,
      body: null,
      storedEtag: etag,
      storedSince: since,
    };
  }
  const nextEtag = body.etag?.trim();
  if (nextEtag) {
    await AsyncStorage.setItem(KEY_ETAG, nextEtag);
  }
  const norm = body.since_normalized_sqlite;
  if (body.incremental_diff_available && typeof norm === "string" && norm.length > 0) {
    await AsyncStorage.setItem(KEY_SINCE, norm);
  }
  const storedEtag = nextEtag ?? etag;
  const storedSince =
    body.incremental_diff_available && typeof norm === "string" && norm.length > 0
      ? norm
      : since;
  return {
    unchanged: false,
    body,
    storedEtag,
    storedSince,
  };
}

/** Экранмен үйлесім: араб негізгі, text_kk бөлек жол */
function cachedAyahFromRow(row: Record<string, unknown>): CachedAyah | null {
  const ayah = typeof row.ayah === "number" ? row.ayah : Number(row.ayah);
  if (!Number.isFinite(ayah)) return null;
  const ar = typeof row.text_ar === "string" ? row.text_ar.trim() : "";
  const kk = typeof row.text_kk === "string" ? row.text_kk.trim() : "";
  const tr = typeof row.translit === "string" ? row.translit.trim() : "";
  const text = ar || tr || kk;
  if (!text) return null;
  return {
    numberInSurah: ayah,
    text: ar || text,
    ...(kk ? { textKk: kk } : {}),
    ...(tr ? { translit: tr } : {}),
  };
}

/** JS ағынды UI жаңартуына босату (инкременттік жазу кезінде) */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/** Хадис әр жолы бөлек кілт — шағын параллель OK; Құран бір сүре = бір кілт, сонда тізбектеу міндетті. */
const HADITH_FETCH_CONCURRENCY = 3;

/**
 * metadata жауабындағы quran_changed / hadith_changed бойынша API-дан тартылып жергілікті сақтауға жазады.
 * Құран: `quranSurahCache` (сүре бойынша бір JSON). Хадис: `raqat.platform.hadith.{id}` JSON.
 */
export async function applyIncrementalContentPatches(
  apiBase: string,
  body: MetadataChangesPayload,
  opts?: ContentSyncOptions
): Promise<IncrementalApplyResult> {
  const errors: string[] = [];
  let quranPatched = 0;
  let hadithStored = 0;
  if (!body.incremental_diff_available) {
    return { quranPatched, hadithStored, errors };
  }
  const secret = opts?.contentSecret;
  const bearer = opts?.accessToken?.trim();
  const tmo = opts?.timeoutMs;

  const qrefs = body.quran_changed ?? [];
  const bySurah = new Map<number, Set<number>>();
  for (const ref of qrefs) {
    if (!ref || typeof ref.surah !== "number" || typeof ref.ayah !== "number") continue;
    if (!bySurah.has(ref.surah)) bySurah.set(ref.surah, new Set());
    bySurah.get(ref.surah)!.add(ref.ayah);
  }

  for (const [surah, ayahSet] of bySurah) {
    const ayahs = [...ayahSet].sort((a, b) => a - b);
    const cached = (await loadSurahAyahsCache(surah)) ?? {
      ayahs: [],
      savedAt: new Date(0).toISOString(),
    };
    const nextByAyah = new Map<number, CachedAyah>(
      cached.ayahs.map((item) => [item.numberInSurah, item])
    );
    let step = 0;
    for (const ayahNum of ayahs) {
      try {
        const r = await fetchPlatformQuranAyah(apiBase, surah, ayahNum, {
          timeoutMs: tmo,
          contentSecret: secret,
          authorizationBearer: bearer || undefined,
        });
        const row = r.ayah as Record<string, unknown> | undefined;
        if (!r.ok || !row || typeof row.ayah !== "number") {
          errors.push(`quran ${surah}:${ayahNum}`);
          continue;
        }
        const entry = cachedAyahFromRow(row);
        if (!entry) {
          errors.push(`quran ${surah}:${ayahNum} empty row`);
          continue;
        }
        nextByAyah.set(ayahNum, entry);
        quranPatched += 1;
      } catch (e) {
        errors.push(`quran ${surah}:${ayahNum}: ${String(e)}`);
      }
      step += 1;
      if (step % 2 === 0) await yieldToUi();
    }
    const next = [...nextByAyah.values()].sort((a, b) => a.numberInSurah - b.numberInSurah);
    await saveSurahAyahsCache(surah, next);
    await yieldToUi();
  }

  const hids = body.hadith_changed ?? [];
  for (let i = 0; i < hids.length; i += HADITH_FETCH_CONCURRENCY) {
    const chunk = hids.slice(i, i + HADITH_FETCH_CONCURRENCY);
    await Promise.all(
      chunk.map(async (hid) => {
        try {
          const r = await fetchPlatformHadith(apiBase, hid, {
            timeoutMs: tmo,
            contentSecret: secret,
            authorizationBearer: bearer || undefined,
          });
          if (!r.ok || !r.hadith) {
            errors.push(`hadith ${hid}`);
            return;
          }
          await AsyncStorage.setItem(
            `${KEY_HADITH_PREFIX}${hid}`,
            JSON.stringify({ hadith: r.hadith, savedAt: new Date().toISOString() })
          );
          hadithStored += 1;
        } catch (e) {
          errors.push(`hadith ${hid}: ${String(e)}`);
        }
      })
    );
    await yieldToUi();
  }

  return { quranPatched, hadithStored, errors };
}

/**
 * Метадерек синхроны + (болса) инкременттік patch бір қадамда.
 */
export async function runContentSyncWithIncrementalPatches(
  apiBase: string,
  opts?: ContentSyncOptions
): Promise<ContentSyncResult & { patch?: IncrementalApplyResult }> {
  const meta = await runContentMetadataSync(apiBase, opts);
  if (meta.unchanged || !meta.body) {
    return { ...meta, patch: { quranPatched: 0, hadithStored: 0, errors: [] } };
  }
  const patch = await applyIncrementalContentPatches(apiBase, meta.body, opts);
  return { ...meta, patch };
}
