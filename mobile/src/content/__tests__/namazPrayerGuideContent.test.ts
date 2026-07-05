import {
  NAMAZ_POSE_VISUAL_STEPS,
  NAMAZ_PRAYER_TYPE_CARDS,
} from "../namazPrayerGuideContent";

const LATIN_PHRASE =
  /\b(Subhana|Sami'Allahu|Rabbana|Rabbighfir|Allahumma|Assalamu|bi'ilmik)\b/i;

function collectUserFacingStrings(): string[] {
  const out: string[] = [];
  for (const step of NAMAZ_POSE_VISUAL_STEPS) {
    out.push(step.desc, ...step.actions, ...(step.hints ?? []));
  }
  for (const card of NAMAZ_PRAYER_TYPE_CARDS) {
    out.push(card.lead, card.subtitle);
    for (const section of card.sections) {
      out.push(section.title, ...section.lines);
    }
  }
  return out;
}

describe("namazPrayerGuideContent Kazakh-facing strings", () => {
  it("does not show raw Latin prayer transliteration in UI copy", () => {
    for (const text of collectUserFacingStrings()) {
      expect(LATIN_PHRASE.test(text) ? text.slice(0, 120) : text).not.toMatch(LATIN_PHRASE);
    }
  });
});
