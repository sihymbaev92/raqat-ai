/**
 * E-код / қоспалар seed — halaldamu additives API бос кезде.
 * Дерек: scripts/build_halal_additives_seed.py → assets/bundled/halal-additives-seed.json
 */
import type { HalalDamuAdditiveItem } from "../api/halalDamuWp";
import { extractEcodesFromText } from "../utils/halalEcodeExtract";

export type HalalAdditiveRisk = "HARAM" | "MUSHKIL" | "REFERENCE";

export type HalalAdditiveSeedEntry = {
  id: number;
  code: string;
  title: string;
  aliases: string[];
  risk: HalalAdditiveRisk | string;
  description: string;
};

type HalalAdditivesSeedBundle = {
  version: number;
  items: HalalAdditiveSeedEntry[];
};

let seedBundleCache: HalalAdditivesSeedBundle | null = null;
let searchRows: { entry: HalalAdditiveSeedEntry; haystack: string }[] | null = null;

const NAMED_INGREDIENT_QUERIES = [
  "желатин",
  "gelatin",
  "реннет",
  "rennet",
  "шеллак",
  "shellac",
  "кармин",
  "carmine",
  "лецитин",
  "lecithin",
  "глицерин",
  "glycerin",
  "шошқа",
  "pork",
  "lard",
  "спирт",
  "alcohol",
  "эмульгатор",
  "фермент",
  "сарысу",
  "whey",
];

function getSeedBundle(): HalalAdditivesSeedBundle {
  if (!seedBundleCache) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    seedBundleCache = require("../../assets/bundled/halal-additives-seed.json") as HalalAdditivesSeedBundle;
  }
  return seedBundleCache;
}

