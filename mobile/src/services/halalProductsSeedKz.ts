/**
 * KZ жиі сканерленетін GTIN — қолмен seed (halaldamu products API бос кезде).
 * Дерек: data/halal_products_seed_kz.csv → assets/bundled/halal-products-seed-kz.json
 */
import type { HalalDamuProductItem } from "../api/halalDamuWp";
import { halalBarcodeLookupKeys, normalizeHalalBarcodeDigits } from "../utils/halalBarcodeLookup";

export type HalalProductSeedEntry = {
  gtin: string;
  title: string;
  brand: string | null;
  ingredients: string | null;
  companyId: number | null;
  certificateStatus: string;
  note: string | null;
};

type HalalProductsSeedBundle = {
  version: number;
  items: HalalProductSeedEntry[];
};

/** Баннер үшін — JSON parse жоқ (алғашқы кадр). Нақты санау getHalalProductsSeedCount(). */
export const HALAL_PRODUCTS_SEED_COUNT_HINT = 3760;

let byBarcode: Map<string, HalalProductSeedEntry> | null = null;
let seedBundleCache: HalalProductsSeedBundle | null = null;
let titleSearchList: HalalProductSeedEntry[] | null = null;
let titleSearchRows: { entry: HalalProductSeedEntry; haystack: string; idx: number }[] | null = null;
/** token (≥3) → row indices — O(1) кандидаттар. */
let tokenIndex: Map<string, number[]> | null = null;
let browseList: HalalProductSeedEntry[] | null = null;

function getSeedBundle(): HalalProductsSeedBundle {
  if (!seedBundleCache) {
    // Keep the large products JSON off the Halal screen's initial render path.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    seedBundleCache = require("../../assets/bundled/halal-products-seed-kz.json") as HalalProductsSeedBundle;
  }
  return seedBundleCache;
}

function normalizeBarcodeDigits(raw: string): string {
  return normalizeHalalBarcodeDigits(raw);
}

function barcodeLookupKeys(digits: string): string[] {
  return halalBarcodeLookupKeys(digits);
}

function normalizeSearchQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/[«»"']/g, "")
    .replace(/\s+/g, " ");
}

function ensureIndex(): void {
  if (byBarcode) return;
  const bundle = getSeedBundle();
  const map = new Map<string, HalalProductSeedEntry>();
  const items = bundle.items ?? [];
  const rows: { entry: HalalProductSeedEntry; haystack: string; idx: number }[] = [];
  const tokens = new Map<string, number[]>();

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx]!;
    const gtin = normalizeBarcodeDigits(item.gtin);
    if (gtin) {
      for (const key of barcodeLookupKeys(gtin)) {
        if (!map.has(key)) map.set(key, item);
      }
    }
    const haystack = normalizeSearchQuery(
      [item.title, item.brand ?? "", item.ingredients ?? "", item.gtin].join(" "),
    );
    rows.push({ entry: item, haystack, idx });
    for (const tok of haystack.split(" ")) {
      if (tok.length < 3) continue;
      const bucket = tokens.get(tok);
      if (bucket) bucket.push(idx);
      else tokens.set(tok, [idx]);
    }
  }

  byBarcode = map;
  titleSearchList = items;
  titleSearchRows = rows;
  tokenIndex = tokens;
}

function seedEntryToProduct(entry: HalalProductSeedEntry, index: number): HalalDamuProductItem {
  const gtin = normalizeBarcodeDigits(entry.gtin);
  return {
    id: -(index + 1),
    title: entry.title,
    barcode: gtin || null,
    certificateStatus: "reference",
    verificationStatus: "raqat_reference",
    producerCertificateStatus: entry.certificateStatus || null,
    companyId: entry.companyId ?? undefined,
    fromRaqatSeed: true,
    ingredients: entry.ingredients,
    seedBrand: entry.brand,
    seedNote: entry.note,
  };
}

/** Штрихкод бойынша seed (API бос болғанда). */
export function lookupHalalProductsSeedByBarcode(barcode: string): HalalDamuProductItem[] {
  const keys = barcodeLookupKeys(barcode);
  if (keys.length === 0) return [];
  ensureIndex();
  const map = byBarcode!;
  const seen = new Set<string>();
  const out: HalalDamuProductItem[] = [];
  for (const key of keys) {
    const entry = map.get(key);
    if (!entry || seen.has(entry.gtin)) continue;
    seen.add(entry.gtin);
    const idx = (titleSearchList ?? []).indexOf(entry);
    out.push(seedEntryToProduct(entry, idx >= 0 ? idx : out.length));
  }
  return out;
}

