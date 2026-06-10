import { isLikelyStaleWebBundleError } from "../lazyScreen";

describe("isLikelyStaleWebBundleError", () => {
  it("detects stale web bundle and missing chunk errors", () => {
    expect(isLikelyStaleWebBundleError(new Error("ChunkLoadError: Loading chunk 42 failed"))).toBe(true);
    expect(isLikelyStaleWebBundleError(new Error("Failed to fetch dynamically imported module"))).toBe(true);
    expect(isLikelyStaleWebBundleError(new Error('Requiring unknown module "1469"'))).toBe(true);
    expect(isLikelyStaleWebBundleError(new Error("quranSurahListColors is not a function"))).toBe(true);
  });

  it("ignores unrelated runtime errors", () => {
    expect(isLikelyStaleWebBundleError(new Error("Cannot read properties of undefined"))).toBe(false);
    expect(isLikelyStaleWebBundleError(null)).toBe(false);
  });
});
