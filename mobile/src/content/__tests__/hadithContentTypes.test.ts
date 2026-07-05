import {
  HADITH_CONTENT_LABELING,
  HADITH_CONTENT_TYPES,
} from "../hadithContentTypes";

describe("hadithContentTypes", () => {
  it("defines two distinct content types for P0 labeling", () => {
    expect(Object.keys(HADITH_CONTENT_TYPES)).toEqual(["articleExcerpt", "sahihCorpus"]);
    expect(HADITH_CONTENT_TYPES.articleExcerpt.badgeI18nKey).toBe("articleExcerptBadge");
    expect(HADITH_CONTENT_TYPES.sahihCorpus.badgeI18nKey).toBe("sahihCorpusBadge");
  });

  it("marks engineering labeling checklist complete", () => {
    expect(HADITH_CONTENT_LABELING.labelingComplete).toBe(true);
    expect(HADITH_CONTENT_LABELING.checklist.length).toBeGreaterThanOrEqual(3);
  });
});
