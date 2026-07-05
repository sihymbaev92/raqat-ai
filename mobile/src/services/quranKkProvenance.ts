import { loadBundledJson } from "../utils/loadBundledJson";
import { QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT } from "../config/quranKkTranslation";

export type QuranKkBundleMeta = {
  schema?: string;
  attribution_kk?: string | null;
  source_detail?: string | null;
  exported_at?: string | null;
  stats?: {
    filled?: number;
    translit_filled?: number;
    total_quran_rows?: number;
  };
};

export type QuranKkProvenanceDisplay = {
  footerLine: string;
  meaningLabelKk: string;
  attributionKk: string;
  sourceDetail: string;
  exportedAt: string | null;
};

let cached: QuranKkProvenanceDisplay | null = null;
let loadPromise: Promise<QuranKkProvenanceDisplay> | null = null;

/** Бандл `source_detail` / `attribution_kk` → UI footer (нақты provenance). */
export function formatQuranKkAttributionFooter(meta: {
  attribution_kk?: string | null;
  source_detail?: string | null;
}): string {
  const att = (meta.attribution_kk ?? "").trim();
  const det = (meta.source_detail ?? "").trim();
  const segments = det
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  const textKkSeg =
    segments.find((s) => /text_kk|qurankarim|Халифа|Halifa/i.test(s)) ?? "";
  const meaningPart = textKkSeg
    .replace(/^text_kk gaps:\s*/i, "")
    .replace(/^text_kk:\s*/i, "")
    .trim();

  const supportParts = [
    att,
    ...segments.filter((s) => s !== textKkSeg && !/^https?:\/\//.test(s)),
  ].filter(Boolean);

  const urlParts = segments.filter((s) => /^https?:\/\//.test(s));

  return [
    meaningPart
      ? `Қазақша аят мағынасы (офлайн бандл): ${meaningPart}.`
      : "Қазақша аят мағынасы (офлайн бандл).",
    urlParts.length ? `Сілтеме: ${urlParts.join(" ")}.` : "",
    supportParts.length
      ? `Транскрипция/қосалқы: ${supportParts.join("; ")}.`
      : "",
    "Толық мәтін және лицензия — ресми басылым/ҚМДБ.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function meaningLabelFromProvenance(meta: {
  attribution_kk?: string | null;
  source_detail?: string | null;
}): string {
  const det = (meta.source_detail ?? "").trim();
  const m = det.match(/text_kk[^|]*?(Халифа Алтай|qurankarim\.kz[^|]*)/i);
  if (m?.[1]) {
    const label = m[1].replace(/^qurankarim\.kz API\s*\(?/i, "").replace(/\)$/, "").trim();
    return `Мағына (${label})`;
  }
  const att = (meta.attribution_kk ?? "").trim();
  if (att && !/транскрип/i.test(att)) {
    return `Мағына (${att})`;
  }
  return QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.meaningLabelKk;
}

export function parseQuranKkBundleMeta(raw: QuranKkBundleMeta): QuranKkProvenanceDisplay {
  const footerLine = formatQuranKkAttributionFooter(raw);
  return {
    footerLine,
    meaningLabelKk: meaningLabelFromProvenance(raw),
    attributionKk: (raw.attribution_kk ?? "").trim(),
    sourceDetail: (raw.source_detail ?? "").trim(),
    exportedAt: raw.exported_at ?? null,
  };
}

export function getQuranKkProvenanceSnapshot(): QuranKkProvenanceDisplay {
  return {
    footerLine: QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.footerLine,
    meaningLabelKk: QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.meaningLabelKk,
    attributionKk: QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.attributionKk,
    sourceDetail: QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.sourceDetail,
    exportedAt: QURAN_KK_BUNDLE_PROVENANCE_SNAPSHOT.exportedAt,
  };
}

export function getQuranKkProvenanceCached(): QuranKkProvenanceDisplay | null {
  return cached;
}

export function setQuranKkProvenanceFromBundle(raw: QuranKkBundleMeta): QuranKkProvenanceDisplay {
  cached = parseQuranKkBundleMeta(raw);
  return cached;
}

/** `quran-kk-from-db.json` header — тізім/сүре footer үшін. */
export async function ensureQuranKkProvenanceLoaded(): Promise<QuranKkProvenanceDisplay> {
  if (cached) return cached;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const bundle = await loadBundledJson<QuranKkBundleMeta>("quran-kk-from-db.json");
        return setQuranKkProvenanceFromBundle(bundle);
      } catch {
        cached = getQuranKkProvenanceSnapshot();
        return cached;
      } finally {
        loadPromise = null;
      }
    })();
  }
  return loadPromise;
}
