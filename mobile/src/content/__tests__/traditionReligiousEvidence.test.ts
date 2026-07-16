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

  it("resolves trusted hadith ids for numbered Bukhari/Muslim citations", () => {
    const blocks = getTraditionReligiousEvidence("bata-beru");
    const hadithRefs = blocks.flatMap((b) => b.refs).filter((r) => r.kind === "hadith");
    expect(hadithRefs.some((r) => r.kind === "hadith" && Boolean(r.hadithId))).toBe(true);

    const neighbor = getTraditionReligiousEvidence("korshi-aqy").flatMap((b) => b.refs);
    const openable = neighbor.filter((r) => r.kind === "hadith" && r.hadithId);
    expect(openable.length).toBeGreaterThan(0);
  });
});
