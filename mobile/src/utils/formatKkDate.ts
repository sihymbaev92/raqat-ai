import { toHijri } from "hijri-converter";

/**
 * Бүгінгі күн (григориан) — kk-KZ немесе қысқа қазақ ай атаулары.
 */
const KK_MONTHS = [
  "қаңтар",
  "ақпан",
  "наурыз",
  "сәуір",
  "мамыр",
  "маусым",
  "шілде",
  "тамыз",
  "қыркүйек",
  "қазан",
  "қараша",
  "желтоқсан",
] as const;

export function formatKkGregorianDate(d: Date): string {
  try {
    const s = d.toLocaleDateString("kk-KZ", { day: "numeric", month: "long", year: "numeric" });
    if (s && !s.toLowerCase().includes("invalid")) {
      return s;
    }
  } catch {
    /* Hermes / ескі жинақ */
  }
  const day = d.getDate();
  const m = d.getMonth();
  const y = d.getFullYear();
  return `${day} ${KK_MONTHS[m] ?? ""} ${y}`;
}

/** Хижра ай атаулары (қысқа) — 1=мухаррам */
const HIJRI_MONTHS_KK = [
  "мухаррам",
  "сафар",
  "рабиʿ I",
  "рабиʿ II",
  "жұмадә I",
  "жұмадә II",
  "раджаб",
  "шаʿбан",
  "рамазан",
  "шәуәл",
  "зул-қаʿда",
  "зул-хиҗжа",
] as const;

/**
 * Үмм әл-Қыра (hijri-converter) + қазақ тілінде ай атауы.
 * «х.ж.» = хижра жылнамасы
 */
export function formatKkHijriUmmAlQura(d: Date): string {
  const h = toHijri(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const month = HIJRI_MONTHS_KK[h.hm - 1] ?? `${h.hm}-ай`;
  return `${h.hd} ${month} ${h.hy} х.ж.`;
}
