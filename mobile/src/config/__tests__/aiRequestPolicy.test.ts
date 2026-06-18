import {
  AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK,
  withReligiousComplianceGuardrail,
} from "../aiRequestPolicy";

describe("AI religious compliance guardrail", () => {
  it("pins AI religious answers to Kazakhstan, Hanafi and Maturidi guidance", () => {
    expect(AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK).toContain("Қазақстан");
    expect(AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK).toContain("Ханафи");
    expect(AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK).toContain("Матуриди");
    expect(AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK).toContain("Әбу Ханифа");
    expect(AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK).toContain("Fatua.kz");
    expect(AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK).toContain("Muftyat.kz");
    expect(AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK).toContain("хадис/риуаят");
    expect(AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK).toContain("Құран аудармасы");
    expect(AI_RELIGIOUS_COMPLIANCE_GUARDRAIL_KK).toContain("AI жауабын пәтуа деп атама");
  });

  it("prepends the guardrail and keeps the latest user prompt inside the limit", () => {
    const prompt = withReligiousComplianceGuardrail("Жаңа сұрақ: қаза намаз қалай оқылады?", 1600);
    expect(prompt).toContain("Міндетті діни қауіпсіздік қағидасы");
    expect(prompt).toContain("Жаңа сұрақ: қаза намаз қалай оқылады?");
    expect(prompt.length).toBeLessThanOrEqual(1600);
  });
});
