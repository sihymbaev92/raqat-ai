import { runHalalLocalChecks } from "../halalLocalChecks";

describe("runHalalLocalChecks", () => {
  it("identifies high-risk and suspicious markers", () => {
    const r = runHalalLocalChecks("Құрамы: gelatin, ethanol, E471");
    expect(r.highRiskTerms.length).toBeGreaterThan(0);
    expect(r.suspiciousTerms).toContain("желатин");
    expect(r.matchedEcodes).toContain("E471");
  });

  it("returns neutral summary for clean text", () => {
    const r = runHalalLocalChecks("Құрамы: су, қант, лимон қышқылы");
    expect(r.highRiskTerms).toHaveLength(0);
    expect(r.summaryKk).toContain("Күшті қауіп маркерлері табылмады");
  });

  it("detects expanded ingredient markers", () => {
    const r = runHalalLocalChecks("Ingredients: whey protein, magnesium stearate, polysorbate 80");
    expect(r.suspiciousTerms).toContain("сүт сарысуы/казеин");
    expect(r.suspiciousTerms).toContain("стеарат");
    expect(r.suspiciousTerms).toContain("полисорбат");
  });
});
