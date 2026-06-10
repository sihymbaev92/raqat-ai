import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  clearHalalScanResults,
  loadHalalScanResults,
  MAX_HALAL_SCAN_RESULTS,
  pushHalalScanResult,
  findHalalScanResult,
} from "../halalScanResults";

describe("halalScanResults", () => {
  beforeEach(async () => {
    await clearHalalScanResults();
  });

  it("stores and retrieves barcode snapshot", async () => {
    await pushHalalScanResult({
      barcode: "4601234567890",
      products: [{ id: 1, title: "Test", barcode: "4601234567890", certificateStatus: "halal" }],
      additives: [],
      companies: [],
    });
    const list = await loadHalalScanResults();
    expect(list).toHaveLength(1);
    expect(list[0].products[0].title).toBe("Test");
    expect(findHalalScanResult(list, "4601234567890")?.barcode).toBe("4601234567890");
  });

  it("caps at MAX_HALAL_SCAN_RESULTS", async () => {
    for (let i = 0; i < MAX_HALAL_SCAN_RESULTS + 3; i++) {
      await pushHalalScanResult({
        barcode: `460000000000${i}`,
        products: [],
        additives: [],
        companies: [],
      });
    }
    const list = await loadHalalScanResults();
    expect(list.length).toBe(MAX_HALAL_SCAN_RESULTS);
  });
});
