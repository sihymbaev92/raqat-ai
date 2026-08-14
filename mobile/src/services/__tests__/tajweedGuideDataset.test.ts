import { tajweedGuideExampleRecord, tajweedGuideExampleReading } from "../../services/tajweedGuideDataset";

describe("tajweedGuideDataset", () => {
  it("loads bundled JSON with page 13 harakat examples", () => {
    const wazaa = tajweedGuideExampleRecord("وَزَعَ");
    expect(wazaa?.readingKk).toBe("уәзә‘а");
    expect(wazaa?.audio.source).toBe("harakat-clips");
    expect(wazaa?.audio).toHaveProperty("file");
  });

  it("resolves Kazakh reading from dataset", () => {
    expect(tajweedGuideExampleReading("دَرَجَ")).toBe("дәрәжә");
    expect(tajweedGuideExampleReading("أَدَبَ")).toBe("әдәбә");
  });

  it("page 13 harakat drills use harakat-clips audio (not EveryAyah)", () => {
    const drills = ["وَزَعَ", "ضُرِبَ", "أَنْ", "زِدْ"] as const;
    for (const ar of drills) {
      const rec = tajweedGuideExampleRecord(ar);
      expect(rec?.audio.source).toBe("harakat-clips");
    }
  });
});
