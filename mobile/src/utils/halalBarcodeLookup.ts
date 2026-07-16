/** Штрихкод сандарын нормализациялау. */
export function normalizeHalalBarcodeDigits(raw: string): string {
  return (raw || "").replace(/\D/g, "");
}

/** EAN-13 / UPC-A / қысқа GTIN варианттары — API және seed іздеу. */
export function halalBarcodeLookupKeys(raw: string): string[] {
  const digits = normalizeHalalBarcodeDigits(raw);
  if (!digits) return [];
  const keys = new Set<string>([digits]);
  if (digits.length === 13 && digits.startsWith("0")) keys.add(digits.slice(1));
  if (digits.length === 12) keys.add(`0${digits}`);
  if (digits.length >= 8) keys.add(digits.slice(-8));
  return [...keys];
}

export function isLikelyHalalBarcodeQuery(raw: string): boolean {
  return normalizeHalalBarcodeDigits(raw).length >= 4;
}
