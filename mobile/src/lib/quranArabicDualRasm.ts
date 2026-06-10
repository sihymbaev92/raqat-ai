/**
 * Екі араб нұсқасын (Мадина + Unicode) салыстыру және көшіруге дайындық.
 * Имла қолданбаларымен салыстырғанда: дерек көзін ашық көрсету + нормализацияланған салыстыру.
 */

/** Unicode NFC/NFKC — кейбір басылымдар арасындағы «көрінбейтін» айырмашылықты азайтады. */
export function normalizeArabicForRasmCompare(raw: string): string {
  const t = raw.trim();
  try {
    return t.normalize("NFKC");
  } catch {
    return t;
  }
}

export function arabicRasmStringsDiffer(a: string, b: string): boolean {
  return normalizeArabicForRasmCompare(a) !== normalizeArabicForRasmCompare(b);
}

/** Екі жол да бос емес — «екі нұсқаны көшіру» мәзір жолы көрінуі үшін. */
export function canCopyDualArabicRasm(madinahText: string | undefined, turkishPrintText: string | undefined): boolean {
  const u = (madinahText ?? "").trim();
  const t = (turkishPrintText ?? "").trim();
  return u.length > 0 && t.length > 0;
}
