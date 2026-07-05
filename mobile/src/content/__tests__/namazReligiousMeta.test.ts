import { NAMAZ_GUIDE_SECTIONS } from "../namazContent";
import {
  NAMAZ_RELIGIOUS_REVIEW,
  namazScholarReviewPending,
} from "../namazReligiousMeta";

describe("namazReligiousMeta", () => {
  it("engineering complete but scholar sign-off pending", () => {
    expect(NAMAZ_RELIGIOUS_REVIEW.status).toBe("engineering_complete");
    expect(NAMAZ_RELIGIOUS_REVIEW.approvedForPublicRelease).toBe(false);
    expect(NAMAZ_RELIGIOUS_REVIEW.reviewerName).toBeNull();
    expect(namazScholarReviewPending()).toBe(true);
  });

  it("lists scholar handoff checklist items", () => {
    expect(NAMAZ_RELIGIOUS_REVIEW.scholarChecklist.length).toBeGreaterThanOrEqual(6);
    expect(NAMAZ_RELIGIOUS_REVIEW.engineeringChecklist.length).toBeGreaterThanOrEqual(4);
  });
});

describe("namazContent sections", () => {
  it("has 14 theory sections with disclaimer in section I", () => {
    expect(NAMAZ_GUIDE_SECTIONS.length).toBe(14);
    const intro = NAMAZ_GUIDE_SECTIONS[0]?.body ?? "";
    expect(intro).toContain("Ханафи");
    expect(intro).toContain("пәтуа");
    expect(intro).toContain("ұстаз");
    expect(intro).not.toContain("udu");
  });

  it("does not present app as issuing fatwa", () => {
    const all = NAMAZ_GUIDE_SECTIONS.map((s) => s.body).join("\n");
    expect(all).toContain("ұстаз");
    expect(all).toContain("мәзһаб");
    expect(all).not.toMatch(/бұл\s+үкім\s+—\s+парыз/i);
  });
});
