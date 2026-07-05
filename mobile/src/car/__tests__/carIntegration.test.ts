import { getCarIntegrationStatus, initCarQuranIntegration } from "../carIntegration";

describe("carIntegration", () => {
  it("reports native car quran on android/ios", () => {
    const status = getCarIntegrationStatus();
    expect(status.docPath).toContain("CAR_QURAN");
    expect(typeof status.nativeCarQuran).toBe("boolean");
  });

  it("initCarQuranIntegration is safe on web", () => {
    expect(() => initCarQuranIntegration()).not.toThrow();
  });
});
