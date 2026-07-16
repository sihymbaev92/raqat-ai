import { getAllTraditionBatas, searchTraditionBatas } from "../traditionBataCatalog";
import { getRelatedTraditionAudios, getTraditionAudioById } from "../traditionTopicsCatalog";

describe("traditionBataCatalog", () => {
  it("contains exactly 100 bata texts", () => {
    expect(getAllTraditionBatas()).toHaveLength(100);
  });

  it("resolves legacy audio ids to catalog entries", () => {
    expect(getTraditionAudioById("zhol-batasi")?.title).toContain("Жол");
    expect(getTraditionAudioById("birlik-batasi")?.title).toContain("Бірлік");
  });

  it("returns all batas for bata-beru topic", () => {
    expect(getRelatedTraditionAudios("bata-beru")).toHaveLength(100);
  });

  it("filters batas by search query", () => {
    const hits = searchTraditionBatas("рамазан");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.text.toLowerCase().includes("рамазан") || h.title.toLowerCase().includes("рамазан"))).toBe(
      true
    );
  });
});
