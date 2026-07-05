import {
  computeNisabKzt,
  computeZakatTotals,
  GOLD_NISAB_GRAMS,
  SILVER_NISAB_GRAMS,
  ZAKAT_RATE,
} from "../zakatCalculatorLogic";
import { ZAKAT_GUIDE_SECTIONS } from "../zakatCalculatorContent";

describe("zakatCalculatorLogic", () => {
  it("computes 2.5% when net exceeds nisab", () => {
    const totals = computeZakatTotals({
      cash: "1000000",
      gold: "",
      silver: "",
      tradeGoods: "",
      receivables: "",
      debts: "",
      nisab: "500000",
    });
    expect(totals.assets).toBe(1_000_000);
    expect(totals.net).toBe(1_000_000);
    expect(totals.reachedNisab).toBe(true);
    expect(totals.zakat).toBe(1_000_000 * ZAKAT_RATE);
  });

  it("returns zero zakat when below nisab", () => {
    const totals = computeZakatTotals({
      cash: "400000",
      gold: "",
      silver: "",
      tradeGoods: "",
      receivables: "",
      debts: "50000",
      nisab: "500000",
    });
    expect(totals.net).toBe(350_000);
    expect(totals.reachedNisab).toBe(false);
    expect(totals.zakat).toBe(0);
    expect(totals.missing).toBe(150_000);
  });

  it("subtracts debts from assets", () => {
    const totals = computeZakatTotals({
      cash: "800000",
      gold: "200000",
      silver: "",
      tradeGoods: "",
      receivables: "",
      debts: "100000",
      nisab: "500000",
    });
    expect(totals.assets).toBe(1_000_000);
    expect(totals.debts).toBe(100_000);
    expect(totals.net).toBe(900_000);
    expect(totals.zakat).toBe(900_000 * ZAKAT_RATE);
  });

  it("computes nisab from gold grams and price", () => {
    const nisab = computeNisabKzt("gold", GOLD_NISAB_GRAMS, "50000");
    expect(nisab).toBe(85 * 50_000);
  });

  it("computes nisab from silver grams and price", () => {
    const nisab = computeNisabKzt("silver", SILVER_NISAB_GRAMS, "1000");
    expect(nisab).toBe(595 * 1_000);
  });

  it("uses override nisab when provided", () => {
    const totals = computeZakatTotals(
      {
        cash: "600000",
        gold: "",
        silver: "",
        tradeGoods: "",
        receivables: "",
        debts: "",
        nisab: "",
      },
      500_000
    );
    expect(totals.nisab).toBe(500_000);
    expect(totals.zakat).toBe(600_000 * ZAKAT_RATE);
  });
});

describe("zakatCalculatorContent", () => {
  it("bundles offline guide with boundary disclaimer", () => {
    expect(ZAKAT_GUIDE_SECTIONS.length).toBeGreaterThanOrEqual(5);
    expect(ZAKAT_GUIDE_SECTIONS[0].title).toMatch(/Ақпараттық құрал/i);
    expect(ZAKAT_GUIDE_SECTIONS[0].body).toMatch(/ресми пәтуа/i);
    for (const section of ZAKAT_GUIDE_SECTIONS) {
      expect(section.body.trim().length).toBeGreaterThan(40);
    }
  });
});
