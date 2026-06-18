import {
  CORE_BACKEND_DEPENDENCY_POLICY,
  RELEASE_FOCUS_CORE_SURFACES,
  RELEASE_SIZE_BUDGETS,
} from "../releaseFocusBudgets";

describe("release focus budgets", () => {
  it("keeps 30-day focus limited to Namaz, Quran/Hatim and Halal", () => {
    expect(RELEASE_FOCUS_CORE_SURFACES).toEqual(["namaz", "quran-hatim", "halal"]);
  });

  it("requires core surfaces to survive backend outage on first paint", () => {
    expect(CORE_BACKEND_DEPENDENCY_POLICY).toHaveLength(RELEASE_FOCUS_CORE_SURFACES.length);
    for (const policy of CORE_BACKEND_DEPENDENCY_POLICY) {
      expect(policy.backendRequiredForFirstPaint).toBe(false);
      expect(policy.offlineFallbackRequired).toBe(true);
    }
  });

  it("defines release size warning budgets", () => {
    expect(RELEASE_SIZE_BUDGETS.apkWarnMb).toBeLessThanOrEqual(145);
    expect(RELEASE_SIZE_BUDGETS.bundledAssetsWarnMb).toBeLessThanOrEqual(400);
    expect(RELEASE_SIZE_BUDGETS.largestSingleAssetWarnMb).toBeLessThanOrEqual(35);
  });
});

