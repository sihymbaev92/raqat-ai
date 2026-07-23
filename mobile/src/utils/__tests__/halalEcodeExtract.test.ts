import { extractEcodesFromText, isLikelyBarcodeDigitsQuery } from "../halalEcodeExtract";

describe("halalEcodeExtract", () => {
  it("extracts E471 and E120 from ingredients", () => {
    const codes = extractEcodesFromText("құрамы: су, қант, E471, кармин (E-120), тұз");
    expect(codes).toContain("e471");
    expect(codes).toContain("e120");
  });

  it("detects barcode-like queries", () => {
    expect(isLikelyBarcodeDigitsQuery("4607025392015")).toBe(true);
    expect(isLikelyBarcodeDigitsQuery("E471")).toBe(false);
    expect(isLikelyBarcodeDigitsQuery("желатин")).toBe(false);
    expect(isLikelyBarcodeDigitsQuery("1234567")).toBe(false);
    expect(isLikelyBarcodeDigitsQuery("12345678")).toBe(true);
  });

  it("extracts Cyrillic Е-codes and letter suffixes with dedupe", () => {
    const codes = extractEcodesFromText("құрамы: Е-120, е 322а, E120, E-322a");
    expect(codes).toContain("e120");
    expect(codes).toContain("e322a");
    expect(codes.filter((c) => c === "e120")).toHaveLength(1);
  });
});
