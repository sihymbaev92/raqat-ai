import {
  buildNamazCompanionSteps,
  namazCompanionFardRakatCount,
  namazCompanionSalatOptions,
  namazCompanionStepProgress,
} from "../namazCompanionSession";

describe("namazCompanionSession", () => {
  it("builds fajr session through sajdah and final sitting", () => {
    const steps = buildNamazCompanionSteps("fajr");
    expect(namazCompanionFardRakatCount("fajr")).toBe(2);
    expect(steps.some((s) => s.phaseKey === "takbir")).toBe(true);
    expect(steps.filter((s) => s.phaseKey === "sajdah")).toHaveLength(2);
    expect(steps[steps.length - 1]?.phaseKey).toBe("sitting");
    expect(steps[steps.length - 1]?.title).toMatch(/Сәлем|отырыс/i);
  });

  it("inserts middle sitting for maghrib after rakat 2", () => {
    const steps = buildNamazCompanionSteps("maghrib");
    expect(namazCompanionFardRakatCount("maghrib")).toBe(3);
    const middle = steps.find((s) => s.title === "Аралық отырыс");
    expect(middle?.rakat).toBe(2);
    expect(steps.filter((s) => s.phaseKey === "sajdah")).toHaveLength(3);
  });

  it("lists five fard options and progress ratio", () => {
    expect(namazCompanionSalatOptions()).toHaveLength(5);
    expect(namazCompanionStepProgress(0, 4)).toBe(0.25);
    expect(namazCompanionStepProgress(3, 4)).toBe(1);
  });
});
