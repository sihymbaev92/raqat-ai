import { NAMAZ_WUDU_VISUAL_STEPS } from "../namazWuduSteps";

describe("namazWuduSteps", () => {
  it("10 визуалды дәрет қадамы, реті дұрыс", () => {
    expect(NAMAZ_WUDU_VISUAL_STEPS).toHaveLength(10);
    NAMAZ_WUDU_VISUAL_STEPS.forEach((s, i) => {
      expect(s.stepNo).toBe(i + 1);
      expect(s.id).toMatch(/^wudu-step-/);
      expect(s.title.length).toBeGreaterThan(2);
      expect(s.desc.length).toBeGreaterThan(5);
      expect(s.actions.length).toBeGreaterThan(0);
      expect(s.image).toBeTruthy();
    });
  });

  it("бастау және аяқтау дуасы бар", () => {
    expect(NAMAZ_WUDU_VISUAL_STEPS[0].recitations?.length).toBeGreaterThan(0);
    expect(NAMAZ_WUDU_VISUAL_STEPS[9].recitations?.length).toBeGreaterThan(0);
  });
});
