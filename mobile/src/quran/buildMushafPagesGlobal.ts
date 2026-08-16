import { globalAyahToRef, TOTAL_AYAHS } from "../data/quranAyahCounts";
import {
  globalAyahAtMushafPageStart,
  HAFS_MUSHAF_PAGE_COUNT,
} from "../data/quranHafsPageFromGlobalAyah";
import { QCF4_MUSHAF_PAGE_RANGES } from "../data/qcf4MushafPageRanges.generated";
import { getBundledSurahAyahs } from "../services/bundledQuranReader";
import { getBundledTajweedAyahText } from "../services/bundledQuranTajweed";
import type { MushafBookAyah, MushafBookPageSlice } from "./mushafBookTypes";

let cachedMushafPages: MushafBookPageSlice[] | null = null;
let cachedMushafPagesLight: MushafBookPageSlice[] | null = null;
let cachedQcf4MushafPages: MushafBookPageSlice[] | null = null;
let cachedQcf4MushafPagesLight: MushafBookPageSlice[] | null = null;
const resolvedAyahCache = new Map<string, MushafBookAyah>();

function bundledAyahRow(surah: number, ayah: number): MushafBookAyah | null {
  const rows = getBundledSurahAyahs(surah);
  if (!rows?.length) return null;
  const row = rows[ayah - 1];
  if (row?.numberInSurah === ayah) return { ...row, surahNumber: surah };
  const found = rows.find((a) => a.numberInSurah === ayah);
  return found ? { ...found, surahNumber: surah } : null;
}

function buildMushafPagesFromQcf4Ranges(enrich: boolean): MushafBookPageSlice[] {
  return QCF4_MUSHAF_PAGE_RANGES.map((ranges, pageIndex) => {
    const ayahs: MushafBookAyah[] = [];
    for (const [surah, startAyah, endAyah] of ranges) {
      for (let ayah = startAyah; ayah <= endAyah; ayah += 1) {
        const row = enrich ? bundledAyahRow(surah, ayah) : null;
        const base = row ?? { numberInSurah: ayah, text: "", surahNumber: surah };
        const textTajweed =
          enrich && !(base.textTajweed ?? "").includes("[")
            ? getBundledTajweedAyahText(surah, ayah) || undefined
            : (base.textTajweed ?? "").trim() || undefined;
        ayahs.push(textTajweed ? { ...base, textTajweed } : base);
      }
    }
    const mushafPageNumber = pageIndex + 1;
    return {
      key: `qcf4-${mushafPageNumber}`,
      mushafPageNumber,
      ayahs,
    };
  });
}

/**
 * 604 бет — тек сүре/аят шекарасы (мәтінсіз). Хатым/webp тез ашылуы үшін.
 * Аят мәтіні `buildMushafPagesGlobal()` фонда толықтырылады.
 */
export function buildMushafPagesGlobalLight(): MushafBookPageSlice[] {
  if (cachedMushafPagesLight) return cachedMushafPagesLight;

  const pages: MushafBookPageSlice[] = [];
  for (let p = 1; p <= HAFS_MUSHAF_PAGE_COUNT; p += 1) {
    const startG = globalAyahAtMushafPageStart(p);
    const endG =
      p < HAFS_MUSHAF_PAGE_COUNT ? globalAyahAtMushafPageStart(p + 1) - 1 : TOTAL_AYAHS;
    const ayahs: MushafBookAyah[] = [];
    for (let g = startG; g <= endG; g += 1) {
      const { surah, ayah } = globalAyahToRef(g);
      ayahs.push({ numberInSurah: ayah, text: "", surahNumber: surah });
    }
    pages.push({
      key: `hafs-${p}`,
      mushafPageNumber: p,
      ayahs,
    });
  }
  cachedMushafPagesLight = pages;
  return pages;
}

/**
 * QCF4 беттері кей жерлерде классикалық Hafs page-start table-дан өзгеше.
 * Тап/highlight/audio mapping дәл болу үшін QCF4 JSON-нан алынған compact range table қолданылады.
 */
export function buildQcf4MushafPagesGlobalLight(): MushafBookPageSlice[] {
  if (cachedQcf4MushafPagesLight) return cachedQcf4MushafPagesLight;
  cachedQcf4MushafPagesLight = buildMushafPagesFromQcf4Ranges(false);
  return cachedQcf4MushafPagesLight;
}

/** UI spinner көрінуі үшін — event loop yield, содан толық беттер (bundled JSON керек). */
export async function buildMushafPagesGlobalAsync(): Promise<MushafBookPageSlice[]> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
  if (cachedMushafPages) return cachedMushafPages;
  const { ensureBundledQuranReaderLoaded } = await import("../services/bundledQuranReader");
  await ensureBundledQuranReaderLoaded();
  return buildMushafPagesGlobal();
}

