import type { SahihHadithEntry } from "../storage/hadithCorpus";

export function refSortKey(reference: string): number {
  const d = reference.replace(/\D/g, "");
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Ішкі сұрыптау: № бойынша, содан id. */
export function sortHadithRowsByReference(rows: SahihHadithEntry[]): SahihHadithEntry[] {
  if (rows.length <= 1) return rows;
  const decorated = rows.map((h) => ({ h, k: refSortKey(h.reference) }));
  decorated.sort((a, b) => (a.k !== b.k ? a.k - b.k : a.h.id.localeCompare(b.h.id)));
  return decorated.map((d) => d.h);
}

const DIGIT_SECTION = "0–9";
const OTHER_SECTION = "#";

/**
 * Тізім топтауы: алдымен қазақша мағына, жоқ болса араб түпнұсқа.
 * Сан — «0–9» бөлімі; әріп табылмаса — «#».
 */
export function firstLetterSectionTitle(h: SahihHadithEntry): string {
  try {
    const raw = (h.textKk?.trim() || h.arabic?.trim() || "");
    if (!raw) return OTHER_SECTION;
    for (const ch of Array.from(raw)) {
      if (/\d/.test(ch)) return DIGIT_SECTION;
      if (/\s/u.test(ch)) continue;
      if (/[.,;:!?…"'«»()[\]{}—–\-_/\\|@#$%^&*+=<>~`]/u.test(ch)) continue;
      try {
        return ch.toLocaleUpperCase("kk-KZ");
      } catch {
        return ch;
      }
    }
    return OTHER_SECTION;
  } catch {
    return OTHER_SECTION;
  }
}

export type HadithLetterSection = { title: string; data: SahihHadithEntry[] };

export function buildHadithLetterSections(rows: SahihHadithEntry[]): HadithLetterSection[] {
  if (!rows.length) return [];
  const map = new Map<string, SahihHadithEntry[]>();
  for (const h of rows) {
    const t = firstLetterSectionTitle(h);
    const arr = map.get(t);
    if (arr) arr.push(h);
    else map.set(t, [h]);
  }
  const titles = [...map.keys()];
  const rank = (x: string) => (x === OTHER_SECTION ? 2 : x === DIGIT_SECTION ? 1 : 0);
  titles.sort((a, b) => {
    const d = rank(a) - rank(b);
    if (d !== 0) return d;
    return a.localeCompare(b, "kk-KZ");
  });
  return titles.map((title) => ({
    title,
    data: sortHadithRowsByReference(map.get(title) ?? []),
  }));
}
