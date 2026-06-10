import { arabicRasmStringsDiffer, canCopyDualArabicRasm, normalizeArabicForRasmCompare } from "../quranArabicDualRasm";

describe("quranArabicDualRasm", () => {
  it("normalizeArabicForRasmCompare trims", () => {
    expect(normalizeArabicForRasmCompare("  abc  ")).toBe("abc");
  });

  it("canCopyDualArabicRasm requires both non-empty", () => {
    expect(canCopyDualArabicRasm("a", "b")).toBe(true);
    expect(canCopyDualArabicRasm("", "b")).toBe(false);
    expect(canCopyDualArabicRasm("a", "")).toBe(false);
  });

  it("arabicRasmStringsDiffer respects NFKC where supported", () => {
    expect(arabicRasmStringsDiffer("a", "b")).toBe(true);
    expect(arabicRasmStringsDiffer("  same  ", "same")).toBe(false);
  });
});
