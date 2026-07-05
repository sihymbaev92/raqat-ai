/** Зекет есептеу — ақпараттық құрал (2.5%, ханафи жиі қолданылатын нисаб шамасы). */
export const ZAKAT_RATE = 0.025;

/** Алтын нисаб — 85 г (жиі қолданылатын шама; нақты мөлшерді ұстазбен нақтылаңыз). */
export const GOLD_NISAB_GRAMS = 85;

/** Күміс нисаб — 595 г (жиі қолданылатын шама; нақты мөлшерді ұстазбен нақтылаңыз). */
export const SILVER_NISAB_GRAMS = 595;

export type ZakatAmountInput = {
  cash: string;
  gold: string;
  silver: string;
  tradeGoods: string;
  receivables: string;
  debts: string;
  nisab: string;
};

export type NisabMode = "manual" | "gold" | "silver";

export type ZakatTotals = {
  assets: number;
  debts: number;
  net: number;
  nisab: number;
  hasNisab: boolean;
  reachedNisab: boolean;
  zakat: number;
  missing: number;
};

export function parseZakatAmount(raw: string): number {
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function computeNisabKzt(mode: NisabMode, grams: number, pricePerGram: string): number {
  if (mode === "manual") return 0;
  const price = parseZakatAmount(pricePerGram);
  const g = mode === "gold" ? GOLD_NISAB_GRAMS : SILVER_NISAB_GRAMS;
  if (price <= 0) return 0;
  return Math.round(g * price);
}

export function computeZakatTotals(amounts: ZakatAmountInput, nisabOverride?: number): ZakatTotals {
  const assets =
    parseZakatAmount(amounts.cash) +
    parseZakatAmount(amounts.gold) +
    parseZakatAmount(amounts.silver) +
    parseZakatAmount(amounts.tradeGoods) +
    parseZakatAmount(amounts.receivables);
  const debts = parseZakatAmount(amounts.debts);
  const net = Math.max(0, assets - debts);
  const manualNisab = parseZakatAmount(amounts.nisab);
  const nisab = typeof nisabOverride === "number" && nisabOverride > 0 ? nisabOverride : manualNisab;
  const hasNisab = nisab > 0;
  const reachedNisab = hasNisab ? net >= nisab : false;
  const zakat = reachedNisab ? net * ZAKAT_RATE : 0;
  return {
    assets,
    debts,
    net,
    nisab,
    hasNisab,
    reachedNisab,
    zakat,
    missing: hasNisab ? Math.max(0, nisab - net) : 0,
  };
}

export function formatKzt(value: number): string {
  const rounded = Math.round(Math.max(0, value));
  try {
    return new Intl.NumberFormat("kk-KZ").format(rounded) + " ₸";
  } catch {
    return `${rounded.toLocaleString()} ₸`;
  }
}
