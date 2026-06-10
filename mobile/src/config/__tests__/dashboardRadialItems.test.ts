import { getDashboardRadialItems } from "../dashboardRadialItems";

describe("dashboardRadialItems", () => {
  it("orders home tiles in the requested 4x3 layout", () => {
    expect(getDashboardRadialItems().map((item) => item.key)).toEqual([
      "quran",
      "hadith",
      "namaz",
      "tajweed",
      "seerah",
      "hajj",
      "tasbih",
      "duas",
      "asma",
      "ai",
      "halal",
      "tradition",
    ]);
  });
});
