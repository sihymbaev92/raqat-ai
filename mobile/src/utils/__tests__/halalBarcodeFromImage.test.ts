import { Camera } from "expo-camera";
import {
  normalizeHalalBarcodeData,
  pickBestHalalBarcodeFromResults,
  scanHalalBarcodeFromImageUri,
} from "../halalBarcodeFromImage";

jest.mock("expo-camera", () => ({
  Camera: {
    scanFromURLAsync: jest.fn(),
  },
}));

describe("halalBarcodeFromImage", () => {
  it("normalizes EAN digits from barcode text", () => {
    expect(normalizeHalalBarcodeData("4601234567890")).toBe("4601234567890");
    expect(normalizeHalalBarcodeData("EAN: 4601234567890")).toBe("4601234567890");
  });

  it("picks first valid barcode from scan results", () => {
    expect(
      pickBestHalalBarcodeFromResults([
        { data: "abc" },
        { data: "4601234567890" },
      ])
    ).toBe("4601234567890");
    expect(pickBestHalalBarcodeFromResults([])).toBeNull();
  });

  it("scans barcode from image uri via Camera.scanFromURLAsync", async () => {
    (Camera.scanFromURLAsync as jest.Mock).mockResolvedValueOnce([
      { data: "4601234567890", type: "ean13" },
    ]);
    await expect(scanHalalBarcodeFromImageUri("file:///tmp/barcode.jpg")).resolves.toBe(
      "4601234567890"
    );
    expect(Camera.scanFromURLAsync).toHaveBeenCalledWith(
      "file:///tmp/barcode.jpg",
      expect.arrayContaining(["ean13", "qr"])
    );
  });
});
