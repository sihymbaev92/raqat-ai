import { getKmdbHubTiles } from "../kmdbHubTiles";

describe("kmdbHubTiles", () => {
  it("keeps only AI question-answer and zakat calculator tiles", () => {
    const tiles = getKmdbHubTiles();
    const screens = tiles.map((tile) => tile.screen);

    expect(screens).toEqual(["ImamAI", "ZakatCalculator"]);
  });

  it("keeps every tile labeled and described", () => {
    for (const tile of getKmdbHubTiles()) {
      expect(tile.label.trim().length).toBeGreaterThan(2);
      expect(tile.subtitle.trim().length).toBeGreaterThan(8);
      expect(tile.image).toBeTruthy();
    }
  });
});