function normalizeEcode(raw: string): string {
  return (raw || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function riskLabelKk(risk: string | null | undefined): string {
  const r = (risk || "").toUpperCase();
  if (r === "HARAM") return "Харам ықтимал";
  if (r === "MUSHKIL") return "Күдікті";
  return "Анықтама";
}

export function additiveRiskRank(risk: string | null | undefined): number {
  const r = (risk || "").toUpperCase();
  if (r === "HARAM") return 0;
  if (r === "MUSHKIL") return 1;
  return 2;
}

export function sortAdditivesByRisk(items: HalalDamuAdditiveItem[]): HalalDamuAdditiveItem[] {
  return [...items].sort((a, b) => {
    const dr = additiveRiskRank(a.risk) - additiveRiskRank(b.risk);
    if (dr !== 0) return dr;
    return (a.title || "").localeCompare(b.title || "", "kk");
  });
}

function seedEntryToAdditive(entry: HalalAdditiveSeedEntry): HalalDamuAdditiveItem {
  const code = entry.code.toUpperCase();
  const title = entry.title.includes(code) || !code.startsWith("E") ? entry.title : `${code} — ${entry.title}`;
  const risk = (entry.risk || "REFERENCE").toUpperCase();
  return {
    id: entry.id > 0 ? entry.id : Math.abs(hashCode(entry.code)) % 1_000_000_000,
    title,
    description: (entry.description || "").trim(),
    risk,
  };
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function ensureSearchIndex(): { entry: HalalAdditiveSeedEntry; haystack: string }[] {
  if (searchRows) return searchRows;
  searchRows = getSeedBundle().items.map((entry) => {
    const parts = [entry.code, entry.title, ...(entry.aliases ?? []), entry.description];
    return { entry, haystack: parts.join(" ").toLowerCase() };
  });
  return searchRows;
}

export function getHalalAdditivesSeedCount(): number {
  return getSeedBundle().items.length;
}

/** Баннер — JSON parse жоқ. */
export const HALAL_ADDITIVES_SEED_COUNT_HINT = 663;

export function lookupHalalAdditiveSeedByCode(query: string): HalalDamuAdditiveItem[] {
  const qRaw = query.trim().toLowerCase();
  const q = normalizeEcode(query);
  if (q.length < 2 && qRaw.length < 2) return [];
  const variants = new Set<string>();
  if (q.length >= 2) {
    variants.add(q);
    if (/^\d/.test(q)) variants.add(`e${q}`);
    if (q.startsWith("e")) variants.add(q.slice(1));
  }
  if (qRaw.length >= 2) variants.add(qRaw);

  const hits: HalalDamuAdditiveItem[] = [];
  for (const entry of getSeedBundle().items) {
    const code = normalizeEcode(entry.code);
    if (variants.has(code) || variants.has(entry.code.toLowerCase())) {
      hits.push(seedEntryToAdditive(entry));
      continue;
    }
    for (const a of entry.aliases ?? []) {
      const al = a.toLowerCase();
      if (variants.has(normalizeEcode(a)) || al === qRaw || (qRaw.length >= 3 && al.includes(qRaw))) {
        hits.push(seedEntryToAdditive(entry));
        break;
      }
    }
  }
  return hits;
}

export function searchHalalAdditivesSeed(query: string, limit = 20): HalalDamuAdditiveItem[] {
  const q = query.trim();
  if (q.length < 2) return [];
  const byCode = lookupHalalAdditiveSeedByCode(q);
  if (byCode.length > 0) return sortAdditivesByRisk(byCode).slice(0, limit);

  const needle = q.toLowerCase();
  const needleNorm = normalizeEcode(q);
  const scored: { item: HalalDamuAdditiveItem; score: number }[] = [];
  for (const row of ensureSearchIndex()) {
    if (!row.haystack.includes(needle) && !normalizeEcode(row.entry.code).includes(needleNorm)) {
      continue;
    }
    let score = 0;
    if (normalizeEcode(row.entry.code) === needleNorm) score += 100;
    else if (normalizeEcode(row.entry.code).startsWith(needleNorm)) score += 50;
    if (row.haystack.startsWith(needle)) score += 20;
    if (row.entry.risk === "HARAM") score += 5;
    if (row.entry.risk === "MUSHKIL") score += 3;
    scored.push({ item: seedEntryToAdditive(row.entry), score });
  }
  scored.sort((a, b) => b.score - a.score || additiveRiskRank(a.item.risk) - additiveRiskRank(b.item.risk));
  return scored.slice(0, limit).map((s) => s.item);
}

export function mergeHalalAdditiveItems(
  primary: HalalDamuAdditiveItem[],
  secondary: HalalDamuAdditiveItem[]
): HalalDamuAdditiveItem[] {
  const seen = new Set<string>();
  const out: HalalDamuAdditiveItem[] = [];
  for (const item of [...primary, ...secondary]) {
    const key = `${item.id}|${(item.title || "").toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return sortAdditivesByRisk(out);
}

/** Құрам мәтінінен E-код + атаулы құрам іздеу. */
export function analyzeIngredientsText(raw: string, limit = 40): HalalDamuAdditiveItem[] {
  const text = (raw || "").trim();
  if (text.length < 2) return [];

  let merged: HalalDamuAdditiveItem[] = [];
  for (const code of extractEcodesFromText(text)) {
    merged = mergeHalalAdditiveItems(merged, lookupHalalAdditiveSeedByCode(code));
  }

  const lower = text.toLowerCase();
  for (const name of NAMED_INGREDIENT_QUERIES) {
    if (!lower.includes(name)) continue;
    merged = mergeHalalAdditiveItems(merged, searchHalalAdditivesSeed(name, 5));
  }

  // Ұзын құрам: токен бойынша қосымша іздеу
  if (merged.length === 0 && text.length >= 4) {
    merged = mergeHalalAdditiveItems(merged, searchHalalAdditivesSeed(text.slice(0, 60), limit));
  }

  return sortAdditivesByRisk(merged).slice(0, limit);
}

export function releaseHalalAdditivesSeedMemory(): void {
  seedBundleCache = null;
  searchRows = null;
}
