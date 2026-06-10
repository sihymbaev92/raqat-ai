import { NAMAZ_GUIDE_SECTIONS } from "../namazContent";
import { NAMAZ_GUIDE_MENZIKIR } from "../namazMenzikir";
import { NAMAZ_PHASE2_QUIZ_BANK } from "../namazCourseRoadmap";

describe("namazMenzikir", () => {
  it("8 бөлім мәтін тақырыптарымен сәйкес", () => {
    expect(NAMAZ_GUIDE_MENZIKIR).toHaveLength(8);
    for (const m of NAMAZ_GUIDE_MENZIKIR) {
      const target = m.target;
      if (typeof target === "string") continue;
      expect(NAMAZ_GUIDE_SECTIONS.some((s) => s.title === target.restTitle)).toBe(true);
    }
  });

  it("сынақ банкі 6 сұрақ", () => {
    expect(NAMAZ_PHASE2_QUIZ_BANK.length).toBeGreaterThanOrEqual(6);
  });
});
