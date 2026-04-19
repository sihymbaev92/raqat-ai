import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "raqat_quran_surah_list_v1";

export type CachedSurah = {
  number: number;
  englishName: string;
  name: string;
  numberOfAyahs: number;
};

export type QuranListCachePayload = {
  list: CachedSurah[];
  savedAt: string;
};

/** platform_api: { ok, surahs: [{ surah, ayah_count, title }] } */
export function parseSurahsFromPlatformIndex(j: unknown): CachedSurah[] | null {
  const body = j as {
    ok?: boolean;
    surahs?: { surah?: number; ayah_count?: number; title?: string | null }[];
  };
  if (!body?.ok || !Array.isArray(body.surahs) || !body.surahs.length) return null;
  const list: CachedSurah[] = [];
  for (const s of body.surahs) {
    const n = typeof s.surah === "number" ? s.surah : Number(s.surah);
    if (!Number.isFinite(n) || n < 1) continue;
    const title = (s.title ?? "").trim();
    list.push({
      number: n,
      englishName: title,
      name: "",
      numberOfAyahs: Number(s.ayah_count ?? 0),
    });
  }
  return list.length ? list : null;
}

export function parseSurahsFromApiJson(j: unknown): CachedSurah[] | null {
  const data = (j as { data?: unknown })?.data;
  const raw = Array.isArray(data)
    ? data
    : (data as { surahs?: unknown } | undefined)?.surahs ??
      (data as { surah?: unknown } | undefined)?.surah;
  if (!Array.isArray(raw) || !raw.length) return null;
  return normalizeRaw(raw);
}

function normalizeRaw(raw: unknown[]): CachedSurah[] {
  return raw
    .map((x) => x as Record<string, unknown>)
    .filter((x) => typeof x?.number === "number")
    .map((x) => ({
      number: x.number as number,
      englishName: String(x.englishName ?? ""),
      name: String(x.name ?? ""),
      numberOfAyahs: Number(x.numberOfAyahs ?? (x as { ayahs?: number }).ayahs ?? 0),
    }));
}

function normalize(raw: unknown[]): CachedSurah[] {
  return normalizeRaw(raw);
}

export async function loadQuranListCache(): Promise<QuranListCachePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as QuranListCachePayload;
    if (!Array.isArray(j?.list) || !j?.savedAt) return null;
    return { list: normalize(j.list), savedAt: j.savedAt };
  } catch {
    return null;
  }
}

export async function saveQuranListCache(list: CachedSurah[]): Promise<void> {
  const payload: QuranListCachePayload = {
    list,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(payload));
}