/** Halal экраны ашылғанда seed индексін алдын ала құру. */
export function prefetchHalalProductsSeedIndex(): void {
  try {
    ensureIndex();
  } catch {
    /* best-effort */
  }
}

function candidateRowIndices(q: string, tokens: string[]): number[] | null {
  const index = tokenIndex;
  if (!index) return null;

  // Толық сөйлем / бір token — индекс арқылы кандидаттар
  const primary = tokens.length === 1 ? tokens[0]! : q.includes(" ") ? null : q;
  if (primary && primary.length >= 3) {
    const exact = index.get(primary);
    if (exact && exact.length > 0) return exact;
  }

  // Бірнеше token: ең сирек token бойынша кандидаттар
  let best: number[] | null = null;
  for (const t of tokens) {
    if (t.length < 3) continue;
    const bucket = index.get(t);
    if (!bucket || bucket.length === 0) continue;
    if (!best || bucket.length < best.length) best = bucket;
  }
  return best;
}

/** Атау / бренд / құрам / GTIN бойынша seed іздеу (2+ таңба). */
export function searchHalalProductsSeed(query: string, limit = 20): HalalDamuProductItem[] {
  const q = normalizeSearchQuery(query);
  if (q.length < 2) return [];
  ensureIndex();

  const digits = normalizeBarcodeDigits(query);
  if (digits.length >= 4) {
    const exact = lookupHalalProductsSeedByBarcode(digits);
    if (exact.length > 0) return exact.slice(0, limit);
  }

  const tokens = q.split(" ").filter((t) => t.length >= 2);
  const rows = titleSearchRows ?? [];
  const scored: { entry: HalalProductSeedEntry; score: number; idx: number }[] = [];

  const candidateIdx = candidateRowIndices(q, tokens);
  const scan: { entry: HalalProductSeedEntry; haystack: string; idx: number }[] =
    candidateIdx != null
      ? candidateIdx.map((i) => rows[i]!).filter(Boolean)
      : rows;

  for (const row of scan) {
    const { entry, haystack: hay, idx } = row;
    if (hay.includes(q)) {
      scored.push({ entry, score: 100, idx });
      if (scored.length >= limit && candidateIdx != null) {
        // Нақты токен кандидаттарында жеткілікті exact hit
        break;
      }
      continue;
    }
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 10;
    }
    if (score > 0) scored.push({ entry, score, idx });
  }

  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
  const seen = new Set<string>();
  const out: HalalDamuProductItem[] = [];
  for (const { entry, idx } of scored) {
    if (seen.has(entry.gtin)) continue;
    seen.add(entry.gtin);
    out.push(seedEntryToProduct(entry, idx));
    if (out.length >= limit) break;
  }
  return out;
}

export function getHalalProductsSeedCount(): number {
  return getSeedBundle().items?.length ?? 0;
}

/** Тізім беті — алфавит бойынша алғашқы N seed. */
export function listHalalProductsSeedBrowse(limit = 20): HalalDamuProductItem[] {
  ensureIndex();
  if (!browseList) {
    browseList = [...(titleSearchList ?? [])].sort((a, b) => a.title.localeCompare(b.title, "kk"));
  }
  return browseList.slice(0, limit).map((entry, idx) => seedEntryToProduct(entry, idx));
}

/** Halal экранынан шыққанда barcode/search index-терін RAM-нан босату. */
export function releaseHalalProductsSeedMemory(): void {
  byBarcode = null;
  seedBundleCache = null;
  titleSearchList = null;
  titleSearchRows = null;
  tokenIndex = null;
  browseList = null;
}

/** API + seed нәтижелерін біріктіру (API алдымен). */
export function mergeHalalProductItems(
  primary: HalalDamuProductItem[],
  extra: HalalDamuProductItem[]
): HalalDamuProductItem[] {
  const merged = [...primary];
  for (const p of extra) {
    const key = `${p.barcode ?? ""}|${p.id}|${p.title}`;
    if (!merged.some((m) => `${m.barcode ?? ""}|${m.id}|${m.title}` === key)) {
      merged.push(p);
    }
  }
  return merged;
}
