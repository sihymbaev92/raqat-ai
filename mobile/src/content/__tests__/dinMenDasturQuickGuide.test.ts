import { DIN_MEN_DASTUR_QUICK_GUIDE } from "../dinMenDasturQuickGuide";
import { getTraditionTopicById } from "../traditionTopicsCatalog";

describe("dinMenDasturQuickGuide", () => {
  it("has four curated items linked to catalog topics", () => {
    expect(DIN_MEN_DASTUR_QUICK_GUIDE).toHaveLength(4);
    for (const item of DIN_MEN_DASTUR_QUICK_GUIDE) {
      expect(getTraditionTopicById(item.topicId)).toBeTruthy();
      expect(item.title.length).toBeGreaterThan(2);
      expect(item.history.length).toBeGreaterThan(5);
      expect(item.shariat.length).toBeGreaterThan(3);
      expect(item.detail.length).toBeGreaterThan(10);
    }
  });
});
