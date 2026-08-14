import { NAMAZ_CONTENT_REVIEW } from "../namazLearningContent";
import { kk } from "../../i18n/kk";

describe("namaz scholar review gate", () => {
  it("tracks Hanafi review checklist before public release", () => {
    expect(NAMAZ_CONTENT_REVIEW.madhhab).toBe("hanafi");
    expect(NAMAZ_CONTENT_REVIEW.checklist.length).toBeGreaterThanOrEqual(5);
    if (!NAMAZ_CONTENT_REVIEW.approvedForPublicRelease) {
      expect(NAMAZ_CONTENT_REVIEW.reviewerName).toBeNull();
      expect(NAMAZ_CONTENT_REVIEW.reviewedAtIso).toBeNull();
    } else {
      expect(NAMAZ_CONTENT_REVIEW.reviewerName?.length).toBeGreaterThan(3);
      expect(NAMAZ_CONTENT_REVIEW.reviewedAtIso).toMatch(/^\d{4}-\d{2}-\d{2}/);
    }
  });

  it("keeps pending banner copy explicit about study-only scope", () => {
    expect(kk.namazGuide.scholarReviewBanner).toMatch(/оқу материалы|оқу/i);
    expect(kk.namazGuide.scholarReviewBanner).toMatch(/пәтуа емес|үкім/i);
    expect(kk.namazGuide.scholarReviewBanner).toMatch(/ҚМДБ ресми қолданбасы емес/);
    expect(kk.namazGuide.reviewBannerScholarApproved).toMatch(/Ханафи/);
  });
});
