/**
 * Open Food Facts — ашық өнім дерекқоры (штрихкод → құрам).
 * https://wiki.openfoodfacts.org/API — User-Agent қажет.
 */

import { barcodeLookupCandidates, extractProductCodeFromScan } from "./barcodeNormalize";

const USER_AGENT = "RAQAT-Mobile/1.0 (halal-check; https://github.com/raqat)";
const OFF_HOSTS = ["https://world.openfoodfacts.org", "https://openfoodfacts.org"];

export type OpenFoodFactsHit = {
  found: true;
  code: string;
  productName: string;
  brands: string;
  ingredients: string;
};

export type OpenFoodFactsFailureReason =
  | "not_found"
  | "network"
  | "timeout"
  | "http_404"
  | "http_429"
  | "http_5xx"
  | "http_other";

export type OpenFoodFactsResult =
  | OpenFoodFactsHit
  | { found: false; code: string; reason?: OpenFoodFactsFailureReason; status?: number };

async function fetchProductJsonOnce(code: string, host: string): Promise<OpenFoodFactsResult> {
  const url = `${host}/api/v0/product/${encodeURIComponent(code)}.json`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 9000);
  const r = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    signal: ctrl.signal,
  }).finally(() => clearTimeout(t));
  if (!r.ok) {
    const status = r.status;
    if (status === 404) return { found: false, code, reason: "http_404", status };
    if (status === 429) return { found: false, code, reason: "http_429", status };
    if (status >= 500) return { found: false, code, reason: "http_5xx", status };
    return { found: false, code, reason: "http_other", status };
  }
  const j = (await r.json()) as {
    /** 1 = табылды */
    status?: number;
    product?: {
      product_name?: string;
      product_name_en?: string;
      generic_name?: string;
      brands?: string;
      ingredients_text?: string;
      ingredients_text_en?: string;
    };
  };
  if (j.status !== 1 || !j.product) {
    return { found: false, code, reason: "not_found", status: 404 };
  }
  const p = j.product;
  const productName =
    [p.product_name, p.product_name_en, p.generic_name].find((s) => s && String(s).trim())?.toString().trim() ?? "";
  const brands = (p.brands ?? "").toString().trim();
  const ingredients =
    [p.ingredients_text, p.ingredients_text_en].find((s) => s && String(s).trim())?.toString().trim() ?? "";
  if (!productName && !ingredients) {
    return { found: false, code, reason: "not_found", status: 404 };
  }
  return {
    found: true,
    code,
    productName,
    brands,
    ingredients,
  };
}

/** Бір GTIN үшін; желінің дұрыс еместігінде бір рет қайталау. */
export async function fetchProductByBarcode(barcode: string): Promise<OpenFoodFactsResult> {
  const code = barcode.replace(/\s/g, "").trim();
  if (!code || code.length < 8) {
    return { found: false, code, reason: "not_found" };
  }
  let last: OpenFoodFactsResult = { found: false, code, reason: "not_found" };
  for (const host of OFF_HOSTS) {
    let retryDelay = 250;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const r = await fetchProductJsonOnce(code, host);
        last = r;
        if (r.found) return r;
        break;
      } catch (err) {
        last =
          err instanceof Error && err.name === "AbortError"
            ? { found: false, code, reason: "timeout" }
            : { found: false, code, reason: "network" };
        // Lightweight observability for troubleshooting lookup quality.
        console.warn("[halal/off] lookup_error", { host, code, attempt, reason: last.reason });
        if (attempt === 2) break;
        await new Promise((res) => setTimeout(res, retryDelay));
        retryDelay *= 2;
      }
    }
  }
  return last;
}

/**
 * QR (OFF URL), GTIN-14 / UPC-A түрлендірулері — бірнеше нұсқаны OFF-та кезекпен сынау.
 */
export async function fetchProductByBarcodeSmart(raw: string): Promise<OpenFoodFactsResult> {
  const extracted = extractProductCodeFromScan(raw);
  const digits = (extracted ?? raw.replace(/\D/g, "")).trim();
  if (!digits || digits.length < 8) {
    return { found: false, code: raw.trim() || digits, reason: "not_found" };
  }
  const candidates = barcodeLookupCandidates(digits);
  let last: OpenFoodFactsResult = { found: false, code: digits, reason: "not_found" };
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const r = await fetchProductByBarcode(c);
    last = r;
    if (r.found) return r;
    if (i < candidates.length - 1) {
      await new Promise((res) => setTimeout(res, 300));
    }
  }
  return last;
}

/** Халал AI мәтін өрісіне салу үшін блог */
export function formatOpenFoodFactsForHalal(hit: OpenFoodFactsHit): string {
  const lines = [
    `Штрихкод: ${hit.code}`,
    hit.productName ? `Өнім: ${hit.productName}` : "",
    hit.brands ? `Марка: ${hit.brands}` : "",
    hit.ingredients ? `Құрам (дерекқор мәтіні): ${hit.ingredients}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}
