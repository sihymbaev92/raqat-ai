import { buildDashboardKurbanAitNewsItems } from "../../content/dashboardNewsItems";

describe("dashboard news fallback", () => {
  it("uses only in-app seasonal items without external KB feeds", () => {
    const items = buildDashboardKurbanAitNewsItems();
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.title).toBeTruthy();
      expect(item.target?.screen).toBe("KurbanAit");
      expect(item.articleUrl ?? "").not.toMatch(/fatua|muftyat/i);
    }
  });
});
