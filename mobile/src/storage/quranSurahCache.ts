import AsyncStorage from "@react-native-async-storage/async-storage";

export type CachedAyah = {
  numberInSurah: number;
  /** Араб мәтін (негізгі көрсету) */
  text: string;
  /** Қазақша аударма — platform_api дерегінен */
  textKk?: string;
  /** Транскрипция: қазақ кирилл (DB бандл) немесе латын (alquran en.transliteration / API) */
  translit?: string;
};

export type SurahAyahsCachePayload = {
  ayahs: CachedAyah[];
  savedAt: string;
};

function keyForSurah(surahNumber: number): string {
  return `raqat_surah_ayahs_${surahNumber}_v1`;
}

export function parseAyahsFromApiResponse(j: unknown): CachedAyah[] | null {
  const code = (j as { code?: number })?.code;
  const ayahs = (j as { data?: { ayahs?: unknown[] } })?.data?.ayahs;
  if (code !== 200 || !Array.isArray(ayahs) || !ayahs.length) return null;
  return ayahs
    .map((a) => a as { numberInSurah?: number; text?: string })
    .filter((a) => typeof a.numberInSurah === "number" && typeof a.text === "string")
    .map((a) => ({
      numberInSurah: a.numberInSurah as number,
      text: a.text as string,
    }));
}

/** platform_api: { ok, ayahs: [{ ayah, text_ar, text_kk, translit }] } */
export function parseAyahsFromPlatformPayload(j: unknown): CachedAyah[] | null {
  const body = j as { ok?: boolean; ayahs?: unknown[] };
  if (!body?.ok || !Array.isArray(body.ayahs) || !body.ayahs.length) return null;
  const out: CachedAyah[] = [];
  for (const raw of body.ayahs) {
    const r = raw as {
      ayah?: number;
      text_ar?: string | null;
      text_kk?: string | null;
      translit?: string | null;
    };
    const n = typeof r.ayah === "number" ? r.ayah : Number(r.ayah);
    if (!Number.isFinite(n) || n < 1) continue;
    const ar = (r.text_ar ?? "").trim();
    const tr = (r.translit ?? "").trim();
    const kk = (r.text_kk ?? "").trim();
    const text = ar || tr || kk;
    if (!text) continue;
    out.push({
      numberInSurah: n,
      text: ar || text,
      ...(kk ? { textKk: kk } : {}),
      ...(tr ? { translit: tr } : {}),
    });
  }
  return out.length ? out : null;
}

export async function loadSurahAyahsCache(
  surahNumber: number
): Promise<SurahAyahsCachePayload | null> {
  try {
    const raw = await AsyncStorage.getItem(keyForSurah(surahNumber));
    if (!raw) return null;
    const j = JSON.parse(raw) as SurahAyahsCachePayload;
    if (!Array.isArray(j?.ayahs) || !j?.savedAt) return null;
    return j;
  } catch {
    return null;
  }
}

function _nonEmptyTranslit(ayahs: CachedAyah[]): string[] {
  return ayahs
    .map((a) => (a.translit ?? "").trim())
    .filter((s) => s.length > 0);
}

/**
 * API кейде барлық аяттарға бірдей «бисмил…» сияқты бұзақ translit қайтарады; осындайда лақтырамыз.
 */
function isSuspiciousIdenticalTranslit(ayahs: CachedAyah[]): boolean {
  const t = _nonEmptyTranslit(ayahs);
  if (t.length < 2) return false;
  if (!t.every((x) => x === t[0])) return false;
  // Бір-ақ қысқа сөз тіркесінің қайталауы
  if (t[0].length < 80) return true;
  return t[0].toLowerCase().includes("бисмил");
}

/**
 * Желіден араб/мағына келгенде: textKk-ні API-дан аламыз, ал
 * **translit-ті бандл/сидтен (previous) бұрын** сақтаймыз — API әр сүреге
 * бисмилдінің бір ғана нұсқасын қайтса да кештің әр-аяттық оқылуын жауып алмасын.
 */
export function mergeAyahsPreserveOfflineExtras(
  incoming: CachedAyah[],
  previous: CachedAyah[] | null | undefined
): CachedAyah[] {
  const junk = isSuspiciousIdenticalTranslit(incoming);
  if (!previous?.length) {
    if (!junk) return incoming;
    return incoming.map(({ numberInSurah, text, textKk }) => {
      const row: CachedAyah = { numberInSurah, text };
      if (textKk) row.textKk = textKk;
      return row;
    });
  }
  const pmap = new Map(previous.map((a) => [a.numberInSurah, a]));
  return incoming.map((a) => {
    const p = pmap.get(a.numberInSurah);
    if (!p) {
      if (!junk) return a;
      return {
        numberInSurah: a.numberInSurah,
        text: a.text,
        ...(a.textKk ? { textKk: a.textKk } : {}),
      };
    }
    const pTr = (p.translit ?? "").trim();
    const aTr = junk ? "" : (a.translit ?? "").trim();
    const tr = pTr || aTr || undefined;
    const kk = (a.textKk ?? "").trim() || (p.textKk ?? "").trim() || undefined;
    const ar = (a.text ?? "").trim() || p.text;
    return {
      numberInSurah: a.numberInSurah,
      text: ar,
      ...(tr ? { translit: tr } : {}),
      ...(kk ? { textKk: kk } : {}),
    };
  });
}

export async function saveSurahAyahsCache(
  surahNumber: number,
  ayahs: CachedAyah[]
): Promise<void> {
  const payload: SurahAyahsCachePayload = {
    ayahs,
    savedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(keyForSurah(surahNumber), JSON.stringify(payload));
}
