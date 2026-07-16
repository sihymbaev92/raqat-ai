import { SEERAH_LESSONS, SEERAH_PHASES } from "../seerahCurriculum";

/** Латын әріптері көп болса — қазақша емес (ескі latin-kk / ағылшын қалдық). */
function hasSuspiciousLatin(text: string): boolean {
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  const cyr = (text.match(/[А-Яа-яӘәІіҢңҒғҮүҰұҚқӨөҺһ]/g) ?? []).length;
  if (latin === 0) return false;
  // Қысқа араб/атауларда бір-екі латын рұқсат емес — толық қазақша болуы керек
  return latin > 2 || (cyr > 0 && latin / (cyr + latin) > 0.25);
}

describe("seerahCurriculum Kazakh language", () => {
  it("phase and lesson titles are Cyrillic Kazakh (not Latin mix)", () => {
    for (const p of SEERAH_PHASES) {
      expect(hasSuspiciousLatin(p.titleKk)).toBe(false);
      expect(hasSuspiciousLatin(p.introKk)).toBe(false);
    }
    for (const l of SEERAH_LESSONS) {
      expect(hasSuspiciousLatin(l.titleKk)).toBe(false);
      expect(hasSuspiciousLatin(l.summaryKk)).toBe(false);
      expect(hasSuspiciousLatin(l.focusKk)).toBe(false);
    }
  });

  it("does not contain Russian farewell leftovers", () => {
    const blob = [
      ...SEERAH_PHASES.map((p) => `${p.titleKk} ${p.introKk}`),
      ...SEERAH_LESSONS.map((l) => `${l.titleKk} ${l.summaryKk} ${l.focusKk}`),
    ].join("\n");
    expect(blob).not.toMatch(/Proshanie|Proщание|Quraysh qysymy|Payg'ambar|Habash sapyry/i);
  });
});
