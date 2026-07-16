import { getDashboardRadialItems } from "../dashboardRadialItems";
import { getDashboardHomeServices } from "../dashboardHomeServices";

describe("dashboardRadialItems", () => {
  const expectedTileOrder = [
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
  ];

  it("orders home tiles in the requested 4x3 layout", () => {
    expect(getDashboardRadialItems().map((item) => item.key)).toEqual(expectedTileOrder);
  });

  it("keeps the home grid aligned with the same 12 existing modules", () => {
    expect(getDashboardHomeServices().map((item) => item.key)).toEqual(expectedTileOrder);
  });
});
