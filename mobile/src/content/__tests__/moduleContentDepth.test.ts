import { DUA_CATEGORIES } from "../duasCatalog";
import { HAJJ_BOOK_SECTIONS } from "../hajjBookContent";
import { HAJJ_MUFTYAT_PAGES } from "../hajjMuftyatPages";
import { TRADITION_TOPICS } from "../traditionTopicsCatalog";
import { SEERAH_LESSONS, SEERAH_PHASES, seerahOfflineCharCount } from "../seerahCurriculum";
import { SEERAH_LESSON_COUNT } from "../../config/seerahVideos";
import { GUIDANCE_DEPTH_MINIMUMS } from "../moduleContentDepth";
import { getKzTrustedHadithItems } from "../kzTrustedHadithCatalog";
import { loadDhikrItems } from "../../screens/tasbihShared";

describe("module content depth parity", () => {
  const mins = GUIDANCE_DEPTH_MINIMUMS;

  it("seerah curriculum meets minimum depth", () => {
    expect(SEERAH_PHASES.length).toBeGreaterThanOrEqual(mins.seerah.phases);
    expect(SEERAH_LESSON_COUNT).toBe(SEERAH_LESSONS.length);
    expect(SEERAH_LESSONS.length).toBeGreaterThanOrEqual(mins.seerah.lessons);
    for (const l of SEERAH_LESSONS) {
      expect(l.titleKk.trim().length).toBeGreaterThan(0);
      expect(l.summaryKk.trim().length).toBeGreaterThanOrEqual(mins.seerah.minSummaryChars);
      expect(SEERAH_PHASES.some((p) => p.id === l.phaseId)).toBe(true);
    }
    expect(seerahOfflineCharCount()).toBeGreaterThanOrEqual(mins.seerah.offlineChars);
  });

  it("hajj bundled content meets minimum depth", () => {
    expect(HAJJ_BOOK_SECTIONS.length).toBeGreaterThanOrEqual(mins.hajj.sections);
    expect(HAJJ_MUFTYAT_PAGES.length).toBeGreaterThanOrEqual(mins.hajj.pages);
  });

  it("tradition topics meet minimum depth", () => {
    expect(TRADITION_TOPICS.length).toBeGreaterThanOrEqual(mins.tradition.topics);
    for (const t of TRADITION_TOPICS) {
      expect(t.summary.trim().length).toBeGreaterThanOrEqual(mins.tradition.minSummaryChars);
      expect(t.howTo.length).toBeGreaterThan(0);
    }
  });

  it("duas, tasbih, asma, hadith meet minimum depth", () => {
    expect(DUA_CATEGORIES.length).toBeGreaterThanOrEqual(mins.duas.categories);
    expect(DUA_CATEGORIES.flatMap((c) => c.blocks).length).toBeGreaterThanOrEqual(mins.duas.minBlocks);
    expect(loadDhikrItems().length).toBeGreaterThanOrEqual(mins.tasbih.items);

    /* eslint-disable @typescript-eslint/no-require-imports */
    const asma = require("../../../assets/bundled/asma-al-husna-kk.json") as { n: number }[];
    /* eslint-enable @typescript-eslint/no-require-imports */
    expect(asma.length).toBeGreaterThanOrEqual(mins.asma.names);

    const hadiths = getKzTrustedHadithItems();
    expect(hadiths.length).toBeGreaterThanOrEqual(mins.hadith.items);
    for (const h of hadiths) {
      expect(h.arabic.trim().length).toBeGreaterThan(10);
      expect(h.textKk.trim().length).toBeGreaterThan(20);
      expect(h.sourceCitationKk.trim().length).toBeGreaterThan(5);
    }
  });
});
