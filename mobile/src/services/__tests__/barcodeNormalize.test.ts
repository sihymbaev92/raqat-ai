import { barcodeLookupCandidates, extractProductCodeFromScan } from "../barcodeNormalize";

describe("extractProductCodeFromScan", () => {
  it("саннан тұратын EAN/UPC кодты қайтарады", () => {
    expect(extractProductCodeFromScan(" 4601234567890 ")).toBe("4601234567890");
  });

  it("OFF product URL ішінен кодты алады", () => {
    expect(extractProductCodeFromScan("https://world.openfoodfacts.org/product/5449000000996/coke")).toBe(
      "5449000000996"
    );
  });

  it("сәйкес код болмаса null қайтарады", () => {
    expect(extractProductCodeFromScan("hello")).toBeNull();
  });
});

describe("barcodeLookupCandidates", () => {
  it("UPC-A (12) үшін EAN-13 нұсқасын қосады", () => {
    expect(barcodeLookupCandidates("012345678905")).toEqual(["012345678905", "0012345678905"]);
  });

  it("0-мен басталған EAN-13 үшін UPC нұсқасын қосады", () => {
    expect(barcodeLookupCandidates("0012345678905")).toEqual(["0012345678905", "012345678905"]);
  });

  it("GTIN-14 үшін қысқарған нұсқаларды береді", () => {
    expect(barcodeLookupCandidates("10012345678905")).toEqual([
      "10012345678905",
      "0012345678905",
      "012345678905",
    ]);
  });
});
