/**
 * KZ жиі сканерленетін GTIN — қолмен seed (halaldamu products API бос кезде).
 * Дерек: data/halal_products_seed_kz.csv → assets/bundled/halal-products-seed-kz.json
 */
import type { HalalDamuProductItem } from "../api/halalDamuWp";
import seedBundle from "../../assets/bundled/halal-products-seed-kz.json";

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

let byBarcode: Map<string, HalalProductSeedEntry> | null = null;
let titleSearchList: HalalProductSeedEntry[] | null = null;
let titleSearchRows: { entry: HalalProductSeedEntry; haystack: string; idx: number }[] | null = null;
let browseList: HalalProductSeedEntry[] | null = null;

function normalizeBarcodeDigits(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

function barcodeLookupKeys(digits: string): string[] {
  const d = normalizeBarcodeDigits(digits);
  if (!d) return [];
  const keys = new Set<string>([d]);
  if (d.length === 13 && d.startsWith("0")) keys.add(d.slice(1));
  if (d.length === 12) keys.add(`0${d}`);
  if (d.length >= 8) keys.add(d.slice(-8));
  return [...keys];
}

function ensureIndex(): void {
  if (byBarcode) return;
  const bundle = seedBundle as HalalProductsSeedBundle;
  const map = new Map<string, HalalProductSeedEntry>();
  for (const item of bundle.items ?? []) {
    const gtin = normalizeBarcodeDigits(item.gtin);
    if (!gtin) continue;
    for (const key of barcodeLookupKeys(gtin)) {
      if (!map.has(key)) map.set(key, item);
    }
  }
  byBarcode = map;
  titleSearchList = bundle.items ?? [];
  titleSearchRows = titleSearchList.map((entry, idx) => ({
    entry,
    idx,
    haystack: normalizeSearchQuery([entry.title, entry.brand ?? "", entry.ingredients ?? "", entry.gtin].join(" ")),
  }));
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

function normalizeSearchQuery(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/[«»"']/g, "")
    .replace(/\s+/g, " ");
}

/** Атау / бренд / құрам бойынша seed іздеу (2+ таңба). */
export function searchHalalProductsSeed(query: string, limit = 20): HalalDamuProductItem[] {
  const q = normalizeSearchQuery(query);
  if (q.length < 2) return [];
  ensureIndex();
  const tokens = q.split(" ").filter((t) => t.length >= 2);
  const scored: { entry: HalalProductSeedEntry; score: number; idx: number }[] = [];
  (titleSearchRows ?? []).forEach(({ entry, haystack: hay, idx }) => {
    if (hay.includes(q)) {
      scored.push({ entry, score: 100, idx });
      return;
    }
    let score = 0;
    for (const t of tokens) {
      if (hay.includes(t)) score += 10;
    }
    if (score > 0) scored.push({ entry, score, idx });
  });
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
  ensureIndex();
  return titleSearchList?.length ?? 0;
}

/** Тізім беті — алфавит бойынша алғашқы N seed. */
export function listHalalProductsSeedBrowse(limit = 20): HalalDamuProductItem[] {
  ensureIndex();
  if (!browseList) {
    browseList = [...(titleSearchList ?? [])].sort((a, b) => a.title.localeCompare(b.title, "kk"));
  }
  return browseList.slice(0, limit).map((entry, idx) => seedEntryToProduct(entry, idx));
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
