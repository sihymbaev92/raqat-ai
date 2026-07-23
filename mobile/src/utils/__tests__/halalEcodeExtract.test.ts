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
  });
});