/** Барлық 604 Hafs бетін жергілікті Құран деректерінен құрастырады. */
export function buildMushafPagesGlobal(): MushafBookPageSlice[] {
  if (cachedMushafPages) return cachedMushafPages;

  const pages: MushafBookPageSlice[] = [];
  for (let p = 1; p <= HAFS_MUSHAF_PAGE_COUNT; p += 1) {
    const startG = globalAyahAtMushafPageStart(p);
    const endG =
      p < HAFS_MUSHAF_PAGE_COUNT ? globalAyahAtMushafPageStart(p + 1) - 1 : TOTAL_AYAHS;
    const ayahs: MushafBookAyah[] = [];
    for (let g = startG; g <= endG; g += 1) {
      const { surah, ayah } = globalAyahToRef(g);
      const row = bundledAyahRow(surah, ayah);
      const base = row ?? { numberInSurah: ayah, text: "", surahNumber: surah };
      const textTajweed =
        (base.textTajweed ?? "").trim() || getBundledTajweedAyahText(surah, ayah) || undefined;
      ayahs.push(textTajweed ? { ...base, textTajweed } : base);
    }
    pages.push({
      key: `hafs-${p}`,
      mushafPageNumber: p,
      ayahs,
    });
  }
  const firstText = pages[0]?.ayahs[0]?.text?.replace(/^\uFEFF/, "").trim() ?? "";
  if (firstText.length > 0) {
    cachedMushafPages = pages;
  }
  return pages;
}

/** QCF4 backend үшін толық мәтін/аударма дерегімен page slices. */
export function buildQcf4MushafPagesGlobal(): MushafBookPageSlice[] {
  if (cachedQcf4MushafPages) return cachedQcf4MushafPages;
  cachedQcf4MushafPages = buildMushafPagesFromQcf4Ranges(true);
  return cachedQcf4MushafPages;
}

/** Тесттер үшін модуль кэшін тазалау. */
export function clearMushafPagesGlobalCache(): void {
  cachedMushafPages = null;
  cachedMushafPagesLight = null;
  cachedQcf4MushafPages = null;
  cachedQcf4MushafPagesLight = null;
  resolvedAyahCache.clear();
}

/** Тест / bundled quran жаңарғанда resolve кэшін тазалау (Turkish Unicode merge). */
export function clearMushafBookAyahResolveCache(): void {
  resolvedAyahCache.clear();
}

/** Жеңіл бет аяты → bundled мәтін (web фонда жүктелгенде). */
export function resolveMushafBookAyah(stub: MushafBookAyah): MushafBookAyah {
  const key = `${stub.surahNumber}:${stub.numberInSurah}`;
  const row = bundledAyahRow(stub.surahNumber, stub.numberInSurah);
  const hit = resolvedAyahCache.get(key);
  if (hit && (hit.text ?? "").replace(/^\uFEFF/, "").trim()) {
    const turkishPrint =
      (hit.textTurkishPrint ?? "").trim() || (row?.textTurkishPrint ?? "").trim() || undefined;
    if (turkishPrint && turkishPrint !== (hit.textTurkishPrint ?? "").trim()) {
      const patched = { ...hit, textTurkishPrint: turkishPrint };
      resolvedAyahCache.set(key, patched);
      return patched;
    }
    return hit;
  }

  const textTajweed =
    (stub.textTajweed ?? "").trim() ||
    (row?.textTajweed ?? "").trim() ||
    getBundledTajweedAyahText(stub.surahNumber, stub.numberInSurah) ||
    undefined;
  if (!row) {
    const out = textTajweed ? { ...stub, textTajweed } : stub;
    if ((out.text ?? "").replace(/^\uFEFF/, "").trim()) resolvedAyahCache.set(key, out);
    return out;
  }
  const merged = {
    ...row,
    ...stub,
    text: (stub.text ?? "").trim() || row.text,
    textKk: (stub.textKk ?? "").trim() || row.textKk,
    translit: (stub.translit ?? "").trim() || row.translit,
    textTajweed,
    textTurkishPrint: (stub.textTurkishPrint ?? "").trim() || row.textTurkishPrint,
    textRu: (stub.textRu ?? "").trim() || row.textRu,
    textEn: (stub.textEn ?? "").trim() || row.textEn,
    textTr: (stub.textTr ?? "").trim() || row.textTr,
    textUz: (stub.textUz ?? "").trim() || row.textUz,
    textKy: (stub.textKy ?? "").trim() || row.textKy,
    textZh: (stub.textZh ?? "").trim() || row.textZh,
    textFa: (stub.textFa ?? "").trim() || row.textFa,
    textId: (stub.textId ?? "").trim() || row.textId,
    textMs: (stub.textMs ?? "").trim() || row.textMs,
    textHi: (stub.textHi ?? "").trim() || row.textHi,
    textKu: (stub.textKu ?? "").trim() || row.textKu,
  };
  if ((merged.text ?? "").replace(/^\uFEFF/, "").trim()) resolvedAyahCache.set(key, merged);
  return merged;
}

export function mushafBookPageIndex(page: number): number {
  return Math.max(0, Math.min(HAFS_MUSHAF_PAGE_COUNT - 1, Math.floor(page) - 1));
}

export function findMushafBookPageIndexForAyah(
  pages: MushafBookPageSlice[],
  surah: number,
  ayah: number
): number {
  const ix = pages.findIndex((pg) =>
    pg.ayahs.some((a) => a.surahNumber === surah && a.numberInSurah === ayah)
  );
  return ix >= 0 ? ix : 0;
}

/** Толық сүре: тек осы сүре аяттары бар 604 беттер (мыс. Бақара → 2–49). */
export function filterMushafBookPagesForSurah(
  pages: MushafBookPageSlice[],
  surahNumber: number
): MushafBookPageSlice[] {
  const s = Math.floor(surahNumber);
  if (s < 1 || s > 114) return pages;
  return pages.filter((pg) => pg.ayahs.some((a) => a.surahNumber === s));
}
