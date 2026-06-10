import { TRADITION_TOPICS } from "../traditionTopicsCatalog";
import {
  getTraditionReligiousEvidence,
  traditionEvidenceRefCount,
  TRADITION_RELIGIOUS_EVIDENCE,
} from "../traditionReligiousEvidence";

describe("traditionReligiousEvidence", () => {
  it("covers every tradition topic with at least one ref", () => {
    const topicIds = TRADITION_TOPICS.map((t) => t.id);
    const missing = topicIds.filter((id) => traditionEvidenceRefCount(id) === 0);
    expect(missing).toEqual([]);
    expect(Object.keys(TRADITION_RELIGIOUS_EVIDENCE).length).toBeGreaterThanOrEqual(30);
  });

  it("returns quran and hadith refs for bata-beru", () => {
    const blocks = getTraditionReligiousEvidence("bata-beru");
    const kinds = blocks.flatMap((b) => b.refs.map((r) => r.kind));
    expect(kinds).toContain("quran");
    expect(kinds).toContain("hadith");
  });

  it("keeps refs complete and hadith excerpts as safe summaries", () => {
    for (const blocks of Object.values(TRADITION_RELIGIOUS_EVIDENCE)) {
      for (const block of blocks) {
        expect(block.id).toBeTruthy();
        expect(block.titleKk.trim().length).toBeGreaterThan(0);
        for (const ref of block.refs) {
          expect(ref.citationKk.trim().length).toBeGreaterThan(0);
          expect(ref.excerptKk.trim().length).toBeGreaterThan(0);
          if (ref.kind === "quran") {
            expect(ref.surah).toBeGreaterThanOrEqual(1);
            expect(ref.surah).toBeLessThanOrEqual(114);
            expect(ref.ayah).toBeGreaterThanOrEqual(1);
          } else {
            expect(ref.excerptKk).not.toMatch(/[«»]/);
          }
        }
      }
    }
  });
});
