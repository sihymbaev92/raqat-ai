import {
  halalBarcodeLookupKeys,
  isLikelyHalalBarcodeQuery,
  normalizeHalalBarcodeDigits,
} from "../halalBarcodeLookup";

describe("halalBarcodeLookup", () => {
  it("normalizes digits only", () => {
    expect(normalizeHalalBarcodeDigits("EAN 4607025392015")).toBe("4607025392015");
  });

  it("builds EAN-13 and UPC-A variants", () => {
    expect(halalBarcodeLookupKeys("4607025392015")).toEqual(
      expect.arrayContaining(["4607025392015", "25392015"])
    );
    expect(halalBarcodeLookupKeys("607025392015")).toEqual(
      expect.arrayContaining(["607025392015", "0607025392015"])
    );
  });

  it("detects likely barcode queries", () => {
    expect(isLikelyHalalBarcodeQuery("4607")).toBe(true);
    expect(isLikelyHalalBarcodeQuery("ab")).toBe(false);
  });
});
