import {
  isTrustedAppDeepLinkPath,
  evaluateAppSecurityPosture,
  getCachedSecurityPosture,
} from "../appSecurityShield";

describe("appSecurityShield", () => {
  it("blocks account/login deep links from untrusted openers", () => {
    expect(isTrustedAppDeepLinkPath("profile")).toBe(false);
    expect(isTrustedAppDeepLinkPath("profile?x=1")).toBe(false);
    expect(isTrustedAppDeepLinkPath("login")).toBe(false);
    expect(isTrustedAppDeepLinkPath("oauth/callback")).toBe(false);
    expect(isTrustedAppDeepLinkPath("prayer")).toBe(true);
    expect(isTrustedAppDeepLinkPath("more/mushaf-book/1")).toBe(true);
    expect(isTrustedAppDeepLinkPath("")).toBe(true);
  });

  it("evaluates posture without throwing on web/native stubs", async () => {
    const p = await evaluateAppSecurityPosture(true);
    expect(p.evaluatedAt).toBeGreaterThan(0);
    expect(Array.isArray(p.reasons)).toBe(true);
    expect(getCachedSecurityPosture()?.evaluatedAt).toBe(p.evaluatedAt);
  });
});
