/** Құрам мәтінінен E-кодтарды шығару (E471, E-120, е 322а). */
export function extractEcodesFromText(raw: string): string[] {
  const text = raw || "";
  if (text.length < 2) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  const re = /(?:^|[^A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі0-9])[EeЕе]\s*[-–—]?\s*(\d{3,4}\s*[a-zA-Zа-яА-Я]?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) != null) {
    const digits = (m[1] || "").replace(/\s+/g, "").toLowerCase();
    if (!/^\d{3,4}[a-z]?$/.test(digits)) continue;
    const code = `e${digits}`;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
    if (out.length >= 24) break;
  }
  return out;
}

export function isLikelyBarcodeDigitsQuery(q: string): boolean {
  const digits = (q || "").replace(/\D/g, "");
  const compact = (q || "").replace(/\s/g, "");
  return digits.length >= 8 && digits.length <= 14 && digits.length >= compact.length - 1;
}
