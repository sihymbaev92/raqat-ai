/**
 * Штрихкод / GTIN нормализациясы: OFF API үшін бірнеше нұсқа, QR ішіндегі OFF сілтемесі.
 */

const OFF_PRODUCT_RE = /openfoodfacts\.org\/product\/(\d{8,14})/i;

/** Сканер немесе буферден: тек сандық GTIN немесе OFF product URL */
export function extractProductCodeFromScan(raw: string): string | null {
  const t = raw.trim();
  const url = t.match(OFF_PRODUCT_RE);
  if (url?.[1]) return url[1].replace(/\D/g, "");
  const digits = t.replace(/[^\d]/g, "");
  if (digits.length >= 8 && digits.length <= 14) return digits;
  return null;
}

function pushUnique(arr: string[], v: string) {
  if (v.length >= 8 && v.length <= 14 && !arr.includes(v)) arr.push(v);
}

/**
 * OFF-та сынау реті: негізгі код, содан кейін UPC/EAN/GTIN-14 түрлендірулері.
 */
export function barcodeLookupCandidates(primary: string): string[] {
  const code = primary.replace(/\D/g, "");
  const out: string[] = [];
  pushUnique(out, code);
  if (code.length === 12) {
    pushUnique(out, `0${code}`);
  }
  if (code.length === 13 && code.startsWith("0")) {
    pushUnique(out, code.slice(1));
  }
  if (code.length === 14) {
    pushUnique(out, code.slice(1));
    pushUnique(out, code.slice(2));
  }
  return out;
}
