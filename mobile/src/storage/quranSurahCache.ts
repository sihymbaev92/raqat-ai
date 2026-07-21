import type { QuranArabicScriptEditionId } from "../config/quranArabicScriptEdition";
import { ensureBundledQuranReaderLoaded, getBundledKkTextForAyah, getBundledSurahAyahs } from "../services/bundledQuranReader";
import { pickPreferredTranslit } from "../utils/quranTranslitDisplay";
import {
  loadSurahAyahsOverlay,
  saveSurahAyahsOverlay,
} from "./quranAyahOverlay";
import { getBundledQuranAyahTranslation } from "../services/quranOfflineTranslations";

export type CachedAyah = {
  numberInSurah: number;
  /** Араб мәтін: Мадина/KFGQPC стиліндегі Усмани (`quran-uthmani`) */
  text: string;
  /**
   * Екінші араб жолы: Al Quran Cloud `quran-unicode` (Unicode араб; түрік және басқа цифрлық басылымдармен
   * жиі үйлесетін кодтау). Желіден толықтырылады; жоқ болса түрік таңдауында негізгі `text` көрінеді.
   */
  textTurkishPrint?: string;
  /** Al Quran Cloud `quran-tajweed` тақырыпшалы мәтін — тәжуид түсі үшін */
  textTajweed?: string;
  /** Қазақша аударма — platform_api дерегінен */
  textKk?: string;
  /** Орысша аударма (Эльмир Кулиев) — тіл ru болғанда көрсетіледі (alquran.cloud ru.kuliev). */
  textRu?: string;
  /** Ағылшынша аударма (Sahih International) — тіл en болғанда (alquran.cloud en.sahih). */
  textEn?: string;
  /** Түрікше аударма (Diyanet) — tr. */
  textTr?: string;
  /** Өзбекше аударма (Содиқ) — uz. */
  textUz?: string;
  /** Қырғызша аударма (Борубаев) — ky. */
  textKy?: string;
  /** Қытайша аударма (Ma Jian) — zh. */
  textZh?: string;
  /** Парсыша аударма (Макарем Ширази) — fa. */
  textFa?: string;
  /** Индонезияша аударма — id. */
  textId?: string;
  /** Малайша аударма (Basmeih) — ms. */
  textMs?: string;
  /** Хинди аударма — hi. */
  textHi?: string;
  /** Күрдіше аударма — ku. */
  textKu?: string;
  /** Кітаптық қазақша транскрипция (кирил) немесе латын қосалқы — resolveQuranTranslitForDisplay */
  translit?: string;
};

/**
 * Таңдалған тілге сәйкес аят мағынасы.
 * Басқа тілде аударма жоқ болса қазақшаға қайтпайды (locale leak болмасын).
 * Араб тілінде (ar) бөлек мағына жоқ — экранда араб мәтінінің өзі тұрады.
 */
export function quranAyahMeaningForSurah(
  surahNumber: number,
  item: Pick<
    CachedAyah,
    | "numberInSurah"
    | "textKk"
    | "textRu"
    | "textEn"
    | "textTr"
    | "textUz"
    | "textKy"
    | "textZh"
    | "textFa"
    | "textId"
    | "textMs"
    | "textHi"
    | "textKu"
  >,
  locale: "kk" | "ru" | "en" | "ky" | "uz" | "tr" | "ar"
): string {
  return quranAyahMeaningForLocale({ ...item, surahNumber }, locale);
}

export function quranAyahMeaningForLocale(
  item: Pick<
    CachedAyah,
    | "numberInSurah"
    | "textKk"
    | "textRu"
    | "textEn"
    | "textTr"
    | "textUz"
    | "textKy"
    | "textZh"
    | "textFa"
    | "textId"
    | "textMs"
    | "textHi"
    | "textKu"
  > & { surahNumber?: number },
  locale: "kk" | "ru" | "en" | "ky" | "uz" | "tr" | "ar"
): string {
  const pick = (v: string | undefined) => (v ?? "").trim();
  const bundled = () => {
    const surah = "surahNumber" in item ? item.surahNumber : undefined;
    const ayah = "numberInSurah" in item ? item.numberInSurah : undefined;
    if (typeof surah !== "number" || typeof ayah !== "number") return "";
    if (locale === "kk") {
      return getBundledKkTextForAyah(surah, ayah) ?? "";
    }
    return getBundledQuranAyahTranslation(surah, ayah, locale);
  };
  switch (locale) {
    case "ru":
      return pick(item.textRu) || bundled();
    case "en":
      return pick(item.textEn) || bundled();
    case "tr":
      return pick(item.textTr) || bundled();
    case "uz":
      return pick(item.textUz) || bundled();
    case "ky":
      return pick(item.textKy) || bundled();
    case "ar":
      return "";
    default:
      return pick(item.textKk) || bundled();
  }
}

export type SurahAyahsCachePayload = {
  ayahs: CachedAyah[];
  savedAt: string;
};

