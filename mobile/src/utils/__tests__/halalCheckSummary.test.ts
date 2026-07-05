import { buildHalalCheckSummary } from "../halalCheckSummary";
import { kk } from "../../i18n/kk";

describe("buildHalalCheckSummary", () => {
  it("returns bad tone when a product is haram", () => {
    const summary = buildHalalCheckSummary(
      [{ id: 1, title: "Test", barcode: "1", certificateStatus: "haram" }],
      [],
      []
    );
    expect(summary?.tone).toBe("bad");
    expect(summary?.title).toBe(kk.features.halalVerifySummaryBadTitle);
  });

  it("returns ok tone for halal products", () => {
    const summary = buildHalalCheckSummary(
      [{ id: 1, title: "Milk", barcode: "1", certificateStatus: "halal" }],
      [],
      []
    );
    expect(summary?.tone).toBe("ok");
  });

  it("returns null when nothing matched", () => {
    expect(buildHalalCheckSummary([], [], [])).toBeNull();
  });
});