/** Оқу экранында көрсетілетін араб мәтін (таңдалған баспа нұсқасы). */
export function displayCachedAyahArabic(item: CachedAyah, edition: QuranArabicScriptEditionId): string {
  if (edition === "turkish") {
    const alt = (item.textTurkishPrint ?? "").trim();
    if (alt) return alt;
  }
  return (item.text ?? "").trim();
}

/** Платформа/басқа дерек үстінен Мадина + түрік жолдарын қою (негізгі kk/translit сақталады). */
export function mergeDualAlquranArabicOntoBase(
  base: CachedAyah[],
  madinahLines: CachedAyah[] | null | undefined,
  turkishLines: CachedAyah[] | null | undefined
): CachedAyah[] {
  const um = new Map((madinahLines ?? []).map((a) => [a.numberInSurah, (a.text ?? "").trim()]));
  const tm = new Map((turkishLines ?? []).map((a) => [a.numberInSurah, (a.text ?? "").trim()]));
  return base.map((a) => {
    const u = um.get(a.numberInSurah);
    const t = tm.get(a.numberInSurah);
    return {
      ...a,
      ...(u ? { text: u } : {}),
      ...(t ? { textTurkishPrint: t } : {}),
    };
  });
}

/** Негізгі `text` Усмани болып тұрғанда тек `textTurkishPrint` толықтырады. */
export function mergeTurkishPrintArabicFromParsed(
  base: CachedAyah[],
  turkishLines: CachedAyah[] | null | undefined
): CachedAyah[] {
  if (!turkishLines?.length) return base;
  const tm = new Map(turkishLines.map((a) => [a.numberInSurah, (a.text ?? "").trim()]));
  return base.map((a) => {
    const t = tm.get(a.numberInSurah);
    return t ? { ...a, textTurkishPrint: t } : a;
  });
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
  await ensureBundledQuranReaderLoaded().catch(() => {});
  const bundled = getBundledSurahAyahs(surahNumber);
  const overlay = await loadSurahAyahsOverlay(surahNumber);
  if (!bundled && !overlay) return null;
  if (overlay && bundled) {
    return {
      ayahs: mergeAyahsPreserveOfflineExtras(overlay.ayahs, bundled),
      savedAt: overlay.savedAt,
    };
  }
  if (overlay) return overlay;
  return {
    ayahs: bundled!,
    savedAt: "bundled",
  };
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
    return incoming.map(({ numberInSurah, text, textKk, textTajweed, textTurkishPrint }) => {
      const row: CachedAyah = { numberInSurah, text };
      if (textKk) row.textKk = textKk;
      if (textTajweed?.trim()) row.textTajweed = textTajweed;
      if (textTurkishPrint?.trim()) row.textTurkishPrint = textTurkishPrint;
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
        ...(a.textTajweed?.trim() ? { textTajweed: a.textTajweed } : {}),
        ...(a.textTurkishPrint?.trim() ? { textTurkishPrint: a.textTurkishPrint } : {}),
      };
    }
    const pTr = (p.translit ?? "").trim();
    const aTr = junk ? "" : (a.translit ?? "").trim();
    const trMerged = pickPreferredTranslit(pTr, aTr);
    const tr = trMerged ? trMerged : undefined;
    const kk = (a.textKk ?? "").trim() || (p.textKk ?? "").trim() || undefined;
    const ar = (a.text ?? "").trim() || p.text;
    const tj = (a.textTajweed ?? "").trim() || (p.textTajweed ?? "").trim() || undefined;
    const ttp =
      (a.textTurkishPrint ?? "").trim() || (p.textTurkishPrint ?? "").trim() || undefined;
    return {
      numberInSurah: a.numberInSurah,
      text: ar,
      ...(tr ? { translit: tr } : {}),
      ...(kk ? { textKk: kk } : {}),
      ...(tj ? { textTajweed: tj } : {}),
      ...(ttp ? { textTurkishPrint: ttp } : {}),
    };
  });
}

/** Al Quran Cloud `quran-tajweed` жауабындағы тақырыпшалы мәтінді негізгі аяттарға қосу */
export function mergeTajweedTaggedIntoAyahs(base: CachedAyah[], tagged: CachedAyah[] | null | undefined): CachedAyah[] {
  if (!tagged?.length) return base;
  const map = new Map<number, string>();
  for (const a of tagged) {
    const t = (a.text ?? "").trim();
    if (t.includes("[")) map.set(a.numberInSurah, t);
  }
  if (!map.size) return base;
  return base.map((a) => {
    const t = map.get(a.numberInSurah);
    return t ? { ...a, textTajweed: t } : a;
  });
}

export async function saveSurahAyahsCache(
  surahNumber: number,
  ayahs: CachedAyah[]
): Promise<void> {
  await ensureBundledQuranReaderLoaded().catch(() => {});
  const base = getBundledSurahAyahs(surahNumber);
  const merged = base ? mergeAyahsPreserveOfflineExtras(ayahs, base) : ayahs;
  await saveSurahAyahsOverlay(surahNumber, merged);
}
